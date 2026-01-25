from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserView, RegisterView, Custom_token_obtain_pair_view, CurrentUserView 
from rest_framework_simplejwt.views import TokenRefreshView



router = DefaultRouter()

router.register(r'users', UserView, basename='user')


urlpatterns = [
    # Define your user-related URLs here

    path('api/v1/',include(router.urls)),
    path('api/v1/register/', RegisterView.as_view(), name = 'register'),
    path('api/v1/login/', Custom_token_obtain_pair_view.as_view(), name = 'login'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), 
    path('api/v1/me/', CurrentUserView.as_view(), name='current-user'),  # Nueva ruta
     ]    