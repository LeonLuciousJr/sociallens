from app.repositories import social_repositiory

def like_post(*, user_id, post_id):
    return social_repositiory.like_post(user_id=user_id, post_id=post_id)
    

def unlike_post(*, user_id, post_id):
    return social_repositiory.unlike_post(user_id=user_id, post_id=post_id)
    
    
def follow_user(*, from_user_id, to_user_id):
    return social_repositiory.follow_user(
        from_user_id=from_user_id, 
        to_user_id=to_user_id
    )
    

def unfollow_user(*, from_user_id, to_user_id):
    return social_repositiory.unfollow_user(
        from_user_id=from_user_id, 
        to_user_id=to_user_id
    )