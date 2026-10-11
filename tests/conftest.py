import pytest
from app.core.middleware import rate_limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter_fixture():
    """Reset the in-memory rate limiter before and after each test for clean test isolation."""
    rate_limiter.reset()
    yield
    rate_limiter.reset()
