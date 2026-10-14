"""
Deterministic Rule Pack for Mission 4: The Unencrypted Secrets Vault
====================================================================
Evaluates cryptographic invariants:
  - CP-KMS-001: Default encryption enforces 'aws:kms' SSEAlgorithm (+25 pts)
  - CP-KMS-002: Dedicated Customer Managed Key (CMK) ARN configured (+25 pts)
  - CP-KMS-003: S3 Bucket Key optimization enabled (+25 pts)
  - CP-KMS-004: Automatic KMS Key Rotation enabled (+25 pts)
"""
from typing import Dict, Any, List


class KMSDefaultEncryptionRule:
    rule_id = "CP-KMS-001"
    name = "Default SSE-KMS Encryption Enforcement"
    points = 25

    def evaluate(self, state: Dict[str, Any]) -> Dict[str, Any]:
        rules = state.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
        if not rules:
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "passed": False,
                "score": 0,
                "max_score": self.points,
                "message": "S3 bucket default encryption is not configured."
            }

        rule = rules[0]
        apply_config = rule.get("ApplyServerSideEncryptionByDefault", {})
        algo = apply_config.get("SSEAlgorithm")

        if algo == "aws:kms":
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "passed": True,
                "score": self.points,
                "max_score": self.points,
                "message": "Default encryption is strictly set to 'aws:kms'."
            }
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "passed": False,
            "score": 0,
            "max_score": self.points,
            "message": f"Expected SSEAlgorithm 'aws:kms', found '{algo}'."
        }


class KMSCustomerManagedKeyRule:
    rule_id = "CP-KMS-002"
    name = "Customer Managed Key (CMK) Specification"
    points = 25

    def evaluate(self, state: Dict[str, Any]) -> Dict[str, Any]:
        rules = state.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
        if not rules:
            return {"rule_id": self.rule_id, "name": self.name, "passed": False, "score": 0, "max_score": self.points, "message": "No encryption rules present."}

        apply_config = rules[0].get("ApplyServerSideEncryptionByDefault", {})
        key_id = apply_config.get("KMSMasterKeyId", "")

        if key_id and "arn:aws:kms:" in key_id and "aws/s3" not in key_id:
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "passed": True,
                "score": self.points,
                "max_score": self.points,
                "message": "Valid Customer Managed Key (CMK) ARN specified."
            }
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "passed": False,
            "score": 0,
            "max_score": self.points,
            "message": "A dedicated Customer Managed Key ARN must be specified (avoiding default aws/s3 key)."
        }


class KMSBucketKeyRule:
    rule_id = "CP-KMS-003"
    name = "S3 Bucket Key Cost & API Rate Optimization"
    points = 25

    def evaluate(self, state: Dict[str, Any]) -> Dict[str, Any]:
        bucket_key = state.get("BucketKeyEnabled", False)
        if bucket_key is True:
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "passed": True,
                "score": self.points,
                "max_score": self.points,
                "message": "S3 Bucket Key is enabled, reducing KMS request traffic."
            }
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "passed": False,
            "score": 0,
            "max_score": self.points,
            "message": "S3 Bucket Key must be enabled to prevent KMS throttling and excessive API cost."
        }


class KMSKeyRotationRule:
    rule_id = "CP-KMS-004"
    name = "Automated KMS Key Rotation"
    points = 25

    def evaluate(self, state: Dict[str, Any]) -> Dict[str, Any]:
        rotation = state.get("KMSKeyRotationEnabled", False)
        if rotation is True:
            return {
                "rule_id": self.rule_id,
                "name": self.name,
                "passed": True,
                "score": self.points,
                "max_score": self.points,
                "message": "Automated annual KMS key rotation is enabled."
            }
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "passed": False,
            "score": 0,
            "max_score": self.points,
            "message": "Automated annual key rotation must be enabled on the KMS customer managed key."
        }


class KMSSecretsRulePack:
    def __init__(self):
        self.rules = [
            KMSDefaultEncryptionRule(),
            KMSCustomerManagedKeyRule(),
            KMSBucketKeyRule(),
            KMSKeyRotationRule()
        ]

    def evaluate(self, state: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [rule.evaluate(state) for rule in self.rules]
