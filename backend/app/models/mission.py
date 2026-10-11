import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    difficulty = Column(String(20), nullable=False)
    base_points = Column(Integer, default=100, nullable=False)
    initial_state = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assignments = relationship("MissionAssignment", back_populates="mission", cascade="all, delete-orphan")
    hints = relationship("Hint", back_populates="mission", cascade="all, delete-orphan", order_by="Hint.level")


class MissionAssignment(Base):
    __tablename__ = "mission_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="RESTRICT"), nullable=False, index=True)
    due_date = Column(DateTime, nullable=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "mission_id", name="uq_class_mission"),
    )

    classroom = relationship("Classroom", back_populates="assignments")
    mission = relationship("Mission", back_populates="assignments")
    attempts = relationship("MissionAttempt", back_populates="assignment", cascade="all, delete-orphan")


class Hint(Base):
    __tablename__ = "hints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    mission_id = Column(String(36), ForeignKey("missions.id", ondelete="CASCADE"), nullable=False, index=True)
    level = Column(Integer, nullable=False)  # 1: Concept, 2: Investigation, 3: Near-Solution, 4: Reveal
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    token_cost = Column(Integer, default=1, nullable=False)
    penalty_percent = Column(Integer, default=5, nullable=False)

    __table_args__ = (
        UniqueConstraint("mission_id", "level", name="uq_mission_hint_level"),
    )

    mission = relationship("Mission", back_populates="hints")


class MissionAttempt(Base):
    __tablename__ = "mission_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assignment_id = Column(String(36), ForeignKey("mission_assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mode = Column(String(20), default="demo", nullable=False)  # 'demo' or 'real_aws'
    aws_account_id = Column(String(20), nullable=True)
    external_id = Column(String(64), nullable=True)
    current_demo_state = Column(JSON, nullable=True)
    status = Column(String(20), default="in_progress", nullable=False, index=True)  # 'in_progress', 'passed', 'failed'
    base_score = Column(Integer, default=0, nullable=False)
    penalty_score = Column(Integer, default=0, nullable=False)
    final_score = Column(Integer, default=0, nullable=False)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime, nullable=True)

    assignment = relationship("MissionAssignment", back_populates="attempts")
    student = relationship("User", foreign_keys=[student_id])
    hint_usages = relationship("HintUsage", back_populates="attempt", cascade="all, delete-orphan")
    findings = relationship("MissionFinding", back_populates="attempt", cascade="all, delete-orphan")


class HintUsage(Base):
    __tablename__ = "hint_usage"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    hint_id = Column(String(36), ForeignKey("hints.id", ondelete="CASCADE"), nullable=False)
    tokens_spent = Column(Integer, nullable=False)
    penalty_applied = Column(Integer, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("attempt_id", "hint_id", name="uq_attempt_hint"),
    )

    attempt = relationship("MissionAttempt", back_populates="hint_usages")
    hint = relationship("Hint")


class MissionFinding(Base):
    __tablename__ = "mission_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attempt_id = Column(String(36), ForeignKey("mission_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    run_number = Column(Integer, nullable=False)
    status = Column(String(10), nullable=False, index=True)  # 'PASS' or 'FAIL'
    passed_rules = Column(Integer, nullable=False)
    total_rules = Column(Integer, nullable=False)
    findings_json = Column(JSON, nullable=False)
    ai_postmortem = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    attempt = relationship("MissionAttempt", back_populates="findings")
