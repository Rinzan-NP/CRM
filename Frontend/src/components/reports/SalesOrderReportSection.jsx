import React from 'react';

const SalesOrderReportSection = ({ report }) => {
  if (!report) return null;
  
  const { total_sales, total_profit, order_count } = report;
  
  return (
    <section className="bg-gradient-to-br from-white  rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-indigo-800">Sales Overview</h2>
        
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Sales Card */}
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-gray-500">Total Sales</div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-800 mb-1">{total_sales}</div>
          
        </div>
        
        {/* Total Profit Card */}
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4  hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-gray-500">Total Profit</div>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-green-800 mb-1">{total_profit}</div>
         
        </div>
        
        {/* Order Count Card */}
        <div className="bg-white rounded-xl p-5 shadow-md border-l-4  hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-medium text-gray-500">Order Count</div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-800 mb-1">{order_count}</div>
          
        </div>
      </div>
      
     
    </section>
  );
};

export default SalesOrderReportSection;