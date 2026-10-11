from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class JoinClassRequest(BaseModel):
    join_code: str


class EnrolledClassSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    instructor_name: str
    enrolled_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssignedMissionItem(BaseModel):
    assignment_id: str
    mission_id: str
    slug: str
    title: str
    description: str
    category: str
    difficulty: str
    base_points: int
    class_id: str
    class_name: str
    due_date: Optional[datetime] = None
    status: str  # 'not_started', 'in_progress', 'passed', 'failed'
    attempt_id: Optional[str] = None
    final_score: Optional[int] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentStats(BaseModel):
    missions_assigned: int
    missions_completed: int
    average_score: float
    hint_tokens_balance: int


class StudentDashboardResponse(BaseModel):
    student_id: str
    full_name: str
    email: str
    stats: StudentStats
    enrolled_classes: List[EnrolledClassSummary]
    assigned_missions: List[AssignedMissionItem]


class CompetencyScore(BaseModel):
    domain: str
    level: str  # "Mastered", "Proficient", "In Progress", "Unattempted"
    score_percent: int
    verified_rules_count: int
    summary: str


class CertificationBadge(BaseModel):
    badge_id: str
    title: str
    issuer: str
    verification_token: str
    is_earned: bool
    earned_at: Optional[datetime] = None
    required_missions: List[str]


class CompletedMissionRecord(BaseModel):
    mission_title: str
    slug: str
    category: str
    final_score: int
    base_score: int
    penalty_score: int
    mode: str
    completed_at: datetime
    attempt_id: str


class StudentPortfolioResponse(BaseModel):
    student_id: str
    full_name: str
    email: str
    total_completed: int
    overall_average_score: float
    competencies: List[CompetencyScore]
    badge: CertificationBadge
    history: List[CompletedMissionRecord]
