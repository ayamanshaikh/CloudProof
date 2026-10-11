import pytest
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_hint_economy_sequential_unlock_and_score_deduction():
    await init_db()
    uid = uuid.uuid4().hex[:6]
    inst_email = f"prof_{uid}@hints.edu"
    std_email = f"student_{uid}@hints.edu"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register instructor & student
        inst_r = await client.post(
            "/api/v1/auth/register",
            json={"email": inst_email, "password": "Password123!", "full_name": "Prof H", "role": "instructor"}
        )
        inst_token = inst_r.json()["access_token"]

        std_r = await client.post(
            "/api/v1/auth/register",
            json={"email": std_email, "password": "Password123!", "full_name": "Student H", "role": "student"}
        )
        std_token = std_r.json()["access_token"]

        # 2. Instructor creates class & assigns Mission 1
        cls_r = await client.post(
            "/api/v1/instructor/classes",
            json={"name": "Cloud Security Hints", "description": "Hint testing"},
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        class_id = cls_r.json()["id"]
        join_code = cls_r.json()["join_code"]

        cat_r = await client.get("/api/v1/instructor/missions/catalog", headers={"Authorization": f"Bearer {inst_token}"})
        m1_id = cat_r.json()[0]["id"]

        await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            json={"mission_id": m1_id},
            headers={"Authorization": f"Bearer {inst_token}"}
        )

        # 3. Student joins class and launches attempt
        await client.post(
            "/api/v1/student/classes/join",
            json={"join_code": join_code},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        dash_r = await client.get("/api/v1/student/dashboard", headers={"Authorization": f"Bearer {std_token}"})
        assignment_id = dash_r.json()["assigned_missions"][0]["assignment_id"]

        start_r = await client.post(
            f"/api/v1/missions/{assignment_id}/start",
            json={"mode": "demo"},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        attempt_id = start_r.json()["attempt_id"]

        # 4. Fetch hint status: all 4 locked
        hints_status_r = await client.get(
            f"/api/v1/hints/attempt/{attempt_id}",
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert hints_status_r.status_code == 200
        hints_status = hints_status_r.json()
        assert hints_status["wallet_balance"] == 10
        assert hints_status["total_penalty_percent"] == 0
        assert len(hints_status["hints"]) == 4
        for h in hints_status["hints"]:
            assert h["is_unlocked"] is False
            assert h["content"] is None

        # 5. Try skipping Hint 1 to unlock Hint 2 directly -> 400 Bad Request
        bad_unlock = await client.post(
            f"/api/v1/hints/attempt/{attempt_id}/unlock",
            json={"hint_level": 2},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert bad_unlock.status_code == 400
        assert "Sequential progression required" in bad_unlock.json()["detail"]

        # 6. Unlock Hint 1 (Cost: 1 token, Penalty: 5%)
        unlock_1 = await client.post(
            f"/api/v1/hints/attempt/{attempt_id}/unlock",
            json={"hint_level": 1},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert unlock_1.status_code == 200
        u1_data = unlock_1.json()
        assert u1_data["tokens_spent"] == 1
        assert u1_data["new_wallet_balance"] == 9
        assert u1_data["total_penalty_percent"] == 5
        assert "In AWS S3, a bucket can become publicly accessible" in u1_data["unlocked_content"]

        # 7. Unlock Hint 2 (Cost: 2 tokens, Penalty: 15%)
        unlock_2 = await client.post(
            f"/api/v1/hints/attempt/{attempt_id}/unlock",
            json={"hint_level": 2},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert unlock_2.status_code == 200
        u2_data = unlock_2.json()
        assert u2_data["tokens_spent"] == 2
        assert u2_data["new_wallet_balance"] == 7  # 10 - 1 - 2 = 7
        assert u2_data["total_penalty_percent"] == 20  # 5 + 15 = 20

        # 8. Student applies full fix and verifies
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
        await client.put(
            f"/api/v1/missions/{attempt_id}/state",
            json={"demo_state": fixed_conf},
            headers={"Authorization": f"Bearer {std_token}"}
        )

        verify_r = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert verify_r.status_code == 200
        verify_data = verify_r.json()
        assert verify_data["status"] == "passed"
        assert verify_data["base_score"] == 100
        assert verify_data["penalty_score"] == 20
        assert verify_data["final_score"] == 80  # 100 base - 20 penalty = 80 final score
