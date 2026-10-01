from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView

from app.routes.auth import LoginView, RegisterView
from app.routes.post_views import PostListCreateView
from app.routes.social_views import LikeView, UnlikeView, FollowView, UnfollowView



class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


urlpatterns = [
    path("login", LoginView.as_view(), name="login"),
    path("register", RegisterView.as_view(), name="register"),
    path("posts", PostListCreateView.as_view(), name="list-create-post"),
    path("like", LikeView.as_view(), name="like-post"),
    path("unlike", UnlikeView.as_view(), name="unlike-post"),
    path("follow", FollowView.as_view(), name="follow-user"),
    path("unfollow", UnfollowView.as_view(), name="unfollow-user"),
    path("token/refresh", RefreshView.as_view(), name="token_refresh"),
]
