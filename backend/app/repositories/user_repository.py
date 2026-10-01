from app.models import User


def create_user(*, email, display_name, password):
    return User.objects.create_user(
        email=email,
        display_name=display_name,
        password=password,
    )