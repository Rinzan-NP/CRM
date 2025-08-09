import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSales } from '../redux/salesSlice';
import Card from '../components/Card';

export default function Dashboard() {
  const dispatch = useDispatch();
  const sales = useSelector((state) => state.sales.data);

  useEffect(() => {
    dispatch(fetchSales());
  }, [dispatch]);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {sales.map(sale => (
        <Card key={sale.id} title="Total Sales" value={`AED ${sale.total}`} />
      ))}
    </div>
  );
}