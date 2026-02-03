from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpedienteViewSet, DocumentoViewSet

router = DefaultRouter()
router.register(r'', ExpedienteViewSet, basename='expediente')
router.register(r'documentos', DocumentoViewSet, basename='documento')

urlpatterns = [
    path('api/v1/', include(router.urls)),
]