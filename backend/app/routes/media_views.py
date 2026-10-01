from rest_framework import serializers
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from app.models import UploadedImage
from app.services.media_service import upload_image

class ImageUploadSerializer(serializers.Serializer):
    file = serializers.ImageField()


class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uploaded_image = upload_image(
            image=serializer.validated_data["file"],
        )

        return Response(
            {
                "mediaId": uploaded_image.pk,
                "url": request.build_absolute_uri(uploaded_image.image.url),
            },
            status=status.HTTP_201_CREATED,
        )