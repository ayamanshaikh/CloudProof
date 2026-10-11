from typing import Dict, List, Optional
from app.engine.verifier import MissionVerifier
from app.engine.rules.base import BaseRule


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
