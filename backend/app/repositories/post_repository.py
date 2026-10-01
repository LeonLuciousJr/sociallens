from django.db.models import Count, Exists, OuterRef
from app.models import Post
from app.models import Like, Follow

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
    

def list_posts(*, user_id=None, page=1, only_following=False, liked=False,):
    print(f"{user_id} {page} {only_following} {liked}")
    
    posts = Post.objects.all()
    
    if user_id and only_following:
        user_following = Follow.objects.filter(
            from_user_id=user_id,
            to_user_id=OuterRef("authorId")
        )
        posts = posts.annotate(is_following=Exists(user_following)).filter(is_following=True)
    
    if user_id and liked:
        user_like = Like.objects.filter(
            user_id=user_id,
            post_id=OuterRef("pk"),
        )
        posts = posts.annotate(is_liked=Exists(user_like)).filter(is_liked=True)
    
    
    return (
        posts
        .annotate(likes_count=Count("likes"))
        .order_by("-created_at")
    )