import pytest
import sys
import os
from unittest.mock import MagicMock
from botocore.exceptions import ClientError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.engine.adapters.aws_boto3 import AWSBoto3Adapter
from app.engine.registry import MissionRegistry
from app.engine.models import RuleCheckStatus


@pytest.mark.asyncio
async def test_aws_boto3_adapter_normalization_and_verification(monkeypatch):
    # 1. Setup Mock STS Client
    mock_sts = MagicMock()
    mock_sts.assume_role.return_value = {
        "Credentials": {
            "AccessKeyId": "ASIA_MOCK_KEY",
            "SecretAccessKey": "MOCK_SECRET",
            "SessionToken": "MOCK_SESSION_TOKEN",
            "Expiration": "2026-10-11T22:00:00Z"
        }
    }

    # 2. Setup Mock S3 Client
    mock_s3 = MagicMock()
    # Mocking compliant S3 bucket
    mock_s3.get_public_access_block.return_value = {
        "PublicAccessBlockConfiguration": {
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True
        }
    }
    # Bucket has no public policy (raises NoSuchBucketPolicy)
    mock_s3.get_bucket_policy.side_effect = ClientError(
        {"Error": {"Code": "NoSuchBucketPolicy", "Message": "The bucket policy does not exist"}},
        "GetBucketPolicy"
    )
    # Bucket ACL is private
    mock_s3.get_bucket_acl.return_value = {
        "Grants": [
            {
                "Grantee": {"Type": "CanonicalUser", "ID": "owner-canonical-id"},
                "Permission": "FULL_CONTROL"
            }
        ]
    }

    # Monkeypatch boto3.client to return mock_s3 when called with "s3"
    def fake_boto3_client(service_name, **kwargs):
        if service_name == "s3":
            return mock_s3
        elif service_name == "sts":
            return mock_sts
        raise ValueError(f"Unexpected service: {service_name}")

    monkeypatch.setattr("boto3.client", fake_boto3_client)

    adapter = AWSBoto3Adapter(sts_client=mock_sts)
    context = {
        "bucket_name": "cloudproof-test-live-bucket",
        "aws_account_id": "112233445566",
        "external_id": "student-secret-token-xyz"
    }

    # 3. Fetch normalized state
    state = await adapter.fetch_state(context)
    assert state["bucket_name"] == "cloudproof-test-live-bucket"
    assert state["public_access_block"]["BlockPublicAcls"] is True
    assert state["public_access_block"]["BlockPublicPolicy"] is True
    assert state["bucket_policy"] is None
    assert state["bucket_acl"] == "private"

    # 4. Verify state passes Mission 1 rules
    verifier = MissionRegistry.get_verifier("s3-public-invoices")
    verdict = await verifier.verify(adapter, context)

    assert verdict.status == RuleCheckStatus.PASS
    assert verdict.passed_rules == 6
    assert verdict.base_points_earned == 100


@pytest.mark.asyncio
async def test_aws_boto3_adapter_missing_context():
    adapter = AWSBoto3Adapter()
    with pytest.raises(ValueError, match="Missing required AWS connection context"):
        await adapter.fetch_state({"bucket_name": "test-bucket"})
