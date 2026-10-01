from rest_framework import serializers
from ..models.post import Post


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = [
            "id",
            "authorId",
            "title",
            "body",
            "media_type",
            "caption",
            "media",
            "created_at",
        ]
        read_only_fields = ["id", "authorId", "created_at"]
