from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def create_access_token(username: str) -> str:
    s = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=s.ADMIN_JWT_EXPIRES_MINUTES)
    return jwt.encode(
        {"sub": username, "exp": expire},
        s.ADMIN_JWT_SECRET,
        algorithm="HS256",
    )


def verify_credentials(username: str, password: str) -> bool:
    s = get_settings()
    # Phase 1: static credentials. Phase 2: DB-backed admin table.
    return username == s.ADMIN_USERNAME and password == s.ADMIN_PASSWORD


async def get_current_admin(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    s = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, s.ADMIN_JWT_SECRET, algorithms=["HS256"])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception


# FastAPI route handler — mount in main app
from fastapi import APIRouter

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login", response_model=TokenResponse)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    if not verify_credentials(form_data.username, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    s = get_settings()
    token = create_access_token(form_data.username)
    return TokenResponse(
        access_token=token,
        expires_in=s.ADMIN_JWT_EXPIRES_MINUTES * 60,
    )
