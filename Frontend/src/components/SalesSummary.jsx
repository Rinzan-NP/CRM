import React from 'react';
import { useSelector } from 'react-redux';

export default function SalesSummary() {
  const sales = useSelector((state) => state.sales.data);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Total Sales</h1>
      <p className="text-2xl text-blue-600">{sales.reduce((acc, curr => acc + curr.total), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} AED</p>
    </div>
  );
}