from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from app.services.social_service import like_post, unlike_post, follow_user, unfollow_user


class LikeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        post_id = request.data.get("postId")

        like, created = like_post(
            user_id=request.user.pk,
            post_id=post_id,
        )

        return Response(
            {"liked": True, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    
class UnlikeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def delete(self, request):
        post_id = request.data.get("postId")

        unlike_post(
            user_id=request.user.pk,
            post_id=post_id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
    
class FollowView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        to_user_id = request.data.get("authorId")

        follow, created = follow_user(
            from_user_id=request.user.pk,
            to_user_id=to_user_id,
        )

        return Response(
            {"followed": True, "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    
class UnfollowView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def delete(self, request):
        to_user_id = request.data.get("authorId")

        unfollow_user(
            from_user_id=request.user.pk,
            to_user_id=to_user_id,
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
