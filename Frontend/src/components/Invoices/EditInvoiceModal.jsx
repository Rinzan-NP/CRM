import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateInvoice, fetchAvailableSalesOrders, fetchSalesOrderDetails } from '../../redux/invoicesSlice';
import { fetchProducts } from '../../redux/productsSlice';
import Modal from '../Common/Modal';
import FormField from '../ui/FormField';
import { Printer, Loader2, Package, DollarSign } from 'lucide-react';

const EditInvoiceModal = ({ isOpen, onClose, invoice, onUpdate }) => {
  const dispatch = useDispatch();
  console.log('Invoice data:', invoice);
  const { availableSalesOrders, salesOrderDetails, loading: stateLoading } = useSelector((state) => state.invoices);
  
  // Debug logging
  console.log('Available sales orders:', availableSalesOrders);
  console.log('Sales order details:', salesOrderDetails);
  const { products } = useSelector((state) => state.products);
  const [formData, setFormData] = useState({
    sales_order: '',
    issue_date: '',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (invoice && isOpen) {
      setFormData({
        sales_order: invoice.sales_order || '',
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
      });
      // Fetch available sales orders and products when modal opens
      dispatch(fetchAvailableSalesOrders());
      dispatch(fetchProducts());
      
      // Fetch detailed sales order information if we have a sales order ID
      if (invoice.sales_order) {
        dispatch(fetchSalesOrderDetails(invoice.sales_order));
      }
    }
  }, [invoice, isOpen, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(updateInvoice({ id: invoice.id, ...formData }));
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the selected sales order details
    const selectedOrder = getSelectedSalesOrder();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice?.invoice_no || 'N/A'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .invoice-header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .invoice-number {
              font-size: 18px;
              color: #666;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .invoice-section {
              flex: 1;
              margin-right: 20px;
            }
            .invoice-section h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .invoice-section p {
              margin: 5px 0;
              color: #666;
            }
            .order-details {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .order-details h4 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .amount-section {
              text-align: right;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">Invoice #: ${invoice?.invoice_no || 'N/A'}</div>
          </div>
          
          <div class="invoice-details">
            <div class="invoice-section">
              <h3>Invoice Details</h3>
              <p><strong>Issue Date:</strong> ${formData.issue_date ? new Date(formData.issue_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Due Date:</strong> ${formData.due_date ? new Date(formData.due_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Status:</strong> ${invoice?.status || 'Pending'}</p>
            </div>
            
            ${selectedOrder ? `
            <div class="invoice-section">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${selectedOrder.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(selectedOrder.order_date).toLocaleDateString()}</p>
              <p><strong>Customer:</strong> ${selectedOrder.customer_name || 'N/A'}</p>
            </div>
            ` : ''}
          </div>
          
          ${selectedOrder ? `
          <div class="order-details">
            <h4>Order Summary</h4>
            ${selectedOrder.line_items && selectedOrder.line_items.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qty</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit Price</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Discount</th>
                  <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${selectedOrder.line_items.map(item => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${getProductName(item.product_id)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">AED ${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.discount}%</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">AED ${parseFloat(item.line_total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
              <p><strong>Subtotal:</strong> AED ${parseFloat(selectedOrder.subtotal || 0).toFixed(2)}</p>
              <p><strong>VAT (${selectedOrder.vat_rate || 0}%):</strong> AED ${parseFloat(selectedOrder.vat_total || 0).toFixed(2)}</p>
              <p style="font-size: 16px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;"><strong>Grand Total:</strong> AED ${parseFloat(selectedOrder.grand_total || 0).toFixed(2)}</p>
            </div>
          </div>
          ` : ''}
          
          <div class="amount-section">
            <div class="amount-row">
              <span>Amount Due:</span>
              <span>AED ${parseFloat(invoice?.outstanding || 0).toFixed(2)}</span>
            </div>
            <div class="amount-row">
              <span>Amount Paid:</span>
              <span>AED ${parseFloat(invoice?.paid_amount || 0).toFixed(2)}</span>
            </div>
            <div class="amount-row total-amount">
              <span>Total Amount:</span>
              <span>AED ${(parseFloat(invoice?.outstanding || 0) + parseFloat(invoice?.paid_amount || 0)).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helper function to get product name by ID
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  // Helper function to get product details
  const getProductDetails = (productId) => {
    const product = products.find(p => p.id === productId);
    return product || null;
  };

  // Get selected sales order details
  const getSelectedSalesOrder = () => {
    // First try to get from detailed sales order data
    if (salesOrderDetails && salesOrderDetails.id === formData.sales_order) {
      return salesOrderDetails;
    }
    // Fallback to available sales orders
    return availableSalesOrders.find(order => order.id === formData.sales_order);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Edit Invoice"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* <FormField label="Sales Order" required>
            <select
              name="sales_order"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.sales_order}
              onChange={handleInputChange}
              disabled={true} // Sales order cannot be changed for existing invoices
            >
              <option value="">Select Sales Order</option>
              {stateLoading ? (
                <option value="">Loading...</option>
              ) : (
                availableSalesOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {`${order.order_number} - ${formatCurrency(order.grand_total)} AED`}
                  </option>
                ))
              )}
            </select>
          </FormField> */}
          
          {formData.sales_order && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Details
                {stateLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                )}
              </h4>
              {(() => {
                const selectedOrder = getSelectedSalesOrder();
                if (!selectedOrder) {
                  return (
                    <div className="text-sm text-gray-500">
                      {stateLoading ? 'Loading order details...' : 'Order details not available'}
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {/* Order Header Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Order Number:</span>
                        <p className="text-gray-900">{selectedOrder.order_number}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Order Date:</span>
                        <p className="text-gray-900">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Customer:</span>
                        <p className="text-gray-900">{selectedOrder.customer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status:</span>
                        <p className="text-gray-900 capitalize">{selectedOrder.status}</p>
                      </div>
                    </div>

                    {/* Product Line Items */}
                    {selectedOrder.line_items && selectedOrder.line_items.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Product Line Items</h5>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {selectedOrder.line_items.map((item, index) => {
                                  const product = getProductDetails(item.product_id);
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-sm text-gray-900">
                                        <div>
                                          <div className="font-medium">{getProductName(item.product_id)}</div>
                                          {product && (
                                            <div className="text-xs text-gray-500">
                                              SKU: {product.sku || 'N/A'}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)} AED</td>
                                      <td className="px-3 py-2 text-sm text-gray-900">{item.discount}%</td>
                                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{formatCurrency(item.line_total)} AED</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Totals */}
                    <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">Subtotal:</span>
                        <span className="text-gray-900">{formatCurrency(selectedOrder.subtotal)} AED</span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="font-medium text-gray-700">VAT ({selectedOrder.vat_rate || 0}%):</span>
                        <span className="text-gray-900">{formatCurrency(selectedOrder.vat_total)} AED</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-semibold mt-2 pt-2 border-t border-gray-200">
                        <span className="text-gray-900 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Grand Total:
                        </span>
                        <span className="text-indigo-600">{formatCurrency(selectedOrder.grand_total)} AED</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <FormField label="Issue Date" required>
            <input
              type="date"
              name="issue_date"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.issue_date}
              onChange={handleInputChange}
            />
          </FormField>

          <FormField label="Due Date" required>
            <input
              type="date"
              name="due_date"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.due_date}
              onChange={handleInputChange}
            />
          </FormField>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Invoice'
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditInvoiceModal;
