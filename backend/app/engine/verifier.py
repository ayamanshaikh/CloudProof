import time
from typing import List, Dict, Any, Type
from app.engine.models import VerificationVerdict, RuleResult, RuleCheckStatus
from app.engine.rules.base import BaseRule
from app.engine.adapters.base import BaseEnvironmentAdapter


class MissionVerifier:
    """Deterministic orchestrator executing rule assertions against normalized infrastructure state."""

    def __init__(self, mission_slug: str, rules: List[BaseRule]):
        self.mission_slug = mission_slug
        self.rules = rules

    async def verify(
        self,
        adapter: BaseEnvironmentAdapter,
        context: Dict[str, Any]
    ) -> VerificationVerdict:
        """
        Execute deterministic verification:
        1. Fetch state via the adapter (Simulation or AWS)
        2. Evaluate all rules against the state
        3. Determine aggregate PASS/FAIL verdict and points
        """
        start_time = time.perf_counter()

        # Step 1: Fetch state
        state = await adapter.fetch_state(context)

        # Step 2: Evaluate rules
        rule_results: List[RuleResult] = []
        total_points_earned = 0
        max_points_possible = sum(rule.points for rule in self.rules)
        all_passed = True

        for rule in self.rules:
            result = rule.evaluate(state)
            rule_results.append(result)

            if result.status == RuleCheckStatus.PASS:
                total_points_earned += result.points_earned
            else:
                all_passed = False

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        passed_rules_count = sum(1 for r in rule_results if r.status == RuleCheckStatus.PASS)

        return VerificationVerdict(
            mission_slug=self.mission_slug,
            status=RuleCheckStatus.PASS if all_passed else RuleCheckStatus.FAIL,
            total_rules=len(self.rules),
            passed_rules=passed_rules_count,
            base_points_earned=total_points_earned if all_passed else 0,
            max_points_possible=max_points_possible,
            rule_results=rule_results,
            execution_time_ms=execution_time_ms,
            raw_state_snapshot=state
        )
