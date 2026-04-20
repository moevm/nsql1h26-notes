from typing import Annotated

from arango.database import StandardDatabase
from fastapi.params import Depends

from db.database import get_db
from user.user_repository import UserRepository
from user.user_service import UserService

def get_user_repository(db: StandardDatabase = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    return UserService(user_repo)