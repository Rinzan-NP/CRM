import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function ProductTable({ products, vatCategories, onEdit, onDelete }) {
  const getVatRate = (id) => {
    const vat = vatCategories.find(v => v.id === id);
    return vat ? `${vat.rate}%` : '';
  };

  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl">
      {/* Desktop Table View */}
      <div className="hidden lg:block">
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

      {/* Tablet View */}
      <div className="hidden sm:block lg:hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Code', 'Name', 'Price', 'Status', 'Actions'].map((h) => (
                <th 
                  key={h} 
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {p.code}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-400">
                    Cost: ${parseFloat(p.unit_cost ?? 0).toFixed(2)} | VAT: {getVatRate(p.vat_category)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                  ${parseFloat(p.unit_price).toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Badge variant={p.is_active ? 'success' : 'inactive'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-1">
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Products
          </h3>
        </div>
        <div className="bg-white divide-y divide-slate-200">
          {products.map((p) => (
            <div key={p.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {p.name}
                    </span>
                    <Badge variant={p.is_active ? 'success' : 'inactive'} className="shrink-0">
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">
                    Code: {p.code}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div>
                  <span className="text-slate-500">Price:</span>
                  <div className="font-medium text-slate-900">
                    ${parseFloat(p.unit_price).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Cost:</span>
                  <div className="font-medium text-slate-900">
                    ${parseFloat(p.unit_cost ?? 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">VAT Rate:</span>
                  <div className="font-medium text-slate-900">
                    {getVatRate(p.vat_category)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onEdit(p)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button 
                  variant="red" 
                  size="sm" 
                  onClick={() => onDelete(p.id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}