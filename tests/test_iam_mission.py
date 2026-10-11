import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.engine.registry import MissionRegistry
from app.engine.adapters.simulation import SimulationAdapter
from app.engine.models import RuleCheckStatus


@pytest.mark.asyncio
async def test_iam_least_privilege_rules_directly():
    await init_db()
    verifier = MissionRegistry.get_verifier("iam-overprivileged-lambda")
    assert verifier is not None
    adapter = SimulationAdapter()

    # 1. Vulnerable Initial State
    vuln_state = {
        "role_name": "WorkerLambdaExecutionRole",
        "attached_managed_policies": [
            "arn:aws:iam::aws:policy/AdministratorAccess"
        ],
        "inline_policy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowAllWorkerActions",
                    "Effect": "Allow",
                    "Action": "*",
                    "Resource": "*"
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

    vuln_verdict = await verifier.verify(adapter, {"current_demo_state": vuln_state})
    assert vuln_verdict.status == RuleCheckStatus.FAIL
    assert vuln_verdict.passed_rules < vuln_verdict.total_rules

    results_by_id = {r.rule_id: r for r in vuln_verdict.rule_results}
    assert results_by_id["CP-IAM-001"].status == RuleCheckStatus.FAIL  # Wildcard Action
    assert results_by_id["CP-IAM-002"].status == RuleCheckStatus.FAIL  # AdministratorAccess attached
    assert results_by_id["CP-IAM-006"].status == RuleCheckStatus.PASS  # Trust policy is valid

    # 2. Remediated Least-Privilege State
    clean_state = {
        "role_name": "WorkerLambdaExecutionRole",
        "attached_managed_policies": [],  # AdministratorAccess detached
        "inline_policy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowLogging",
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/image-processor:*"
                },
                {
                    "Sid": "AllowScopedImageRead",
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

    clean_verdict = await verifier.verify(adapter, {"current_demo_state": clean_state})
    assert clean_verdict.status == RuleCheckStatus.PASS
    assert clean_verdict.passed_rules == clean_verdict.total_rules
    assert clean_verdict.base_points_earned == 100


@pytest.mark.asyncio
async def test_iam_mission_api_lifecycle():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = uuid.uuid4().hex[:6]

        # 1. Register instructor
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_iam_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. IAM Security",
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
            json={"name": "Serverless Security 302", "description": "Hands-on IAM"}
        )
        assert class_res.status_code == 201
        class_id = class_res.json()["id"]
        join_code = class_res.json()["join_code"]

        # 3. Find Mission 2 (iam-overprivileged-lambda) in catalog and assign it
        cat_res = await client.get("/api/v1/instructor/missions/catalog", headers=inst_headers)
        assert cat_res.status_code == 200
        catalog = cat_res.json()
        mission_2 = next((m for m in catalog if m["slug"] == "iam-overprivileged-lambda"), None)
        assert mission_2 is not None, "Mission 2 (iam-overprivileged-lambda) should be seeded in catalog"

        assign_res = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": mission_2["id"]}
        )
        assert assign_res.status_code == 201
        assignment_id = assign_res.json()["assignment_id"]

        # 4. Register student
        stu_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"stu_iam_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Charlie Cloud",
                "role": "student"
            }
        )
        assert stu_res.status_code == 201
        stu_token = stu_res.json()["access_token"]
        stu_headers = {"Authorization": f"Bearer {stu_token}"}

        # Student joins class & starts mission
        await client.post(
            "/api/v1/student/classes/join",
            headers=stu_headers,
            json={"join_code": join_code}
        )
        start_res = await client.post(
            f"/api/v1/missions/{assignment_id}/start",
            headers=stu_headers,
            json={"mode": "demo"}
        )
        assert start_res.status_code == 200
        attempt_id = start_res.json()["attempt_id"]

        # 5. Verify initial state fails
        verify_initial = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu_headers
        )
        assert verify_initial.status_code == 200
        assert verify_initial.json()["verdict"]["status"] == "FAIL"

        # 6. Unlock hint tier 1 (-5%)
        unlock_res = await client.post(
            f"/api/v1/hints/attempt/{attempt_id}/unlock",
            headers=stu_headers,
            json={"hint_level": 1}
        )
        assert unlock_res.status_code == 200

        # 7. Apply remediation
        remediated_state = {
            "role_name": "WorkerLambdaExecutionRole",
            "attached_managed_policies": [],
            "inline_policy": {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowLogging",
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/image-processor:*"
                    },
                    {
                        "Sid": "AllowScopedImageRead",
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
        await client.put(
            f"/api/v1/missions/{attempt_id}/state",
            headers=stu_headers,
            json={"demo_state": remediated_state}
        )

        # 8. Verify remediated state passes
        verify_final = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu_headers
        )
        assert verify_final.status_code == 200
        assert verify_final.json()["verdict"]["status"] == "PASS"
        assert verify_final.json()["base_score"] == 100
        assert verify_final.json()["penalty_score"] == 5
        assert verify_final.json()["final_score"] == 95  # 100 - 5 = 95

        # 9. Fetch post-mortem
        pm_res = await client.get(
            f"/api/v1/postmortem/attempt/{attempt_id}",
            headers=stu_headers
        )
        assert pm_res.status_code == 200
        pm = pm_res.json()
        assert pm["verdict_status"] == "PASS"
        assert len(pm["incident_summary"]) > 0
        assert len(pm["root_cause_analysis"]) > 0
