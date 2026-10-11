import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from scripts.seed_demo import seed_demo_environment
from scripts.demo_walkthrough import run_demo_flow


@pytest.mark.asyncio
async def test_end_to_end_demo_showcase_workflow():
    """
    End-to-End Test for the 12-Stage CloudProof Demonstration Flow (Section 18).
    Verifies:
      1.  Instructor Authentication (Dr. Alan Turing)
      2.  Classroom CS401 & 3 Mission Assignments Inspection
      3.  Student Authentication (Alex Rivera)
      4.  Student Dashboard & Virtual Hint Wallet Verification
      5.  Mission 1 Initiation in Deterministic Simulation Mode
      6.  Vulnerability Discovery
      7.  Pedagogical Hint 1 Unlock & Wallet Deduction
      8.  Simulated S3 Infrastructure Remediation
      9.  Deterministic Rule Verification (PASS, 6/6 rules, 95/100 score)
      10. Grounded AI Post-Mortem Generation (6-part structured RCA)
      11. Instructor Gradebook Reflection & CSV Export
      12. Student Verified Portfolio & Competency Mastery
    """
    # 1. Ensure clean schema and demo accounts are seeded
    await init_db()
    await seed_demo_environment(clean=True)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
        success = await run_demo_flow(client, auto=True)
        assert success is True, "End-to-end demonstration flow failed."
