from fastapi import FastAPI
from auth import auth_controller


app = FastAPI()

app.include_router(auth_controller.router)