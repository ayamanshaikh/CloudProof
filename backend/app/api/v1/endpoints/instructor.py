import csv
import io
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_instructor
from app.models.user import User
from app.models.classroom import Classroom, ClassMember
from app.models.mission import (
    Mission,
    MissionAssignment,
    MissionAttempt,
    HintUsage,
    MissionFinding
)
from app.schemas.instructor import (
    CreateClassRequest,
    AssignMissionRequest,
    CatalogMissionItem,
    ClassSummaryItem,
    InstructorDashboardResponse,
    RosterStudentItem,
    StudentProgressItem,
    CommonMistakeItem,
    ClassDetailResponse
)
from app.models.pilot import PilotParticipant
from app.schemas.pilot import AssignPilotParticipantRequest, PilotParticipantResponse

router = APIRouter(prefix="/instructor", tags=["Instructor"])


def generate_join_code() -> str:
    """Generate clean alphanumeric join code: CP-XXXX."""
    chars = string.ascii_uppercase + string.digits
    # remove easily confused characters like O, 0, I, 1
    safe_chars = [c for c in chars if c not in ("O", "0", "I", "1")]
    random_str = "".join(random.choices(safe_chars, k=4))
    return f"CP-{random_str}"


@router.get("/missions/catalog", response_model=list[CatalogMissionItem])
async def get_mission_catalog(
    _: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all available curated incident missions in the catalog."""
    stmt = select(Mission).order_by(Mission.created_at.asc())
    result = await db.execute(stmt)
    missions = result.scalars().all()
    return [CatalogMissionItem.model_validate(m) for m in missions]


@router.get("/dashboard", response_model=InstructorDashboardResponse)
async def get_instructor_dashboard(
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve instructor dashboard summary with classes and enrollment counts."""
    stmt_classes = (
        select(Classroom)
        .options(
            selectinload(Classroom.members),
            selectinload(Classroom.assignments)
        )
        .where(Classroom.instructor_id == current_instructor.id)
        .order_by(Classroom.created_at.desc())
    )
    result = await db.execute(stmt_classes)
    classes = result.scalars().all()

    class_summaries = []
    total_students_enrolled = 0
    total_missions_assigned = 0

    for c in classes:
        student_count = len(c.members)
        mission_count = len(c.assignments)
        total_students_enrolled += student_count
        total_missions_assigned += mission_count

        class_summaries.append(
            ClassSummaryItem(
                id=c.id,
                name=c.name,
                description=c.description,
                join_code=c.join_code,
                student_count=student_count,
                mission_count=mission_count,
                created_at=c.created_at
            )
        )

    return InstructorDashboardResponse(
        instructor_id=current_instructor.id,
        full_name=current_instructor.full_name,
        email=current_instructor.email,
        total_classes=len(classes),
        total_students=total_students_enrolled,
        total_assigned_missions=total_missions_assigned,
        classes=class_summaries
    )


@router.post("/classes", response_model=ClassSummaryItem, status_code=status.HTTP_201_CREATED)
async def create_class(
    payload: CreateClassRequest,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new class section with an auto-generated unique join code."""
    # Generate unique join code with retry
    join_code = generate_join_code()
    for _ in range(5):
        stmt_check = select(Classroom).where(Classroom.join_code == join_code)
        res = await db.execute(stmt_check)
        if not res.scalar_one_or_none():
            break
        join_code = generate_join_code()

    new_class = Classroom(
        instructor_id=current_instructor.id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        join_code=join_code
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)

    return ClassSummaryItem(
        id=new_class.id,
        name=new_class.name,
        description=new_class.description,
        join_code=new_class.join_code,
        student_count=0,
        mission_count=0,
        created_at=new_class.created_at
    )


@router.post("/classes/{class_id}/assign", response_model=dict, status_code=status.HTTP_201_CREATED)
async def assign_mission_to_class(
    class_id: str,
    payload: AssignMissionRequest,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Assign an incident mission to a class section."""
    # Verify class belongs to instructor
    stmt_class = select(Classroom).where(
        Classroom.id == class_id,
        Classroom.instructor_id == current_instructor.id
    )
    res_class = await db.execute(stmt_class)
    classroom = res_class.scalar_one_or_none()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or does not belong to you"
        )

    # Verify mission exists
    stmt_mission = select(Mission).where(Mission.id == payload.mission_id)
    res_mission = await db.execute(stmt_mission)
    mission = res_mission.scalar_one_or_none()
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found in catalog"
        )

    # Check for existing assignment
    stmt_assign_check = select(MissionAssignment).where(
        MissionAssignment.class_id == class_id,
        MissionAssignment.mission_id == payload.mission_id
    )
    res_assign_check = await db.execute(stmt_assign_check)
    if res_assign_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mission is already assigned to this class"
        )

    assignment = MissionAssignment(
        class_id=class_id,
        mission_id=payload.mission_id,
        due_date=payload.due_date
    )
    db.add(assignment)
    await db.commit()

    return {"message": "Mission assigned successfully", "assignment_id": assignment.id}


