from .settings import *

SECRET_KEY = "test-only-secret-key-with-at-least-32-bytes"

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        **REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}),
        "login": "10000/min",
        "register": "10000/min",
    },
}