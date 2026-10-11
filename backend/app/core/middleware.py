import re
import time
from collections import deque
from typing import Dict, Tuple, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Production security headers middleware enforcing defensive HTTP response headers
    to prevent clickjacking, MIME sniffing, cross-site scripting, and framing.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
        except Exception as exc:
            import logging
            logging.getLogger("cloudproof.security").error(
                f"Security audit - unhandled exception on {request.method} {request.url.path}: {exc}",
                exc_info=True
            )
            response = JSONResponse(
                status_code=500,
                content={"detail": "An internal server error occurred. The incident has been logged for security audit."}
            )

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class InMemoryRateLimiter:
    """
    Thread-safe sliding-window in-memory rate limiter.
    Zero external dependencies (no Redis requirement for zero-cloud-cost college deployments).
    Tracks request timestamps in deques per client IP and route category.
    """
    def __init__(self):
        # Key: (client_ip, category) -> deque of timestamp floats
        self._buckets: Dict[Tuple[str, str], deque] = {}

    def is_allowed(self, client_ip: str, category: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if request from client_ip in category is allowed.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        key = (client_ip, category)
        now = time.time()
        cutoff = now - window_seconds

        if key not in self._buckets:
            self._buckets[key] = deque()

        bucket = self._buckets[key]

        # Evict timestamps outside the sliding window
        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        if len(bucket) >= max_requests:
            oldest = bucket[0]
            retry_after = max(1, int(oldest + window_seconds - now))
            return False, retry_after

        bucket.append(now)
        return True, 0

    def get_remaining(self, client_ip: str, category: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining allowed requests in current sliding window."""
        key = (client_ip, category)
        now = time.time()
        cutoff = now - window_seconds

        if key not in self._buckets:
            return max_requests

        bucket = self._buckets[key]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()

        return max(0, max_requests - len(bucket))

    def reset(self):
        """Reset all rate limit tracking (useful for test isolation)."""
        self._buckets.clear()


# Global singleton instance for application lifespan
rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiting middleware protecting sensitive attack surfaces:
    - Authentication (/api/v1/auth/login, /api/v1/auth/register)
    - Mission verification (/api/v1/missions/{attempt_id}/verify)
    """
    AUTH_PATTERN = re.compile(r"^/api/v1/auth/(login|register)/?$")
    VERIFY_PATTERN = re.compile(r"^/api/v1/missions/[^/]+/verify/?$")

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next) -> Response:
        if not getattr(settings, "RATE_LIMIT_ENABLED", True):
            return await call_next(request)

        # Do not rate limit CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        client_ip = self._get_client_ip(request)

        # 1. Auth routes rate limit check
        if request.method == "POST" and self.AUTH_PATTERN.match(path):
            max_reqs = getattr(settings, "AUTH_RATE_LIMIT", 10)
            window_sec = getattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60)
            allowed, retry_after = rate_limiter.is_allowed(client_ip, "auth", max_reqs, window_sec)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded for authentication. Please wait before retrying."},
                    headers={"Retry-After": str(retry_after)}
                )

        # 2. Mission verify route rate limit check
        elif request.method == "POST" and self.VERIFY_PATTERN.match(path):
            max_reqs = getattr(settings, "VERIFY_RATE_LIMIT", 20)
            window_sec = getattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60)
            allowed, retry_after = rate_limiter.is_allowed(client_ip, "verify", max_reqs, window_sec)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded for mission verification. Please wait before retrying."},
                    headers={"Retry-After": str(retry_after)}
                )

        return await call_next(request)
