from django.db.models import Count
from app.models import Post

POSTS_PER_PAGE = 10

def create_post(*, authorId, title, body, media_type, media, caption):
    return Post.objects.create(
        authorId = authorId, 
        title = title, 
        body = body, 
        media_type = media_type, 
        media = media, 
        caption = caption,
    )
    

def list_posts(*, page=1, onlyFollowing=False, liked=False,):
    return (
        Post.objects
        # .select_related("author")
        .annotate(likes_count=Count("likes"))
        .order_by("-created_at")
    )