from fastapi import HTTPException

from core.security import create_access_token, create_refresh_token, decode_token


class TokenService:
    def create_tokens(self, user_key: str, username: str, role: str) -> tuple[str, str]:
        access = create_access_token(user_key, username, role)
        refresh = create_refresh_token(user_key)
        return access, refresh

    def decode_refresh(self, token: str) -> dict:
        payload = decode_token(token)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Expected refresh token")
        return payload
