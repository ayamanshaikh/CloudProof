import pytest
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db, async_session_factory
from app.models.classroom import Classroom
from app.models.mission import Mission, MissionAssignment
from sqlalchemy import select


@pytest.mark.asyncio
async def test_student_join_class_and_dashboard():
    await init_db()
    uid = uuid.uuid4().hex[:6]
    student_email = f"student_{uid}@univ.edu"
    instructor_email = f"prof_{uid}@univ.edu"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register student
        std_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": student_email,
                "password": "Password123!",
                "full_name": "Jane Student",
                "role": "student"
            }
        )
        assert std_resp.status_code == 201
        student_token = std_resp.json()["access_token"]
        student_id = std_resp.json()["user"]["id"]

        # 2. Register instructor
        inst_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": instructor_email,
                "password": "Password123!",
                "full_name": "Professor Alan",
                "role": "instructor"
            }
        )
        assert inst_resp.status_code == 201
        instructor_id = inst_resp.json()["user"]["id"]

        # 3. Create class and assign Mission 1 directly in DB
        join_code = f"CS{uid[:4].upper()}"
        async with async_session_factory() as session:
            test_class = Classroom(
                instructor_id=instructor_id,
                name="CS401 Cloud Infrastructure",
                description="Practical incident labs",
                join_code=join_code
            )
            session.add(test_class)
            await session.flush()

            stmt_m = select(Mission).where(Mission.slug == "s3-public-invoices")
            m_res = await session.execute(stmt_m)
            mission = m_res.scalar_one()

            assignment = MissionAssignment(
                class_id=test_class.id,
                mission_id=mission.id
            )
            session.add(assignment)
            await session.commit()

        # 4. Student attempts to join with invalid code -> 404
        bad_join = await client.post(
            "/api/v1/student/classes/join",
            json={"join_code": "INVALID99"},
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert bad_join.status_code == 404

        # 5. Student joins with valid code -> 200
        good_join = await client.post(
            "/api/v1/student/classes/join",
            json={"join_code": join_code},
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert good_join.status_code == 200
        join_data = good_join.json()
        assert join_data["name"] == "CS401 Cloud Infrastructure"

        # 6. Student queries dashboard
        dash_resp = await client.get(
            "/api/v1/student/dashboard",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert dash_resp.status_code == 200
        dash_data = dash_resp.json()
        assert dash_data["stats"]["hint_tokens_balance"] == 10
        assert dash_data["stats"]["missions_assigned"] == 1
        assert len(dash_data["enrolled_classes"]) == 1
        assert len(dash_data["assigned_missions"]) == 1
        assert dash_data["assigned_missions"][0]["slug"] == "s3-public-invoices"
        assert dash_data["assigned_missions"][0]["status"] == "not_started"
