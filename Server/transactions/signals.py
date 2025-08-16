from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Payment, Invoice

@receiver(post_save, sender=Payment)
def update_invoice_on_payment_save(sender, instance, created, **kwargs):
    """Update invoice status whenever a payment is saved (created or updated)"""
    try:
        # Force refresh the invoice to get latest data
        invoice = instance.invoice
        invoice.refresh_from_db()
        
        # Update the invoice payment status
        invoice.update_payment_status()
        
        print(f"Signal: Updated invoice {invoice.invoice_no} after payment {'creation' if created else 'update'}")
    except Exception as e:
        print(f"Error updating invoice after payment save: {e}")

@receiver(post_delete, sender=Payment)
def update_invoice_on_payment_delete(sender, instance, **kwargs):
    """Update invoice status whenever a payment is deleted"""
    try:
        # Get the invoice before the payment is deleted
        invoice = instance.invoice
        
        # Update the invoice payment status
        invoice.update_payment_status()
        
        print(f"Signal: Updated invoice {invoice.invoice_no} after payment deletion")
    except Exception as e:
        print(f"Error updating invoice after payment delete: {e}")
