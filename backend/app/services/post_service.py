from app.repositories import post_repository


def publish_post(*, author_id, title, body, media_type, media=None, caption=""):
    return post_repository.create_post(
        authorId=author_id,
        title=title, 
        body=body, 
        media_type=media_type, 
        media=media, 
        caption=caption,
    )
    

def list_posts():
    return post_repository.list_posts()