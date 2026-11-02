from app.repositories import social_repository

def like_post(*, user_id, post_id):
    return social_repository.like_post(user_id=user_id, post_id=post_id)
    

def unlike_post(*, user_id, post_id):
    return social_repository.unlike_post(user_id=user_id, post_id=post_id)
    
    
def follow_user(*, from_user_id, to_user_id):
    return social_repository.follow_user(
        from_user_id=from_user_id, 
        to_user_id=to_user_id
    )
    

def unfollow_user(*, from_user_id, to_user_id):
    return social_repository.unfollow_user(
        from_user_id=from_user_id, 
        to_user_id=to_user_id
    )