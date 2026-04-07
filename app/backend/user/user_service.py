from user.user_repository import UserRepository


class UserService:

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    def get_user(self, user_key: str):
        return self.user_repo.get_by_key(user_key)
    
    def update_user(self, user_key: str, data: dict):
        user = self.user_repo.update(user_key, data)
        return user