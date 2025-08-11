import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function ProductTable({ products, vatCategories, onEdit, onDelete }) {
  const getVatRate = (id) => {
    const vat = vatCategories.find(v => v.id === id);
    return vat ? `${vat.rate}%` : '';
  };

  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {['Code', 'Name', 'Price', 'Cost', 'VAT', 'Status', 'Actions'].map((h) => (
              <th 
                key={h} 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                {p.code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {p.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                ${parseFloat(p.unit_price).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                ${parseFloat(p.unit_cost ?? 0).toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {getVatRate(p.vat_category)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={p.is_active ? 'success' : 'inactive'}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onEdit(p)}
                >
                  Edit
                </Button>
                <Button 
                  variant="red" 
                  size="sm" 
                  onClick={() => onDelete(p.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}