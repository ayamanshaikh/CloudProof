import json
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from app.engine.adapters.base import BaseEnvironmentAdapter
from app.core.config import settings


class AWSBoto3Adapter(BaseEnvironmentAdapter):
    """
    Adapter fetching live configuration from a student's real AWS account
    via read-only cross-account STS AssumeRole.
    """

    def __init__(self, sts_client: Optional[Any] = None):
        # Allow injecting mocked sts_client for automated unit testing
        self._sts_client = sts_client

    def _get_sts_client(self):
        if self._sts_client:
            return self._sts_client
        return boto3.client("sts", region_name=settings.AWS_REGION)

    async def fetch_state(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expects context with:
        - aws_account_id: str
        - external_id: str
        - target resource identifier:
            - bucket_name: str (for S3 storage missions)
            - group_id or security_group_id: str (for VPC SG missions)
            - target_role_name: str (for IAM missions)
        - role_name: Optional[str] (default: CloudProofVerificationRole)
        """
        aws_account_id = context.get("aws_account_id")
        external_id = context.get("external_id")
        role_name = context.get("role_name", "CloudProofVerificationRole")

        bucket_name = context.get("bucket_name")
        group_id = context.get("group_id") or context.get("security_group_id")
        target_role_name = context.get("target_role_name")

        if not aws_account_id or not external_id:
            raise ValueError("Missing required AWS connection context: aws_account_id, or external_id.")

        if not bucket_name and not group_id and not target_role_name:
            raise ValueError("Missing required AWS connection context: bucket_name, group_id, or target_role_name.")

        role_arn = f"arn:aws:iam::{aws_account_id}:role/{role_name}"

        # 1. Assume Role using STS
        sts = self._get_sts_client()
        assume_resp = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="CloudProofVerificationSession",
            ExternalId=external_id,
            DurationSeconds=900  # 15 minutes
        )

        creds = assume_resp["Credentials"]

        # 2. If Security Group verification
        if group_id:
            ec2 = boto3.client(
                "ec2",
                region_name=settings.AWS_REGION,
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"]
            )
            sg_resp = ec2.describe_security_groups(GroupIds=[group_id])
            sgs = sg_resp.get("SecurityGroups", [])
            if not sgs:
                raise ValueError(f"Security Group '{group_id}' not found.")
            sg = sgs[0]
            return {
                "group_id": sg.get("GroupId"),
                "group_name": sg.get("GroupName"),
                "description": sg.get("Description"),
                "vpc_id": sg.get("VpcId"),
                "ip_permissions": sg.get("IpPermissions", []),
                "ip_permissions_egress": sg.get("IpPermissionsEgress", [])
            }

        # 3. If IAM Role verification
        if target_role_name:
            iam = boto3.client(
                "iam",
                region_name=settings.AWS_REGION,
                aws_access_key_id=creds["AccessKeyId"],
                aws_secret_access_key=creds["SecretAccessKey"],
                aws_session_token=creds["SessionToken"]
            )
            role_data = iam.get_role(RoleName=target_role_name)["Role"]
            attached = iam.list_attached_role_policies(RoleName=target_role_name).get("AttachedPolicies", [])
            attached_arns = [p["PolicyArn"] for p in attached]

            inline_policies = iam.list_role_policies(RoleName=target_role_name).get("PolicyNames", [])
            first_inline = None
            if inline_policies:
                first_policy_doc = iam.get_role_policy(
                    RoleName=target_role_name,
                    PolicyName=inline_policies[0]
                ).get("PolicyDocument")
                if isinstance(first_policy_doc, str):
                    first_inline = json.loads(first_policy_doc)
                else:
                    first_inline = first_policy_doc

            trust_policy = role_data.get("AssumeRolePolicyDocument")
            if isinstance(trust_policy, str):
                trust_policy = json.loads(trust_policy)

            return {
                "role_name": target_role_name,
                "attached_managed_policies": attached_arns,
                "inline_policy": first_inline,
                "trust_policy": trust_policy
            }

        # 4. Initialize temporary read-only S3 client
        s3 = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"]
        )

        # 3. Retrieve Public Access Block settings
        public_access_block = {
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False
        }
        try:
            pab_resp = s3.get_public_access_block(Bucket=bucket_name)
            pab_conf = pab_resp.get("PublicAccessBlockConfiguration", {})
            public_access_block = {
                "BlockPublicAcls": pab_conf.get("BlockPublicAcls", False),
                "IgnorePublicAcls": pab_conf.get("IgnorePublicAcls", False),
                "BlockPublicPolicy": pab_conf.get("BlockPublicPolicy", False),
                "RestrictPublicBuckets": pab_conf.get("RestrictPublicBuckets", False)
            }
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code != "NoSuchPublicAccessBlockConfiguration":
                raise e

        # 4. Retrieve Bucket Policy
        bucket_policy = None
        try:
            policy_resp = s3.get_bucket_policy(Bucket=bucket_name)
            policy_str = policy_resp.get("Policy")
            if policy_str:
                bucket_policy = json.loads(policy_str)
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code != "NoSuchBucketPolicy":
                raise e

        # 5. Retrieve Bucket ACL
        bucket_acl = "private"
        try:
            acl_resp = s3.get_bucket_acl(Bucket=bucket_name)
            grants = acl_resp.get("Grants", [])
            for grant in grants:
                grantee = grant.get("Grantee", {})
                permission = grant.get("Permission", "")
                uri = grantee.get("URI", "")
                # Check for AllUsers (public) or AuthenticatedUsers
                if "AllUsers" in uri:
                    if permission in ("READ", "FULL_CONTROL"):
                        bucket_acl = "public-read"
                        break
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code != "AccessDenied":
                raise e

        # Return standardized normalized configuration state
        return {
            "bucket_name": bucket_name,
            "public_access_block": public_access_block,
            "bucket_acl": bucket_acl,
            "bucket_policy": bucket_policy
        }
