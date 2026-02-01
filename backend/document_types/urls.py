from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentTypeViewSet

router = DefaultRouter()
router.register(r'', DocumentTypeViewSet, basename='documenttype')

urlpatterns = [
    path('', include(router.urls)),
]