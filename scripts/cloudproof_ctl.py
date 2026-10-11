#!/usr/bin/env python3
"""
CloudProof Multi-Mission Deployment & Teardown CLI.

Turnkey automation tool for students and instructors deploying, inspecting,
and tearing down real AWS CloudFormation environments with zero orphaned resources.
"""

import os
import sys
import time
import argparse
from typing import Dict, Any, Optional, List
import boto3
from botocore.exceptions import ClientError

MISSION_REGISTRY: Dict[str, Dict[str, Any]] = {
    "s3-public-invoices": {
        "title": "The Public Invoice Bucket",
        "category": "Storage Security",
        "stack_name": "CloudProof-Mission-S3-PublicInvoices",
        "template_path": "missions/s3-public-invoices/cloudformation/template.yaml",
        "description": "Deploys an intentionally public Amazon S3 bucket with customer invoices.",
        "requires_cloudproof_account_id": True,
    },
    "iam-overprivileged-lambda": {
        "title": "The Overprivileged Lambda Role",
        "category": "Identity & Access Management",
        "stack_name": "CloudProof-Mission-IAM-OverprivilegedLambda",
        "template_path": "missions/iam-overprivileged-lambda/cloudformation/template.yaml",
        "description": "Deploys a Lambda execution role with AdministratorAccess and wildcard actions.",
        "requires_cloudproof_account_id": True,
    },
    "vpc-exposed-database": {
        "title": "The World-Readable Database Port",
        "category": "Network Security & VPC",
        "stack_name": "CloudProof-Mission-VPC-ExposedDatabase",
        "template_path": "missions/vpc-exposed-database/cloudformation/template.yaml",
        "description": "Deploys an Aurora PostgreSQL Security Group open to 0.0.0.0/0 on port 5432 and 22.",
        "requires_cloudproof_account_id": False,
    },
}


def get_cfn_client(region: Optional[str] = None, client: Optional[Any] = None) -> Any:
    if client:
        return client
    region_name = region or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    return boto3.client("cloudformation", region_name=region_name)


def get_s3_client(region: Optional[str] = None, client: Optional[Any] = None) -> Any:
    if client:
        return client
    region_name = region or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    return boto3.client("s3", region_name=region_name)


def get_sts_client(region: Optional[str] = None, client: Optional[Any] = None) -> Any:
    if client:
        return client
    region_name = region or os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    return boto3.client("sts", region_name=region_name)


def load_template_body(template_path: str) -> str:
    """Locates and reads the CloudFormation template body."""
    # Handle paths relative to repo root
    resolved_path = template_path
    if not os.path.isabs(template_path):
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        resolved_path = os.path.join(repo_root, template_path)

    if not os.path.exists(resolved_path):
        raise FileNotFoundError(f"CloudFormation template not found at '{resolved_path}'")

    with open(resolved_path, "r", encoding="utf-8") as f:
        return f.read()


def list_missions() -> List[Dict[str, Any]]:
    """Returns a list of all registered mission configurations."""
    missions = []
    for slug, meta in MISSION_REGISTRY.items():
        missions.append({
            "slug": slug,
            "title": meta["title"],
            "category": meta["category"],
            "stack_name": meta["stack_name"],
            "template_path": meta["template_path"],
            "description": meta["description"],
        })
    return missions


def check_stack_exists(cfn_client: Any, stack_name: str) -> Optional[str]:
    """Returns the stack status if it exists, or None if deleted/not found."""
    try:
        res = cfn_client.describe_stacks(StackName=stack_name)
        stacks = res.get("Stacks", [])
        if stacks:
            status = stacks[0]["StackStatus"]
            if status != "DELETE_COMPLETE":
                return status
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if "ValidationError" in error_code and "does not exist" in str(e):
            return None
        raise e
    return None


