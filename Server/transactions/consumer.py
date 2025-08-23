import json
import asyncio
from datetime import datetime, timedelta
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Route, RouteLocationPing
from .serializers import RouteLocationPingSerializer


class RouteTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.route_id = self.scope['url_route']['kwargs']['route_id']
        self.route_group_name = f'route_{self.route_id}'
        self.user = self.scope.get('user', AnonymousUser())
        
        # Verify user has access to this route
        if not await self.has_route_access():
            await self.close(code=4003)
            return
        
        # Join route group
        await self.channel_layer.group_add(
            self.route_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_status',
            'status': 'connected',
            'route_id': self.route_id,
            'message': 'WebSocket connection established'
        }))
        
        # Send initial route data
        await self.send_initial_data()

    async def disconnect(self, close_code):
        # Leave route group
        await self.channel_layer.group_discard(
            self.route_group_name,
            self.channel_name
        )
        print(f"WebSocket disconnected for route {self.route_id}, code: {close_code}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'request_summary':
                await self.send_route_summary()
            elif message_type == 'request_pings':
                await self.send_recent_pings()
            elif message_type == 'ping':
                # Keep connection alive
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON data'
            }))

    @database_sync_to_async
    def has_route_access(self):
        """Check if user has access to this route"""
        try:
            route = Route.objects.get(id=self.route_id)
            if hasattr(self.user, 'role'):
                if self.user.role == 'admin':
                    return True
                elif self.user.role == 'salesperson':
                    return route.salesperson == self.user
            return False
        except Route.DoesNotExist:
            return False

    @database_sync_to_async
    def get_recent_pings(self, limit=50):
        """Get recent GPS pings for the route"""
        try:
            pings = RouteLocationPing.objects.filter(
                route_id=self.route_id
            ).order_by('-created_at')[:limit]
            return RouteLocationPingSerializer(pings, many=True).data
        except Exception as e:
            print(f"Error getting recent pings: {e}")
            return []

    @database_sync_to_async
    def get_route_summary(self):
        """Get route summary data"""
        try:
            # Import here to avoid circular imports
            from .views import RouteLocationPingViewSet
            viewset = RouteLocationPingViewSet()
            
            # This would need to be adapted to work async
            # For now, we'll return a simple summary
            pings_count = RouteLocationPing.objects.filter(route_id=self.route_id).count()
            return {
                'ping_count': pings_count,
                'last_updated': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting route summary: {e}")
            return None

    async def send_initial_data(self):
        """Send initial route data to client"""
        pings = await self.get_recent_pings()
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'pings': pings,
            'timestamp': datetime.now().isoformat()
        }))

    async def send_route_summary(self):
        """Send route summary to client"""
        summary = await self.get_route_summary()
        if summary:
            await self.send(text_data=json.dumps({
                'type': 'route_summary',
                'summary': summary,
                'timestamp': datetime.now().isoformat()
            }))

    async def send_recent_pings(self):
        """Send recent GPS pings to client"""
        pings = await self.get_recent_pings()
        await self.send(text_data=json.dumps({
            'type': 'recent_pings',
            'pings': pings,
            'timestamp': datetime.now().isoformat()
        }))

    # Handlers for group messages
    async def gps_ping_update(self, event):
        """Handle GPS ping updates from group"""
        await self.send(text_data=json.dumps({
            'type': 'gps_ping',
            'ping': event['ping'],
            'timestamp': datetime.now().isoformat()
        }))

    async def route_summary_update(self, event):
        """Handle route summary updates from group"""
        await self.send(text_data=json.dumps({
            'type': 'route_summary',
            'summary': event['summary'],
            'optimization': event.get('optimization'),
            'timestamp': datetime.now().isoformat()
        }))

    async def tracking_status_update(self, event):
        """Handle tracking status updates from group"""
        await self.send(text_data=json.dumps({
            'type': 'tracking_status',
            'status': event['status'],
            'message': event['message'],
            'timestamp': datetime.now().isoformat()
        }))

    async def error_message(self, event):
        """Handle error messages from group"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': event['message'],
            'timestamp': datetime.now().isoformat()
        }))
