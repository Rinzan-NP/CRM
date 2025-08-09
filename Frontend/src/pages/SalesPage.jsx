import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createSale } from '../features/sales/salesSlice';

export default function SalesPage() {
  const [customer, setCustomer] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(0);
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
   await dispatch(createSale({ customer, product, quantity }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">New Sale</h1>
      <form onSubmit={handleSubmit}>
         <div className="mb-4">
            <label htmlFor="customer" className="block text-gray-700 text-sm font-bold mb-2">Customer</label>
            <input type="text" id="customer" name="customer" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={customer} onChange={e => setCustomer(e.target.value)} />
         </div>
         <div className="mb-4">
            <label htmlFor="product" className="block text-gray-700 text-sm font-bold mb-2">Product</label>
            <input type="text" id="product" name="product" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={product} onChange={e => setProduct(e.target.value)} />
         </div>
         <div className="mb-6">
            <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
            <input type="number" id="quantity" name="quantity" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={quantity} onChange={e => setQuantity(e.target.value)} />
         </div>
         <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save Sale</button>
      </form>
    </div>
  );
}