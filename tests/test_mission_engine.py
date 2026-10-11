import pytest
import sys
import os
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.engine.models import RuleCheckStatus, RuleSeverity, RuleResult
from app.engine.rules.base import BaseRule
from app.engine.adapters.simulation import SimulationAdapter
from app.engine.verifier import MissionVerifier
from app.engine.registry import MissionRegistry


# Define two concrete test rules
class DummyBlockPublicAclsRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_BLOCK_PUBLIC_ACLS",
            name="Block Public ACLs Enabled",
            description="Ensures BlockPublicAcls is set to True",
            severity=RuleSeverity.HIGH,
            points=40,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        pab = state.get("public_access_block", {})
        actual = pab.get("BlockPublicAcls", False)
        status = RuleCheckStatus.PASS if actual is True else RuleCheckStatus.FAIL
        evidence = "BlockPublicAcls is enabled" if actual else "BlockPublicAcls is currently disabled (False)"
        
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


class DummyBucketPolicyRule(BaseRule):
    def __init__(self):
        super().__init__(
            rule_id="S3_NO_WILDCARD_PRINCIPAL_POLICY",
            name="No Wildcard Principal Bucket Policy",
            description="Ensures bucket policy does not grant anonymous public read access",
            severity=RuleSeverity.CRITICAL,
            points=60,
            resource_type="aws_s3"
        )

    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        policy = state.get("bucket_policy")
        has_wildcard = False
        if policy and isinstance(policy, dict):
            for statement in policy.get("Statement", []):
                if statement.get("Effect") == "Allow" and statement.get("Principal") == "*":
                    has_wildcard = True
                    break

        status = RuleCheckStatus.FAIL if has_wildcard else RuleCheckStatus.PASS
        evidence = (
            "Detected anonymous public read statement with Principal: '*'"
            if has_wildcard
            else "No open wildcard anonymous statements found"
        )

        return RuleResult(
            rule_id=self.rule_id,
            name=self.name,
            status=status,
            severity=self.severity,
            expected="No Principal: '*'",
            actual="Principal: '*'" if has_wildcard else "Secure",
            evidence=evidence,
            points_earned=self.points if status == RuleCheckStatus.PASS else 0,
            max_points=self.points
        )


@pytest.mark.asyncio
async def test_deterministic_mission_engine_flow():
    # 1. Register test mission with verifier
    rules = [DummyBlockPublicAclsRule(), DummyBucketPolicyRule()]
    verifier = MissionRegistry.register_mission("test-incident", rules)
    adapter = SimulationAdapter()

    # 2. Test Failing State (Misconfigured bucket)
    failing_state = {
        "bucket_name": "test-broken-bucket",
        "public_access_block": {
            "BlockPublicAcls": False
        },
        "bucket_policy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject"
                }
            ]
        }
    }

    verdict_fail = await verifier.verify(adapter, {"current_demo_state": failing_state})
    assert verdict_fail.status == RuleCheckStatus.FAIL
    assert verdict_fail.total_rules == 2
    assert verdict_fail.passed_rules == 0
    assert verdict_fail.base_points_earned == 0
    assert verdict_fail.max_points_possible == 100
    assert len(verdict_fail.rule_results) == 2
    assert verdict_fail.execution_time_ms < 50.0  # Must be fast

    # 3. Test Partially Fixed State (Passed 1 rule, failed 1 rule)
    partial_state = {
        "bucket_name": "test-broken-bucket",
        "public_access_block": {
            "BlockPublicAcls": True  # Fixed
        },
        "bucket_policy": {  # Still broken
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject"
                }
            ]
        }
    }

    verdict_partial = await verifier.verify(adapter, {"current_demo_state": partial_state})
    assert verdict_partial.status == RuleCheckStatus.FAIL
    assert verdict_partial.passed_rules == 1
    assert verdict_partial.base_points_earned == 0  # Only full pass earns base points

    # 4. Test Fully Remediated State
    remediated_state = {
        "bucket_name": "test-broken-bucket",
        "public_access_block": {
            "BlockPublicAcls": True
        },
        "bucket_policy": None  # Removed public policy
    }

    verdict_pass = await verifier.verify(adapter, {"current_demo_state": remediated_state})
    assert verdict_pass.status == RuleCheckStatus.PASS
    assert verdict_pass.passed_rules == 2
    assert verdict_pass.base_points_earned == 100
    assert verdict_pass.max_points_possible == 100
    assert verdict_pass.rule_results[0].status == RuleCheckStatus.PASS
    assert verdict_pass.rule_results[1].status == RuleCheckStatus.PASS
