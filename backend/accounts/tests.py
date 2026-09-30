from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction
from django.test import TestCase

User = get_user_model()


class UserTests(TestCase):
    def test_create_user_persists_hashed_password_and_public_handle(self):
        user = User.objects.create_user("Creator@Example.COM", "Creator", "Test-only-42!")
        user.refresh_from_db()
        self.assertEqual(connection.vendor, "postgresql")
        self.assertEqual(user.email, "creator@example.com")
        self.assertEqual(user.username, "Creator")
        self.assertNotEqual(user.password, "Test-only-42!")
        self.assertTrue(user.check_password("Test-only-42!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_authentication_uses_email_not_public_handle(self):
        user = User.objects.create_user("creator@example.com", "Creator", "Test-only-42!")
        self.assertEqual(authenticate(email="CREATOR@EXAMPLE.COM", password="Test-only-42!"), user)
        self.assertIsNone(authenticate(username="Creator", password="Test-only-42!"))
        self.assertIsNone(authenticate(email=user.email, password="incorrect"))
        user.is_active = False
        user.save(update_fields=["is_active"])
        self.assertIsNone(authenticate(email=user.email, password="Test-only-42!"))

    def test_missing_and_invalid_identifiers_are_rejected(self):
        for email, username in [("", "creator"), ("a@example.com", ""), (" ", "creator")]:
            with self.subTest(email=email, username=username), self.assertRaises(ValueError):
                User.objects.create_user(email, username)
        for email, username in [("invalid", "creator"), ("a@example.com", "bad handle!")]:
            with self.subTest(email=email, username=username), self.assertRaises(ValidationError):
                User.objects.create_user(email, username)

    def test_manager_rejects_duplicate_email_and_handle(self):
        User.objects.create_user("creator@example.com", "Creator")
        for email, username in [
            ("CREATOR@EXAMPLE.COM", "other"),
            ("other@example.com", "creator"),
        ]:
            with self.subTest(email=email), self.assertRaises(ValidationError):
                User.objects.create_user(email, username)

    def test_database_enforces_uniqueness_even_when_validation_is_bypassed(self):
        User.objects.create_user("creator@example.com", "Creator")
        for email, username in [
            ("creator@example.com", "other"),
            ("CREATOR@EXAMPLE.COM", "other"),
            ("other@example.com", "Creator"),
            ("other@example.com", "creator"),
        ]:
            with self.subTest(email=email, username=username):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    User.objects.bulk_create([User(email=email, username=username)])

    def test_no_password_creates_unusable_password(self):
        user = User.objects.create_user("creator@example.com", "Creator")
        self.assertFalse(user.has_usable_password())

    def test_superuser_and_permission_support(self):
        user = User.objects.create_superuser("admin@example.com", "Admin", "Test-only-42!")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.has_perm("accounts.change_user"))
        self.assertTrue(user.check_password("Test-only-42!"))

    def test_superuser_flags_cannot_be_disabled(self):
        for flag in ("is_staff", "is_superuser", "is_active"):
            with self.subTest(flag=flag), self.assertRaises(ValueError):
                User.objects.create_superuser("admin@example.com", "Admin", **{flag: False})

    def test_regular_user_can_receive_group_and_direct_permissions(self):
        user = User.objects.create_user("reader@example.com", "Reader")
        group = Group.objects.create(name="Test reviewers")
        group.permissions.add(Permission.objects.get(codename="view_user"))
        user.groups.add(group)
        user.user_permissions.add(Permission.objects.get(codename="change_user"))
        self.assertTrue(user.has_perm("accounts.view_user"))
        self.assertTrue(user.has_perm("accounts.change_user"))
        self.assertFalse(user.has_perm("accounts.delete_user"))
