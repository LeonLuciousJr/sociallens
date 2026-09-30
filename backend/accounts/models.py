from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower

from .managers import UserManager


class User(AbstractUser):
    """Email is the login identifier; inherited username is the public handle."""

    email = models.EmailField(unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    objects = UserManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("email"), name="accounts_user_email_ci_unique"),
            models.UniqueConstraint(Lower("username"), name="accounts_user_handle_ci_unique"),
        ]

    def __str__(self):
        return self.username
