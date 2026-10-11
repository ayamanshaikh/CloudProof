import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.core.middleware import rate_limiter


@pytest.fixture(autouse=True)
def ensure_rate_limiter_clean():
    rate_limiter.reset()
    yield
    rate_limiter.reset()


@pytest.mark.asyncio
async def test_security_headers_present_on_api_responses():
    """Verify production defensive security headers are appended to HTTP responses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200

        # Assert mandatory defensive headers
        headers = res.headers
        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("x-xss-protection") == "1; mode=block"
        assert "max-age=31536000" in headers.get("strict-transport-security", "")
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert "default-src 'self'" in headers.get("content-security-policy", "")
        assert "camera=()" in headers.get("permissions-policy", "")


@pytest.mark.asyncio
async def test_rate_limiter_auth_endpoints_throttling():
    """Verify rapid consecutive authentication attempts are throttled with HTTP 429."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client_ip = "198.51.100.5"
        headers = {"X-Forwarded-For": client_ip}

        # 1. First 10 auth attempts should pass through to auth handler (returning 401 for bad creds, NOT 429)
        for i in range(10):
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": f"hacker_{i}@test.com", "password": "WrongPassword!"},
                headers=headers
            )
            assert res.status_code == 401, f"Expected 401 on attempt {i+1}, got {res.status_code}"

        # 2. 11th auth attempt should be throttled by RateLimitMiddleware with HTTP 429
        throttled_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "hacker_11@test.com", "password": "WrongPassword!"},
            headers=headers
        )
        assert throttled_res.status_code == 429
        body = throttled_res.json()
        assert "Rate limit exceeded" in body["detail"]
        assert "Retry-After" in throttled_res.headers
        assert int(throttled_res.headers["Retry-After"]) >= 1

        # Defensive security headers must also be present on 429 responses
        assert throttled_res.headers.get("x-content-type-options") == "nosniff"
        assert throttled_res.headers.get("x-frame-options") == "DENY"


@pytest.mark.asyncio
async def test_rate_limiter_ip_isolation():
    """Verify rate limiting is isolated per client IP."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        ip_a = "192.0.2.1"
        ip_b = "192.0.2.2"

        # Exhaust limit for IP A
        for _ in range(10):
            await client.post(
                "/api/v1/auth/login",
                json={"email": "victim@test.com", "password": "Wrong!"},
                headers={"X-Forwarded-For": ip_a}
            )

        res_a_blocked = await client.post(
            "/api/v1/auth/login",
            json={"email": "victim@test.com", "password": "Wrong!"},
            headers={"X-Forwarded-For": ip_a}
        )
        assert res_a_blocked.status_code == 429

        # IP B should NOT be blocked
        res_b_allowed = await client.post(
            "/api/v1/auth/login",
            json={"email": "legit@test.com", "password": "Wrong!"},
            headers={"X-Forwarded-For": ip_b}
        )
        assert res_b_allowed.status_code == 401  # Allowed through to auth handler


@pytest.mark.asyncio
async def test_rate_limiter_mission_verify_throttling():
    """Verify mission verification endpoint enforces rate limits against automated brute-forcing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        client_ip = "203.0.113.99"
        headers = {"X-Forwarded-For": client_ip, "Authorization": "Bearer mock-token"}

        # 20 verify requests allowed through (even if 401 due to fake token, rate limiter counts them)
        for i in range(20):
            res = await client.post(
                "/api/v1/missions/fake-attempt-id/verify",
                headers=headers
            )
            assert res.status_code != 429, f"Unexpected 429 on verify call {i+1}"

        # 21st verify call must be throttled with 429
        throttled_res = await client.post(
            "/api/v1/missions/fake-attempt-id/verify",
            headers=headers
        )
        assert throttled_res.status_code == 429
        assert "mission verification" in throttled_res.json()["detail"].lower()
        assert "Retry-After" in throttled_res.headers


@pytest.mark.asyncio
async def test_non_sensitive_endpoints_not_rate_limited():
    """Verify public informational endpoints like health check are not blocked by rate limits."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 30 consecutive calls should all succeed without 429
        for _ in range(30):
            res = await client.get("/api/v1/health")
            assert res.status_code == 200


@pytest.mark.asyncio
async def test_unhandled_exception_sanitization():
    """Verify unhandled 500 exceptions are sanitized and do not leak internal stack traces or secrets."""
    # Define a test endpoint that raises an unexpected internal exception
    @app.get("/api/v1/test-internal-error")
    async def crash_endpoint():
        raise RuntimeError("CRITICAL_DATABASE_KEY_LEAK_SECRET_12345: /var/db/connection_failed")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/test-internal-error")
        assert res.status_code == 500

        data = res.json()
        assert "detail" in data
        assert "internal server error occurred" in data["detail"].lower()

        # Crucial security guarantee: Internal exception text and stack trace must NOT leak
        assert "CRITICAL_DATABASE_KEY_LEAK_SECRET_12345" not in res.text
        assert "Traceback" not in res.text
        assert "/var/db" not in res.text

        # Defensive security headers must still be attached to 500 responses
        assert res.headers.get("x-content-type-options") == "nosniff"
        assert res.headers.get("x-frame-options") == "DENY"
