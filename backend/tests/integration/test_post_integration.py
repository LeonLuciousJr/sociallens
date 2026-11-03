from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from app.models import Post
from app.models.post import MediaType
from app.services import user_service


class PostViewsIntegrationTests(APITestCase):
    def setUp(self):
        self.url = reverse("list-create-post")
        self.user = user_service.register_user(
            email="alice@example.com",
            display_name="Alice",
            password="correct horse",
        )

    def test_cannot_create_post_without_authentication(self):
        response = self.client.post(
            self.url,
            {
                "title": "Unauthenticated",
                "body": "This should be rejected.",
                "mediaType": MediaType.TEXT,
                "caption": "",
            },
            format="json",
        )

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_create_text_post_then_browse_it(self):
        self.client.force_authenticate(user=self.user)

        create_response = self.client.post(
            self.url,
            {
                "title": "Hello, Django",
                "body": "My first integration-tested post.",
                "mediaType": MediaType.TEXT,
                "caption": "",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Post.objects.filter(
                pk=create_response.data["id"],
                title="Hello, Django",
            ).exists()
        )

        self.client.force_authenticate(user=None)
        feed_response = self.client.get(self.url, {"page": 1})

        self.assertEqual(feed_response.status_code, status.HTTP_200_OK)
        self.assertEqual(feed_response.data["count"], 1)
        self.assertEqual(len(feed_response.data["results"]), 1)
        self.assertEqual(
            feed_response.data["results"][0]["title"],
            "Hello, Django",
        )

    def test_image_post_requires_an_image(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            self.url,
            {
                "title": "Missing image",
                "body": "An IMAGE post needs an upload.",
                "mediaType": MediaType.IMAGE,
                "caption": "A caption",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("media", response.data)

    def test_invalid_page_is_rejected(self):
        response = self.client.get(self.url, {"page": 0})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_feed_uses_twenty_posts_per_page(self):
        self.client.force_authenticate(user=self.user)

        for number in range(21):
            response = self.client.post(
                self.url,
                {
                    "title": f"Post {number}",
                    "body": f"Body {number}",
                    "mediaType": MediaType.TEXT,
                    "caption": "",
                },
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(user=None)
        response = self.client.get(self.url, {"page": 1})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 21)
        self.assertEqual(len(response.data["results"]), 20)
