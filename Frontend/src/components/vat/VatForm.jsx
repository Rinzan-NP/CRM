import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createVatCategory, updateVatCategory } from '../../redux/productsSlice';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function VatForm({ edit, onDone }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ category: '', rate: '' });

  useEffect(() => {
    if (edit) setForm(edit);
    else setForm({ category: '', rate: '' });
  }, [edit]);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (edit) await dispatch(updateVatCategory({ id: edit.id, ...form }));
    else await dispatch(createVatCategory(form));
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-y-4">
      <Input
        name="category"
        placeholder="Category name"
        value={form.category}
        onChange={handle}
        required
      />
      <Input
        name="rate"
        type="number"
        step="0.01"
        placeholder="Rate (%)"
        value={form.rate}
        onChange={handle}
        required
      />
      <Button variant="green">{edit ? 'Update' : 'Add'}</Button>
    </form>
  );
}