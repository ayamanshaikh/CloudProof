import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_student
from app.models.user import User
from app.models.classroom import ClassMember
from app.models.mission import (
    Mission,
    MissionAssignment,
    MissionAttempt,
    MissionFinding,
    HintUsage
)
from app.schemas.verification import (
    StartMissionRequest,
    AttemptStateResponse,
    UpdateDemoStateRequest,
    VerifyAttemptResponse
)
from app.engine.registry import MissionRegistry
from app.engine.adapters.simulation import SimulationAdapter
from app.engine.models import RuleCheckStatus

router = APIRouter(prefix="/missions", tags=["Verification"])


@router.post("/{assignment_id}/start", response_model=AttemptStateResponse)
async def start_or_resume_mission(
    assignment_id: str,
    payload: StartMissionRequest,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Start or resume a student mission attempt."""
    # 1. Fetch assignment and verify student belongs to class
    stmt_assign = (
        select(MissionAssignment)
        .options(selectinload(MissionAssignment.mission))
        .where(MissionAssignment.id == assignment_id)
    )
    res_assign = await db.execute(stmt_assign)
    assignment = res_assign.scalar_one_or_none()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission assignment not found"
        )

    stmt_member = select(ClassMember).where(
        ClassMember.class_id == assignment.class_id,
        ClassMember.student_id == current_student.id
    )
    res_member = await db.execute(stmt_member)
    if not res_member.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in the class for this assignment"
        )

    # 2. Check for existing active or completed attempt
    stmt_attempt = (
        select(MissionAttempt)
        .where(
            MissionAttempt.assignment_id == assignment_id,
            MissionAttempt.student_id == current_student.id
        )
        .order_by(MissionAttempt.started_at.desc())
    )
    res_attempt = await db.execute(stmt_attempt)
    existing_attempt = res_attempt.scalars().first()

    if existing_attempt and existing_attempt.status in ("in_progress", "passed"):
        return AttemptStateResponse(
            attempt_id=existing_attempt.id,
            assignment_id=assignment.id,
            mission_slug=assignment.mission.slug,
            mission_title=assignment.mission.title,
            mode=existing_attempt.mode,
            status=existing_attempt.status,
            current_demo_state=existing_attempt.current_demo_state,
            started_at=existing_attempt.started_at,
            base_score=existing_attempt.base_score,
            penalty_score=existing_attempt.penalty_score,
            final_score=existing_attempt.final_score
        )

    # 3. Create fresh attempt seeded with mission's initial broken state
    initial_demo_state = assignment.mission.initial_state
    new_attempt = MissionAttempt(
        assignment_id=assignment_id,
        student_id=current_student.id,
        mode=payload.mode,
        aws_account_id=payload.aws_account_id,
        external_id=str(uuid.uuid4()),
        current_demo_state=initial_demo_state,
        status="in_progress",
        base_score=0,
        penalty_score=0,
        final_score=0
    )
    db.add(new_attempt)
    await db.commit()
    await db.refresh(new_attempt)

    return AttemptStateResponse(
        attempt_id=new_attempt.id,
        assignment_id=assignment.id,
        mission_slug=assignment.mission.slug,
        mission_title=assignment.mission.title,
        mode=new_attempt.mode,
        status=new_attempt.status,
        current_demo_state=new_attempt.current_demo_state,
        started_at=new_attempt.started_at,
        base_score=new_attempt.base_score,
        penalty_score=new_attempt.penalty_score,
        final_score=new_attempt.final_score
    )


@router.put("/{attempt_id}/state", response_model=dict)
async def update_demo_configuration_state(
    attempt_id: str,
    payload: UpdateDemoStateRequest,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Update student's current simulated infrastructure state in Demo Mode."""
    stmt = select(MissionAttempt).where(
        MissionAttempt.id == attempt_id,
        MissionAttempt.student_id == current_student.id
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt.current_demo_state = payload.demo_state
    await db.commit()

    return {"message": "Configuration state updated successfully", "attempt_id": attempt.id}


@router.post("/{attempt_id}/verify", response_model=VerifyAttemptResponse)
async def verify_attempt(
    attempt_id: str,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Execute deterministic verification against the student's infrastructure configuration."""
    stmt = (
        select(MissionAttempt)
        .options(
            selectinload(MissionAttempt.assignment).selectinload(MissionAssignment.mission),
            selectinload(MissionAttempt.hint_usages)
        )
        .where(
            MissionAttempt.id == attempt_id,
            MissionAttempt.student_id == current_student.id
        )
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    mission_slug = attempt.assignment.mission.slug
    verifier = MissionRegistry.get_verifier(mission_slug)
    if not verifier:
        raise HTTPException(status_code=500, detail=f"No verifier registered for mission '{mission_slug}'")

    # Fetch total runs count for run_number increment
    stmt_count = select(MissionFinding).where(MissionFinding.attempt_id == attempt_id)
    findings_res = await db.execute(stmt_count)
    past_runs = len(findings_res.scalars().all())
    run_number = past_runs + 1

    # Execute deterministic rule verification using SimulationAdapter (or AWS adapter)
    adapter = SimulationAdapter()
    context = {"current_demo_state": attempt.current_demo_state}

    verdict = await verifier.verify(adapter, context)

    # Calculate score if passed
    if verdict.status == RuleCheckStatus.PASS:
        attempt.status = "passed"
        attempt.completed_at = datetime.now(timezone.utc)
        attempt.base_score = verdict.base_points_earned
        
        # Calculate penalty from hints used
        total_penalty = sum(h.penalty_applied for h in attempt.hint_usages)
        attempt.penalty_score = total_penalty
        attempt.final_score = max(0, attempt.base_score - total_penalty)
    else:
        attempt.status = "failed"

    # Persist finding audit record
    finding = MissionFinding(
        attempt_id=attempt.id,
        run_number=run_number,
        status="PASS" if verdict.status == RuleCheckStatus.PASS else "FAIL",
        passed_rules=verdict.passed_rules,
        total_rules=verdict.total_rules,
        findings_json=verdict.model_dump()
    )
    db.add(finding)
    await db.commit()
    await db.refresh(attempt)

    return VerifyAttemptResponse(
        verdict=verdict,
        attempt_id=attempt.id,
        status=attempt.status,
        base_score=attempt.base_score,
        penalty_score=attempt.penalty_score,
        final_score=attempt.final_score,
        completed_at=attempt.completed_at
    )
