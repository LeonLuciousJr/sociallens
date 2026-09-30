from django.db import connection


def database_is_reachable():
    """A real round trip, without reading or exposing application records."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        return cursor.fetchone() == (1,)
