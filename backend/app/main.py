import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.core.database import init_db
from app.core.middleware import SecurityHeadersMiddleware, RateLimitMiddleware
from app.api.v1.router import api_router

logger = logging.getLogger("cloudproof.security")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    yield


app = FastAPI(
    title="CloudProof API",
    version="1.0.0",
    description="Educational cloud computing incident practice and automated verification platform.",
    lifespan=lifespan
)

# 1. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Rate Limiting Middleware (in-memory sliding window for auth and verify)
app.add_middleware(RateLimitMiddleware)

# 3. Security Headers Middleware (outermost defensive HTTP response headers)
app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Sanitize unhandled internal exceptions to prevent information leakage,
    while passing standard HTTP exceptions and validation errors through.
    """
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None) or {}
        )
    if isinstance(exc, RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()}
        )

    logger.error(f"Security audit - unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. The incident has been logged for security audit."}
    )


# Mount API routers
app.include_router(api_router, prefix="/api/v1")


@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """System health check endpoint verifying backend availability."""
    return {
        "status": "healthy",
        "service": "CloudProof Backend API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }
