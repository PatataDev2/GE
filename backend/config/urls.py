"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path , include
from django.conf import settings
from django.conf.urls.static import static
from users.views import AdminDashboardView
from notifications.views import ActivityLogViewSet
from rest_framework.routers import DefaultRouter
from . import backup_views


router = DefaultRouter()
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/',include('users.urls')),
    path('departments/', include('departments.urls')),
    path('api/document-types/', include('document_types.urls')),
    path('api/expedients/', include('expedients.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/notifications/', include('notifications.urls')),
    # path('api/users/', include('users.urls')),  # Duplicate — users/ is the canonical prefix
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/backups/', backup_views.backup_list, name='backup-list'),
    path('api/admin/backups/<str:filename>/', backup_views.backup_detail, name='backup-detail'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)