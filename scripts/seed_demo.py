#!/usr/bin/env python3
"""
CloudProof Presentation & Demo Seeding CLI
==========================================
Seeds a realistic institutional demonstration environment into CloudProof:
  - Instructor: Dr. Alan Turing (dr.turing@college.edu)
  - Classroom: CS401: Cloud Infrastructure Security & Incident Response (Code: SEC401)
  - 3 Active Mission Assignments (S3 Public Bucket, IAM Lambda Role, VPC Database Port)
  - 3 Student Accounts:
      * Alex Rivera / Demo Student (student@college.edu) - Clean presentation candidate
      * Alice Chen (alice.chen@college.edu) - Multi-mission completer
      * Bob Smith (bob.smith@college.edu) - Peer student with partial progress

Usage:
    python scripts/seed_demo.py [--clean]
"""
import sys
import os
import argparse
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, delete

# Ensure backend directory is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.core.database import init_db, async_session_factory
from app.core.security import hash_password
from app.models.user import User, StudentWallet
from app.models.classroom import Classroom, ClassMember
from app.models.mission import (
    Mission,
    MissionAssignment,
    MissionAttempt,
    MissionFinding,
    Hint,
    HintUsage
)


async def seed_demo_environment(clean: bool = False):
    print("=" * 65)
    print("        CloudProof Institutional Demo Seeding Orchestrator       ")
    print("=" * 65)

    # 1. Ensure schema and initial mission rules are populated
    await init_db()

    async with async_session_factory() as session:
        # Check existing instructor
        stmt_inst = select(User).where(User.email == "dr.turing@college.edu")
        res_inst = await session.execute(stmt_inst)
        instructor = res_inst.scalar_one_or_none()

        if instructor and clean:
            print("[*] Cleaning previous demo environment (--clean specified)...")
            # Delete demo classroom cascade
            stmt_cls = select(Classroom).where(Classroom.instructor_id == instructor.id)
            res_cls = await session.execute(stmt_cls)
            classes = res_cls.scalars().all()
            for c in classes:
                await session.delete(c)

            # Delete demo student users
            for email in ["student@college.edu", "alice.chen@college.edu", "bob.smith@college.edu", "dr.turing@college.edu"]:
                stmt_u = select(User).where(User.email == email)
                u = (await session.execute(stmt_u)).scalar_one_or_none()
                if u:
                    await session.delete(u)

            await session.commit()
            instructor = None

        # 2. Create Demo Instructor
        if not instructor:
            print("[+] Creating Demo Instructor: Dr. Alan Turing...")
            instructor = User(
                email="dr.turing@college.edu",
                password_hash=hash_password("DemoInstructor123!"),
                full_name="Dr. Alan Turing",
                role="instructor"
            )
            session.add(instructor)
            await session.flush()
        else:
            print("[*] Reusing existing Demo Instructor: Dr. Alan Turing")

        # 3. Create Demo Classroom CS401
        stmt_cls = select(Classroom).where(Classroom.join_code == "SEC401")
        res_cls = await session.execute(stmt_cls)
        classroom = res_cls.scalar_one_or_none()

        if not classroom:
            print("[+] Creating Demo Classroom: CS401 (Code: SEC401)...")
            classroom = Classroom(
                instructor_id=instructor.id,
                name="CS401: Cloud Infrastructure Security & Incident Response",
                description="Interactive hands-on cloud vulnerability investigation, least privilege engineering, and network perimeter isolation.",
                join_code="SEC401"
            )
            session.add(classroom)
            await session.flush()
        else:
            print("[*] Reusing existing Demo Classroom: CS401")

        # 4. Assign All 3 Missions to Classroom
        missions_stmt = select(Mission).order_by(Mission.slug)
        missions = (await session.execute(missions_stmt)).scalars().all()

        assignments = {}
        for m in missions:
            stmt_asgn = select(MissionAssignment).where(
                MissionAssignment.class_id == classroom.id,
                MissionAssignment.mission_id == m.id
            )
            asgn = (await session.execute(stmt_asgn)).scalar_one_or_none()
            if not asgn:
                print(f"[+] Assigning '{m.title}' to CS401...")
                asgn = MissionAssignment(
                    class_id=classroom.id,
                    mission_id=m.id,
                    due_date=datetime.now(timezone.utc) + timedelta(days=14)
                )
                session.add(asgn)
                await session.flush()
            assignments[m.slug] = asgn

        # 5. Create Students
        students_def = [
            {
                "email": "student@college.edu",
                "password": "DemoStudent123!",
                "name": "Alex Rivera (Demo Student)",
                "wallet": 10,
                "history": "clean"
            },
            {
                "email": "alice.chen@college.edu",
                "password": "StudentPass123!",
                "name": "Alice Chen",
                "wallet": 7,
                "history": "advanced"
            },
            {
                "email": "bob.smith@college.edu",
                "password": "StudentPass123!",
                "name": "Bob Smith",
                "wallet": 6,
                "history": "intermediate"
            }
        ]

        created_students = {}
        for s_def in students_def:
            stmt_s = select(User).where(User.email == s_def["email"])
            user = (await session.execute(stmt_s)).scalar_one_or_none()
            if not user:
                print(f"[+] Creating Student: {s_def['name']} ({s_def['email']})...")
                user = User(
                    email=s_def["email"],
                    password_hash=hash_password(s_def["password"]),
                    full_name=s_def["name"],
                    role="student"
                )
                session.add(user)
                await session.flush()

                wallet = StudentWallet(student_id=user.id, balance=s_def["wallet"])
                session.add(wallet)
            created_students[s_def["email"]] = user

            # Enroll in Classroom
            stmt_mem = select(ClassMember).where(
                ClassMember.class_id == classroom.id,
                ClassMember.student_id == user.id
            )
            if not (await session.execute(stmt_mem)).scalar_one_or_none():
                print(f"[+] Enrolling {s_def['name']} in CS401...")
                member = ClassMember(class_id=classroom.id, student_id=user.id)
                session.add(member)

        # 6. Seed Realistic Peer Progress (Alice and Bob)
        # Alice passed Mission 1 (Storage) & Mission 2 (IAM)
        alice = created_students["alice.chen@college.edu"]
        if "s3-public-invoices" in assignments:
            asgn_s3 = assignments["s3-public-invoices"]
            stmt_att = select(MissionAttempt).where(
                MissionAttempt.assignment_id == asgn_s3.id,
                MissionAttempt.student_id == alice.id
            )
            if not (await session.execute(stmt_att)).scalar_one_or_none():
                att = MissionAttempt(
                    assignment_id=asgn_s3.id,
                    student_id=alice.id,
                    mode="simulation",
                    status="passed",
                    base_score=100,
                    penalty_score=5,
                    final_score=95,
                    completed_at=datetime.now(timezone.utc) - timedelta(hours=2)
                )
                session.add(att)

        if "iam-overprivileged-lambda" in assignments:
            asgn_iam = assignments["iam-overprivileged-lambda"]
            stmt_att = select(MissionAttempt).where(
                MissionAttempt.assignment_id == asgn_iam.id,
                MissionAttempt.student_id == alice.id
            )
            if not (await session.execute(stmt_att)).scalar_one_or_none():
                att = MissionAttempt(
                    assignment_id=asgn_iam.id,
                    student_id=alice.id,
                    mode="simulation",
                    status="passed",
                    base_score=100,
                    penalty_score=0,
                    final_score=100,
                    completed_at=datetime.now(timezone.utc) - timedelta(hours=1)
                )
                session.add(att)

        # Bob passed Mission 1 with hints
        bob = created_students["bob.smith@college.edu"]
        if "s3-public-invoices" in assignments:
            asgn_s3 = assignments["s3-public-invoices"]
            stmt_att = select(MissionAttempt).where(
                MissionAttempt.assignment_id == asgn_s3.id,
                MissionAttempt.student_id == bob.id
            )
            if not (await session.execute(stmt_att)).scalar_one_or_none():
                att = MissionAttempt(
                    assignment_id=asgn_s3.id,
                    student_id=bob.id,
                    mode="simulation",
                    status="passed",
                    base_score=100,
                    penalty_score=15,
                    final_score=85,
                    completed_at=datetime.now(timezone.utc) - timedelta(minutes=45)
                )
                session.add(att)

        await session.commit()

    print("\n" + "=" * 65)
    print("                 DEMO CREDENTIALS CHEAT SHEET                 ")
    print("=" * 65)
    print(f"{'Role':<15} | {'Email':<25} | {'Password':<18}")
    print("-" * 65)
    print(f"{'Instructor':<15} | {'dr.turing@college.edu':<25} | {'DemoInstructor123!':<18}")
    print(f"{'Student (Demo)':<15} | {'student@college.edu':<25} | {'DemoStudent123!':<18}")
    print(f"{'Student (Peer)':<15} | {'alice.chen@college.edu':<25} | {'StudentPass123!':<18}")
    print(f"{'Student (Peer)':<15} | {'bob.smith@college.edu':<25} | {'StudentPass123!':<18}")
    print("-" * 65)
    print(f"Classroom Join Code: SEC401 (CS401: Cloud Infrastructure Security)")
    print("=" * 65 + "\n")
    print("[SUCCESS] Demo seeding completed successfully. System ready for showcase!\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CloudProof Demo Environment Seeder")
    parser.add_argument("--clean", action="store_true", help="Clean prior demo records before seeding")
    args = parser.parse_args()

    asyncio.run(seed_demo_environment(clean=args.clean))
