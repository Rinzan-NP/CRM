# CRM Backend API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### 1.1 User Registration
**POST** `/accounts/register/`

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123",
    "role": "salesperson"
}
```

**Response:**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "role": "salesperson"
}
```

**Roles:** `admin`, `salesperson`, `accountant`

### 1.2 User Login
**POST** `/accounts/login/`

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "refresh": "refresh_token",
    "access": "access_token",
    "user": {
        "email": "user@example.com",
        "role": "salesperson"
    }
}
```

### 1.3 Token Refresh
**POST** `/accounts/refresh/`

**Request Body:**
```json
{
    "refresh": "refresh_token"
}
```

**Response:**
```json
{
    "access": "new_access_token"
}
```

---

## 2. Customer Management

### 2.1 List Customers
**GET** `/main/customers/`

**Response:**
```json
[
    {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main St",
        "credit_limit": "1000.00",
        "current_balance": "250.00",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]
```

### 2.2 Create Customer
**POST** `/main/customers/`

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "credit_limit": "1000.00"
}
```

### 2.3 Get Customer
**GET** `/main/customers/{id}/`

### 2.4 Update Customer
**PUT** `/main/customers/{id}/`

### 2.5 Delete Customer
**DELETE** `/main/customers/{id}/`

---

## 3. Supplier Management

### 3.1 List Suppliers
**GET** `/main/suppliers/`

**Response:**
```json
[
    {
        "id": "uuid",
        "name": "ABC Supplies",
        "email": "contact@abcsupplies.com",
        "phone": "+1234567890",
        "address": "456 Business Ave",
        "credit_limit": "5000.00",
        "current_balance": "1200.00",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]
```

### 3.2 Create Supplier
**POST** `/main/suppliers/`

**Request Body:**
```json
{
    "name": "ABC Supplies",
    "email": "contact@abcsupplies.com",
    "phone": "+1234567890",
    "address": "456 Business Ave",
    "credit_limit": "5000.00"
}
```

### 3.3 Get Supplier
**GET** `/main/suppliers/{id}/`

### 3.4 Update Supplier
**PUT** `/main/suppliers/{id}/`

### 3.5 Delete Supplier
**DELETE** `/main/suppliers/{id}/`

---

## 4. Product Management

### 4.1 List Products
**GET** `/main/products/`

**Response:**
```json
[
    {
        "id": "uuid",
        "code": "PROD001",
        "name": "Product Name",
        "unit_price": "100.00",
        "unit_cost": "60.00",
        "vat_category": "uuid",
        "vat_rate": "5.00",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
]
```

### 4.2 Create Product
**POST** `/main/products/`

**Request Body:**
```json
{
    "code": "PROD001",
    "name": "Product Name",
    "unit_price": "100.00",
    "unit_cost": "60.00",
    "vat_category": "uuid",
    "is_active": true
}
```

### 4.3 Get Product
**GET** `/main/products/{id}/`

### 4.4 Update Product
**PUT** `/main/products/{id}/`

### 4.5 Delete Product
**DELETE** `/main/products/{id}/`

---

## 5. VAT Settings

### 5.1 List VAT Categories
**GET** `/main/vat-settings/`

**Response:**
```json
[
    {
        "id": "uuid",
        "category": "Standard",
        "rate": "5.00"
    }
]
```

### 5.2 Create VAT Category
**POST** `/main/vat-settings/`

**Request Body:**
```json
{
    "category": "Standard",
    "rate": "5.00"
}
```

### 5.3 Get VAT Category
**GET** `/main/vat-settings/{id}/`

### 5.4 Update VAT Category
**PUT** `/main/vat-settings/{id}/`

### 5.5 Delete VAT Category
**DELETE** `/main/vat-settings/{id}/`

---

## 6. Sales Orders

### 6.1 List Sales Orders
**GET** `/transactions/sales-orders/`

**Response:**
```json
[
    {
        "id": "uuid",
        "order_number": "SO-20240101-001",
        "customer": "uuid",
        "salesperson": "uuid",
        "order_date": "2024-01-01",
        "status": "confirmed",
        "subtotal": "1000.00",
        "vat_total": "50.00",
        "grand_total": "1050.00",
        "profit": "400.00",
        "prices_include_vat": false,
        "line_items": [
            {
                "product_id": "uuid",
                "quantity": 2,
                "unit_price": "500.00",
                "discount": "0.00",
                "line_total": "1000.00",
                "product": {
                    "id": "uuid",
                    "code": "PROD001",
                    "name": "Product Name"
                }
            }
        ]
    }
]
```

### 6.2 Create Sales Order
**POST** `/transactions/sales-orders/`

**Request Body:**
```json
{
    "customer": "uuid",
    "order_date": "2024-01-01",
    "status": "draft",
    "prices_include_vat": false,
    "line_items": [
        {
            "product_id": "uuid",
            "quantity": 2,
            "unit_price": "500.00",
            "discount": "0.00"
        }
    ]
}
```

### 6.3 Get Sales Order
**GET** `/transactions/sales-orders/{id}/`

### 6.4 Update Sales Order
**PUT** `/transactions/sales-orders/{id}/`

### 6.5 Delete Sales Order
**DELETE** `/transactions/sales-orders/{id}/`

### 6.6 Get Sales Order Profit
**GET** `/transactions/sales-orders/{id}/profit/`

**Response:**
```json
{
    "profit": "400.00"
}
```

---

## 7. Purchase Orders

### 7.1 List Purchase Orders
**GET** `/transactions/purchase-orders/`

**Response:**
```json
[
    {
        "id": "uuid",
        "order_number": "PO-20240101-001",
        "supplier": "uuid",
        "order_date": "2024-01-01",
        "status": "confirmed",
        "subtotal": "800.00",
        "vat_total": "40.00",
        "grand_total": "840.00",
        "prices_include_vat": false,
        "line_items": [
            {
                "id": "uuid",
                "product": {
                    "id": "uuid",
                    "code": "PROD001",
                    "name": "Product Name"
                },
                "product_id": "uuid",
                "quantity": 2,
                "unit_cost": "400.00",
                "discount": "0.00",
                "line_total": "800.00"
            }
        ]
    }
]
```

### 7.2 Create Purchase Order
**POST** `/transactions/purchase-orders/`

**Request Body:**
```json
{
    "supplier": "uuid",
    "order_date": "2024-01-01",
    "status": "draft",
    "prices_include_vat": false,
    "line_items": [
        {
            "product_id": "uuid",
            "quantity": 2,
            "unit_cost": "400.00",
            "discount": "0.00"
        }
    ]
}
```

### 7.3 Get Purchase Order
**GET** `/transactions/purchase-orders/{id}/`

### 7.4 Update Purchase Order
**PUT** `/transactions/purchase-orders/{id}/`

### 7.5 Delete Purchase Order
**DELETE** `/transactions/purchase-orders/{id}/`

---

## 8. Invoices

### 8.1 List Invoices
**GET** `/transactions/invoices/`

**Response:**
```json
[
    {
        "id": "uuid",
        "sales_order": "uuid",
        "invoice_no": "INV-20240101-001",
        "issue_date": "2024-01-01",
        "due_date": "2024-01-31",
        "amount_due": "1050.00",
        "paid_amount": "500.00",
        "outstanding": "550.00",
        "status": "sent",
        "payments": [
            {
                "id": "uuid",
                "invoice": "uuid",
                "amount": "500.00",
                "paid_on": "2024-01-15",
                "mode": "bank"
            }
        ]
    }
]
```

### 8.2 Create Invoice
**POST** `/transactions/invoices/`

**Request Body:**
```json
{
    "sales_order": "uuid",
    "issue_date": "2024-01-01",
    "due_date": "2024-01-31"
}
```

### 8.3 Get Invoice
**GET** `/transactions/invoices/{id}/`

### 8.4 Update Invoice
**PUT** `/transactions/invoices/{id}/`

### 8.5 Delete Invoice
**DELETE** `/transactions/invoices/{id}/`

---

## 9. Payments

### 9.1 List Payments
**GET** `/transactions/payments/`

**Response:**
```json
[
    {
        "id": "uuid",
        "invoice": "uuid",
        "amount": "500.00",
        "paid_on": "2024-01-15",
        "mode": "bank"
    }
]
```

### 9.2 Create Payment
**POST** `/transactions/payments/`

**Request Body:**
```json
{
    "invoice": "uuid",
    "amount": "500.00",
    "paid_on": "2024-01-15",
    "mode": "bank"
}
```

**Payment Modes:** `cash`, `bank`

### 9.3 Get Payment
**GET** `/transactions/payments/{id}/`

### 9.4 Update Payment
**PUT** `/transactions/payments/{id}/`

### 9.5 Delete Payment
**DELETE** `/transactions/payments/{id}/`

---

## 10. Routes

### 10.1 List Routes
**GET** `/transactions/routes/`

**Response:**
```json
[
    {
        "id": "uuid",
        "salesperson": "uuid",
        "name": "Downtown Route",
        "date": "2024-01-01",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "visits": [
            {
                "id": "uuid",
                "route": "uuid",
                "customer": "uuid",
                "check_in": "2024-01-01T10:00:00Z",
                "check_out": "2024-01-01T11:00:00Z",
                "lat": "25.2048",
                "lon": "55.2708",
                "status": "visited"
            }
        ]
    }
]
```

### 10.2 Create Route
**POST** `/transactions/routes/`

**Request Body:**
```json
{
    "name": "Downtown Route",
    "date": "2024-01-01",
    "start_time": "09:00:00",
    "end_time": "17:00:00"
}
```

### 10.3 Get Route
**GET** `/transactions/routes/{id}/`

### 10.4 Update Route
**PUT** `/transactions/routes/{id}/`

### 10.5 Delete Route
**DELETE** `/transactions/routes/{id}/`

### 10.6 Get Route Visits
**GET** `/transactions/routes/{id}/visits/`

---

## 11. Route Visits

### 11.1 List Route Visits
**GET** `/transactions/routevisits/`

**Response:**
```json
[
    {
        "id": "uuid",
        "route": "uuid",
        "customer": "uuid",
        "check_in": "2024-01-01T10:00:00Z",
        "check_out": "2024-01-01T11:00:00Z",
        "lat": "25.2048",
        "lon": "55.2708",
        "status": "visited"
    }
]
```

### 11.2 Create Route Visit
**POST** `/transactions/routevisits/`

**Request Body:**
```json
{
    "route": "uuid",
    "customer": "uuid",
    "check_in": "2024-01-01T10:00:00Z",
    "check_out": "2024-01-01T11:00:00Z",
    "lat": "25.2048",
    "lon": "55.2708",
    "status": "visited"
}
```

**Status Options:** `planned`, `visited`, `missed`

### 11.3 Get Route Visit
**GET** `/transactions/routevisits/{id}/`

### 11.4 Update Route Visit
**PUT** `/transactions/routevisits/{id}/`

### 11.5 Delete Route Visit
**DELETE** `/transactions/routevisits/{id}/`

---

## 12. Route Location Pings

### 12.1 List Location Pings
**GET** `/transactions/route-location-pings/`

**Query Parameters:**
- `route`: Filter by route ID

**Response:**
```json
[
    {
        "id": "uuid",
        "route": "uuid",
        "visit": "uuid",
        "lat": "25.2048",
        "lon": "55.2708",
        "accuracy_meters": "5.00",
        "speed_mps": "10.00",
        "heading_degrees": "180.00",
        "created_at": "2024-01-01T10:00:00Z"
    }
]
```

### 12.2 Create Location Ping
**POST** `/transactions/route-location-pings/`

**Request Body:**
```json
{
    "route": "uuid",
    "visit": "uuid",
    "lat": "25.2048",
    "lon": "55.2708",
    "accuracy_meters": "5.00",
    "speed_mps": "10.00",
    "heading_degrees": "180.00"
}
```

### 12.3 Get Location Ping
**GET** `/transactions/route-location-pings/{id}/`

### 12.4 Update Location Ping
**PUT** `/transactions/route-location-pings/{id}/`

### 12.5 Delete Location Ping
**DELETE** `/transactions/route-location-pings/{id}/`

---

## 13. Reports

### 13.1 VAT Report
**GET** `/transactions/vat-report/?start=2024-01-01&end=2024-01-31`

**Response:**
```json
{
    "period_start": "2024-01-01",
    "period_end": "2024-01-31",
    "standard_sales": "10000.00",
    "standard_vat": "500.00",
    "zero_sales": "2000.00",
    "zero_vat": "0.00",
    "exempt_sales": "1000.00",
    "exempt_vat": "0.00"
}
```

### 13.2 Sales vs Purchase Report
**GET** `/transactions/reports/sales-vs-purchase/?start=2024-01-01&end=2024-01-31`

**Response:**
```json
{
    "period": {
        "start": "2024-01-01",
        "end": "2024-01-31"
    },
    "sales": {
        "total_sales": "15000.00",
        "total_profit": "3000.00",
        "order_count": 25
    },
    "purchases": {
        "total_purchases": "8000.00",
        "order_count": 15
    },
    "net_profit": "7000.00"
}
```

### 13.3 Route Efficiency Report
**GET** `/transactions/reports/route-efficiency/?start=2024-01-01&end=2024-01-31`

**Response:**
```json
[
    {
        "route_id": "uuid",
        "route_name": "Downtown Route",
        "salesperson": "salesperson@example.com",
        "date": "2024-01-01",
        "total_planned": 10,
        "completed": 8,
        "completion_rate": 80.0,
        "missed": 2
    }
]
```

### 13.4 Outstanding Payments Report
**GET** `/transactions/reports/outstanding-payments/`

**Response:**
```json
[
    {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "total_outstanding": "1500.00",
        "invoice_count": 3
    }
]
```

---

## 14. Audit Logs

### 14.1 List Audit Logs
**GET** `/audit/logs/`

**Response:**
```json
[
    {
        "id": "uuid",
        "user": "uuid",
        "action": "CREATE",
        "model_name": "SalesOrder",
        "object_id": "uuid",
        "timestamp": "2024-01-01T10:00:00Z",
        "changes": {
            "order_number": "SO-20240101-001",
            "customer": "uuid"
        }
    }
]
```

**Actions:** `CREATE`, `UPDATE`, `DELETE`

---

## Error Responses

### 400 Bad Request
```json
{
    "detail": "Invalid data provided",
    "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided"
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
    "detail": "Not found"
}
```

### 500 Internal Server Error
```json
{
    "detail": "Internal server error"
}
```

---

## Role-Based Access Control

### Admin
- Full access to all endpoints
- Can view all audit logs
- Can manage all users

### Salesperson
- Can only view their own sales orders, routes, and visits
- Cannot create/update purchase orders, invoices, or payments
- Can view their own audit logs

### Accountant
- Can manage financial transactions (invoices, payments, purchase orders)
- Cannot manage routes or visits
- Can view all financial data

---

## Rate Limiting
- 1000 requests per hour per user
- 100 requests per minute per user

## Pagination
List endpoints support pagination with query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:**
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/endpoint/?page=2",
    "previous": null,
    "results": [...]
}
```

---

## WebSocket Endpoints (Real-time Features)

### Route Live Tracking
**WebSocket URL:** `ws://localhost:8000/ws/route-tracking/`

**Message Format:**
```json
{
    "type": "location_update",
    "route_id": "uuid",
    "lat": "25.2048",
    "lon": "55.2708",
    "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## Development Notes

### Environment Variables
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/dbname
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Running the Server
```bash
python manage.py runserver
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Superuser
```bash
python manage.py createsuperuser
```