def deploy_mission(
    mission_slug: str,
    external_id: str,
    cloudproof_account_id: str = "123456789012",
    region: Optional[str] = None,
    wait: bool = True,
    cfn_client: Optional[Any] = None
) -> Dict[str, Any]:
    """Deploys or updates the CloudFormation stack for the specified mission."""
    if mission_slug not in MISSION_REGISTRY:
        raise ValueError(f"Unknown mission slug '{mission_slug}'. Run 'list' to view available missions.")

    meta = MISSION_REGISTRY[mission_slug]
    stack_name = meta["stack_name"]
    template_body = load_template_body(meta["template_path"])

    cfn = get_cfn_client(region=region, client=cfn_client)

    params = [
        {"ParameterKey": "ExternalId", "ParameterValue": external_id}
    ]
    if meta.get("requires_cloudproof_account_id"):
        params.append({"ParameterKey": "CloudProofAccountId", "ParameterValue": cloudproof_account_id})

    existing_status = check_stack_exists(cfn, stack_name)

    if existing_status:
        # Update existing stack
        try:
            cfn.update_stack(
                StackName=stack_name,
                TemplateBody=template_body,
                Parameters=params,
                Capabilities=["CAPABILITY_NAMED_IAM"]
            )
            action = "UPDATE"
        except ClientError as e:
            msg = str(e)
            if "No updates are to be performed" in msg:
                return {
                    "status": "UP_TO_DATE",
                    "stack_name": stack_name,
                    "message": "Stack is already up-to-date with this template and parameters."
                }
            raise e
    else:
        # Create fresh stack
        cfn.create_stack(
            StackName=stack_name,
            TemplateBody=template_body,
            Parameters=params,
            Capabilities=["CAPABILITY_NAMED_IAM"],
            Tags=[
                {"Key": "Platform", "Value": "CloudProof"},
                {"Key": "Mission", "Value": mission_slug}
            ]
        )
        action = "CREATE"

    if wait:
        terminal_status = wait_for_stack(cfn, stack_name, target_action=action)
        return {
            "status": terminal_status,
            "stack_name": stack_name,
            "action": action,
            "outputs": get_stack_outputs(cfn, stack_name)
        }

    return {
        "status": "IN_PROGRESS",
        "stack_name": stack_name,
        "action": action
    }


def wait_for_stack(cfn_client: Any, stack_name: str, target_action: str = "CREATE", timeout_seconds: int = 600) -> str:
    """Blocks until stack reaches a terminal state, printing progression dots."""
    start_time = time.time()
    success_states = ("CREATE_COMPLETE", "UPDATE_COMPLETE")
    failure_states = ("CREATE_FAILED", "ROLLBACK_COMPLETE", "ROLLBACK_FAILED", "UPDATE_ROLLBACK_COMPLETE", "UPDATE_ROLLBACK_FAILED")

    while time.time() - start_time < timeout_seconds:
        status = check_stack_exists(cfn_client, stack_name)
        if status in success_states:
            return status
        if status in failure_states:
            raise RuntimeError(f"CloudFormation stack {stack_name} entered failed state: {status}")
        time.sleep(3)

    raise TimeoutError(f"Timed out waiting for stack {stack_name} after {timeout_seconds} seconds.")


def get_stack_outputs(cfn_client: Any, stack_name: str) -> Dict[str, str]:
    """Retrieves CloudFormation stack outputs as a key-value dictionary."""
    try:
        res = cfn_client.describe_stacks(StackName=stack_name)
        stacks = res.get("Stacks", [])
        if not stacks:
            return {}
        outputs = {}
        for o in stacks[0].get("Outputs", []):
            outputs[o["OutputKey"]] = o["OutputValue"]
        return outputs
    except Exception:
        return {}


