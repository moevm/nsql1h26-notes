from contextlib import asynccontextmanager

from fastapi import FastAPI

from auth import auth_controller
from db.database import ensure_db, ensure_admin_exists
from user import user_controller
from note import note_controller
from log import log_controller
from share import share_controller
from backup import backup_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LIFESPAN START")
    db = ensure_db()
    ensure_admin_exists(db)
    yield


app = FastAPI(lifespan=lifespan)


app.include_router(auth_controller.router)
app.include_router(user_controller.router)
app.include_router(note_controller.router)
app.include_router(log_controller.router)
app.include_router(share_controller.router)
app.include_router(backup_controller.router)
