from app.models import Like
from app.models import Follow

def like_post(*, user_id, post_id):
    return Like.objects.get_or_create(
        user_id=user_id,
        post_id=post_id,
    )
    

def unlike_post(*, user_id, post_id):
    return Like.objects.filter(
        user_id=user_id,
        post_id=post_id,
    ).delete()
    
    
def follow_user(*, from_user_id, to_user_id):
    return Follow.objects.get_or_create(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
    )
    

def unfollow_user(*, from_user_id, to_user_id):
    return Follow.objects.filter(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
    ).delete()