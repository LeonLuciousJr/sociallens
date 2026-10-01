from app.models import UploadedImage


def create_uploaded_image(*, image):
    return UploadedImage.objects.create(image=image)