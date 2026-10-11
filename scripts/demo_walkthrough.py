#!/usr/bin/env python3
"""
CloudProof End-to-End Live Showcase & Demo Walkthrough Runner
============================================================
Executes the full 12-stage college demonstration flow defined in Section 18 of the specification:
  Stage 1:  Instructor Authentication (Dr. Alan Turing)
  Stage 2:  Classroom Inspection (CS401 & 3 Incident Assignments)
  Stage 3:  Student Authentication (Alex Rivera / Demo Student)
  Stage 4:  Student Dashboard & Hint Token Wallet Check
  Stage 5:  Launch Mission 1 ("The Public Invoice Bucket") in Simulation Mode
  Stage 6:  Vulnerability Inspection (Public S3 ACL & Policy)
  Stage 7:  Pedagogical Hint Request (Wallet deduction & penalty tracking)
  Stage 8:  Configuration Remediation (Private S3 hardening)
  Stage 9:  Deterministic Rule Verification (100% PASS, 95 final score)
  Stage 10: Grounded AI Post-Mortem Generation (6-part structured RCA)
  Stage 11: Instructor Dashboard Gradebook Reflection & CSV Export
  Stage 12: Student Verified Portfolio & Cryptographic Certificate Attestation

Supports both Live Server mode (http://localhost:8000/api/v1) and In-Memory mode.

Usage:
    python scripts/demo_walkthrough.py [--in-memory] [--auto] [--base-url URL]
"""
import sys
import os
import argparse
import asyncio
import httpx

# Ensure backend directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def log_step(number: int, title: str, description: str):
    print("\n" + "=" * 70)
    print(f"  [STAGE {number:02d}/12] {title.upper()}")
    print("=" * 70)
    print(f"[*] {description}\n")


