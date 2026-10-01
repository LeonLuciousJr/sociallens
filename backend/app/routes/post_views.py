from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from ..models.post import Post
from .serializers import PostSerializer


class PostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Post.objects.filter(authorId=self.request.user)


class PostDetailView(generics.RetrieveAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        # Scoping here means users can retrieve only their own posts.
        return Post.objects.filter(authorId=self.request.user)
