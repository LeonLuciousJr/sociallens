from pathlib import Path
import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q

def post_media_upload_to(instance, filename):
    # Use an opaque name rather than trusting the user's filename.
    extension = Path(filename).suffix.lower()
    return (
        f"posts/{instance.author_id}/{instance.pk}/"
        f"{uuid.uuid4().hex}{extension}"
    )
    
class MediaType(models.TextChoices):
    TEXT = "TEXT"
    IMAGE = "IMAGE"

class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    authorId = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    media_type = models.CharField(max_length=5, choices=MediaType.choices)
    caption = models.CharField(max_length=500, blank=True, default="")
    media = models.ImageField(
        upload_to=post_media_upload_to,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(media_type__in=MediaType.values),
                name="post_media_type_valid",
            ),
        ]
        ordering = ["-created_at"]
