from django.core.management.base import BaseCommand
from django.db import transaction
from transactions.models import Invoice, Payment
from decimal import Decimal

class Command(BaseCommand):
    help = 'Test the payment system to ensure outstanding amounts are updated correctly'

    def add_arguments(self, parser):
        parser.add_argument(
            '--invoice-id',
            type=int,
            help='Specific invoice ID to test',
        )

    def handle(self, *args, **options):
        self.stdout.write('Testing payment system...')
        
        if options['invoice_id']:
            invoices = Invoice.objects.filter(id=options['invoice_id'])
        else:
            invoices = Invoice.objects.all()[:5]  # Test first 5 invoices
        
        for invoice in invoices:
            self.stdout.write(f'\n--- Testing Invoice {invoice.invoice_no} ---')
            self.stdout.write(f'Amount Due: {invoice.amount_due}')
            self.stdout.write(f'Current Paid Amount: {invoice.paid_amount}')
            self.stdout.write(f'Current Outstanding: {invoice.outstanding}')
            self.stdout.write(f'Current Status: {invoice.status}')
            
            # Get all payments for this invoice
            payments = invoice.payments.all()
            self.stdout.write(f'Total Payments: {payments.count()}')
            
            for payment in payments:
                self.stdout.write(f'  - Payment {payment.id}: {payment.amount} on {payment.paid_on}')
            
            # Test updating payment status
            self.stdout.write('\nUpdating payment status...')
            invoice.update_payment_status()
            
            self.stdout.write(f'Updated Paid Amount: {invoice.paid_amount}')
            self.stdout.write(f'Updated Outstanding: {invoice.outstanding}')
            self.stdout.write(f'Updated Status: {invoice.status}')
            
            # Verify calculations
            total_payments = sum(payment.amount for payment in payments)
            expected_outstanding = max(Decimal('0.00'), invoice.amount_due - total_payments)
            
            self.stdout.write(f'\nVerification:')
            self.stdout.write(f'  Total Payments: {total_payments}')
            self.stdout.write(f'  Expected Outstanding: {expected_outstanding}')
            self.stdout.write(f'  Actual Outstanding: {invoice.outstanding}')
            
            if abs(invoice.outstanding - expected_outstanding) < Decimal('0.01'):
                self.stdout.write(self.style.SUCCESS('✓ Outstanding amount is correct!'))
            else:
                self.stdout.write(self.style.ERROR('✗ Outstanding amount mismatch!'))
        
        self.stdout.write('\nPayment system test completed!')