@router.get("/classes/{class_id}", response_model=ClassDetailResponse)
async def get_class_details_and_analytics(
    class_id: str,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve class details, enrolled roster, student progress matrix, and common mistakes analytics."""
    # 1. Fetch class
    stmt_class = (
        select(Classroom)
        .options(
            selectinload(Classroom.members).selectinload(ClassMember.student),
            selectinload(Classroom.assignments).selectinload(MissionAssignment.mission)
        )
        .where(
            Classroom.id == class_id,
            Classroom.instructor_id == current_instructor.id
        )
    )
    res_class = await db.execute(stmt_class)
    classroom = res_class.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or does not belong to you"
        )

    # 2. Build roster & student scores
    roster_list: list[RosterStudentItem] = []
    progress_matrix: list[StudentProgressItem] = []
    failing_rules_counter: dict[str, dict] = {}

    for member in classroom.members:
        student = member.student
        # Get attempts for this student across all assignments in this class
        assignment_ids = [a.id for a in classroom.assignments]
        completed_count = 0
        student_scores = []

        if assignment_ids:
            for assignment in classroom.assignments:
                stmt_attempt = (
                    select(MissionAttempt)
                    .options(
                        selectinload(MissionAttempt.hint_usages),
                        selectinload(MissionAttempt.findings)
                    )
                    .where(
                        MissionAttempt.assignment_id == assignment.id,
                        MissionAttempt.student_id == student.id
                    )
                    .order_by(MissionAttempt.started_at.desc())
                )
                res_attempt = await db.execute(stmt_attempt)
                attempts = res_attempt.scalars().all()
                latest_attempt = attempts[0] if attempts else None

                hints_count = len(latest_attempt.hint_usages) if latest_attempt else 0
                status_str = latest_attempt.status if latest_attempt else "not_started"
                final_score = latest_attempt.final_score if latest_attempt and latest_attempt.status == "passed" else None
                completed_at = latest_attempt.completed_at if latest_attempt else None

                if latest_attempt and latest_attempt.status == "passed":
                    completed_count += 1
                    student_scores.append(latest_attempt.final_score)

                # Aggregate failing rules across all attempts for Common Mistakes
                for att in attempts:
                    for finding in att.findings:
                        if finding.status == "FAIL" and finding.findings_json:
                            rule_results = finding.findings_json.get("rule_results", [])
                            for rr in rule_results:
                                if rr.get("status") == "FAIL":
                                    r_id = rr.get("rule_id", "UNKNOWN_RULE")
                                    if r_id not in failing_rules_counter:
                                        failing_rules_counter[r_id] = {
                                            "rule_id": r_id,
                                            "severity": rr.get("severity", "MEDIUM"),
                                            "failure_count": 0,
                                            "description": rr.get("evidence", "Rule check failed during verification")
                                        }
                                    failing_rules_counter[r_id]["failure_count"] += 1

                progress_matrix.append(
                    StudentProgressItem(
                        student_id=student.id,
                        student_name=student.full_name,
                        student_email=student.email,
                        assignment_id=assignment.id,
                        mission_title=assignment.mission.title,
                        status=status_str,
                        final_score=final_score,
                        hints_used=hints_count,
                        completed_at=completed_at
                    )
                )

        avg_score = float(sum(student_scores) / len(student_scores)) if student_scores else None
        roster_list.append(
            RosterStudentItem(
                id=student.id,
                full_name=student.full_name,
                email=student.email,
                enrolled_at=member.enrolled_at,
                missions_completed=completed_count,
                average_score=avg_score
            )
        )

    # Format common mistakes sorted by failure count descending
    common_mistakes_list = [
        CommonMistakeItem(**data)
        for data in sorted(failing_rules_counter.values(), key=lambda x: x["failure_count"], reverse=True)
    ]

    assigned_missions_summary = [
        CatalogMissionItem.model_validate(a.mission) for a in classroom.assignments
    ]

    return ClassDetailResponse(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        join_code=classroom.join_code,
        created_at=classroom.created_at,
        students=roster_list,
        assigned_missions=assigned_missions_summary,
        progress_matrix=progress_matrix,
        common_mistakes=common_mistakes_list
    )


@router.get("/classes/{class_id}/export")
async def export_class_grades_csv(
    class_id: str,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Export complete class gradebook and mission attempt analytics as RFC 4180 CSV."""
    stmt_class = (
        select(Classroom)
        .options(
            selectinload(Classroom.members).selectinload(ClassMember.student),
            selectinload(Classroom.assignments).selectinload(MissionAssignment.mission),
            selectinload(Classroom.assignments).selectinload(MissionAssignment.attempts).selectinload(MissionAttempt.hint_usages)
        )
        .where(
            Classroom.id == class_id,
            Classroom.instructor_id == current_instructor.id
        )
    )
    res_class = await db.execute(stmt_class)
    classroom = res_class.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or does not belong to you"
        )

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header Row
    writer.writerow([
        "Student Name",
        "Student Email",
        "Mission Title",
        "Attempt Status",
        "Mode",
        "Base Score",
        "Penalty Deductions",
        "Final Grade",
        "Hints Used",
        "Completed At"
    ])

    for member in sorted(classroom.members, key=lambda m: m.student.full_name):
        student = member.student
        if not classroom.assignments:
            writer.writerow([
                student.full_name,
                student.email,
                "No Missions Assigned",
                "N/A",
                "N/A",
                0,
                0,
                0,
                0,
                "N/A"
            ])
            continue

        for assignment in sorted(classroom.assignments, key=lambda a: a.mission.title):
            mission = assignment.mission
            student_attempts = [
                a for a in assignment.attempts if a.student_id == student.id
            ]
            if not student_attempts:
                writer.writerow([
                    student.full_name,
                    student.email,
                    mission.title,
                    "NOT_STARTED",
                    "N/A",
                    0,
                    0,
                    0,
                    0,
                    "Not Started"
                ])
            else:
                latest_attempt = max(student_attempts, key=lambda a: a.started_at)
                completed_str = latest_attempt.completed_at.isoformat() if latest_attempt.completed_at else "Incomplete"
                hints_count = len(latest_attempt.hint_usages) if latest_attempt.hint_usages else 0
                writer.writerow([
                    student.full_name,
                    student.email,
                    mission.title,
                    latest_attempt.status.upper(),
                    latest_attempt.mode,
                    latest_attempt.base_score,
                    latest_attempt.penalty_score,
                    latest_attempt.final_score,
                    hints_count,
                    completed_str
                ])

    csv_content = output.getvalue()
    safe_name = classroom.name.lower().replace(" ", "_").replace("/", "_")
    filename = f"cloudproof_grades_{safe_name}_{classroom.join_code}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


