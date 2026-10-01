from app.repositories import user_repository


def register_user(*, email, display_name, password):
    return user_repository.create_user(
        email=email,
        display_name=display_name,
        password=password,
    )