from user.user_repository import UserRepository
from core.security import hash_password, verify_password, create_access_token


class AuthService:

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register(self, username: str, password: str):
        existing = self.user_repo.get_by_username(username)

        if existing:
            raise Exception("User already exists")
        
        hashed = hash_password(password)
        user = self.user_repo.create(username, hashed)

        token = create_access_token({"sub": user.username})
        return token
    
    def login(self, username: str, password: str):
        user = self.user_repo.get_by_username(username)

        if not user:
            raise Exception("Invalid credential")
        
        if not verify_password(password, user.password):
            raise Exception("Invalid password")
        
        token = create_access_token({"sub": user.username})
        return token