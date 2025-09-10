from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from audit.models import AuditLog
from audit.serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Admins see everything, others see only their own actions
        qs = self.queryset.filter(company=self.request.user.company)
        user = self.request.user
        if getattr(user, 'role', '') == 'admin':
            return qs
        return qs.filter(user=user)