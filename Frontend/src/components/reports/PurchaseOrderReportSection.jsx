import React from 'react';

const PurchaseOrderReportSection = ({ report }) => {
  if (!report) return null;
  const { total_purchases, order_count } = report;
  
  return (
    <section className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Purchase Order Report</h2>
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br rounded-xl p-5 border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Total Purchases</div>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-700">{total_purchases}</div>
          <div className="mt-2 text-xs text-gray-500 font-medium">
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              All-time purchases
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-5 border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700">Order Count</div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{order_count}</div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed orders
            </span>
          </div>
        </div>
      </div>
      
      
    </section>
  );
};

export default PurchaseOrderReportSection;