"""Local foundation settings. PostgreSQL is required in development and tests."""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Do not interpolate ${...} inside passwords; explicit environment values win.
load_dotenv(BASE_DIR / ".env", override=False, interpolate=False)


def required_env(name):
    value = os.environ.get(name, "")
    if not value.strip() or value.startswith("replace-with-"):
        raise ImproperlyConfigured(f"Set {name} in backend/.env or the environment.")
    return value


SECRET_KEY = required_env("DJANGO_SECRET_KEY")
if len(SECRET_KEY) < 50:
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must contain at least 50 characters.")

debug_value = os.environ.get("DJANGO_DEBUG", "false").lower()
if debug_value not in {"true", "false"}:
    raise ImproperlyConfigured("DJANGO_DEBUG must be true or false.")
DEBUG = debug_value == "true"
ALLOWED_HOSTS = [
    host.strip() for host in required_env("DJANGO_ALLOWED_HOSTS").split(",") if host.strip()
]
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS must list explicit hostnames.")

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "accounts.apps.AccountsConfig",
    "core.apps.CoreConfig",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

try:
    database_port = int(required_env("POSTGRES_PORT"))
except ValueError as exc:
    raise ImproperlyConfigured("POSTGRES_PORT must be an integer.") from exc
if not 1 <= database_port <= 65535:
    raise ImproperlyConfigured("POSTGRES_PORT must be between 1 and 65535.")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": required_env("POSTGRES_DB"),
        "USER": required_env("POSTGRES_USER"),
        "PASSWORD": required_env("POSTGRES_PASSWORD"),
        "HOST": required_env("POSTGRES_HOST"),
        "PORT": database_port,
        "OPTIONS": {"connect_timeout": 3, "options": "-c statement_timeout=3000"},
    }
}
AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    # No HTTP authentication scheme or login endpoints in the foundation.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
}
LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Chicago"
USE_I18N = True
USE_TZ = True
