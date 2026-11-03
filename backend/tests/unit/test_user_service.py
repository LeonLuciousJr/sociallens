from types import SimpleNamespace
from unittest.mock import patch

from app.services import user_service


def test_register_user_forwards_arguments_and_returns_user():
    expected_user = SimpleNamespace(id="u1", email="alice@example.com")

    with patch.object(
        user_service.user_repository,
        "create_user",
        return_value=expected_user,
    ) as create_user:
        result = user_service.register_user(
            email="alice@example.com",
            display_name="Alice",
            password="correct horse battery staple",
        )

    assert result is expected_user
    create_user.assert_called_once_with(
        email="alice@example.com",
        display_name="Alice",
        password="correct horse battery staple",
    )
