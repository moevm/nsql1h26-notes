from user.user_repository import UserRepository
from auth.auth_service import AuthService


user_repo = UserRepository()


def get_auth_service():
    return AuthService(user_repo)