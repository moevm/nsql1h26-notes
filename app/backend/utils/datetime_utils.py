from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")



def normalize_datetime(v: str | None) -> str | None:
    if v is None:
        return v
    try:
        dt = datetime.fromisoformat(v)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    except ValueError:
        raise ValueError("Invalid datetime format")

def validate_date_range(start: str | None, end: str | None, field_name: str = "date"):
    if start and end and start > end:
        raise ValueError(f"{field_name}_from must be <= {field_name}_to")