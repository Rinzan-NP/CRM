"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Initialize Django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from transactions.routing import websocket_urlpatterns
from transactions.middleware import WebSocketAuthMiddleware

# Debug: Print the WebSocket URL patterns
print("WebSocket URL patterns:", websocket_urlpatterns)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": WebSocketAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
