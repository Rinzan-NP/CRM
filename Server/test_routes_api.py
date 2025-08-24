import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transactions.models import Route
from transactions.serializers import RouteSerializer

# Get all routes
routes = Route.objects.all()
print(f"Total routes: {routes.count()}")

# Test the serializer
serializer = RouteSerializer(routes, many=True)
data = serializer.data

print("\nAPI Response:")
for route in data:
    print(f"Route {route['id']}: {route['name']}")
    print(f"  - salesperson: {route.get('salesperson')}")
    print(f"  - salesperson_name: {route.get('salesperson_name')}")
    print()
