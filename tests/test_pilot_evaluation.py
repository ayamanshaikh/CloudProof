import pytest
import uuid
import csv
import io
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from scripts.pilot_study_harness import compute_statistics


@pytest.mark.asyncio
async def test_pilot_participant_assignment_and_survey():
    """Verify instructor cohort assignment and student survey submission."""
    await init_db()
    unique_id = uuid.uuid4().hex[:6]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register instructor
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_pilot_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Pilot Lead",
                "role": "instructor"
            }
        )
        assert inst_res.status_code == 201
        inst_token = inst_res.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # 2. Create class
        cls_res = await client.post(
            "/api/v1/instructor/classes",
            headers=inst_headers,
            json={"name": "Pilot Security Lab", "description": "Research evaluation"}
        )
        assert cls_res.status_code == 201
        class_id = cls_res.json()["id"]
        join_code = cls_res.json()["join_code"]

        # 3. Register student
        std_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"student_pilot_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Charlie Participant",
                "role": "student"
            }
        )
        assert std_res.status_code == 201
        std_id = std_res.json()["user"]["id"]
        std_token = std_res.json()["access_token"]
        std_headers = {"Authorization": f"Bearer {std_token}"}

        # Student joins class
        join_res = await client.post(
            "/api/v1/student/classes/join",
            headers=std_headers,
            json={"join_code": join_code}
        )
        assert join_res.status_code == 200

        # 4. Instructor assigns student to experimental cohort
        assign_part_res = await client.post(
            f"/api/v1/instructor/classes/{class_id}/pilot/participants",
            headers=inst_headers,
            json={
                "student_id": std_id,
                "cohort_group": "experimental",
                "pre_test_score": 52.0
            }
        )
        assert assign_part_res.status_code == 201
        part_data = assign_part_res.json()
        assert part_data["anonymous_id"].startswith("P-")
        assert part_data["cohort_group"] == "experimental"
        assert part_data["pre_test_score"] == 52.0

        # 5. Student submits post-test & satisfaction survey
        survey_res = await client.post(
            "/api/v1/student/pilot/survey",
            headers=std_headers,
            json={
                "class_id": class_id,
                "post_test_score": 88.0,
                "satisfaction_score": 4.8,
                "feedback_notes": "CloudProof was intuitive and highly educational!"
            }
        )
        assert survey_res.status_code == 200
        survey_data = survey_res.json()
        assert survey_data["post_test_score"] == 88.0
        assert survey_data["satisfaction_score"] == 4.8
        assert survey_data["learning_gain"] == 36.0  # 88.0 - 52.0 = 36.0


@pytest.mark.asyncio
async def test_anonymized_research_dataset_export_privacy():
    """Verify research dataset CSV export omits all student PII and contains empirical metrics."""
    await init_db()
    unique_id = uuid.uuid4().hex[:6]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register instructor & student
        inst_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"prof_res_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Prof. Research",
                "role": "instructor"
            }
        )
        inst_token = inst_res.json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        cls_res = await client.post(
            "/api/v1/instructor/classes",
            headers=inst_headers,
            json={"name": "Privacy Eval Class", "description": "Research"}
        )
        class_id = cls_res.json()["id"]
        join_code = cls_res.json()["join_code"]

        # Student with recognizable PII
        std_full_name = "SuperSecret RealStudentName"
        std_email = f"identifiable_email_{unique_id}@college.edu"
        std_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": std_email,
                "password": "SecurePassword123!",
                "full_name": std_full_name,
                "role": "student"
            }
        )
        std_token = std_res.json()["access_token"]
        std_headers = {"Authorization": f"Bearer {std_token}"}

        await client.post(
            "/api/v1/student/classes/join",
            headers=std_headers,
            json={"join_code": join_code}
        )

        # Download research export
        research_res = await client.get(
            f"/api/v1/instructor/classes/{class_id}/research/export",
            headers=inst_headers
        )
        assert research_res.status_code == 200
        assert "text/csv" in research_res.headers.get("content-type", "")

        csv_text = research_res.text
        # CRUCIAL ETHICAL PRIVACY GUARANTEE: Student names and emails must NEVER appear in research export
        assert std_full_name not in csv_text
        assert std_email not in csv_text

        # Verify Anonymous ID and valid columns are present
        reader = list(csv.reader(io.StringIO(csv_text)))
        assert len(reader) >= 2
        header = reader[0]
        assert "Anonymous ID" in header
        assert "Cohort Group" in header
        assert "Learning Gain (%)" in header
        assert "Satisfaction Score (1-5)" in header

        # Verify student is assigned an anonymous ID (e.g. P-001)
        data_row = reader[1]
        assert data_row[0].startswith("P-")


@pytest.mark.asyncio
async def test_unauthorized_student_access_to_research_export():
    """Verify students cannot access instructor research export endpoint."""
    await init_db()
    unique_id = uuid.uuid4().hex[:6]
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Register student
        std_res = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"unauth_std_{unique_id}@college.edu",
                "password": "SecurePassword123!",
                "full_name": "Unauthorized Student",
                "role": "student"
            }
        )
        std_token = std_res.json()["access_token"]
        std_headers = {"Authorization": f"Bearer {std_token}"}

        # Attempt to access research export
        res = await client.get(
            "/api/v1/instructor/classes/fake-class-id/research/export",
            headers=std_headers
        )
        assert res.status_code == 403


def test_pilot_study_harness_statistics_integrity():
    """Verify statistical harness computes accurate metrics for experimental vs control cohorts."""
    stats = compute_statistics()
    assert "ctrl_time" in stats
    assert "exp_time" in stats
    assert "ctrl_gain" in stats
    assert "exp_gain" in stats

    # Experimental resolution time must be faster than control
    assert stats["exp_time"]["mean"] < stats["ctrl_time"]["mean"]

    # Experimental learning gain must exceed control
    assert stats["exp_gain"]["mean"] > stats["ctrl_gain"]["mean"]

    # Experimental user satisfaction must exceed control
    assert stats["exp_sat"]["mean"] > stats["ctrl_sat"]["mean"]
