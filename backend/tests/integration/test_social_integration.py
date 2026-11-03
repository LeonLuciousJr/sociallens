from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from app.services import user_service


class SocialViewsIntegrationTests(APITestCase):
    def setUp(self):
        self.like_url = reverse("like-post")
        self.unlike_url = reverse("unlike-post")
        self.follow_url = reverse("follow-user")
        self.unfollow_url = reverse("unfollow-user")
        self.posts_url = reverse("list-create-post")

        self.alice = user_service.register_user(
            email="alice@example.com",
            display_name="Alice",
            password="test-password",
        )
        self.bob = user_service.register_user(
            email="bob@example.com",
            display_name="Bob",
            password="test-password",
        )

        # Create a real post owned by Alice for the like tests.
        self.client.force_authenticate(user=self.alice)
        post_response = self.client.post(
            self.posts_url,
            {
                "title": "Post to like",
                "body": "A real post in the test database.",
                "mediaType": "TEXT",
                "caption": "",
            },
            format="json",
        )
        self.assertEqual(post_response.status_code, status.HTTP_201_CREATED)
        self.post_id = post_response.data["id"]

    def test_like_is_created_once_and_can_be_removed(self):
        self.client.force_authenticate(user=self.bob)

        first_like = self.client.post(
            self.like_url,
            {"postId": self.post_id},
            format="json",
        )
        self.assertEqual(first_like.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_like.data, {"liked": True, "created": True})

        duplicate_like = self.client.post(
            self.like_url,
            {"postId": self.post_id},
            format="json",
        )
        self.assertEqual(duplicate_like.status_code, status.HTTP_200_OK)
        self.assertEqual(duplicate_like.data, {"liked": True, "created": False})

        unlike = self.client.delete(
            self.unlike_url,
            {"postId": self.post_id},
            format="json",
        )
        self.assertEqual(unlike.status_code, status.HTTP_204_NO_CONTENT)

        # A new like after removal should create the relationship again.
        like_again = self.client.post(
            self.like_url,
            {"postId": self.post_id},
            format="json",
        )
        self.assertEqual(like_again.status_code, status.HTTP_201_CREATED)
        self.assertEqual(like_again.data, {"liked": True, "created": True})

    def test_follow_is_created_once_and_can_be_removed(self):
        self.client.force_authenticate(user=self.alice)

        first_follow = self.client.post(
            self.follow_url,
            {"authorId": self.bob.pk},
            format="json",
        )
        self.assertEqual(first_follow.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_follow.data, {"followed": True, "created": True})

        duplicate_follow = self.client.post(
            self.follow_url,
            {"authorId": self.bob.pk},
            format="json",
        )
        self.assertEqual(duplicate_follow.status_code, status.HTTP_200_OK)
        self.assertEqual(
            duplicate_follow.data,
            {"followed": True, "created": False},
        )

        unfollow = self.client.delete(
            self.unfollow_url,
            {"authorId": self.bob.pk},
            format="json",
        )
        self.assertEqual(unfollow.status_code, status.HTTP_204_NO_CONTENT)

        follow_again = self.client.post(
            self.follow_url,
            {"authorId": self.bob.pk},
            format="json",
        )
        self.assertEqual(follow_again.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            follow_again.data,
            {"followed": True, "created": True},
        )

    def test_social_endpoints_require_authentication(self):
        self.client.force_authenticate(user=None)

        requests = [
            lambda: self.client.post(
                self.like_url, {"postId": self.post_id}, format="json"
            ),
            lambda: self.client.delete(
                self.unlike_url, {"postId": self.post_id}, format="json"
            ),
            lambda: self.client.post(
                self.follow_url, {"authorId": self.bob.pk}, format="json"
            ),
            lambda: self.client.delete(
                self.unfollow_url, {"authorId": self.bob.pk}, format="json"
            ),
        ]

        for make_request in requests:
            with self.subTest():
                response = make_request()
                self.assertIn(
                    response.status_code,
                    (
                        status.HTTP_401_UNAUTHORIZED,
                        status.HTTP_403_FORBIDDEN,
                    ),
                )
