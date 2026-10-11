import pytest
import uuid
import sys
import os
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_student_portfolio_and_certification_badge_lifecycle():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = uuid.uuid4().hex[:6]

        # 1. Register instructor
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_port_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Portfolio Evaluator",
                "role": "instructor"
            }
        )
        assert inst_res.status_code == 201
        inst_token = inst_res.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # 2. Create class
        class_res = await client.post(
            "/api/v1/instructor/classes",
            headers=inst_headers,
            json={"name": "Comprehensive Cloud Defense 501", "description": "Tri-domain Cloud Security"}
        )
        assert class_res.status_code == 201
        class_id = class_res.json()["id"]
        join_code = class_res.json()["join_code"]

        # 3. Assign all 3 missions: S3, IAM, and VPC
        cat_res = await client.get("/api/v1/instructor/missions/catalog", headers=inst_headers)
        assert cat_res.status_code == 200
        catalog = {m["slug"]: m["id"] for m in cat_res.json()}

        assign_s3 = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": catalog["s3-public-invoices"]}
        )
        s3_assignment_id = assign_s3.json()["assignment_id"]

        assign_iam = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": catalog["iam-overprivileged-lambda"]}
        )
        iam_assignment_id = assign_iam.json()["assignment_id"]

        assign_vpc = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": catalog["vpc-exposed-database"]}
        )
        vpc_assignment_id = assign_vpc.json()["assignment_id"]

        # 4. Register student & join class
        stu_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"stu_port_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Evan Evidence",
                "role": "student"
            }
        )
        assert stu_res.status_code == 201
        stu_token = stu_res.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        await client.post(
            "/api/v1/student/classes/join",
            headers=stu_headers,
            json={"join_code": join_code}
        )

        # 5. Check Initial Portfolio State (Zero Completed)
        port_init = await client.get("/api/v1/student/portfolio", headers=stu_headers)
        assert port_init.status_code == 200
        data_init = port_init.json()
        assert data_init["total_completed"] == 0
        assert data_init["badge"]["is_earned"] is False
        assert data_init["badge"]["verification_token"] == "PENDING-ALL-CORE-INCIDENTS"
        for comp in data_init["competencies"]:
            assert comp["level"] == "Unattempted"
            assert comp["score_percent"] == 0

        # 6. Complete Mission 1: S3 Public Invoices
        start_s3 = await client.post(f"/api/v1/missions/{s3_assignment_id}/start", headers=stu_headers, json={"mode": "demo"})
        s3_attempt_id = start_s3.json()["attempt_id"]
        # Save remediated S3 state
        remediated_s3 = {
            "bucket_name": "cloudproof-acme-invoices-2026",
            "public_access_block": {
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True
            },
            "bucket_acl": "private",
            "bucket_policy": None
        }
        await client.put(f"/api/v1/missions/{s3_attempt_id}/state", headers=stu_headers, json={"demo_state": remediated_s3})
        v_s3 = await client.post(f"/api/v1/missions/{s3_attempt_id}/verify", headers=stu_headers)
        assert v_s3.json()["status"] == "passed"

        # Check Portfolio after Mission 1
        port_1 = await client.get("/api/v1/student/portfolio", headers=stu_headers)
        data_1 = port_1.json()
        assert data_1["total_completed"] == 1
        assert data_1["badge"]["is_earned"] is False
        s3_comp = next(c for c in data_1["competencies"] if c["domain"] == "Storage Security")
        assert s3_comp["level"] == "Mastered"
        assert s3_comp["score_percent"] == 100

        # 7. Complete Mission 2: IAM Overprivileged Lambda
        start_iam = await client.post(f"/api/v1/missions/{iam_assignment_id}/start", headers=stu_headers, json={"mode": "demo"})
        iam_attempt_id = start_iam.json()["attempt_id"]
        remediated_iam = {
            "role_name": "WorkerLambdaExecutionRole",
            "attached_managed_policies": [],
            "inline_policy": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowLogging",
                        "Effect": "Allow",
                        "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                        "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/worker:*"
                    },
                    {
                        "Sid": "AllowScopedS3",
                        "Effect": "Allow",
                        "Action": "s3:GetObject",
                        "Resource": "arn:aws:s3:::acme-media-uploads-2026/*"
                    }
                ]
            },
            "trust_policy": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        }
        await client.put(f"/api/v1/missions/{iam_attempt_id}/state", headers=stu_headers, json={"demo_state": remediated_iam})
        v_iam = await client.post(f"/api/v1/missions/{iam_attempt_id}/verify", headers=stu_headers)
        assert v_iam.json()["status"] == "passed"

        # 8. Complete Mission 3: VPC Exposed Database
        start_vpc = await client.post(f"/api/v1/missions/{vpc_assignment_id}/start", headers=stu_headers, json={"mode": "demo"})
        vpc_attempt_id = start_vpc.json()["attempt_id"]
        remediated_vpc = {
            "group_id": "sg-04a89bc21345d6e7f",
            "group_name": "prod-aurora-postgres-sg",
            "vpc_id": "vpc-01a2b3c4d5e6f7g8h",
            "ip_permissions": [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                    "IpRanges": [{"CidrIp": "10.0.0.0/16", "Description": "Backend private subnet"}],
                    "Ipv6Ranges": [],
                    "PrefixListIds": [],
                    "UserIdGroupPairs": []
                }
            ],
            "ip_permissions_egress": [
                {
                    "IpProtocol": "-1",
                    "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                    "Ipv6Ranges": [],
                    "PrefixListIds": [],
                    "UserIdGroupPairs": []
                }
            ]
        }
        await client.put(f"/api/v1/missions/{vpc_attempt_id}/state", headers=stu_headers, json={"demo_state": remediated_vpc})
        v_vpc = await client.post(f"/api/v1/missions/{vpc_attempt_id}/verify", headers=stu_headers)
        assert v_vpc.json()["status"] == "passed"

        # 9. Verify Final Portfolio & Certification Badge
        port_final = await client.get("/api/v1/student/portfolio", headers=stu_headers)
        assert port_final.status_code == 200
        data_final = port_final.json()

        assert data_final["total_completed"] == 3
        assert data_final["overall_average_score"] == 100.0

        # All 3 competencies Mastered
        for comp in data_final["competencies"]:
            assert comp["level"] == "Mastered"
            assert comp["score_percent"] == 100

        # Badge earned!
        badge = data_final["badge"]
        assert badge["is_earned"] is True
        assert badge["verification_token"].startswith("CP-VERIFY-")
        assert len(badge["verification_token"]) == 22  # "CP-VERIFY-" (10) + 12 chars = 22
        assert badge["earned_at"] is not None
        assert len(badge["required_missions"]) == 3
