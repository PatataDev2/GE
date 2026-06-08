from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DocumentViewSet

router = DefaultRouter()
router.register(r'', DocumentViewSet) # Ruta base: api/documents/

urlpatterns = [
    path('', include(router.urls)),
]
