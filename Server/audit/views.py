from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    """
    API endpoint to list audit logs with filtering and search capabilities.
    Only shows audit logs from users in the same company as the current user.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['model_name', 'action', 'performed_by', 'timestamp']
    search_fields = ['model_name', 'record_number', 'performed_by__username']
    ordering_fields = ['timestamp', 'model_name', 'action']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """
        Filter audit logs to only show logs from users in the same company.
        """
        user = self.request.user
        if hasattr(user, 'company') and user.company:
            return AuditLog.objects.filter(
                performed_by__company=user.company
            )
        else:
            # If user has no company, return empty queryset
            return AuditLog.objects.none()


class AuditLogDetailView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve a specific audit log entry.
    Only allows access to audit logs from users in the same company.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter audit logs to only show logs from users in the same company.
        """
        user = self.request.user
        if hasattr(user, 'company') and user.company:
            return AuditLog.objects.filter(
                performed_by__company=user.company
            )
        else:
            # If user has no company, return empty queryset
            return AuditLog.objects.none()


class AuditStatisticsView(APIView):
    """
    API endpoint to get audit statistics.
    Only shows statistics for audit logs from users in the same company.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Filter by company
        user = request.user
        if hasattr(user, 'company') and user.company:
            base_queryset = AuditLog.objects.filter(
                performed_by__company=user.company,
                timestamp__gte=start_date
            )
        else:
            base_queryset = AuditLog.objects.none()
        
        # Get basic statistics
        total_logs = base_queryset.count()
        
        # Action statistics
        action_stats = base_queryset.values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Model statistics
        model_stats = base_queryset.values('model_name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # User statistics
        user_stats = base_queryset.filter(
            performed_by__isnull=False
        ).values('performed_by__username').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Daily statistics for the last 7 days
        daily_stats = []
        for i in range(7):
            date = timezone.now().date() - timedelta(days=i)
            if hasattr(user, 'company') and user.company:
                count = AuditLog.objects.filter(
                    performed_by__company=user.company,
                    timestamp__date=date
                ).count()
            else:
                count = 0
            daily_stats.append({
                'date': date.isoformat(),
                'count': count
            })
        
        return Response({
            'total_logs': total_logs,
            'action_stats': list(action_stats),
            'model_stats': list(model_stats),
            'user_stats': list(user_stats),
            'daily_stats': daily_stats,
            'period_days': days
        })


class AuditDashboardView(APIView):
    """
    API endpoint to get audit dashboard data.
    Only shows data for audit logs from users in the same company.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        
        # Filter by company
        user = request.user
        if hasattr(user, 'company') and user.company:
            base_queryset = AuditLog.objects.filter(performed_by__company=user.company)
        else:
            base_queryset = AuditLog.objects.none()
        
        # Today's logs
        today_logs = base_queryset.filter(timestamp__date=today).count()
        
        # Yesterday's logs
        yesterday_logs = base_queryset.filter(timestamp__date=yesterday).count()
        
        # This week's logs
        week_logs = base_queryset.filter(timestamp__date__gte=week_ago).count()
        
        # Recent activity (last 10 logs)
        recent_logs = base_queryset.select_related('performed_by').order_by('-timestamp')[:10]
        recent_activity = []
        for log in recent_logs:
            recent_activity.append({
                'id': log.id,
                'action': log.action,
                'model_name': log.model_name,
                'record_number': log.record_number,
                'performed_by': log.performed_by.username if log.performed_by else 'System',
                'timestamp': log.timestamp.isoformat()
            })
        
        # Top active users
        top_users = base_queryset.filter(
            timestamp__date__gte=week_ago,
            performed_by__isnull=False
        ).values('performed_by__username').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        return Response({
            'today_logs': today_logs,
            'yesterday_logs': yesterday_logs,
            'week_logs': week_logs,
            'recent_activity': recent_activity,
            'top_users': list(top_users)
        })


class AuditExportView(APIView):
    """
    API endpoint to export audit logs.
    Only exports audit logs from users in the same company.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Filter by company first
        user = request.user
        if hasattr(user, 'company') and user.company:
            queryset = AuditLog.objects.filter(performed_by__company=user.company)
        else:
            queryset = AuditLog.objects.none()
        
        # Apply additional filters
        if 'model_name' in request.query_params:
            queryset = queryset.filter(model_name=request.query_params['model_name'])
        if 'action' in request.query_params:
            queryset = queryset.filter(action=request.query_params['action'])
        if 'date_from' in request.query_params:
            queryset = queryset.filter(timestamp__date__gte=request.query_params['date_from'])
        if 'date_to' in request.query_params:
            queryset = queryset.filter(timestamp__date__lte=request.query_params['date_to'])
        
        # Serialize the data
        serializer = AuditLogSerializer(queryset, many=True)
        
        return Response({
            'logs': serializer.data,
            'count': queryset.count(),
            'exported_at': timezone.now().isoformat()
        })
