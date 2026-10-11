import pytest
import uuid
import sys
import os
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.core.database import init_db
from app.engine.registry import MissionRegistry
from app.engine.models import RuleCheckStatus
from app.engine.adapters.simulation import SimulationAdapter


@pytest.mark.asyncio
async def test_network_security_group_rules_directly():
    await init_db()
    verifier = MissionRegistry.get_verifier("vpc-exposed-database")
    assert verifier is not None
    adapter = SimulationAdapter()

    # 1. Test Vulnerable State
    vulnerable_state = {
        "group_id": "sg-04a89bc21345d6e7f",
        "group_name": "prod-aurora-postgres-sg",
        "ip_permissions": [
            {
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                "Ipv6Ranges": [],
                "UserIdGroupPairs": []
            },
            {
                "IpProtocol": "tcp",
                "FromPort": 22,
                "ToPort": 22,
                "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                "Ipv6Ranges": [],
                "UserIdGroupPairs": []
            }
        ]
    }

    verdict = await verifier.verify(adapter, {"current_demo_state": vulnerable_state})

    assert verdict.status == RuleCheckStatus.FAIL
    assert verdict.passed_rules < 4
    results_by_id = {r.rule_id: r for r in verdict.rule_results}
    assert results_by_id["CP-NET-001"].status == RuleCheckStatus.FAIL  # Postgres open to 0.0.0.0/0
    assert results_by_id["CP-NET-003"].status == RuleCheckStatus.FAIL  # SSH open to 0.0.0.0/0

    # 2. Test Remediated State (Port 5432 scoped to 10.0.0.0/16, Port 22 removed)
    remediated_state = {
        "group_id": "sg-04a89bc21345d6e7f",
        "group_name": "prod-aurora-postgres-sg",
        "ip_permissions": [
            {
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "IpRanges": [{"CidrIp": "10.0.0.0/16", "Description": "Backend application subnet"}],
                "Ipv6Ranges": [],
                "UserIdGroupPairs": []
            }
        ],
        "ip_permissions_egress": [
            {
                "IpProtocol": "-1",
                "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                "Ipv6Ranges": [],
                "UserIdGroupPairs": []
            }
        ]
    }

    verdict_fixed = await verifier.verify(adapter, {"current_demo_state": remediated_state})

    assert verdict_fixed.status == RuleCheckStatus.PASS
    assert verdict_fixed.passed_rules == 4
    assert verdict_fixed.base_points_earned == 100


@pytest.mark.asyncio
async def test_network_mission_api_lifecycle():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = uuid.uuid4().hex[:6]

        # 1. Register instructor
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_net_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Network Security",
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
            json={"name": "VPC Defense 401", "description": "Hands-on Network Security"}
        )
        assert class_res.status_code == 201
        class_id = class_res.json()["id"]
        join_code = class_res.json()["join_code"]

        # 3. Find Mission 3 (vpc-exposed-database) in catalog and assign it
        cat_res = await client.get("/api/v1/instructor/missions/catalog", headers=inst_headers)
        assert cat_res.status_code == 200
        catalog = cat_res.json()
        mission_3 = next((m for m in catalog if m["slug"] == "vpc-exposed-database"), None)
        assert mission_3 is not None, "Mission 3 (vpc-exposed-database) must be seeded in catalog"

        assign_res = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            headers=inst_headers,
            json={"mission_id": mission_3["id"]}
        )
        assert assign_res.status_code == 201
        assignment_id = assign_res.json()["assignment_id"]

        # 4. Register student
        stu_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"stu_net_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Dana Defender",
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

        # 5. Verify initial vulnerable state -> FAIL
        verify_initial = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu_headers
        )
        assert verify_initial.status_code == 200
        assert verify_initial.json()["verdict"]["status"] == "FAIL"

        # 6. Student remediates Security Group: isolate 5432 to 10.0.0.0/16, close SSH
        remediated_sg_state = {
            "group_id": "sg-04a89bc21345d6e7f",
            "group_name": "prod-aurora-postgres-sg",
            "vpc_id": "vpc-01a2b3c4d5e6f7g8h",
            "ip_permissions": [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 5432,
                    "ToPort": 5432,
                    "IpRanges": [{"CidrIp": "10.0.0.0/16", "Description": "Allow backend app tier"}],
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

        up_res = await client.put(
            f"/api/v1/missions/{attempt_id}/state",
            json={"demo_state": remediated_sg_state},
            headers=stu_headers
        )
        assert up_res.status_code == 200

        # 7. Verify remediated configuration -> PASS (100 pts)
        verify_fixed = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu_headers
        )
        assert verify_fixed.status_code == 200
        assert verify_fixed.json()["verdict"]["status"] == "PASS"
        assert verify_fixed.json()["verdict"]["base_points_earned"] == 100
        assert verify_fixed.json()["verdict"]["passed_rules"] == 4
