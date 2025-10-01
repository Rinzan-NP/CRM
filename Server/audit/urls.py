from django.urls import path
from . import views

app_name = 'audit'

urlpatterns = [
    path('logs/', views.AuditLogListView.as_view(), name='audit_logs'),
    path('logs/<int:pk>/', views.AuditLogDetailView.as_view(), name='audit_log_detail'),
    path('statistics/', views.AuditStatisticsView.as_view(), name='audit_statistics'),
    path('dashboard/', views.AuditDashboardView.as_view(), name='audit_dashboard'),
    path('export/', views.AuditExportView.as_view(), name='audit_export'),
]

