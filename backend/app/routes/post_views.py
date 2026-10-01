from rest_framework import serializers, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from app.models import Post
from app.models.post import MediaType
from app.services import post_service


class CreatePostSerializer(serializers.ModelSerializer):
    mediaType = serializers.ChoiceField(
        source="media_type",
        choices=MediaType.choices,
    )
    media = serializers.ImageField(required=False, write_only=True)

    class Meta:
        model = Post
        fields = ["title", "body", "mediaType", "caption", "media"]

    def validate(self, attrs):
        if attrs["media_type"] == MediaType.IMAGE and not attrs.get("media"):
            raise serializers.ValidationError(
                {"media": "An image is required for an IMAGE post."}
            )
        if attrs["media_type"] == MediaType.TEXT and attrs.get("media"):
            raise serializers.ValidationError(
                {"media": "A TEXT post cannot include an image."}
            )
        return attrs


class PostResponseSerializer(serializers.ModelSerializer):
    mediaType = serializers.CharField(source="media_type", read_only=True)
    media_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "authorId",
            "title",
            "body",
            "mediaType",
            "caption",
            "media",
            "media_url",
            "likes",
            "created_at",
        ]

    def get_media_url(self, post):
        return post.media.url if post.media else None


class PostPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class PostListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get(self, request):
        posts = post_service.list_posts()

        paginator = PostPagination()
        page = paginator.paginate_queryset(posts, request, view=self)
        serializer = PostResponseSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = CreatePostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        post = post_service.publish_post(
            author_id=request.user,
            **serializer.validated_data,
        )

        return Response(
            PostResponseSerializer(post).data,
            status=status.HTTP_201_CREATED,
        )
