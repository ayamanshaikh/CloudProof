from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.student import router as student_router
from app.api.v1.endpoints.instructor import router as instructor_router
from app.api.v1.endpoints.verification import router as verification_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(student_router)
api_router.include_router(instructor_router)
api_router.include_router(verification_router)



