from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    API endpoint to list audit logs with filtering and search capabilities.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['model_name', 'action', 'performed_by', 'timestamp']
    search_fields = ['model_name', 'record_number', 'performed_by__username']
    ordering_fields = ['timestamp', 'model_name', 'action']
    ordering = ['-timestamp']


class AuditLogDetailView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve a specific audit log entry.
    """
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
