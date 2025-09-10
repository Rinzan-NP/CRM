from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/route-tracking/(?P<route_id>[^/]+)/$', consumers.RouteTrackingConsumer.as_asgi()),
]
