import Button from '../ui/Button';

export default function VatTable({ vatCategories, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl">
      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {['Category', 'Rate (%)', 'Actions'].map((h) => (
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
            {vatCategories.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {v.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {v.rate}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => onEdit(v)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="red" 
                    size="sm" 
                    onClick={() => onDelete(v.id)}
                  >
                    Delete
                  </Button>
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
            VAT Categories
          </h3>
        </div>
        <div className="bg-white divide-y divide-slate-200">
          {vatCategories.map((v) => (
            <div key={v.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {v.category}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Rate: {v.rate}%
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onEdit(v)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button 
                  variant="red" 
                  size="sm" 
                  onClick={() => onDelete(v.id)}
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