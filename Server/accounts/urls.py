from django.urls import path
from .views import RegisterView, LoginView, SalesPersonListView, UserBlockAndUnblock, UserListView, UserProfileView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('salespersons/', SalesPersonListView.as_view(), name='salesperson_list'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/block-unblock/', UserBlockAndUnblock.as_view(), name='user_block_unblock'),
    path('user/profile/', UserProfileView.as_view(), name='user-profile'),

]