async def run_demo_flow(client: httpx.AsyncClient, auto: bool = False):
    def pause():
        if not auto:
            input("\n>> Press [ENTER] to advance to the next demonstration stage...")

    print("=" * 70)
    print("      CLOUDPROOF LIVE INCIDENT RESPONSE SHOWCASE RUNNER       ")
    print("=" * 70)
    print("Target Flow: Instructor Class -> Student Practice -> Vulnerability Fix ->")
    print("             Deterministic Verification -> AI Post-Mortem -> Gradebook Update")
    print("=" * 70)

    # --------------------------------------------------------------------------
    # STAGE 1: Instructor Login
    # --------------------------------------------------------------------------
    log_step(1, "Instructor Authentication", "Authenticating faculty account (Dr. Alan Turing)...")
    inst_login_res = await client.post(
        "/auth/login",
        json={"email": "dr.turing@college.edu", "password": "DemoInstructor123!"}
    )
    if inst_login_res.status_code != 200:
        print(f"[FAIL] Instructor login failed: {inst_login_res.status_code} - {inst_login_res.text}")
        print("[!] Hint: Run 'python scripts/seed_demo.py' to initialize demo accounts.")
        return False

    inst_data = inst_login_res.json()
    inst_token = inst_data["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}
    print(f"[SUCCESS] Instructor authenticated: {inst_data['user']['full_name']} (Role: {inst_data['user']['role']})")
    print(f"          JWT Bearer token issued.")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 2: Classroom Inspection
    # --------------------------------------------------------------------------
    log_step(2, "Classroom & Mission Roster", "Fetching active classroom CS401 and assigned missions...")
    dash_res = await client.get("/instructor/dashboard", headers=inst_headers)
    assert dash_res.status_code == 200, f"Expected 200, got {dash_res.status_code}: {dash_res.text}"
    classes = dash_res.json().get("classes", [])
    assert len(classes) > 0, "No classes found for instructor"
    cs401 = classes[0]
    class_id = cs401["id"]
    print(f"[SUCCESS] Active Classroom: {cs401['name']}")
    print(f"          Join Code: {cs401['join_code']} | Total Students Enrolled: {cs401['student_count']}")

    # Get class details with assigned catalog missions
    class_detail_res = await client.get(f"/instructor/classes/{class_id}", headers=inst_headers)
    assert class_detail_res.status_code == 200, f"Expected 200, got {class_detail_res.status_code}: {class_detail_res.text}"
    class_detail = class_detail_res.json()
    assigned_missions = class_detail.get("assigned_missions", [])
    print(f"          Assigned Incident Missions ({len(assigned_missions)}):")
    for m in assigned_missions:
        print(f"            - {m.get('title')} [{m.get('category')}] (Difficulty: {m.get('difficulty')})")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 3: Student Authentication
    # --------------------------------------------------------------------------
    log_step(3, "Student Authentication", "Authenticating student account (Alex Rivera)...")
    std_login_res = await client.post(
        "/auth/login",
        json={"email": "student@college.edu", "password": "DemoStudent123!"}
    )
    assert std_login_res.status_code == 200
    std_data = std_login_res.json()
    std_token = std_data["access_token"]
    std_headers = {"Authorization": f"Bearer {std_token}"}
    print(f"[SUCCESS] Student authenticated: {std_data['user']['full_name']} (Role: {std_data['user']['role']})")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 4: Student Dashboard Inspection
    # --------------------------------------------------------------------------
    log_step(4, "Student Dashboard & Wallet", "Inspecting student enrollment and daily hint token economy...")
    std_dash_res = await client.get("/student/dashboard", headers=std_headers)
    assert std_dash_res.status_code == 200
    dash_data = std_dash_res.json()

    enrolled = dash_data.get("enrolled_classes", [])
    missions = dash_data.get("assigned_missions", [])
    stats = dash_data.get("stats", {})

    print(f"[SUCCESS] Student Enrolled Classes: {len(enrolled)}")
    for c in enrolled:
        print(f"            - {c.get('name')} (Instructor: {c.get('instructor_name')})")
    print(f"          Available Mission Assignments: {len(missions)}")
    for m in missions:
        print(f"            - {m.get('title')} [Status: {m.get('status').upper()}]")
    print(f"          Daily Hint Token Balance: {stats.get('hint_tokens_balance')}/10 virtual tokens available")

    # Locate Mission 1 assignment ID
    s3_assignment = next((m for m in missions if m.get("slug") == "s3-public-invoices"), missions[0])
    assignment_id = s3_assignment["assignment_id"]
    pause()

    # --------------------------------------------------------------------------
    # STAGE 5: Launch Mission 1 in Simulation Mode
    # --------------------------------------------------------------------------
    log_step(5, "Launch Incident Mission", "Starting Mission 1 ('The Public Invoice Bucket') in Simulation Mode...")
    start_res = await client.post(
        f"/missions/{assignment_id}/start",
        json={"mode": "simulation"},
        headers=std_headers
    )
    assert start_res.status_code == 200
    attempt_data = start_res.json()
    attempt_id = attempt_data["attempt_id"]
    print(f"[SUCCESS] Mission Attempt Initiated: ID {attempt_id}")
    print(f"          Mission Title: {attempt_data['mission_title']}")
    print(f"          Execution Mode: {attempt_data['mode']} (Zero cloud cost simulation)")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 6: Vulnerability Inspection
    # --------------------------------------------------------------------------
    log_step(6, "Vulnerability Investigation", "Student inspects current broken cloud configuration...")
    demo_state = attempt_data.get("current_demo_state", {})
    pab = demo_state.get("public_access_block", {})
    policy = demo_state.get("bucket_policy", {})

    print(f"[!] VULNERABILITY DETECTED:")
    print(f"      - Bucket ACL: {demo_state.get('bucket_acl')} (World-Readable)")
    print(f"      - BlockPublicAcls: {pab.get('BlockPublicAcls')}")
    print(f"      - BlockPublicPolicy: {pab.get('BlockPublicPolicy')}")
    print(f"      - IgnorePublicAcls: {pab.get('IgnorePublicAcls')}")
    print(f"      - RestrictPublicBuckets: {pab.get('RestrictPublicBuckets')}")
    if policy and "Statement" in policy:
        stmt = policy["Statement"][0]
        print(f"      - Bucket Policy: Principal '{stmt.get('Principal')}' allowed '{stmt.get('Action')}'")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 7: Pedagogical Hint Request
    # --------------------------------------------------------------------------
    log_step(7, "Hint Request & Token Economy", "Student requests Level 1 conceptual guidance...")
    hint_res = await client.post(
        f"/hints/attempt/{attempt_id}/unlock",
        json={"hint_level": 1},
        headers=std_headers
    )
    assert hint_res.status_code == 200, f"Expected 200, got {hint_res.status_code}: {hint_res.text}"
    hint_data = hint_res.json()
    print(f"[SUCCESS] Hint Level {hint_data['hint_level']} Unlocked:")
    print(f"          Guidance: {hint_data['unlocked_content']}")
    print(f"          Cost: {hint_data['tokens_spent']} token | Penalty Applied: {hint_data['penalty_applied']}%")
    print(f"          Remaining Wallet Balance: {hint_data['new_wallet_balance']} tokens")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 8: Configuration Remediation
    # --------------------------------------------------------------------------
    log_step(8, "Student Applies Remediation", "Hardening S3 Block Public Access and eliminating anonymous policy...")
    fixed_state = {
        "bucket_name": demo_state.get("bucket_name", "cloudproof-acme-invoices-2026"),
        "public_access_block": {
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True
        },
        "bucket_acl": "private",
        "bucket_policy": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "RestrictedAppAccessOnly",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": "arn:aws:iam::123456789012:role/InvoiceWorkerRole"
                    },
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{demo_state.get('bucket_name', 'cloudproof-acme-invoices-2026')}/*"
                }
            ]
        }
    }
    update_res = await client.put(
        f"/missions/{attempt_id}/state",
        json={"demo_state": fixed_state},
        headers=std_headers
    )
    assert update_res.status_code == 200
    print(f"[SUCCESS] Remediation applied to simulated infrastructure state.")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 9: Deterministic Rule Verification
    # --------------------------------------------------------------------------
    log_step(9, "Deterministic Verification Engine", "Executing deterministic rule check against student configuration...")
    verify_res = await client.post(
        f"/missions/{attempt_id}/verify",
        headers=std_headers
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    verdict = v_data["verdict"]

    print(f"[SUCCESS] Verification Status: {v_data['status'].upper()}")
    print(f"          Deterministic Rules Evaluated ({verdict['passed_rules']}/{verdict['total_rules']}):")
    for r in verdict.get("rule_results", []):
        mark = "[PASS]" if r.get("status") == "PASS" else "[FAIL]"
        print(f"            {mark} {r.get('rule_id')}: {r.get('name')} (+{r.get('points_earned')} pts)")

    print(f"\n          Base Score: {v_data['base_score']} pts")
    print(f"          Hint Penalty: -{v_data['penalty_score']} pts")
    print(f"          Final Grade: {v_data['final_score']}/100 pts")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 10: Grounded AI Post-Mortem Generation
    # --------------------------------------------------------------------------
    log_step(10, "AI Incident Post-Mortem", "Generating grounded 6-part Incident Post-Mortem...")
    pm_res = await client.get(
        f"/postmortem/attempt/{attempt_id}",
        headers=std_headers
    )
    assert pm_res.status_code == 200, f"Expected 200, got {pm_res.status_code}: {pm_res.text}"
    pm_data = pm_res.json()

    print(f"[SUCCESS] Incident Post-Mortem Generated ({pm_data.get('generated_by')}):")
    print(f"  [1] Incident Summary:")
    print(f"      {pm_data.get('incident_summary')[:200]}...")
    print(f"  [2] Root Cause Analysis:")
    print(f"      {pm_data.get('root_cause_analysis')[:200]}...")
    print(f"  [3] Threat & Exploit Scenario:")
    print(f"      {pm_data.get('threat_exploit_scenario')[:200]}...")
    print(f"  [4] Remediation Diff Breakdown:")
    print(f"      {pm_data.get('remediation_diff_breakdown')[:200]}...")
    print(f"  [5] Why Fix Works (Defensive Architecture):")
    print(f"      {pm_data.get('why_fix_works')[:200]}...")
    print(f"  [6] Recommended Best Practices:")
    for bp in pm_data.get('best_practices', []):
        print(f"      - {bp}")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 11: Instructor Dashboard Gradebook Reflection
    # --------------------------------------------------------------------------
    log_step(11, "Instructor Analytics Update", "Verifying instructor gradebook and class statistics update...")
    class_update_res = await client.get(
        f"/instructor/classes/{class_id}",
        headers=inst_headers
    )
    assert class_update_res.status_code == 200
    class_update = class_update_res.json()
    students_roster = class_update.get("students", [])

    print(f"[SUCCESS] Class Roster Updated ({len(students_roster)} students):")
    for s in students_roster:
        avg = f"{s.get('average_score'):.1f}%" if s.get('average_score') is not None else "N/A"
        print(f"            - {s.get('full_name')}: {s.get('missions_completed')} completed | Avg: {avg}")

    csv_res = await client.get(
        f"/instructor/classes/{class_id}/export",
        headers=inst_headers
    )
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    print(f"          Gradebook CSV Export generated ({len(csv_res.text)} bytes).")
    pause()

    # --------------------------------------------------------------------------
    # STAGE 12: Student Portfolio & Certification Badge Attestation
    # --------------------------------------------------------------------------
    log_step(12, "Student Skills Portfolio & Badge", "Checking student verified competencies and certificate attestation...")
    portfolio_res = await client.get("/student/portfolio", headers=std_headers)
    assert portfolio_res.status_code == 200
    portfolio = portfolio_res.json()

    print(f"[SUCCESS] Student Portfolio Verified:")
    print(f"          Total Completed Missions: {portfolio.get('total_completed')}")
    print(f"          Overall Average Score: {portfolio.get('overall_average_score'):.1f}%")
    print(f"          Competency Breakdown:")
    for comp in portfolio.get("competencies", []):
        print(f"            * {comp.get('domain')}: {comp.get('level')} ({comp.get('score_percent')}%) - {comp.get('summary')}")

    cert = portfolio.get("badge", {})
    print(f"\n[SUCCESS] DIGITAL CERTIFICATE BADGE:")
    print(f"          Title: {cert.get('title')}")
    print(f"          Issuer: {cert.get('issuer')}")
    print(f"          Verification Token: {cert.get('verification_token')}")
    print(f"          Earned Status: {cert.get('is_earned')}")

    print("\n" + "=" * 70)
    print("      [COMPLETE] END-TO-END DEMONSTRATION WORKFLOW SUCCEEDED     ")
    print("=" * 70)
    return True


async def main():
    parser = argparse.ArgumentParser(description="CloudProof Demo Walkthrough Runner")
    parser.add_argument("--base-url", default="http://localhost:8000/api/v1", help="Base URL for CloudProof API")
    parser.add_argument("--auto", action="store_true", help="Run without interactive pauses between stages")
    parser.add_argument("--in-memory", action="store_true", help="Run against in-memory FastAPI app without live server")
    args = parser.parse_args()

    if args.in_memory:
        from app.main import app
        from app.core.database import init_db
        from httpx import ASGITransport
        await init_db()
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            success = await run_demo_flow(client, auto=True)
            sys.exit(0 if success else 1)
    else:
        async with httpx.AsyncClient(base_url=args.base_url, timeout=30.0) as client:
            success = await run_demo_flow(client, auto=args.auto)
            sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
