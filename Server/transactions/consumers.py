import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Route, RouteLocationPing


class RouteTrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.route_id = self.scope['url_route']['kwargs']['route_id']
        self.user = self.scope['user']
        
        # Check if user is authenticated
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return
        
        # Verify user has access to this route
        if not await self.can_access_route():
            await self.close()
            return
        
        # Join the route-specific group
        self.room_group_name = f'route_tracking_{self.route_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to route {self.route_id} tracking'
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'location_update':
                await self.handle_location_update(data)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def handle_location_update(self, data):
        """Handle GPS location updates"""
        try:
            # Save location ping to database
            ping_data = await self.save_location_ping(data)
            
            # Broadcast to all connected clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'location_broadcast',
                    'data': ping_data
                }
            )
            
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to process location update: {str(e)}'
            }))

    async def location_broadcast(self, event):
        """Send location update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'data': event['data']
        }))

    @database_sync_to_async
    def can_access_route(self):
        """Check if user has access to this route"""
        try:
            route = Route.objects.get(id=self.route_id)
            
            # Admin can access all routes
            if hasattr(self.user, 'role') and self.user.role == 'admin':
                return True
            
            # Salesperson can only access their own routes
            if hasattr(self.user, 'role') and self.user.role == 'salesperson':
                return route.salesperson == self.user
            
            return False
        except Route.DoesNotExist:
            return False

    @database_sync_to_async
    def save_location_ping(self, data):
        """Save location ping to database"""
        try:
            route = Route.objects.get(id=self.route_id)
            
            ping = RouteLocationPing.objects.create(
                route=route,
                lat=data.get('lat'),
                lon=data.get('lon'),
                accuracy_meters=data.get('accuracy_meters'),
                speed_mps=data.get('speed_mps'),
                heading_degrees=data.get('heading_degrees')
            )
            
            return {
                'id': str(ping.id),
                'lat': float(ping.lat),
                'lon': float(ping.lon),
                'accuracy_meters': float(ping.accuracy_meters) if ping.accuracy_meters else None,
                'speed_mps': float(ping.speed_mps) if ping.speed_mps else None,
                'heading_degrees': float(ping.heading_degrees) if ping.heading_degrees else None,
                'created_at': ping.created_at.isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to save location ping: {str(e)}")
