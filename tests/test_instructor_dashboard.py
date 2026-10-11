import pytest
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_instructor_class_management_and_analytics():
    await init_db()
    uid = uuid.uuid4().hex[:6]
    instructor_email = f"prof_{uid}@cloudproof.edu"
    student_email = f"student_{uid}@cloudproof.edu"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register instructor
        inst_reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": instructor_email,
                "password": "ProfessorPassword123!",
                "full_name": "Prof. Turing",
                "role": "instructor"
            }
        )
        assert inst_reg.status_code == 201
        inst_token = inst_reg.json()["access_token"]

        # 2. Register student
        std_reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": student_email,
                "password": "StudentPassword123!",
                "full_name": "Bob Student",
                "role": "student"
            }
        )
        assert std_reg.status_code == 201
        std_token = std_reg.json()["access_token"]

        # 3. Instructor creates a class
        create_class_resp = await client.post(
            "/api/v1/instructor/classes",
            json={
                "name": "Cloud Security & Diagnostics",
                "description": "Incident response laboratory"
            },
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        assert create_class_resp.status_code == 201
        class_data = create_class_resp.json()
        assert "id" in class_data
        assert class_data["name"] == "Cloud Security & Diagnostics"
        assert class_data["join_code"].startswith("CP-")
        class_id = class_data["id"]
        join_code = class_data["join_code"]

        # 4. Instructor fetches mission catalog
        catalog_resp = await client.get(
            "/api/v1/instructor/missions/catalog",
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        assert catalog_resp.status_code == 200
        catalog = catalog_resp.json()
        assert len(catalog) >= 1
        mission_1 = catalog[0]
        assert mission_1["slug"] == "s3-public-invoices"

        # 5. Instructor assigns Mission 1 to class
        assign_resp = await client.post(
            f"/api/v1/instructor/classes/{class_id}/assign",
            json={"mission_id": mission_1["id"]},
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        assert assign_resp.status_code == 201

        # 6. Student joins class using join code
        student_join = await client.post(
            "/api/v1/student/classes/join",
            json={"join_code": join_code},
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert student_join.status_code == 200

        # 7. Instructor checks class details and analytics
        details_resp = await client.get(
            f"/api/v1/instructor/classes/{class_id}",
            headers={"Authorization": f"Bearer {inst_token}"}
        )
        assert details_resp.status_code == 200
        details = details_resp.json()
        assert details["name"] == "Cloud Security & Diagnostics"
        assert len(details["students"]) == 1
        assert details["students"][0]["email"] == student_email
        assert len(details["assigned_missions"]) == 1
        assert len(details["progress_matrix"]) == 1
        assert details["progress_matrix"][0]["status"] == "not_started"

        # 8. Student unauthorized to access instructor class details -> 403
        std_forbidden = await client.get(
            f"/api/v1/instructor/classes/{class_id}",
            headers={"Authorization": f"Bearer {std_token}"}
        )
        assert std_forbidden.status_code == 403
