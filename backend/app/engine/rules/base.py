from abc import ABC, abstractmethod
from typing import Dict, Any
from app.engine.models import RuleResult, RuleSeverity


class BaseRule(ABC):
    """Abstract base class for all deterministic infrastructure check rules."""

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str,
        severity: RuleSeverity,
        points: int,
        resource_type: str = "aws_s3"
    ):
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.severity = severity
        self.points = points
        self.resource_type = resource_type

    @abstractmethod
    def evaluate(self, state: Dict[str, Any]) -> RuleResult:
        """Evaluate the rule against normalized infrastructure state dictionary."""
        pass
