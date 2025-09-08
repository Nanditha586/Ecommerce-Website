from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, CartView, RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.views.generic import TemplateView
router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='items')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('cart/', CartView.as_view(), name='cart'),
    path('', include(router.urls)),
    path('', TemplateView.as_view(template_name='shop/index.html'), name='home'),
]
