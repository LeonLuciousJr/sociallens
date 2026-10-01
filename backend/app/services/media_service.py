from app.repositories.media_repository import create_uploaded_image


def upload_image(*, image):
    # Add use-case logic here if needed, such as ownership or limits.
    return create_uploaded_image(image=image)