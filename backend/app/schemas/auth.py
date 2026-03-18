from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class RegisterResponse(BaseModel):
    message: str
    user_id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int


class RefreshResponse(BaseModel):
    access_token: str
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_verified: bool
    avatar_url: str | None = None

    class Config:
        from_attributes = True
