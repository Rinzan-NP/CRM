import Button from '../ui/Button';

export default function VatTable({ vatCategories, onEdit, onDelete }) {
  return (
    <div className="overflow-hidden border border-slate-200 rounded-xl">
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
  );
}