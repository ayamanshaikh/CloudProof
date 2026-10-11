import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class PilotParticipant(Base):
    """
    De-identified participant model for empirical educational research & pilot evaluation.
    Conforms to IRB/FERPA ethical guidelines by stripping real names and emails in research exports.
    """
    __tablename__ = "pilot_participants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    anonymous_id = Column(String(20), nullable=False, index=True)  # e.g., P-001, P-002
    cohort_group = Column(String(20), default="experimental", nullable=False)  # "control" or "experimental"
    pre_test_score = Column(Float, nullable=True)  # Baseline cloud security score (0-100)
    post_test_score = Column(Float, nullable=True)  # Post-intervention assessment score (0-100)
    satisfaction_score = Column(Float, nullable=True)  # SUS / Likert scale (1.0 to 5.0)
    feedback_notes = Column(Text, nullable=True)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_pilot_class_student"),
        UniqueConstraint("class_id", "anonymous_id", name="uq_pilot_class_anon_id"),
    )

    classroom = relationship("Classroom")
    student = relationship("User")
