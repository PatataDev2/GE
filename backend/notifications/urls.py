from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ActivityLogViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('', include(router.urls)),
]
