from unittest.mock import patch

from django.db import OperationalError, connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from rest_framework.test import APIClient


class HealthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_public_health_executes_real_database_query(self):
        self.assertEqual(connection.vendor, "postgresql")
        with CaptureQueriesContext(connection) as queries:
            response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok"})
        self.assertTrue(any(query["sql"] == "SELECT 1" for query in queries))
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_database_failure_returns_503_without_internal_details(self):
        with patch("core.repositories.connection.cursor", side_effect=OperationalError("private detail")):
            response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable", "database": "unavailable"})
        self.assertNotContains(response, "private detail", status_code=503)
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_unexpected_query_result_is_unhealthy(self):
        with patch("core.repositories.database_is_reachable", return_value=False):
            response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 503)

    def test_health_does_not_accept_writes(self):
        for method in ("post", "put", "patch", "delete"):
            with self.subTest(method=method):
                self.assertEqual(getattr(self.client, method)(reverse("health")).status_code, 405)

    def test_authentication_endpoints_are_not_exposed(self):
        for url in ("/api/login/", "/api/register/", "/api/token/", "/admin/"):
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 404)
