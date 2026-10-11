from typing import Dict, Any, List
from app.engine.models import RuleResult, RuleCheckStatus, RuleSeverity
from app.engine.rules.base import BaseRule


class RuleS3BlockPublicAcls(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_BLOCK_PUBLIC_ACLS",
            name="Block Public ACLs (BPA)",
            description="Blocks new public ACLs and uploading objects with public ACLs.",
            severity=RuleSeverity.HIGH,
            points=20,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        pab = state.get("public_access_block") or {}
        actual = pab.get("BlockPublicAcls", False)
        status = RuleCheckStatus.PASS if actual is True else RuleCheckStatus.FAIL
        evidence = (
            "BlockPublicAcls is enabled (True)."
            if actual is True
            else "BlockPublicAcls is currently disabled (False), permitting public ACL assignment."
        )
        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected=True,
            actual=actual,
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


class RuleS3IgnorePublicAcls(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_IGNORE_PUBLIC_ACLS",
            name="Ignore Public ACLs (BPA)",
            description="Causes AWS S3 to ignore all public ACLs on this bucket and its objects.",
            severity=RuleSeverity.HIGH,
            points=20,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        pab = state.get("public_access_block") or {}
        actual = pab.get("IgnorePublicAcls", False)
        status = RuleCheckStatus.PASS if actual is True else RuleCheckStatus.FAIL
        evidence = (
            "IgnorePublicAcls is enabled (True)."
            if actual is True
            else "IgnorePublicAcls is currently disabled (False), allowing existing public ACLs to expose objects."
        )
        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected=True,
            actual=actual,
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


class RuleS3BlockPublicPolicy(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_BLOCK_PUBLIC_POLICY",
            name="Block Public Policy (BPA)",
            description="Rejects bucket policies that allow public, anonymous access.",
            severity=RuleSeverity.HIGH,
            points=20,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        pab = state.get("public_access_block") or {}
        actual = pab.get("BlockPublicPolicy", False)
        status = RuleCheckStatus.PASS if actual is True else RuleCheckStatus.FAIL
        evidence = (
            "BlockPublicPolicy is enabled (True)."
            if actual is True
            else "BlockPublicPolicy is currently disabled (False), allowing attachment of policies with public access."
        )
        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected=True,
            actual=actual,
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


class RuleS3RestrictPublicBuckets(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_RESTRICT_PUBLIC_BUCKETS",
            name="Restrict Public Buckets (BPA)",
            description="Restricts bucket access to AWS service principals and authorized users in the bucket owner account.",
            severity=RuleSeverity.HIGH,
            points=20,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        pab = state.get("public_access_block") or {}
        actual = pab.get("RestrictPublicBuckets", False)
        status = RuleCheckStatus.PASS if actual is True else RuleCheckStatus.FAIL
        evidence = (
            "RestrictPublicBuckets is enabled (True)."
            if actual is True
            else "RestrictPublicBuckets is disabled (False), failing to restrict access for cross-account delegations."
        )
        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected=True,
            actual=actual,
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


class RuleS3NoWildcardPolicy(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_NO_WILDCARD_PRINCIPAL_POLICY",
            name="No Wildcard Principal In Bucket Policy",
            description="Ensures no bucket policy statement grants unauthenticated public access via wildcard Principal: '*'.",
            severity=RuleSeverity.CRITICAL,
            points=10,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        policy = state.get("bucket_policy")
        has_wildcard = False
        offending_sid = None

        if policy and isinstance(policy, dict):
            statements = policy.get("Statement", [])
            if isinstance(statements, dict):
                statements = [statements]

            for stmt in statements:
                if stmt.get("Effect") == "Allow":
                    principal = stmt.get("Principal")
                    # Check for Principal: "*" or {"AWS": "*"}
                    if principal == "*" or (isinstance(principal, dict) and principal.get("AWS") == "*"):
                        has_wildcard = True
                        offending_sid = stmt.get("Sid", "UnnamedStatement")
                        break

        status = RuleCheckStatus.FAIL if has_wildcard else RuleCheckStatus.PASS
        evidence = (
            f"Statement '{offending_sid}' contains an unrestricted Principal: '*' granting global anonymous access."
            if has_wildcard
            else "Bucket policy contains no open wildcard anonymous Principal statements."
        )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected="No Principal: '*'",
            actual="Principal: '*'" if has_wildcard else "No wildcards",
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


class RuleS3NoPublicAcl(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_NO_PUBLIC_ACL",
            name="No Public Read Bucket ACL",
            description="Ensures bucket Canned ACL is not set to public-read or public-read-write.",
            severity=RuleSeverity.HIGH,
            points=10,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        acl = (state.get("bucket_acl") or "private").lower()
        is_public = acl in ("public-read", "public-read-write", "authenticated-read")

        status = RuleCheckStatus.FAIL if is_public else RuleCheckStatus.PASS
        evidence = (
            f"Bucket ACL is currently '{acl}', permitting anonymous read access."
            if is_public
            else f"Bucket ACL is '{acl}' (private)."
        )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected="private",
            actual=acl,
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


def get_mission_1_rules() -> List[BaseRule]:
    """Factory returning all 6 deterministic rules for Mission 1."""
    return [
        RuleS3BlockPublicAcls(),
        RuleS3IgnorePublicAcls(),
        RuleS3BlockPublicPolicy(),
        RuleS3RestrictPublicBuckets(),
        RuleS3NoWildcardPolicy(),
        RuleS3NoPublicAcl()
    ]
