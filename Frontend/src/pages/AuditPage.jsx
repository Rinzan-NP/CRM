import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fetchAuditLogs } from '../features/audit/auditSlice';

export default function AuditPage() {
  const auditLogs = useSelector((state) => state.audit.data);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <table className="table table-bordered">
         <thead>
            <tr>
               <th>Action</th>
               <th>Model</th>
               <th>Object ID</th>
               <th>Timestamp</th>
            </tr>
         </thead>
         <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                 <td>{log.action}</td>
                 <td>{log.model_name}</td>
                 <td>{log.object_id}</td>
                 <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
         </tbody>
      </table>
    </div>
  );
}