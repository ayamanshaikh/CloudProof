from typing import Dict, Any
from app.engine.adapters.base import BaseEnvironmentAdapter


class SimulationAdapter(BaseEnvironmentAdapter):
    """Adapter fetching state directly from student's simulated demo configuration."""

    async def fetch_state(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract normalized configuration state from context.
        Context provides 'current_demo_state'.
        """
        state = context.get("current_demo_state") or {}
        return state
