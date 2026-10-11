import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_student
from app.models.user import User, StudentWallet
from app.models.classroom import Classroom, ClassMember
from app.models.mission import Mission, MissionAssignment, MissionAttempt
from app.schemas.student import (
    JoinClassRequest,
    StudentDashboardResponse,
    EnrolledClassSummary,
    AssignedMissionItem,
    StudentStats,
    StudentPortfolioResponse,
    CompetencyScore,
    CertificationBadge,
    CompletedMissionRecord
)

router = APIRouter(prefix="/student", tags=["Student"])


@router.post("/classes/join", response_model=EnrolledClassSummary, status_code=status.HTTP_200_OK)
async def join_class_via_code(
    payload: JoinClassRequest,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Enroll the current student into a class using an alphanumeric join code."""
    join_code_clean = payload.join_code.strip().upper()

    # Find class by join code
    stmt = select(Classroom).options(selectinload(Classroom.instructor)).where(Classroom.join_code == join_code_clean)
    result = await db.execute(stmt)
    classroom = result.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid join code. No active class found with this code."
        )

    # Check if student is already enrolled
    stmt_check = select(ClassMember).where(
        ClassMember.class_id == classroom.id,
        ClassMember.student_id == current_student.id
    )
    result_check = await db.execute(stmt_check)
    existing_member = result_check.scalar_one_or_none()

    if existing_member:
        return EnrolledClassSummary(
            id=classroom.id,
            name=classroom.name,
            description=classroom.description,
            instructor_name=classroom.instructor.full_name,
            enrolled_at=existing_member.enrolled_at
        )

    # Enroll student
    new_member = ClassMember(
        class_id=classroom.id,
        student_id=current_student.id
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return EnrolledClassSummary(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        instructor_name=classroom.instructor.full_name,
        enrolled_at=new_member.enrolled_at
    )


@router.get("/dashboard", response_model=StudentDashboardResponse)
async def get_student_dashboard(
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full student dashboard state: wallet, enrolled classes, and assigned missions."""
    # 1. Fetch wallet balance
    stmt_wallet = select(StudentWallet).where(StudentWallet.student_id == current_student.id)
    result_wallet = await db.execute(stmt_wallet)
    wallet = result_wallet.scalar_one_or_none()
    balance = wallet.balance if wallet else 10

    # 2. Fetch enrolled classes
    stmt_classes = (
        select(ClassMember)
        .options(
            selectinload(ClassMember.classroom).selectinload(Classroom.instructor)
        )
        .where(ClassMember.student_id == current_student.id)
        .order_by(ClassMember.enrolled_at.desc())
    )
    result_classes = await db.execute(stmt_classes)
    enrollments = result_classes.scalars().all()

    enrolled_classes_list = [
        EnrolledClassSummary(
            id=e.classroom.id,
            name=e.classroom.name,
            description=e.classroom.description,
            instructor_name=e.classroom.instructor.full_name,
            enrolled_at=e.enrolled_at
        )
        for e in enrollments
    ]

    enrolled_class_ids = [e.class_id for e in enrollments]

    # 3. Fetch assigned missions for these enrolled classes
    assigned_missions_list: list[AssignedMissionItem] = []
    completed_count = 0
    scores_list = []

    if enrolled_class_ids:
        stmt_assignments = (
            select(MissionAssignment)
            .options(
                selectinload(MissionAssignment.mission),
                selectinload(MissionAssignment.classroom)
            )
            .where(MissionAssignment.class_id.in_(enrolled_class_ids))
            .order_by(MissionAssignment.assigned_at.desc())
        )
        result_assignments = await db.execute(stmt_assignments)
        assignments = result_assignments.scalars().all()

        # Fetch latest attempt for each assignment by this student
        for a in assignments:
            stmt_attempt = (
                select(MissionAttempt)
                .where(
                    MissionAttempt.assignment_id == a.id,
                    MissionAttempt.student_id == current_student.id
                )
                .order_by(MissionAttempt.started_at.desc())
            )
            result_attempt = await db.execute(stmt_attempt)
            latest_attempt = result_attempt.scalars().first()

            status_val = latest_attempt.status if latest_attempt else "not_started"
            final_score_val = latest_attempt.final_score if latest_attempt and latest_attempt.status == "passed" else None
            completed_at_val = latest_attempt.completed_at if latest_attempt else None

            if latest_attempt and latest_attempt.status == "passed":
                completed_count += 1
                scores_list.append(latest_attempt.final_score)

            assigned_missions_list.append(
                AssignedMissionItem(
                    assignment_id=a.id,
                    mission_id=a.mission.id,
                    slug=a.mission.slug,
                    title=a.mission.title,
                    description=a.mission.description,
                    category=a.mission.category,
                    difficulty=a.mission.difficulty,
                    base_points=a.mission.base_points,
                    class_id=a.classroom.id,
                    class_name=a.classroom.name,
                    due_date=a.due_date,
                    status=status_val,
                    attempt_id=latest_attempt.id if latest_attempt else None,
                    final_score=final_score_val,
                    completed_at=completed_at_val
                )
            )

    avg_score = float(sum(scores_list) / len(scores_list)) if scores_list else 0.0

    return StudentDashboardResponse(
        student_id=current_student.id,
        full_name=current_student.full_name,
        email=current_student.email,
        stats=StudentStats(
            missions_assigned=len(assigned_missions_list),
            missions_completed=completed_count,
            average_score=avg_score,
            hint_tokens_balance=balance
        ),
        enrolled_classes=enrolled_classes_list,
        assigned_missions=assigned_missions_list
    )


@router.get("/portfolio", response_model=StudentPortfolioResponse)
async def get_student_portfolio(
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve the student's verified skills portfolio, competencies radar,
    and completion certification badge.
    """
    # 1. Fetch all passed attempts for this student
    stmt = (
        select(MissionAttempt)
        .options(
            selectinload(MissionAttempt.assignment).selectinload(MissionAssignment.mission)
        )
        .where(
            MissionAttempt.student_id == current_student.id,
            MissionAttempt.status == "passed"
        )
        .order_by(MissionAttempt.completed_at.desc())
    )
    res = await db.execute(stmt)
    passed_attempts = res.scalars().all()

    # Track best score per mission slug
    best_by_slug: dict[str, MissionAttempt] = {}
    history_records: list[CompletedMissionRecord] = []
    for att in passed_attempts:
        slug = att.assignment.mission.slug
        if slug not in best_by_slug or att.final_score > best_by_slug[slug].final_score:
            best_by_slug[slug] = att

        history_records.append(
            CompletedMissionRecord(
                mission_title=att.assignment.mission.title,
                slug=slug,
                category=att.assignment.mission.category,
                final_score=att.final_score,
                base_score=att.base_score,
                penalty_score=att.penalty_score,
                mode=att.mode,
                completed_at=att.completed_at,
                attempt_id=att.id
            )
        )

    # 2. Compute 3 core competencies
    # Domain 1: Storage Security (s3-public-invoices)
    s3_att = best_by_slug.get("s3-public-invoices")
    s3_score = s3_att.final_score if s3_att else 0
    s3_level = "Mastered" if s3_score >= 90 else "Proficient" if s3_score > 0 else "Unattempted"

    # Domain 2: IAM & Privilege Escalation (iam-overprivileged-lambda)
    iam_att = best_by_slug.get("iam-overprivileged-lambda")
    iam_score = iam_att.final_score if iam_att else 0
    iam_level = "Mastered" if iam_score >= 90 else "Proficient" if iam_score > 0 else "Unattempted"

    # Domain 3: Network Security & VPC (vpc-exposed-database)
    net_att = best_by_slug.get("vpc-exposed-database")
    net_score = net_att.final_score if net_att else 0
    net_level = "Mastered" if net_score >= 90 else "Proficient" if net_score > 0 else "Unattempted"

    competencies = [
        CompetencyScore(
            domain="Storage Security",
            level=s3_level,
            score_percent=s3_score,
            verified_rules_count=6 if s3_att else 0,
            summary="Amazon S3 Block Public Access (BPA), Access Control Lists (ACLs), and bucket policy scoping."
        ),
        CompetencyScore(
            domain="IAM & Privilege Escalation",
            level=iam_level,
            score_percent=iam_score,
            verified_rules_count=6 if iam_att else 0,
            summary="IAM Least Privilege, AdministratorAccess detachment, service trust policy, and CloudWatch log preservation."
        ),
        CompetencyScore(
            domain="Network Security & VPC",
            level=net_level,
            score_percent=net_score,
            verified_rules_count=4 if net_att else 0,
            summary="VPC Security Group ingress hardening, PostgreSQL isolation to RFC 1918 private subnets, and SSH removal."
        )
    ]

    # 3. Badge evaluation
    required_slugs = ["s3-public-invoices", "iam-overprivileged-lambda", "vpc-exposed-database"]
    all_passed = all(slug in best_by_slug for slug in required_slugs)

    if all_passed:
        raw_hash = f"{current_student.id}-cloudproof-l1-credential"
        token_hash = hashlib.sha256(raw_hash.encode()).hexdigest()[:12].upper()
        verification_token = f"CP-VERIFY-{token_hash}"
        earned_date = max(best_by_slug[s].completed_at for s in required_slugs)
    else:
        verification_token = "PENDING-ALL-CORE-INCIDENTS"
        earned_date = None

    badge = CertificationBadge(
        badge_id="BADGE-INCIDENT-RESPONDER-L1",
        title="Cloud Incident Responder - Foundational",
        issuer="CloudProof Verification Authority",
        verification_token=verification_token,
        is_earned=all_passed,
        earned_at=earned_date,
        required_missions=[
            "The Public Invoice Bucket (Storage)",
            "The Overprivileged Lambda Role (IAM)",
            "The World-Readable Database Port (Network)"
        ]
    )

    all_scores = [att.final_score for att in history_records]
    avg_score = float(sum(all_scores) / len(all_scores)) if all_scores else 0.0

    return StudentPortfolioResponse(
        student_id=current_student.id,
        full_name=current_student.full_name,
        email=current_student.email,
        total_completed=len(history_records),
        overall_average_score=avg_score,
        competencies=competencies,
        badge=badge,
        history=history_records
    )
