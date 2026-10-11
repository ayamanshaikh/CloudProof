import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.mission import MissionAttempt, MissionAssignment, Mission, MissionFinding
from app.schemas.postmortem import PostMortemResponse
from app.ai.provider import get_llm_provider

router = APIRouter(prefix="/postmortem", tags=["AI Post-Mortem"])


@router.get("/attempt/{attempt_id}", response_model=PostMortemResponse)
async def get_incident_postmortem(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate or retrieve an authoritative 6-part Incident Post-Mortem.
    Grounds findings entirely on the deterministic rule results and configuration diff.
    """
    stmt = (
        select(MissionAttempt)
        .options(
            selectinload(MissionAttempt.assignment).selectinload(MissionAssignment.mission),
            selectinload(MissionAttempt.findings)
        )
        .where(MissionAttempt.id == attempt_id)
    )
    res = await db.execute(stmt)
    attempt = res.scalar_one_or_none()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission attempt not found."
        )

    # Permission check: Student must own the attempt; instructors can view any attempt
    if current_user.role == "student" and attempt.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not own this mission attempt."
        )

    # Check if attempt has run deterministic verification
    if not attempt.findings or len(attempt.findings) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attempt has not been verified yet. Run deterministic verification before generating post-mortem."
        )

    latest_finding = max(attempt.findings, key=lambda f: f.run_number)

    # If already cached in finding record, return cached analysis
    if latest_finding.ai_postmortem:
        try:
            cached = json.loads(latest_finding.ai_postmortem)
            return PostMortemResponse(
                attempt_id=attempt.id,
                mission_title=attempt.assignment.mission.title,
                verdict_status=latest_finding.status,
                incident_summary=cached.get("incident_summary", ""),
                root_cause_analysis=cached.get("root_cause_analysis", ""),
                threat_exploit_scenario=cached.get("threat_exploit_scenario", ""),
                remediation_diff_breakdown=cached.get("remediation_diff_breakdown", ""),
                why_fix_works=cached.get("why_fix_works", ""),
                best_practices=cached.get("best_practices", []),
                generated_by=cached.get("generated_by", "CloudProof AI Layer"),
                created_at=latest_finding.verified_at.isoformat()
            )
        except Exception:
            pass  # Fall through to re-generate if cache corrupt

    mission = attempt.assignment.mission
    initial_state = mission.initial_state or {}
    remediated_state = attempt.current_demo_state or {}
    verdict_dict = latest_finding.findings_json or {}
    rule_results = verdict_dict.get("rule_results", [])

    provider = get_llm_provider()
    analysis = await provider.generate_postmortem(
        mission_title=mission.title,
        verdict_status=latest_finding.status,
        rule_results=rule_results,
        initial_state=initial_state,
        remediated_state=remediated_state
    )

    # Cache on finding record
    latest_finding.ai_postmortem = json.dumps(analysis)
    await db.commit()

    return PostMortemResponse(
        attempt_id=attempt.id,
        mission_title=mission.title,
        verdict_status=latest_finding.status,
        incident_summary=analysis.get("incident_summary", ""),
        root_cause_analysis=analysis.get("root_cause_analysis", ""),
        threat_exploit_scenario=analysis.get("threat_exploit_scenario", ""),
        remediation_diff_breakdown=analysis.get("remediation_diff_breakdown", ""),
        why_fix_works=analysis.get("why_fix_works", ""),
        best_practices=analysis.get("best_practices", []),
        generated_by=analysis.get("generated_by", "CloudProof AI Layer"),
        created_at=datetime.now(timezone.utc).isoformat()
    )
