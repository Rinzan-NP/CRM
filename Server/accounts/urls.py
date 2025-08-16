from django.urls import path
from .views import RegisterView, LoginView, SalesPersonListView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('salespersons/', SalesPersonListView.as_view(), name='salesperson_list'),
]
