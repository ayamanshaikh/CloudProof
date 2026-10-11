import pytest
import uuid
import csv
import io
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_instructor_grade_export_csv_and_scoring_deductions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = uuid.uuid4().hex[:6]

        # 1. Register instructor
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_export_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Gradebook",
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
            json={"name": "Cyber Defense 401", "description": "Capstone Class"}
        )
        assert class_res.status_code == 201
        class_id = class_res.json()["id"]
        join_code = class_res.json()["join_code"]

        # Assign Mission 1
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

        # 3. Register Student 1 (completes with 1 hint)
        stu1_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"alice_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Alice Anderson",
                "role": "student"
            }
        )
        assert stu1_res.status_code == 201
        stu1_token = stu1_res.json()["access_token"]
        stu1_headers = {"Authorization": f"Bearer {stu1_token}"}

        # Alice joins class and starts mission
        await client.post(
            "/api/v1/student/classes/join",
            headers=stu1_headers,
            json={"join_code": join_code}
        )
        start_res = await client.post(
            f"/api/v1/missions/{assignment_id}/start",
            headers=stu1_headers,
            json={"mode": "demo"}
        )
        attempt_id = start_res.json()["attempt_id"]

        # Alice unlocks Hint Tier 1 (-5% deduction)
        unlock_res = await client.post(
            f"/api/v1/hints/attempt/{attempt_id}/unlock",
            headers=stu1_headers,
            json={"hint_level": 1}
        )
        assert unlock_res.status_code == 200
        assert unlock_res.json()["penalty_applied"] == 5

        # Alice remediates and verifies
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
            headers=stu1_headers,
            json={"demo_state": fix_state}
        )
        verify_res = await client.post(
            f"/api/v1/missions/{attempt_id}/verify",
            headers=stu1_headers
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["base_score"] == 100
        assert verify_res.json()["penalty_score"] == 5
        assert verify_res.json()["final_score"] == 95  # 100 - 5 = 95

        # 4. Register Student 2 (joins class but doesn't start)
        stu2_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"bob_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Bob Builder",
                "role": "student"
            }
        )
        assert stu2_res.status_code == 201
        stu2_token = stu2_res.json()["access_token"]
        stu2_headers = {"Authorization": f"Bearer {stu2_token}"}

        await client.post(
            "/api/v1/student/classes/join",
            headers=stu2_headers,
            json={"join_code": join_code}
        )

        # 5. Instructor exports grades CSV
        export_res = await client.get(
            f"/api/v1/instructor/classes/{class_id}/export",
            headers=inst_headers
        )
        assert export_res.status_code == 200
        assert "text/csv" in export_res.headers["content-type"]
        assert "attachment;" in export_res.headers["content-disposition"]
        assert ".csv" in export_res.headers["content-disposition"]

        # Parse CSV output
        csv_text = export_res.text
        reader = list(csv.reader(io.StringIO(csv_text)))
        assert len(reader) >= 3  # Header + Alice + Bob

        # Validate Header
        header = reader[0]
        assert header == [
            "Student Name",
            "Student Email",
            "Mission Title",
            "Attempt Status",
            "Mode",
            "Base Score",
            "Penalty Deductions",
            "Final Grade",
            "Hints Used",
            "Completed At"
        ]

        # Find rows for Alice and Bob
        alice_row = next(r for r in reader if r[0] == "Alice Anderson")
        bob_row = next(r for r in reader if r[0] == "Bob Builder")

        # Alice: Status PASSED, Base 100, Penalty 5, Final 95, Hints 1
        assert alice_row[3] == "PASSED"
        assert alice_row[5] == "100"
        assert alice_row[6] == "5"
        assert alice_row[7] == "95"
        assert alice_row[8] == "1"

        # Bob: Status NOT_STARTED, Base 0, Penalty 0, Final 0, Hints 0
        assert bob_row[3] == "NOT_STARTED"
        assert bob_row[7] == "0"
        assert bob_row[8] == "0"

        # 6. Unauthorized access checks: Student cannot export
        student_export = await client.get(
            f"/api/v1/instructor/classes/{class_id}/export",
            headers=stu1_headers
        )
        assert student_export.status_code == 403

        # Unrelated Instructor cannot export
        other_inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"other_prof_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Other",
                "role": "instructor"
            }
        )
        assert other_inst_res.status_code == 201
        other_token = other_inst_res.json()["access_token"]
        other_export = await client.get(
            f"/api/v1/instructor/classes/{class_id}/export",
            headers={"Authorization": f"Bearer {other_token}"}
        )
        assert other_export.status_code == 404
