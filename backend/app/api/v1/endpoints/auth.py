from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user, get_current_instructor, get_current_student
from app.models.user import User, StudentWallet
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new student or instructor user."""
    # Check if email is already registered
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    # Create new user
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role
    )
    db.add(user)
    await db.flush()

    # If registered as a student, initialize hint token wallet
    if payload.role == "student":
        wallet = StudentWallet(
            student_id=user.id,
            balance=10
        )
        db.add(wallet)

    await db.commit()
    await db.refresh(user)

    # Generate JWT
    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password and issue JWT."""
    stmt = select(User).where(User.email == payload.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_data = {"sub": user.id, "email": user.email, "role": user.role}
    access_token = create_access_token(data=token_data)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return UserResponse.model_validate(current_user)


# Role-restricted test endpoints for RBAC test suite
@router.get("/guard/student", response_model=dict)
async def guard_student_only(current_student: User = Depends(get_current_student)):
    """Test endpoint restricted to students."""
    return {"message": "Access granted to student", "user_id": current_student.id}


@router.get("/guard/instructor", response_model=dict)
async def guard_instructor_only(current_instructor: User = Depends(get_current_instructor)):
    """Test endpoint restricted to instructors."""
    return {"message": "Access granted to instructor", "user_id": current_instructor.id}
