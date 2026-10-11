from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class PostMortemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    attempt_id: str
    mission_title: str
    verdict_status: str
    incident_summary: str
    root_cause_analysis: str
    threat_exploit_scenario: str
    remediation_diff_breakdown: str
    why_fix_works: str
    best_practices: List[str]
    generated_by: str
    created_at: str