def status_mission(mission_slug: str, region: Optional[str] = None, cfn_client: Optional[Any] = None) -> Dict[str, Any]:
    """Inspects the current state, parameters, and outputs of a mission stack."""
    if mission_slug not in MISSION_REGISTRY:
        raise ValueError(f"Unknown mission slug '{mission_slug}'.")

    meta = MISSION_REGISTRY[mission_slug]
    stack_name = meta["stack_name"]
    cfn = get_cfn_client(region=region, client=cfn_client)

    try:
        res = cfn.describe_stacks(StackName=stack_name)
        stacks = res.get("Stacks", [])
        if not stacks:
            return {"status": "NOT_FOUND", "stack_name": stack_name}
        st = stacks[0]
        outputs = {o["OutputKey"]: o["OutputValue"] for o in st.get("Outputs", [])}
        return {
            "status": st["StackStatus"],
            "stack_name": stack_name,
            "created_at": str(st.get("CreationTime")),
            "outputs": outputs
        }
    except ClientError as e:
        if "does not exist" in str(e):
            return {"status": "NOT_FOUND", "stack_name": stack_name}
        raise e


def empty_bucket(s3_client: Any, bucket_name: str) -> int:
    """Empties all objects and versions from an S3 bucket before stack deletion."""
    deleted_count = 0
    try:
        # Delete all object versions and delete markers
        paginator = s3_client.get_paginator("list_object_versions")
        for page in paginator.paginate(Bucket=bucket_name):
            to_delete = []
            for version in page.get("Versions", []):
                to_delete.append({"Key": version["Key"], "VersionId": version["VersionId"]})
            for marker in page.get("DeleteMarkers", []):
                to_delete.append({"Key": marker["Key"], "VersionId": marker["VersionId"]})

            if to_delete:
                s3_client.delete_objects(
                    Bucket=bucket_name,
                    Delete={"Objects": to_delete, "Quiet": True}
                )
                deleted_count += len(to_delete)
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code != "NoSuchBucket":
            raise e
    return deleted_count


def teardown_mission(
    mission_slug: str,
    region: Optional[str] = None,
    wait: bool = True,
    cfn_client: Optional[Any] = None,
    s3_client: Optional[Any] = None
) -> Dict[str, Any]:
    """Cleanly deletes all resources for a mission stack, leaving zero orphaned assets."""
    if mission_slug not in MISSION_REGISTRY:
        raise ValueError(f"Unknown mission slug '{mission_slug}'.")

    meta = MISSION_REGISTRY[mission_slug]
    stack_name = meta["stack_name"]

    cfn = get_cfn_client(region=region, client=cfn_client)
    s3 = get_s3_client(region=region, client=s3_client)

    status = check_stack_exists(cfn, stack_name)
    if not status:
        return {
            "status": "ALREADY_DELETED",
            "stack_name": stack_name,
            "message": "Stack does not exist."
        }

    # If S3 mission, empty bucket first to prevent BucketNotEmpty deletion failure
    if mission_slug == "s3-public-invoices":
        outputs = get_stack_outputs(cfn, stack_name)
        bucket_name = outputs.get("InvoiceBucketName")
        if bucket_name:
            empty_bucket(s3, bucket_name)

    cfn.delete_stack(StackName=stack_name)

    if wait:
        # Wait for DELETE_COMPLETE
        start = time.time()
        while time.time() - start < 300:
            current_status = check_stack_exists(cfn, stack_name)
            if current_status is None or current_status == "DELETE_COMPLETE":
                return {
                    "status": "DELETE_COMPLETE",
                    "stack_name": stack_name,
                    "message": "All resources cleanly deleted. Zero cloud footprint."
                }
            time.sleep(3)

    return {
        "status": "DELETE_IN_PROGRESS",
        "stack_name": stack_name
    }


def verify_role(
    role_arn: str,
    external_id: str,
    sts_client: Optional[Any] = None
) -> Dict[str, Any]:
    """Runs a live STS AssumeRole verification check to confirm CloudProof connectivity."""
    sts = get_sts_client(client=sts_client)
    try:
        resp = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName="CloudProofPreflightCheck",
            ExternalId=external_id,
            DurationSeconds=900
        )
        return {
            "status": "SUCCESS",
            "role_arn": role_arn,
            "assumed_role_user": resp["AssumedRoleUser"]["Arn"],
            "message": "STS AssumeRole with External ID succeeded. Ready for automated verification."
        }
    except ClientError as e:
        return {
            "status": "FAILED",
            "role_arn": role_arn,
            "error": str(e)
        }


