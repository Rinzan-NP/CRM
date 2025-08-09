import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createProduct, updateProduct } from '../../redux/productsSlice';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import CheckBox from '../ui/CheckBox';

export default function ProductForm({ vatCategories, edit, onDone }) {
  const dispatch = useDispatch();
  const [product, setProduct] = useState({
    code: '',
    name: '',
    unit_price: '',
    vat_category: 1,
    is_active: true,
  });

  useEffect(() => {
    if (edit) setProduct(edit);
    else
      setProduct({
        code: '',
        name: '',
        unit_price: '',
        vat_category: 1,
        is_active: true,
      });
  }, [edit]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({ ...product, [name]: type === 'checkbox' ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (edit) await dispatch(updateProduct({ id: edit.id, ...product }));
    else await dispatch(createProduct(product));
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input 
          name="code" 
          label="Product Code" 
          placeholder="PRD-001" 
          value={product.code} 
          onChange={handle} 
          required 
        />
        <Input 
          name="name" 
          label="Product Name" 
          placeholder="Premium Widget" 
          value={product.name} 
          onChange={handle} 
          required 
        />
        <Input
          name="unit_price"
          type="number"
          step="0.01"
          label="Unit Price"
          placeholder="0.00"
          value={product.unit_price}
          onChange={handle}
          required
        />
        <Select 
          name="vat_category" 
          label="VAT Category" 
          value={product.vat_category} 
          onChange={handle}
        >
          {vatCategories.map((v) => (
            <option key={v.id} value={v.id}>
              {v.category} ({v.rate}%)
            </option>
          ))}
        </Select>
      </div>
      
      <div className="flex items-center">
        <CheckBox 
          id="is_active" 
          name="is_active" 
          checked={product.is_active} 
          onChange={handle} 
        />
        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
          Active Product
        </label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-2">
        <Button 
          variant="secondary" 
          type="button" 
          onClick={onDone}
          className="px-6"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="px-6"
        >
          {edit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}