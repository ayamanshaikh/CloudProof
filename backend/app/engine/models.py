from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RuleCheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    ERROR = "ERROR"


class RuleSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class RuleResult(BaseModel):
    rule_id: str
    name: str
    status: RuleCheckStatus
    severity: RuleSeverity
    expected: Any
    actual: Any
    evidence: str
    points_earned: int = 0
    max_points: int = 0


class VerificationVerdict(BaseModel):
    mission_slug: str
    status: RuleCheckStatus  # PASS if all rules pass, else FAIL
    total_rules: int
    passed_rules: int
    base_points_earned: int
    max_points_possible: int
    rule_results: List[RuleResult]
    execution_time_ms: float
    raw_state_snapshot: Optional[Dict[str, Any]] = None
