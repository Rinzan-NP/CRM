import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchVatCategories, deleteProduct, deleteVatCategory } from '../redux/productsSlice';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';
import ProductForm from '../components/Products/ProductForm';
import ProductTable from '../components/Products/ProductTable';
import VatForm from '../components/vat/VatForm';
import VatTable from '../components/vat/VatTable';

export default function Products() {
  const dispatch = useDispatch();
  const { products, vatCategories, loading, error } = useSelector((s) => s.products);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingVat, setEditingVat] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchVatCategories());
  }, [dispatch]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 max-w-md bg-white rounded-xl shadow-md">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Section title="Product Management">
          <div className="space-y-8">
            <Card className="p-8">
              <h3 className="text-lg font-medium text-slate-800 mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <ProductForm
                vatCategories={vatCategories}
                edit={editingProduct}
                onDone={() => setEditingProduct(null)}
              />
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Product Catalog</h3>
              <ProductTable
                products={products}
                vatCategories={vatCategories}
                onEdit={setEditingProduct}
                onDelete={(id) => dispatch(deleteProduct(id))}
              />
            </div>
          </div>
        </Section>

        <Section title="VAT Categories">
          <div className="space-y-8">
            <Card className="p-8">
              <h3 className="text-lg font-medium text-slate-800 mb-6">
                {editingVat ? 'Edit VAT Category' : 'Add VAT Category'}
              </h3>
              <VatForm edit={editingVat} onDone={() => setEditingVat(null)} />
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Available VAT Rates</h3>
              <VatTable
                vatCategories={vatCategories}
                onEdit={setEditingVat}
                onDelete={(id) => dispatch(deleteVatCategory(id))}
              />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}