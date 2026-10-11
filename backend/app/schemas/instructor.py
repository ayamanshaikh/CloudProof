from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class CreateClassRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=500)


class AssignMissionRequest(BaseModel):
    mission_id: str
    due_date: Optional[datetime] = None


class CatalogMissionItem(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    category: str
    difficulty: str
    base_points: int

    model_config = ConfigDict(from_attributes=True)


class ClassSummaryItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    join_code: str
    student_count: int
    mission_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InstructorDashboardResponse(BaseModel):
    instructor_id: str
    full_name: str
    email: str
    total_classes: int
    total_students: int
    total_assigned_missions: int
    classes: List[ClassSummaryItem]


class RosterStudentItem(BaseModel):
    id: str
    full_name: str
    email: str
    enrolled_at: datetime
    missions_completed: int
    average_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class StudentProgressItem(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    assignment_id: str
    mission_title: str
    status: str  # 'not_started', 'in_progress', 'passed', 'failed'
    final_score: Optional[int] = None
    hints_used: int = 0
    completed_at: Optional[datetime] = None


class CommonMistakeItem(BaseModel):
    rule_id: str
    severity: str
    failure_count: int
    description: str


class ClassDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    join_code: str
    created_at: datetime
    students: List[RosterStudentItem]
    assigned_missions: List[CatalogMissionItem]
    progress_matrix: List[StudentProgressItem]
    common_mistakes: List[CommonMistakeItem]
