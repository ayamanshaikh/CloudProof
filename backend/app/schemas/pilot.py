from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class AssignPilotParticipantRequest(BaseModel):
    student_id: str
    cohort_group: str = Field(default="experimental", pattern="^(control|experimental)$")
    pre_test_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    post_test_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    satisfaction_score: Optional[float] = Field(None, ge=1.0, le=5.0)
    feedback_notes: Optional[str] = None


class StudentPilotSurveyRequest(BaseModel):
    class_id: str
    pre_test_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    post_test_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    satisfaction_score: Optional[float] = Field(None, ge=1.0, le=5.0)
    feedback_notes: Optional[str] = None


class PilotParticipantResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    anonymous_id: str
    cohort_group: str
    pre_test_score: Optional[float] = None
    post_test_score: Optional[float] = None
    satisfaction_score: Optional[float] = None
    feedback_notes: Optional[str] = None
    learning_gain: Optional[float] = None
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)
