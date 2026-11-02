from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from app.models import User


class AuthIntegrationTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.password = "correct-horse-battery"

    def register(self, email="alice@example.com", password=None):
        return self.client.post(
            self.register_url,
            {
                "email": email,
                "displayName": "Alice",
                "password": password or self.password,
            },
            format="json",
        )

    def test_register_creates_user_and_returns_tokens(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        user = User.objects.get(email="alice@example.com")
        self.assertTrue(user.check_password(self.password))
        self.assertNotEqual(user.password, self.password)

    def test_login_returns_tokens_for_registered_user(self):
        register_response = self.register()
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            self.login_url,
            {
                "email": "alice@example.com",
                "password": self.password,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_incorrect_password(self):
        self.register()

        response = self.client.post(
            self.login_url,
            {
                "email": "alice@example.com",
                "password": "wrong-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_registration_rejects_password_shorter_than_twelve_characters(self):
        response = self.register(password="short")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(email="alice@example.com").exists())

    def test_registration_rejects_duplicate_email(self):
        first_response = self.register()
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

        second_response = self.register()

        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            User.objects.filter(email="alice@example.com").count(),
            1,
        )
