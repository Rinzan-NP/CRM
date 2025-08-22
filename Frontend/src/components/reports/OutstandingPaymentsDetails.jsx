import React from 'react';
import { FiCreditCard } from 'react-icons/fi';

const OutstandingPaymentsDetails = ({ reports }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <FiCreditCard className="text-amber-600" size={20} />
          </div>
          Outstanding Payments Details
        </h3>
        <p className="text-sm text-gray-600 mt-1">Customer payment status overview</p>
      </div>
      {reports.outstandingPayments && reports.outstandingPayments.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {reports.outstandingPayments.map((customer, index) => (
            <div key={index} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{customer.customer_name}</h4>
                  <p className="text-sm text-gray-500">{customer.customer_email}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Invoices</p>
                    <p className="font-bold text-gray-800">{customer.invoice_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Amount Due</p>
                    <p className="font-bold text-amber-700">
                      {formatCurrency(customer.total_outstanding)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-gray-400 bg-gray-50">
          No outstanding payments data available
        </div>
      )}
    </div>
  );
};

export default OutstandingPaymentsDetails;