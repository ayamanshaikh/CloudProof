import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Classroom(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    instructor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    join_code = Column(String(10), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    instructor = relationship("User", foreign_keys=[instructor_id])
    members = relationship("ClassMember", back_populates="classroom", cascade="all, delete-orphan")
    assignments = relationship("MissionAssignment", back_populates="classroom", cascade="all, delete-orphan")


class ClassMember(Base):
    __tablename__ = "class_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "student_id", name="uq_class_student"),
    )

    # Relationships
    classroom = relationship("Classroom", back_populates="members")
    student = relationship("User", foreign_keys=[student_id])
