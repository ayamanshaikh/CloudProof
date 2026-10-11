import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ai.provider import DeterministicOfflineLLMProvider, get_llm_provider


@pytest.mark.asyncio
async def test_deterministic_offline_llm_provider_direct():
    provider = DeterministicOfflineLLMProvider()
    result = await provider.generate_postmortem(
        mission_title="The Public Invoice Bucket",
        verdict_status="PASS",
        rule_results=[
            {"rule_id": "CP-S3-001", "name": "BlockPublicAcls Enforced", "status": "PASS"},
            {"rule_id": "CP-S3-002", "name": "IgnorePublicAcls Enforced", "status": "PASS"},
            {"rule_id": "CP-S3-005", "name": "No Public Bucket Policy", "status": "PASS"},
            {"rule_id": "CP-S3-006", "name": "Canned ACL is Private", "status": "PASS"},
        ],
        initial_state={
            "bucket_acl": "public-read",
            "public_access_block": {
                "BlockPublicAcls": False,
                "IgnorePublicAcls": False,
                "BlockPublicPolicy": False,
                "RestrictPublicBuckets": False,
            }
        },
        remediated_state={
            "bucket_acl": "private",
            "public_access_block": {
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            }
        }
    )

    assert "incident_summary" in result and len(result["incident_summary"]) > 20
    assert "root_cause_analysis" in result and "BlockPublicAcls" in result["root_cause_analysis"]
    assert "threat_exploit_scenario" in result and "no-sign-request" in result["threat_exploit_scenario"]
    assert "remediation_diff_breakdown" in result and "public-read" in result["remediation_diff_breakdown"]
    assert "why_fix_works" in result and "IgnorePublicAcls" in result["why_fix_works"]
    assert isinstance(result["best_practices"], list) and len(result["best_practices"]) >= 4
    assert result["generated_by"] != ""


@pytest.mark.asyncio
async def test_ai_postmortem_api_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register instructor
        unique_id = uuid.uuid4().hex[:6]
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_postmortem_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Incident",
                "role": "instructor"
            }
        )
        assert inst_res.status_code == 201
        inst_token = inst_res.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # 2. Create class & assign mission
        class_res = await client.post(
            "/api/v1/instructor/classes",
            headers=inst_headers,
            json={"name": "Cloud Security Fall 2026", "description": "Hands-on labs"}
        )
        assert class_res.status_code == 201
        class_data = class_res.json()
        class_id = class_data["id"]
        join_code = class_data["join_code"]

        cat_res = await client.get("/api/v1/instructor/missions/catalog", headers=inst_headers)
        assert cat_res.status_code == 200
        mission_1 = cat_res.json()[0]

        assign_res = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": mission_1["id"]}
        )
        assert assign_res.status_code == 201
        assignment_id = assign_res.json()["assignment_id"]

        # 3. Register student 1
        stu_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"stu_postmortem_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Alice Auditor",
                "role": "student"
            }
        )
        assert stu_res.status_code == 201
        stu_token = stu_res.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # Student joins class & starts mission
        join_res = await client.post(
            "/api/v1/student/classes/join",
            headers=stu_headers,
            json={"join_code": join_code}
        )
        assert join_res.status_code == 200

        start_res = await client.post(
            f"/api/v1/missions/{assignment_id}/start",
            headers=stu_headers,
            json={"mode": "demo"}
        )
        assert start_res.status_code == 200
        attempt_id = start_res.json()["attempt_id"]

        # 4. Attempt to fetch post-mortem BEFORE verification -> 400
        pm_early = await client.get(
            f"/api/v1/postmortem/attempt/{attempt_id}",
            headers=stu_headers
        )
        assert pm_early.status_code == 400
        assert "not been verified yet" in pm_early.json()["detail"]

        # 5. Remediate & Verify
        fix_state = {
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
        await client.put(
            f"/api/v1/missions/{attempt_id}/state",
            headers=stu_headers,
            json={"demo_state": fix_state}
        )

        verify_res = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu_headers
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verdict"]["status"] == "PASS"

        # 6. Fetch post-mortem AFTER verification -> 200 with all 6 sections
        pm_res = await client.get(
            f"/api/v1/postmortem/attempt/{attempt_id}",
            headers=stu_headers
        )
        assert pm_res.status_code == 200
        pm = pm_res.json()
        assert pm["attempt_id"] == attempt_id
        assert pm["verdict_status"] == "PASS"
        assert len(pm["incident_summary"]) > 0
        assert len(pm["root_cause_analysis"]) > 0
        assert len(pm["threat_exploit_scenario"]) > 0
        assert len(pm["remediation_diff_breakdown"]) > 0
        assert len(pm["why_fix_works"]) > 0
        assert len(pm["best_practices"]) >= 4

        # 7. Instructor can also inspect student's post-mortem
        pm_inst = await client.get(
            f"/api/v1/postmortem/attempt/{attempt_id}",
            headers=inst_headers
        )
        assert pm_inst.status_code == 200
        assert pm_inst.json()["attempt_id"] == attempt_id

        # 8. Unrelated student 2 cannot inspect student 1's post-mortem -> 403
        stu2_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"stu2_postmortem_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Bob Peeker",
                "role": "student"
            }
        )
        assert stu2_res.status_code == 201
        stu2_token = stu2_res.json()["access_token"]
        stu2_headers = {"Authorization": f"Bearer {stu2_token}"}

        pm_stu2 = await client.get(
            f"/api/v1/postmortem/attempt/{attempt_id}",
            headers=stu2_headers
        )
        assert pm_stu2.status_code == 403
