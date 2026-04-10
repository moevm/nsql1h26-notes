from user.user_service import UserService
from core.security import hash_password, verify_password, create_tokens


class AuthService:

    def __init__(self, user_service: UserService):
        self.user_service = user_service

    def register(self, username: str, password: str, confirm_password: str):
        existing = self.user_service.get_user_by_username(username)

        if existing:
            raise Exception("User already exists")
        
        if not self._validate_password(password, confirm_password):
            raise Exception("Passswords do not match")
        
        hashed = hash_password(password)
        user = self.user_service.create_user(username, hashed)

        return create_tokens(user.user_key)
    
    def login(self, username: str, password: str):
        user = self.user_service.get_user_by_username(username)

        if not user:
            raise Exception("Invalid user")
        
        if not verify_password(password, user.password):
            raise Exception("Invalid password")
        
        return create_tokens(user.user_key)
    
    def _validate_password(self, password: str, confirm_password: str):
        return password == confirm_password
    
    def issue_tokens(self, user_key: str):
        return create_tokens(user_key)