@router.post("/classes/{class_id}/pilot/participants", response_model=PilotParticipantResponse, status_code=status.HTTP_201_CREATED)
async def assign_or_update_pilot_participant(
    class_id: str,
    payload: AssignPilotParticipantRequest,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Assign or update a student's pilot study cohort and assessment metrics."""
    # Verify class belongs to instructor
    stmt_class = select(Classroom).where(
        Classroom.id == class_id,
        Classroom.instructor_id == current_instructor.id
    )
    res_class = await db.execute(stmt_class)
    if not res_class.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Class not found or does not belong to you.")

    # Verify student enrolled
    stmt_mem = select(ClassMember).where(
        ClassMember.class_id == class_id,
        ClassMember.student_id == payload.student_id
    )
    if not (await db.execute(stmt_mem)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student is not enrolled in this class.")

    stmt_part = select(PilotParticipant).where(
        PilotParticipant.class_id == class_id,
        PilotParticipant.student_id == payload.student_id
    )
    participant = (await db.execute(stmt_part)).scalar_one_or_none()

    if not participant:
        stmt_count = select(func.count(PilotParticipant.id)).where(PilotParticipant.class_id == class_id)
        anon_num = (await db.scalar(stmt_count) or 0) + 1
        anon_id = f"P-{anon_num:03d}"

        participant = PilotParticipant(
            class_id=class_id,
            student_id=payload.student_id,
            anonymous_id=anon_id,
            cohort_group=payload.cohort_group,
            pre_test_score=payload.pre_test_score,
            post_test_score=payload.post_test_score,
            satisfaction_score=payload.satisfaction_score,
            feedback_notes=payload.feedback_notes
        )
        db.add(participant)
    else:
        participant.cohort_group = payload.cohort_group
        if payload.pre_test_score is not None:
            participant.pre_test_score = payload.pre_test_score
        if payload.post_test_score is not None:
            participant.post_test_score = payload.post_test_score
        if payload.satisfaction_score is not None:
            participant.satisfaction_score = payload.satisfaction_score
        if payload.feedback_notes is not None:
            participant.feedback_notes = payload.feedback_notes

    await db.commit()
    await db.refresh(participant)

    gain = None
    if participant.post_test_score is not None and participant.pre_test_score is not None:
        gain = participant.post_test_score - participant.pre_test_score

    resp = PilotParticipantResponse.model_validate(participant)
    resp.learning_gain = gain
    return resp


@router.get("/classes/{class_id}/research/export")
async def export_anonymized_research_dataset(
    class_id: str,
    current_instructor: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """
    Export de-identified empirical research metrics for academic evaluation (RQ1-RQ4).
    Completely omits student PII (names, emails) in compliance with academic privacy guidelines.
    """
    stmt_class = (
        select(Classroom)
        .options(
            selectinload(Classroom.members).selectinload(ClassMember.student),
            selectinload(Classroom.assignments).selectinload(MissionAssignment.mission),
            selectinload(Classroom.assignments).selectinload(MissionAssignment.attempts).selectinload(MissionAttempt.hint_usages)
        )
        .where(
            Classroom.id == class_id,
            Classroom.instructor_id == current_instructor.id
        )
    )
    res_class = await db.execute(stmt_class)
    classroom = res_class.scalar_one_or_none()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found or does not belong to you"
        )

    # Fetch pilot participants for this class
    stmt_parts = select(PilotParticipant).where(PilotParticipant.class_id == class_id)
    parts_res = await db.execute(stmt_parts)
    pilot_map = {p.student_id: p for p in parts_res.scalars().all()}

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Research Header Row (Zero PII)
    writer.writerow([
        "Anonymous ID",
        "Cohort Group",
        "Mission Slug",
        "Mission Title",
        "Attempt Status",
        "Execution Mode",
        "Time to Solve (seconds)",
        "Verification Runs",
        "Hints Unlocked Count",
        "Hint Penalty Deducted",
        "Base Score",
        "Final Score",
        "Pre-Test Score",
        "Post-Test Score",
        "Learning Gain (%)",
        "Satisfaction Score (1-5)",
        "Completed At"
    ])

    sorted_members = sorted(classroom.members, key=lambda m: m.student_id)
    for idx, member in enumerate(sorted_members, 1):
        s_id = member.student_id
        pilot_data = pilot_map.get(s_id)
        anon_id = pilot_data.anonymous_id if pilot_data else f"P-{idx:03d}"
        cohort = pilot_data.cohort_group if pilot_data else "experimental"
        pre_test = f"{pilot_data.pre_test_score:.1f}" if pilot_data and pilot_data.pre_test_score is not None else "N/A"
        post_test = f"{pilot_data.post_test_score:.1f}" if pilot_data and pilot_data.post_test_score is not None else "N/A"

        learning_gain = "N/A"
        if pilot_data and pilot_data.post_test_score is not None and pilot_data.pre_test_score is not None:
            gain_val = pilot_data.post_test_score - pilot_data.pre_test_score
            learning_gain = f"{gain_val:+.1f}%"

        satisfaction = f"{pilot_data.satisfaction_score:.1f}" if pilot_data and pilot_data.satisfaction_score is not None else "N/A"

        if not classroom.assignments:
            writer.writerow([
                anon_id, cohort, "none", "No Missions Assigned",
                "NOT_STARTED", "N/A", "N/A", 0, 0, 0, 0, 0,
                pre_test, post_test, learning_gain, satisfaction, "N/A"
            ])
            continue

        for assignment in sorted(classroom.assignments, key=lambda a: a.mission.title):
            mission = assignment.mission
            attempts = [a for a in assignment.attempts if a.student_id == s_id]
            if not attempts:
                writer.writerow([
                    anon_id, cohort, mission.slug, mission.title,
                    "NOT_STARTED", "N/A", "N/A", 0, 0, 0, 0, 0,
                    pre_test, post_test, learning_gain, satisfaction, "Not Started"
                ])
            else:
                latest = max(attempts, key=lambda a: a.started_at)
                runs_count = len(attempts)
                hints_count = len(latest.hint_usages) if latest.hint_usages else 0
                completed_str = latest.completed_at.isoformat() if latest.completed_at else "Incomplete"

                duration_sec = "N/A"
                if latest.completed_at and latest.started_at:
                    diff = (latest.completed_at - latest.started_at).total_seconds()
                    duration_sec = f"{int(max(0, diff))}"

                writer.writerow([
                    anon_id,
                    cohort,
                    mission.slug,
                    mission.title,
                    latest.status.upper(),
                    latest.mode,
                    duration_sec,
                    runs_count,
                    hints_count,
                    latest.penalty_score,
                    latest.base_score,
                    latest.final_score,
                    pre_test,
                    post_test,
                    learning_gain,
                    satisfaction,
                    completed_str
                ])

    csv_content = output.getvalue()
    filename = f"cloudproof_research_dataset_{classroom.join_code}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


