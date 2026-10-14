"""
Unit tests for Mission 4: The Unencrypted Secrets Vault.
Validates KMSDefaultEncryptionRule, KMSCustomerManagedKeyRule,
KMSBucketKeyRule, and KMSKeyRotationRule.
"""
import os
import sys
import importlib.util
import pytest

# Dynamically import rules from missions/kms-unencrypted-secrets/rules.py
RULES_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "missions", "kms-unencrypted-secrets", "rules.py")
)
spec = importlib.util.spec_from_file_location("kms_rules", RULES_PATH)
kms_rules = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kms_rules)
KMSSecretsRulePack = kms_rules.KMSSecretsRulePack


def test_kms_rule_pack_evaluation_lifecycle():
    pack = KMSSecretsRulePack()
    assert len(pack.rules) == 4

    # 1. Broken Initial State
    broken_state = {
        "ServerSideEncryptionConfiguration": {"Rules": []},
        "BucketKeyEnabled": False,
        "KMSKeyRotationEnabled": False
    }
    results = pack.evaluate(broken_state)
    assert all(r["passed"] is False for r in results)
    total_score = sum(r["score"] for r in results)
    assert total_score == 0

    # 2. Hardened Compliant State
    hardened_state = {
        "ServerSideEncryptionConfiguration": {
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "aws:kms",
                        "KMSMasterKeyId": "arn:aws:kms:us-east-1:123456789012:key/vault-prod-key-789"
                    }
                }
            ]
        },
        "BucketKeyEnabled": True,
        "KMSKeyRotationEnabled": True
    }
    results_hardened = pack.evaluate(hardened_state)
    assert all(r["passed"] is True for r in results_hardened)
    total_hardened_score = sum(r["score"] for r in results_hardened)
    assert total_hardened_score == 100
