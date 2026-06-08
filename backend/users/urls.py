from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminCreateFuncionarioView,
    AdminResetPasswordView,
    AdminToggleActivoView,
    AdminUpdateFuncionarioView,
    ChangePasswordView,
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CurrentUserView,
    Custom_token_obtain_pair_view,
    LogoutView,
    RegisterView,
    UserView,
)

router = DefaultRouter()
router.register(r'', UserView, basename='user')

urlpatterns = [
    path('api/v1/register/', RegisterView.as_view(), name='register'),
    path('api/v1/me/', CurrentUserView.as_view(), name='current-user'),
    path('api/v1/login/', Custom_token_obtain_pair_view.as_view(), name='login'),
    path('api/v1/login/cookie/', CookieTokenObtainPairView.as_view(), name='login-cookie'),
    path('api/v1/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/logout/', LogoutView.as_view(), name='logout'),
    path('api/v1/admin/create-funcionario/', AdminCreateFuncionarioView.as_view(), name='admin-create-funcionario'),
    path('api/v1/admin/update-funcionario/<int:pk>/', AdminUpdateFuncionarioView.as_view(), name='admin-update-funcionario'),
    path('api/v1/admin/toggle-activo/<int:pk>/', AdminToggleActivoView.as_view(), name='admin-toggle-activo'),
    path('api/v1/admin/reset-password/<int:pk>/', AdminResetPasswordView.as_view(), name='admin-reset-password'),
    path('api/v1/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/v1/', include(router.urls)),
]
