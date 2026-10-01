from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView

from app.routes.auth import LoginView, RegisterView


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


urlpatterns = [
    path("login", LoginView.as_view(), name="login"),
    path("register", RegisterView.as_view(), name="register"),
    path("token/refresh", RefreshView.as_view(), name="token_refresh"),
]
