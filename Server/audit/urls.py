from django.urls import path
from . import views

app_name = 'audit'

urlpatterns = [
    path('logs/', views.AuditLogListView.as_view(), name='audit_logs'),
    path('logs/<int:pk>/', views.AuditLogDetailView.as_view(), name='audit_log_detail'),
]

