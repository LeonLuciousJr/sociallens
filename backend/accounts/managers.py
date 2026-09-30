from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    @classmethod
    def normalize_email(cls, email):
        # SocialLens treats the entire email address as case-insensitive.
        return super().normalize_email(email).lower()

    def get_by_natural_key(self, email):
        return self.get(email__iexact=self.normalize_email(email))

    def create_user(self, email, username, password=None, **extra_fields):
        if not email or not email.strip():
            raise ValueError("An email address is required.")
        if not username or not username.strip():
            raise ValueError("A public username is required.")
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        user = self.model(
            email=self.normalize_email(email),
            username=self.model.normalize_username(username.strip()),
            **extra_fields,
        )
        user.set_password(password)
        user.full_clean()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        for field in ("is_staff", "is_superuser", "is_active"):
            if extra_fields.get(field) is not True:
                raise ValueError(f"A superuser must have {field}=True.")
        return self.create_user(email, username, password, **extra_fields)
