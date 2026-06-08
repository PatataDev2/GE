from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ExpedientViewSet

router = DefaultRouter()
router.register(r'', ExpedientViewSet) # La ruta será /api/expedients/

urlpatterns = [
    path('', include(router.urls)),
]
