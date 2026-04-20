from typing import List, Dict

from arango import ArangoClient
from arango.database import StandardDatabase
from arango.exceptions import CollectionCreateError, DatabaseCreateError, ServerConnectionError
from passlib.context import CryptContext

from auth.auth_schemas import UserRole
from core.config import get_settings
from time import sleep

from utils.datetime_utils import now_iso

settings = get_settings()

client = ArangoClient(hosts=settings.database_url)
db: StandardDatabase | None = None

COLLECTIONS: tuple[str, ...] = ("users", "notes","logs")
MAX_INIT_ATTEMPTS = 30
RETRY_DELAY_SECONDS = 2.0
DEBUG_USERS: List[Dict] = [
    {
        "username": settings.ADMIN_USERNAME,
        "password": settings.ADMIN_PASSWORD,
        "role": UserRole.ADMIN.value,
    },
    {
        "username": settings.USER_USERNAME,
        "password": settings.USER_PASSWORD,
        "role": UserRole.USER.value,
    }
]

def ensure_db(
    max_attempts: int = MAX_INIT_ATTEMPTS,
    retry_delay_seconds: float = RETRY_DELAY_SECONDS,
) -> StandardDatabase:
    global db

    if db is not None:
        return db

    last_error: Exception | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            sys_db = client.db(
                "_system",
                username=settings.ARANGO_USER,
                password=settings.ARANGO_PASSWORD,
            )

            if not sys_db.has_database(settings.ARANGO_DB):
                try:
                    sys_db.create_database(settings.ARANGO_DB)
                except DatabaseCreateError:
                    if not sys_db.has_database(settings.ARANGO_DB):
                        raise

            db = client.db(
                settings.ARANGO_DB,
                username=settings.ARANGO_USER,
                password=settings.ARANGO_PASSWORD,
            )

            for collection_name in COLLECTIONS:
                if not db.has_collection(collection_name):
                    try:
                        db.create_collection(collection_name)
                    except CollectionCreateError:
                        if not db.has_collection(collection_name):
                            raise

            return db
        except ServerConnectionError as exc:
            last_error = exc
            db = None
            if attempt < max_attempts:
                sleep(retry_delay_seconds)

        except Exception as exc:
            print(f"[DB INIT ERROR] Attempt {attempt}:", repr(exc))
            last_error = exc
            db = None

    raise RuntimeError(
        "ArangoDB is unavailable after repeated startup attempts"
    ) from last_error

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def ensure_admin_exists(db: StandardDatabase):
    users = db.collection("users")

    for debug_user in DEBUG_USERS:
        query = """
        FOR u IN users
            FILTER u.username == @username
            LIMIT 1
            RETURN u
        """
        cursor = db.aql.execute(query, bind_vars={"username": debug_user["username"]})
        existing_user = next(cursor, None)

        if not existing_user:
            user_data = {
                "username": debug_user["username"],
                "hashed_password": pwd_context.hash(debug_user["password"]),
                "role": debug_user["role"],
                "created_at": now_iso(),
            }
            users.insert(user_data)
            print(f"[DB INIT] Created {debug_user['role']} user: {debug_user['username']}")
        else:
            print(f"[DB INIT] {debug_user['role']} user already exists: {debug_user['username']}")


def get_db():
    return ensure_db()
