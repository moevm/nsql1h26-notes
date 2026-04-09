from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from auth.auth_service import AuthService
from core.config import SECRET_KEY, ALGORITHM
from core.container import user_repo


security = HTTPBearer()


def get_auth_service() -> AuthService:
    return AuthService(user_repo)


def get_current_user_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_key: str = payload.get("sub")

        if not user_key:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_key

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")