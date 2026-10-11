from typing import Dict, List, Optional
from app.engine.verifier import MissionVerifier
from app.engine.rules.base import BaseRule
from app.engine.rules.s3_public_access import get_mission_1_rules
from app.engine.rules.iam_least_privilege import get_mission_2_rules


class MissionRegistry:
    """Central registry linking mission slugs to their deterministic rules and verifier."""

    _verifiers: Dict[str, MissionVerifier] = {}

    @classmethod
    def register_mission(cls, mission_slug: str, rules: List[BaseRule]) -> MissionVerifier:
        verifier = MissionVerifier(mission_slug=mission_slug, rules=rules)
        cls._verifiers[mission_slug] = verifier
        return verifier

    @classmethod
    def get_verifier(cls, mission_slug: str) -> Optional[MissionVerifier]:
        return cls._verifiers.get(mission_slug)


# Register Mission 1: The Public Invoice Bucket
MissionRegistry.register_mission("s3-public-invoices", get_mission_1_rules())

# Register Mission 2: The Overprivileged Lambda Role
MissionRegistry.register_mission("iam-overprivileged-lambda", get_mission_2_rules())


