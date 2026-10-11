import pytest
import sys
import os
from unittest.mock import MagicMock
from botocore.exceptions import ClientError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scripts.cloudproof_ctl import (
    list_missions,
    deploy_mission,
    status_mission,
    teardown_mission,
    verify_role,
    empty_bucket
)


def test_cloudproof_ctl_list_missions():
    missions = list_missions()
    assert len(missions) == 3
    slugs = [m["slug"] for m in missions]
    assert "s3-public-invoices" in slugs
    assert "iam-overprivileged-lambda" in slugs
    assert "vpc-exposed-database" in slugs


def test_cloudproof_ctl_deploy_and_status_mocked():
    mock_cfn = MagicMock()

    # Step 1: Stack does not exist initially
    mock_cfn.describe_stacks.side_effect = [
        # Check exists before create -> raises ValidationError (stack does not exist)
        ClientError({"Error": {"Code": "ValidationError", "Message": "Stack does not exist"}}, "DescribeStacks"),
        # Wait poll 1: CREATE_COMPLETE
        {
            "Stacks": [
                {
                    "StackStatus": "CREATE_COMPLETE",
                    "Outputs": [
                        {"OutputKey": "InvoiceBucketName", "OutputValue": "cloudproof-acme-invoices-2026"},
                        {"OutputKey": "VerificationRoleArn", "OutputValue": "arn:aws:iam::123456789012:role/CloudProofVerificationRole"}
                    ]
                }
            ]
        },
        # describe_stacks for get_stack_outputs
        {
            "Stacks": [
                {
                    "StackStatus": "CREATE_COMPLETE",
                    "Outputs": [
                        {"OutputKey": "InvoiceBucketName", "OutputValue": "cloudproof-acme-invoices-2026"},
                        {"OutputKey": "VerificationRoleArn", "OutputValue": "arn:aws:iam::123456789012:role/CloudProofVerificationRole"}
                    ]
                }
            ]
        },
        # status_mission call
        {
            "Stacks": [
                {
                    "StackStatus": "CREATE_COMPLETE",
                    "CreationTime": "2026-10-11T22:00:00Z",
                    "Outputs": [
                        {"OutputKey": "InvoiceBucketName", "OutputValue": "cloudproof-acme-invoices-2026"}
                    ]
                }
            ]
        }
    ]

    res_deploy = deploy_mission(
        mission_slug="s3-public-invoices",
        external_id="student-token-abc",
        wait=True,
        cfn_client=mock_cfn
    )

    assert res_deploy["status"] == "CREATE_COMPLETE"
    assert res_deploy["outputs"]["InvoiceBucketName"] == "cloudproof-acme-invoices-2026"
    assert mock_cfn.create_stack.called

    res_status = status_mission("s3-public-invoices", cfn_client=mock_cfn)
    assert res_status["status"] == "CREATE_COMPLETE"
    assert res_status["outputs"]["InvoiceBucketName"] == "cloudproof-acme-invoices-2026"


def test_cloudproof_ctl_empty_bucket_and_teardown_mocked():
    mock_s3 = MagicMock()
    mock_cfn = MagicMock()

    # Mock S3 versions pagination
    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [
        {
            "Versions": [{"Key": "invoice-001.pdf", "VersionId": "v1"}],
            "DeleteMarkers": [{"Key": "invoice-002.pdf", "VersionId": "d1"}]
        }
    ]
    mock_s3.get_paginator.return_value = mock_paginator

    # Test empty_bucket directly
    deleted = empty_bucket(mock_s3, "test-bucket")
    assert deleted == 2
    assert mock_s3.delete_objects.called

    # Mock CFN teardown
    mock_cfn.describe_stacks.side_effect = [
        # Check exists -> exists
        {"Stacks": [{"StackStatus": "CREATE_COMPLETE", "Outputs": [{"OutputKey": "InvoiceBucketName", "OutputValue": "test-bucket"}]}]},
        # Get outputs for bucket discovery
        {"Stacks": [{"StackStatus": "CREATE_COMPLETE", "Outputs": [{"OutputKey": "InvoiceBucketName", "OutputValue": "test-bucket"}]}]},
        # Poll 1 in wait: DELETE_COMPLETE
        ClientError({"Error": {"Code": "ValidationError", "Message": "Stack does not exist"}}, "DescribeStacks")
    ]

    res_teardown = teardown_mission(
        mission_slug="s3-public-invoices",
        wait=True,
        cfn_client=mock_cfn,
        s3_client=mock_s3
    )

    assert res_teardown["status"] == "DELETE_COMPLETE"
    assert mock_cfn.delete_stack.called


def test_cloudproof_ctl_verify_role_mocked():
    mock_sts = MagicMock()

    # 1. Success case
    mock_sts.assume_role.return_value = {
        "AssumedRoleUser": {"Arn": "arn:aws:sts::123456789012:assumed-role/CloudProofVerificationRole/CloudProofPreflightCheck"}
    }
    res_ok = verify_role(
        role_arn="arn:aws:iam::123456789012:role/CloudProofVerificationRole",
        external_id="token-123",
        sts_client=mock_sts
    )
    assert res_ok["status"] == "SUCCESS"
    assert "assumed-role" in res_ok["assumed_role_user"]

    # 2. Failure case (AccessDenied)
    mock_sts.assume_role.side_effect = ClientError(
        {"Error": {"Code": "AccessDenied", "Message": "ExternalId mismatch"}},
        "AssumeRole"
    )
    res_err = verify_role(
        role_arn="arn:aws:iam::123456789012:role/CloudProofVerificationRole",
        external_id="wrong-token",
        sts_client=mock_sts
    )
    assert res_err["status"] == "FAILED"
    assert "ExternalId mismatch" in res_err["error"]
