from django.core.management.base import BaseCommand
from transactions.models import Route
from accounts.models import User

class Command(BaseCommand):
    help = 'Check routes and their salesperson assignments'

    def handle(self, *args, **options):
        routes = Route.objects.all()
        
        self.stdout.write(f"Total routes: {routes.count()}")
        
        routes_with_salesperson = routes.filter(salesperson__isnull=False)
        routes_without_salesperson = routes.filter(salesperson__isnull=True)
        
        self.stdout.write(f"Routes with salesperson: {routes_with_salesperson.count()}")
        self.stdout.write(f"Routes without salesperson: {routes_without_salesperson.count()}")
        
        if routes_without_salesperson.exists():
            self.stdout.write("\nRoutes without salesperson:")
            for route in routes_without_salesperson:
                self.stdout.write(f"  - Route {route.id}: {route.name} ({route.date})")
        
        self.stdout.write("\nSample routes with salesperson:")
        for route in routes_with_salesperson[:5]:
            self.stdout.write(f"  - Route {route.id}: {route.name} - Salesperson: {route.salesperson.email if route.salesperson else 'None'}")
        
        # Check if there are any users with salesperson role
        salespersons = User.objects.filter(role='salesperson')
        self.stdout.write(f"\nTotal salespersons: {salespersons.count()}")
        
        if salespersons.exists():
            self.stdout.write("Available salespersons:")
            for sp in salespersons:
                self.stdout.write(f"  - {sp.email} (ID: {sp.id})")
