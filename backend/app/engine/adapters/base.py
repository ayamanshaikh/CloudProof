from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseEnvironmentAdapter(ABC):
    """Abstract adapter fetching normalized configuration state from target environment."""

    @abstractmethod
    async def fetch_state(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch and normalize configuration state from the environment.
        In Demo Mode: context contains attempt_id or current_demo_state JSON.
        In Real AWS Mode: context contains aws_account_id, role_arn, external_id.
        """
        pass
