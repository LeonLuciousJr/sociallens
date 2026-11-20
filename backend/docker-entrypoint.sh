#!/bin/sh
set -e

: "${DB_HOST:?DB_HOST must be set}"

# Retry migrations while Postgres initializes during a Compose cold start.
attempt=1
until python manage.py migrate --noinput; do
    if [ "$attempt" -ge 10 ]; then
        echo "Migrations failed after $attempt attempts; giving up." >&2
        exit 1
    fi
    echo "Database not ready (attempt $attempt); retrying in 3s..." >&2
    attempt=$((attempt + 1))
    sleep 3
done

exec "$@"