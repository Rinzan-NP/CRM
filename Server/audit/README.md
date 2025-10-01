# Audit System Documentation

## Overview
The audit system automatically tracks all changes to auditable models in the system. It creates audit log entries whenever models are created, updated, or deleted.

## Automatic Audit Logging

### How it works
1. **Signals**: Django signals automatically trigger audit log creation when models are saved or deleted
2. **Middleware**: The `CurrentUserMiddleware` tracks the current user for audit logs
3. **Models**: All models in the `AUDITABLE_MODELS` list are automatically audited

### Auditable Models
The following models are automatically audited:
- Customer
- Supplier
- Product
- SalesOrder
- Invoice
- Payment
- Route
- RouteVisit
- User
- Credit

## Manual Audit Logging

### Basic Usage
```python
from audit.utils import create_audit_log
from audit.signals import audit_user_action, audit_system_action

# Create audit log for user action
create_audit_log(
    model="Customer",
    action="update",
    by=request.user,
    number=customer.customer_code,
    before_data={"name": "Old Name"},
    after_data={"name": "New Name"}
)

# Manual audit logging functions
audit_user_action(
    user=request.user,
    action="block",
    model_name="Customer",
    record_number=customer.customer_code,
    before_data={"status": "active"},
    after_data={"status": "blocked"}
)

# System action audit log
audit_system_action(
    action="create",
    model_name="Report",
    record_number="RPT-001",
    before_data=None,
    after_data={"type": "monthly", "status": "generated"}
)
```

### In Views
```python
from rest_framework import viewsets
from audit.utils import create_audit_log
from audit.signals import audit_user_action

class CustomerViewSet(viewsets.ModelViewSet):
    def perform_create(self, serializer):
        # Get data before save
        before_data = None
        
        # Save the instance
        instance = serializer.save(company=self.request.user.company)
        
        # Create audit log for specific business logic
        create_audit_log(
            model="Customer",
            action="create",
            by=self.request.user,
            number=instance.customer_code,
            before_data=before_data,
            after_data=serializer.data
        )
    
    @action(detail=True, methods=['post'])
    def block_customer(self, request, pk=None):
        customer = self.get_object()
        
        # Store before data
        before_data = {"status": customer.status}
        
        # Perform the action
        customer.status = "blocked"
        customer.save()
        
        # Create audit log
        audit_user_action(
            user=request.user,
            action="block",
            model_name="Customer",
            record_number=customer.customer_code,
            before_data=before_data,
            after_data={"status": "blocked"}
        )
        
        return Response({"status": "Customer blocked"})
```

## Audit Log Structure

### Fields
- `model_name`: Name of the model being audited
- `record_number`: Record identifier (e.g., customer_code, invoice_no)
- `action`: Action performed (create, update, delete, block, unblock, read)
- `performed_by`: User who performed the action
- `before_data`: Data before the change (JSON)
- `after_data`: Data after the change (JSON)
- `timestamp`: When the action was performed

### Actions
- `create`: New record created
- `update`: Existing record modified
- `delete`: Record deleted
- `block`: Record blocked
- `unblock`: Record unblocked
- `read`: Record accessed (for sensitive operations)

## API Endpoints

### List Audit Logs
```
GET /api/audit/logs/
```

Query Parameters:
- `model_name`: Filter by model name
- `action`: Filter by action
- `performed_by`: Filter by user ID
- `timestamp`: Filter by date range
- `search`: Search in model_name, record_number, or username
- `ordering`: Sort by timestamp, model_name, or action

### Get Audit Log Details
```
GET /api/audit/logs/{id}/
```

### Get Statistics
```
GET /api/audit/statistics/
```

Query Parameters:
- `days`: Number of days to include (default: 30)

### Get Dashboard Data
```
GET /api/audit/dashboard/
```

### Export Audit Logs
```
GET /api/audit/export/
```

Query Parameters:
- `model_name`: Filter by model name
- `action`: Filter by action
- `date_from`: Start date
- `date_to`: End date

## Frontend Integration

The frontend audit logs page is available at `/audit/audit-logs` and provides:

- **Table View**: Comprehensive table with all audit logs
- **Card View**: Mobile-friendly card layout
- **Filtering**: Filter by action, model, date range, and search
- **Statistics**: Dashboard with activity statistics
- **Export**: Export audit logs to various formats
- **Real-time Updates**: Automatic refresh of audit logs

## Best Practices

1. **Use Automatic Logging**: Most changes are automatically logged via signals
2. **Manual Logging**: Use manual logging for business-specific actions (block, unblock, special workflows)
3. **Sensitive Data**: Be careful not to log sensitive information like passwords
4. **Performance**: Audit logging is asynchronous and won't slow down your application
5. **Storage**: Consider implementing log rotation for large systems

## Configuration

### Adding New Models
To audit a new model, add it to the `AUDITABLE_MODELS` list in `audit/signals.py`:

```python
AUDITABLE_MODELS = [
    'Customer',
    'Supplier',
    'Product',
    'SalesOrder',
    'Invoice',
    'Payment',
    'Route',
    'RouteVisit',
    'User',
    'Credit',
    'YourNewModel',  # Add here
]
```

### Customizing Record Identifiers
The system automatically detects record identifiers, but you can customize this in the `get_record_identifier` function in `audit/signals.py`.

## Troubleshooting

### Common Issues
1. **Missing Audit Logs**: Ensure the model is in `AUDITABLE_MODELS` list
2. **No User Information**: Check that `CurrentUserMiddleware` is in `MIDDLEWARE` settings
3. **Performance Issues**: Consider implementing audit log cleanup/archiving

### Debug Mode
Set `DEBUG=True` in settings to see audit logging errors in the console.



