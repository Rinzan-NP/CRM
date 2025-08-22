import React from 'react';

const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['overview', 'sales', 'purchases', 'vat', 'routes', 'payments'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
      <div className="flex flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeTab === tab 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
                : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationTabs;