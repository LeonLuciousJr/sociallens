from django.db import DatabaseError

from . import repositories


def get_health():
    try:
        available = repositories.database_is_reachable()
    except DatabaseError:
        available = False
    if available:
        return {"status": "ok", "database": "ok"}
    return {"status": "unavailable", "database": "unavailable"}
