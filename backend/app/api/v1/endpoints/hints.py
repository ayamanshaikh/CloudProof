from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_student
from app.models.user import User, StudentWallet
from app.models.mission import (
    MissionAttempt,
    MissionAssignment,
    Mission,
    Hint,
    HintUsage
)
from app.schemas.hint import (
    HintItemResponse,
    HintAttemptStatusResponse,
    UnlockHintRequest,
    UnlockHintResponse
)

router = APIRouter(prefix="/hints", tags=["Hints"])


@router.get("/attempt/{attempt_id}", response_model=HintAttemptStatusResponse)
async def get_attempt_hint_status(
    attempt_id: str,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve hints for this attempt, hiding content for locked tiers."""
    # 1. Fetch attempt and mission
    stmt = (
        select(MissionAttempt)
        .options(
            selectinload(MissionAttempt.assignment).selectinload(MissionAssignment.mission).selectinload(Mission.hints),
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

    # 2. Fetch student wallet
    stmt_wallet = select(StudentWallet).where(StudentWallet.student_id == current_student.id)
    res_wallet = await db.execute(stmt_wallet)
    wallet = res_wallet.scalar_one_or_none()
    balance = wallet.balance if wallet else 10

    # 3. Map unlocked hint IDs
    unlocked_hint_ids = {h.hint_id for h in attempt.hint_usages}
    total_penalty = sum(h.penalty_applied for h in attempt.hint_usages)

    hints_list = []
    for h in sorted(attempt.assignment.mission.hints, key=lambda x: x.level):
        is_unlocked = h.id in unlocked_hint_ids
        hints_list.append(
            HintItemResponse(
                id=h.id,
                level=h.level,
                title=h.title,
                token_cost=h.token_cost,
                penalty_percent=h.penalty_percent,
                is_unlocked=is_unlocked,
                content=h.content if is_unlocked else None
            )
        )

    return HintAttemptStatusResponse(
        attempt_id=attempt.id,
        mission_id=attempt.assignment.mission_id,
        wallet_balance=balance,
        total_penalty_percent=total_penalty,
        hints=hints_list
    )


@router.post("/attempt/{attempt_id}/unlock", response_model=UnlockHintResponse)
async def unlock_hint_tier(
    attempt_id: str,
    payload: UnlockHintRequest,
    current_student: User = Depends(get_current_student),
    db: AsyncSession = Depends(get_db)
):
    """
    Unlock a specific hint level sequentially (Level 2 requires Level 1).
    Deducts virtual hint credits from the student's wallet and applies score penalty.
    """
    requested_level = payload.hint_level
    if requested_level not in (1, 2, 3, 4):
        raise HTTPException(status_code=400, detail="Hint level must be between 1 and 4")

    # 1. Fetch attempt, mission hints, and past hint usages
    stmt = (
        select(MissionAttempt)
        .options(
            selectinload(MissionAttempt.assignment).selectinload(MissionAssignment.mission).selectinload(Mission.hints),
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

    mission_hints = {h.level: h for h in attempt.assignment.mission.hints}
    target_hint = mission_hints.get(requested_level)

    if not target_hint:
        raise HTTPException(status_code=404, detail=f"No hint configured for level {requested_level}")

    # 2. Check if already unlocked
    unlocked_levels = {hu.hint.level for hu in attempt.hint_usages if hu.hint}
    # Note: if hu.hint is not loaded, we can find by hint_id
    hint_id_to_level = {h.id: h.level for h in attempt.assignment.mission.hints}
    unlocked_levels = {hint_id_to_level[hu.hint_id] for hu in attempt.hint_usages if hu.hint_id in hint_id_to_level}

    if requested_level in unlocked_levels:
        total_penalty = sum(hu.penalty_applied for hu in attempt.hint_usages)
        stmt_wallet = select(StudentWallet).where(StudentWallet.student_id == current_student.id)
        res_wallet = await db.execute(stmt_wallet)
        wallet = res_wallet.scalar_one_or_none()
        return UnlockHintResponse(
            message="Hint already unlocked",
            hint_level=requested_level,
            tokens_spent=0,
            new_wallet_balance=wallet.balance if wallet else 10,
            penalty_applied=0,
            total_penalty_percent=total_penalty,
            unlocked_content=target_hint.content
        )

    # 3. Enforce sequential progression: requested_level > 1 requires (requested_level - 1)
    if requested_level > 1 and (requested_level - 1) not in unlocked_levels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sequential progression required: You must unlock Hint {requested_level - 1} before unlocking Hint {requested_level}."
        )

    # 4. Check student wallet balance
    stmt_wallet = select(StudentWallet).where(StudentWallet.student_id == current_student.id)
    res_wallet = await db.execute(stmt_wallet)
    wallet = res_wallet.scalar_one_or_none()

    if not wallet or wallet.balance < target_hint.token_cost:
        curr_bal = wallet.balance if wallet else 0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient hint tokens. Required: {target_hint.token_cost}, Available: {curr_bal}."
        )

    # 5. Deduct token cost and record usage
    wallet.balance -= target_hint.token_cost

    usage = HintUsage(
        attempt_id=attempt.id,
        hint_id=target_hint.id,
        tokens_spent=target_hint.token_cost,
        penalty_applied=target_hint.penalty_percent
    )
    db.add(usage)

    # Recalculate attempt penalty score
    attempt.penalty_score += target_hint.penalty_percent
    if attempt.base_score > 0:
        attempt.final_score = max(0, attempt.base_score - attempt.penalty_score)

    await db.commit()
    await db.refresh(wallet)

    total_penalty = attempt.penalty_score

    return UnlockHintResponse(
        message=f"Hint Level {requested_level} unlocked successfully",
        hint_level=requested_level,
        tokens_spent=target_hint.token_cost,
        new_wallet_balance=wallet.balance,
        penalty_applied=target_hint.penalty_percent,
        total_penalty_percent=total_penalty,
        unlocked_content=target_hint.content
    )
