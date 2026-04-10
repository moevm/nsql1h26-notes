from user.user_service import UserService
from core.container import user_repo


def get_user_service():
    return UserService(user_repo)