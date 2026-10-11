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
    StudentStats
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
