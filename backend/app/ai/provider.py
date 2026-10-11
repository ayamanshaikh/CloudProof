import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.ai.prompts import POSTMORTEM_SYSTEM_PROMPT, build_postmortem_user_prompt
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseLLMProvider(ABC):
    """Abstract interface for CloudProof Post-Mortem LLM providers."""

    @abstractmethod
    async def generate_postmortem(
        self,
        mission_title: str,
        verdict_status: str,
        rule_results: List[Dict[str, Any]],
        initial_state: Dict[str, Any],
        remediated_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate structured 6-part Incident Post-Mortem dictionary."""
        pass


class DeterministicOfflineLLMProvider(BaseLLMProvider):
    """
    Deterministic offline explanation generator.
    Guarantees 100% test reliability and zero-cloud-cost operation without external API dependencies.
    Directly grounded in the deterministic rule engine verdict and configuration diff.
    """

    async def generate_postmortem(
        self,
        mission_title: str,
        verdict_status: str,
        rule_results: List[Dict[str, Any]],
        initial_state: Dict[str, Any],
        remediated_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        passed_count = sum(1 for r in rule_results if r.get("status") == "PASS")
        total_count = len(rule_results)
        is_pass = verdict_status.upper() == "PASS"

        # 1. Incident Summary
        incident_summary = (
            f"Remediation verification for mission '{mission_title}' concluded with verdict: {verdict_status.upper()} "
            f"({passed_count}/{total_count} security rules satisfied). The incident involved an unauthenticated S3 "
            f"storage exposure that leaked sensitive company PDF invoice assets to the public internet."
        )

        # 2. Root Cause Analysis
        init_bpa = initial_state.get("public_access_block", {})
        init_acl = initial_state.get("bucket_acl", "unknown")
        root_cause_analysis = (
            f"The initial bucket configuration suffered from multiple layers of insecure access control. "
            f"First, S3 Block Public Access (BPA) was disabled across all 4 controls "
            f"(BlockPublicAcls={init_bpa.get('BlockPublicAcls')}, IgnorePublicAcls={init_bpa.get('IgnorePublicAcls')}, "
            f"BlockPublicPolicy={init_bpa.get('BlockPublicPolicy')}, RestrictPublicBuckets={init_bpa.get('RestrictPublicBuckets')}). "
            f"Second, the bucket ACL was configured as '{init_acl}', granting global read permissions to the AllUsers group. "
            f"Finally, an overly permissive bucket policy granted wildcard Principal ('*') permissions for s3:GetObject."
        )

        # 3. Realistic Exploit Scenario
        threat_exploit_scenario = (
            "Step 1: An external threat actor uses automated enumeration tools (such as masscan, bucket-stream, or search engines) "
            "to discover the S3 endpoint 's3.amazonaws.com/cloudproof-acme-invoices-2026'.\n"
            "Step 2: Without requiring any AWS IAM credentials or STS authentication tokens, the attacker executes "
            "'aws s3 ls s3://cloudproof-acme-invoices-2026 --no-sign-request' to inspect the entire object directory.\n"
            "Step 3: The adversary downloads confidential customer invoices containing PII, bank account numbers, and corporate contract values, "
            "triggering regulatory breach disclosures under GDPR and CCPA."
        )

        # 4. Remediation Diff Breakdown
        rem_bpa = remediated_state.get("public_access_block", {})
        rem_acl = remediated_state.get("bucket_acl", "unknown")
        remediation_diff_breakdown = (
            f"Student Remediation Diff Analysis:\n"
            f"- S3 Bucket ACL: Modified from '{init_acl}' to '{rem_acl}'.\n"
            f"- BlockPublicAcls: {init_bpa.get('BlockPublicAcls')} -> {rem_bpa.get('BlockPublicAcls')}\n"
            f"- IgnorePublicAcls: {init_bpa.get('IgnorePublicAcls')} -> {rem_bpa.get('IgnorePublicAcls')}\n"
            f"- BlockPublicPolicy: {init_bpa.get('BlockPublicPolicy')} -> {rem_bpa.get('BlockPublicPolicy')}\n"
            f"- RestrictPublicBuckets: {init_bpa.get('RestrictPublicBuckets')} -> {rem_bpa.get('RestrictPublicBuckets')}\n"
            f"- Bucket Policy: Overly broad wildcard principal statements were removed or neutralized."
        )

        # 5. Why the Fix Works
        if is_pass:
            why_fix_works = (
                "The remediation enforces defense-in-depth across multiple AWS evaluation layers. "
                "Enabling 'IgnorePublicAcls' causes AWS S3 to completely disregard any public ACL grants, neutralizing past or future ACL leaks. "
                "Enabling 'BlockPublicPolicy' and 'RestrictPublicBuckets' instructs the AWS S3 policy engine to reject any policies granting anonymous public access. "
                "Restricting the bucket canned ACL to 'private' ensures only the account owner has object read/write grants."
            )
        else:
            failed_rules = [r.get("name") for r in rule_results if r.get("status") != "PASS"]
            why_fix_works = (
                f"The remediation is incomplete because {len(failed_rules)} rule(s) failed: {', '.join(failed_rules)}. "
                "AWS S3 access evaluation uses an explicit DENY or implicit DENY model. If any public channel remains open "
                "(such as disabled BPA flags or wildcard resource policies), unauthenticated internet requests will continue to succeed."
            )

        # 6. Production Best Practices
        best_practices = [
            "Enable S3 Block Public Access at the entire AWS Account level through AWS Organizations Service Control Policies (SCPs).",
            "Enforce default server-side encryption with AWS KMS Customer Managed Keys (SSE-KMS) to prevent unauthorized decryption even if read permissions leak.",
            "Use Amazon S3 Bucket Policies with aws:sourceVpce conditions to restrict bucket traffic exclusively to authorized VPC Endpoints.",
            "Enable Amazon GuardDuty and AWS Config rule 's3-bucket-public-read-prohibited' for real-time automated alerting and remediation."
        ]

        return {
            "incident_summary": incident_summary,
            "root_cause_analysis": root_cause_analysis,
            "threat_exploit_scenario": threat_exploit_scenario,
            "remediation_diff_breakdown": remediation_diff_breakdown,
            "why_fix_works": why_fix_works,
            "best_practices": best_practices,
            "generated_by": "CloudProof Deterministic Engine (Offline Fallback)",
        }


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini SDK integration provider using gemini-3.8-flash.
    Strictly follows AI Separation Rule: LLM never grades, only explains findings.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.fallback = DeterministicOfflineLLMProvider()

    async def generate_postmortem(
        self,
        mission_title: str,
        verdict_status: str,
        rule_results: List[Dict[str, Any]],
        initial_state: Dict[str, Any],
        remediated_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        prompt = build_postmortem_user_prompt(
            mission_title=mission_title,
            verdict_status=verdict_status,
            rule_results=rule_results,
            initial_state=initial_state,
            remediated_state=remediated_state
        )

        try:
            from google import genai

            client = genai.Client(api_key=self.api_key)
            interaction = client.interactions.create(
                model="gemini-3.8-flash",
                system_instruction=POSTMORTEM_SYSTEM_PROMPT,
                input=prompt
            )

            response_text = interaction.output_text or ""
            # Strip markdown code blocks if wrapped in ```json ... ```
            clean_text = response_text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            parsed = json.loads(clean_text.strip())
            parsed["generated_by"] = "Google Gemini 3.8 Flash"
            return parsed
        except Exception as e:
            logger.warning("Gemini API call failed (%s); falling back to Deterministic Offline Provider", str(e))
            return await self.fallback.generate_postmortem(
                mission_title, verdict_status, rule_results, initial_state, remediated_state
            )


def get_llm_provider() -> BaseLLMProvider:
    """Factory function providing configured LLM provider or offline fallback."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key and api_key.strip() and api_key != "your-gemini-api-key-here":
        return GeminiLLMProvider(api_key.strip())
    return DeterministicOfflineLLMProvider()
