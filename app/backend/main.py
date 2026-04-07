from fastapi import FastAPI

from auth import auth_controller
from user import user_controller


app = FastAPI()

app.include_router(auth_controller.router)
app.include_router(user_controller.router)