def main():
    parser = argparse.ArgumentParser(
        description="CloudProof Real AWS Multi-Mission Automation CLI"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # list
    subparsers.add_parser("list", help="List all available incident missions")

    # deploy
    deploy_parser = subparsers.add_parser("deploy", help="Deploy mission CloudFormation stack")
    deploy_parser.add_argument("--mission", required=True, help="Mission slug (e.g. s3-public-invoices)")
    deploy_parser.add_argument("--external-id", required=True, help="Unique student External ID")
    deploy_parser.add_argument("--account-id", default="123456789012", help="CloudProof Backend AWS Account ID")
    deploy_parser.add_argument("--region", default=None, help="AWS Region (default: us-east-1)")
    deploy_parser.add_argument("--no-wait", action="store_true", help="Do not wait for stack completion")

    # status
    status_parser = subparsers.add_parser("status", help="Get status of deployed mission")
    status_parser.add_argument("--mission", required=True, help="Mission slug")
    status_parser.add_argument("--region", default=None, help="AWS Region")

    # verify-role
    verify_parser = subparsers.add_parser("verify-role", help="Verify STS AssumeRole connectivity")
    verify_parser.add_argument("--role-arn", required=True, help="CloudProofVerificationRole ARN")
    verify_parser.add_argument("--external-id", required=True, help="External ID")

    # teardown
    teardown_parser = subparsers.add_parser("teardown", help="Tear down mission stack cleanly")
    teardown_parser.add_argument("--mission", required=True, help="Mission slug")
    teardown_parser.add_argument("--region", default=None, help="AWS Region")
    teardown_parser.add_argument("--no-wait", action="store_true", help="Do not wait for deletion")

    args = parser.parse_args()

    if args.command == "list":
        missions = list_missions()
        print("\n=== CloudProof Incident Catalog ===")
        for m in missions:
            print(f"- {m['slug']}")
            print(f"  Title:       {m['title']}")
            print(f"  Category:    {m['category']}")
            print(f"  Stack Name:  {m['stack_name']}")
            print(f"  Template:    {m['template_path']}")
            print(f"  Description: {m['description']}\n")

    elif args.command == "deploy":
        print(f"[*] Deploying mission '{args.mission}' with External ID '{args.external_id}'...")
        res = deploy_mission(
            mission_slug=args.mission,
            external_id=args.external_id,
            cloudproof_account_id=args.account_id,
            region=args.region,
            wait=not args.no_wait
        )
        print(f"[+] Status: {res['status']}")
        if "outputs" in res:
            print("[+] Stack Outputs:")
            for k, v in res["outputs"].items():
                print(f"    {k}: {v}")

    elif args.command == "status":
        res = status_mission(args.mission, region=args.region)
        print(f"[*] Stack: {res['stack_name']}")
        print(f"[*] Status: {res['status']}")
        if "outputs" in res and res["outputs"]:
            print("[*] Outputs:")
            for k, v in res["outputs"].items():
                print(f"    {k}: {v}")

    elif args.command == "verify-role":
        res = verify_role(args.role_arn, args.external_id)
        if res["status"] == "SUCCESS":
            print(f"[+] {res['message']}")
            print(f"    Assumed Role: {res['assumed_role_user']}")
        else:
            print(f"[-] Verification failed: {res['error']}")
            sys.exit(1)

    elif args.command == "teardown":
        print(f"[*] Tearing down mission '{args.mission}'...")
        res = teardown_mission(
            mission_slug=args.mission,
            region=args.region,
            wait=not args.no_wait
        )
        print(f"[+] Status: {res['status']}")
        if "message" in res:
            print(f"[+] {res['message']}")


if __name__ == "__main__":
    main()
