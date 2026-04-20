from dataclasses import dataclass
from datetime import datetime

from auth.auth_schemas import UserRole


@dataclass
class User:
    user_key: str
    username: str
    password: str
    created_at: datetime
    role: UserRole