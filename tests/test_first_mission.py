import pytest
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.engine.registry import MissionRegistry
from app.engine.adapters.simulation import SimulationAdapter
from app.engine.models import RuleCheckStatus


@pytest.mark.asyncio
async def test_first_mission_rule_pack_directly():
    verifier = MissionRegistry.get_verifier("s3-public-invoices")
    assert verifier is not None
    assert len(verifier.rules) == 6

    adapter = SimulationAdapter()

    # Initial Broken State
    broken_state = {
        "bucket_name": "cloudproof-acme-invoices-2026",
        "public_access_block": {
            "BlockPublicAcls": False,
            "IgnorePublicAcls": False,
            "BlockPublicPolicy": False,
            "RestrictPublicBuckets": False
        },
        "bucket_acl": "public-read",
        "bucket_policy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject"
                }
            ]
        }
    }

    verdict_fail = await verifier.verify(adapter, {"current_demo_state": broken_state})
    assert verdict_fail.status == RuleCheckStatus.FAIL
    assert verdict_fail.passed_rules == 0
    assert verdict_fail.total_rules == 6
    assert verdict_fail.base_points_earned == 0

    # Remediated Compliant State
    fixed_state = {
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

    verdict_pass = await verifier.verify(adapter, {"current_demo_state": fixed_state})
    assert verdict_pass.status == RuleCheckStatus.PASS
    assert verdict_pass.passed_rules == 6
    assert verdict_pass.base_points_earned == 100
    assert verdict_pass.max_points_possible == 100


@pytest.mark.asyncio
async def test_first_mission_api_remediation_lifecycle():
    await init_db()
    uid = uuid.uuid4().hex[:6]
    inst_email = f"prof_{uid}@test.edu"
    std_email = f"student_{uid}@test.edu"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register instructor & student
        inst_r = await client.post(
            "/api/v1/auth/register",
            json={"email": inst_email, "password": "Password123!", "full_name": "Prof S", "role": "instructor"}
        )
        inst_token = inst_r.json()["access_token"]

        std_r = await client.post(
            "/api/v1/auth/register",
            json={"email": std_email, "password": "Password123!", "full_name": "Student S", "role": "student"}
        )
        std_token = std_r.json()["access_token"]

        # 2. Instructor creates class & assigns Mission 1
        cls_r = await client.post(
            "/api/v1/instructor/classes",
            json={"name": "Cloud Security Lab", "description": "S3 Incident"},
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        cls_data = cls_r.json()
        class_id = cls_data["id"]
        join_code = cls_data["join_code"]

        cat_r = await client.get("/api/v1/instructor/missions/catalog", headers={"Authorization": f"Bearer {inst_token}"})
        m1_id = cat_r.json()[0]["id"]

        await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            json={"mission_id": m1_id},
            headers={"Authorization": f"Bearer {inst_token}"}
        )

        # 3. Student joins class
        await client.post(
            "/api/v1/student/classes/join",
            json={"join_code": join_code},
            headers={"Authorization": f"Bearer {std_token}"}
        )

        # 4. Student gets assigned missions from dashboard
        dash_r = await client.get("/api/v1/student/dashboard", headers={"Authorization": f"Bearer {std_token}"})
        assignment_id = dash_r.json()["assigned_missions"][0]["assignment_id"]

        # 5. Student launches mission
        start_r = await client.post(
            f"/api/v1/missions/{assignment_id}/start",
            json={"mode": "demo"},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert start_r.status_code == 200
        attempt_id = start_r.json()["attempt_id"]
        assert start_r.json()["current_demo_state"]["public_access_block"]["BlockPublicAcls"] is False

        # 6. Verify initial state -> FAIL
        verify_fail = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert verify_fail.status_code == 200
        fail_data = verify_fail.json()
        assert fail_data["status"] == "failed"
        assert fail_data["verdict"]["status"] == "FAIL"
        assert fail_data["final_score"] == 0

        # 7. Student fixes configuration
        fixed_conf = {
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

        update_r = await client.put(
            f"/api/v1/missions/{attempt_id}/state",
            json={"demo_state": fixed_conf},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert update_r.status_code == 200

        # 8. Verify fixed state -> PASS with 100 points
        verify_pass = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert verify_pass.status_code == 200
        pass_data = verify_pass.json()
        assert pass_data["status"] == "passed"
        assert pass_data["verdict"]["status"] == "PASS"
        assert pass_data["final_score"] == 100
        assert pass_data["base_score"] == 100
