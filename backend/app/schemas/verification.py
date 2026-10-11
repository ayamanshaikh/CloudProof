from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from app.engine.models import VerificationVerdict, RuleResult


class StartMissionRequest(BaseModel):
    mode: str = "demo"  # 'demo' or 'real_aws'
    aws_account_id: Optional[str] = None


class AttemptStateResponse(BaseModel):
    attempt_id: str
    assignment_id: str
    mission_slug: str
    mission_title: str
    mode: str
    status: str
    current_demo_state: Optional[Dict[str, Any]] = None
    started_at: datetime
    base_score: int
    penalty_score: int
    final_score: int

    model_config = ConfigDict(from_attributes=True)


class UpdateDemoStateRequest(BaseModel):
    demo_state: Dict[str, Any]


class VerifyAttemptResponse(BaseModel):
    verdict: VerificationVerdict
    attempt_id: str
    status: str
    base_score: int
    penalty_score: int
    final_score: int
    completed_at: Optional[datetime] = None
