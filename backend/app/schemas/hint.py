from typing import List, Optional
from pydantic import BaseModel


class HintItemResponse(BaseModel):
    id: str
    level: int  # 1: Conceptual, 2: Investigative, 3: Near-Solution, 4: Solution Reveal
    title: str
    token_cost: int
    penalty_percent: int
    is_unlocked: bool
    content: Optional[str] = None  # None if locked to prevent leaking


class HintAttemptStatusResponse(BaseModel):
    attempt_id: str
    mission_id: str
    wallet_balance: int
    total_penalty_percent: int
    hints: List[HintItemResponse]


class UnlockHintRequest(BaseModel):
    hint_level: int


class UnlockHintResponse(BaseModel):
    message: str
    hint_level: int
    tokens_spent: int
    new_wallet_balance: int
    penalty_applied: int
    total_penalty_percent: int
    unlocked_content: str
