import pytest
import sys
import os
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_student_and_instructor_registration_and_rbac():
    await init_db()
    import uuid
    uid = uuid.uuid4().hex[:6]
    student_email = f"student_{uid}@university.edu"
    instructor_email = f"prof_{uid}@university.edu"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register a student
        student_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": student_email,
                "password": "Password123!",
                "full_name": "Alice Student",
                "role": "student"
            }
        )
        assert student_resp.status_code == 201
        student_data = student_resp.json()
        assert "access_token" in student_data
        assert student_data["user"]["email"] == student_email
        assert student_data["user"]["role"] == "student"
        student_token = student_data["access_token"]

        # 2. Duplicate registration should fail
        dup_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": student_email,
                "password": "AnotherPassword!",
                "full_name": "Duplicate Student",
                "role": "student"
            }
        )
        assert dup_resp.status_code == 400

        # 3. Register an instructor
        instructor_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": instructor_email,
                "password": "ProfessorSecure99!",
                "full_name": "Dr. Smith",
                "role": "instructor"
            }
        )
        assert instructor_resp.status_code == 201
        instructor_data = instructor_resp.json()
        assert instructor_data["user"]["role"] == "instructor"
        instructor_token = instructor_data["access_token"]

        # 4. Login with correct password
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": student_email,
                "password": "Password123!"
            }
        )
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()

        # 5. Login with invalid password
        bad_login = await client.post(
            "/api/v1/auth/login",
            json={
                "email": student_email,
                "password": "WrongPassword!"
            }
        )
        assert bad_login.status_code == 401

        # 6. Verify /me profile
        me_resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == student_email

        # 7. Access /me without token -> 401
        unauth_resp = await client.get("/api/v1/auth/me")
        assert unauth_resp.status_code == 401

        # 8. RBAC: Student accesses Student guard -> 200 OK
        student_guard_ok = await client.get(
            "/api/v1/auth/guard/student",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert student_guard_ok.status_code == 200

        # 9. RBAC: Student accesses Instructor guard -> 403 Forbidden
        student_guard_forbidden = await client.get(
            "/api/v1/auth/guard/instructor",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        assert student_guard_forbidden.status_code == 403

        # 10. RBAC: Instructor accesses Instructor guard -> 200 OK
        inst_guard_ok = await client.get(
            "/api/v1/auth/guard/instructor",
            headers={"Authorization": f"Bearer {instructor_token}"}
        )
        assert inst_guard_ok.status_code == 200

        # 11. RBAC: Instructor accesses Student guard -> 403 Forbidden
        inst_guard_forbidden = await client.get(
            "/api/v1/auth/guard/student",
            headers={"Authorization": f"Bearer {instructor_token}"}
        )
        assert inst_guard_forbidden.status_code == 403
