from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="CloudProof API",
    version="1.0.0",
    description="Educational cloud computing incident practice and automated verification platform."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", tags=["System"])
async def health_check():
    """System health check endpoint verifying backend availability."""
    return {
        "status": "healthy",
        "service": "CloudProof Backend API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }
