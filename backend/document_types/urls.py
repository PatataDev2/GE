from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DocumentTypeViewSet

router = DefaultRouter()
router.register(r'', DocumentTypeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
