from core.security import hash_password
from user.user_repository import UserRepository


class UserService:

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def create_user(self, username: str, password: str):
        hashed = hash_password(password)
        return self.user_repo.create(username, hashed)
    
    def get_user(self, user_key: str):
        return self.user_repo.get_by_key(user_key)
    
    def get_user_by_username(self, username: str):
        return self.user_repo.get_by_username(username)
    
    def update_user(self, user_key: str, data: dict):
        user = self.user_repo.update(user_key, data)
        return user