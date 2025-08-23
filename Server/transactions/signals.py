from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Payment, Invoice, RouteLocationPing
import json


@receiver(post_save, sender=Payment)
def update_invoice_on_payment_save(sender, instance, created, **kwargs):
    """Update invoice status whenever a payment is saved (created or updated)"""
    try:
        invoice = instance.invoice
        invoice.refresh_from_db()
        invoice.update_payment_status()
        
        print(f"Signal: Updated invoice {invoice.invoice_no} after payment {'creation' if created else 'update'}")
    except Exception as e:
        print(f"Error updating invoice after payment save: {e}")


@receiver(post_delete, sender=Payment)
def update_invoice_on_payment_delete(sender, instance, **kwargs):
    """Update invoice status whenever a payment is deleted"""
    try:
        invoice = instance.invoice
        invoice.update_payment_status()
        
        print(f"Signal: Updated invoice {invoice.invoice_no} after payment deletion")
    except Exception as e:
        print(f"Error updating invoice after payment delete: {e}")


@receiver(post_save, sender=RouteLocationPing)
def broadcast_gps_ping(sender, instance, created, **kwargs):
    """Broadcast new GPS ping to WebSocket clients"""
    if created:
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                route_group_name = f'route_{instance.route_id}'
                
                # Serialize the ping data
                from .serializers import RouteLocationPingSerializer
                ping_data = RouteLocationPingSerializer(instance).data
                
                # Send to route group
                async_to_sync(channel_layer.group_send)(
                    route_group_name,
                    {
                        'type': 'gps_ping_update',
                        'ping': ping_data
                    }
                )
                
                print(f"Broadcasted GPS ping for route {instance.route_id}")
        except Exception as e:
            print(f"Error broadcasting GPS ping: {e}")
