from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException
from passlib.context import CryptContext
import uuid

from auth.auth_schemas import RefreshToken, UserToken
from core.config import get_settings

settings = get_settings()


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def decode_access_token(token: str) -> UserToken:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(401, "Expected access token")
    return UserToken.model_validate(payload)


def decode_refresh_token(token: str) -> RefreshToken:
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(401, "Expected refresh token")
    return RefreshToken.model_validate(payload)


def create_token(payload: dict) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(user_key: str, username: str, role: str):
    payload = {
        "sub": user_key,
        "username": username,
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return create_token(payload)


def create_refresh_token(user_key: str):
    payload = {
        "sub": user_key,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": datetime.now(timezone.utc)
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    }
    return create_token(payload)
