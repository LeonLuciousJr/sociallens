from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import get_health


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    http_method_names = ["get", "head", "options"]

    def get(self, request):
        health = get_health()
        return Response(
            health,
            status=200 if health["status"] == "ok" else 503,
            headers={"Cache-Control": "no-store"},
        )
