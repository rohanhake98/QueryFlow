from fastapi import APIRouter, Depends, Response, Cookie
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, RefreshResponse, UserResponse
from app.services.auth_service import register_user, authenticate_user, save_refresh_token, get_current_user
from app.utils.jwt import create_access_token, create_refresh_token, get_user_id_from_token
from app.models.user import User
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(payload.email, payload.password, payload.full_name, db)
    return RegisterResponse(message="Registration successful. Please verify your email.", user_id=str(user.id))


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(payload.email, payload.password, db)
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    await save_refresh_token(user.id, refresh_token, db)

    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    return LoginResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(refresh_token: str | None = Cookie(default=None)):
    if not refresh_token:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    user_id = get_user_id_from_token(refresh_token)
    access_token = create_access_token(user_id)
    return RefreshResponse(access_token=access_token, expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
    )
