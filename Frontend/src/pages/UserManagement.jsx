// src/pages/Users.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, createUser, blockUnblockUser } from '../redux/usersSlice';
import PageHeader from '../components/layout/PageHeader';
import StatsCard from '../components/ui/StatsCard';
import DataTable from '../components/ui/DataTable';
import FormField from '../components/ui/FormField';
import { Plus, Shield, ShieldOff, Users, UserCheck, UserX } from 'lucide-react';
import Modal from '../components/Common/Modal';

const UsersManagement = () => {
  const { users, loading, error } = useSelector((state) => state.users);
  const dispatch = useDispatch();
  
  const [user, setUser] = useState({
    email: '',
    role: '',
  });
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'salesperson', label: 'Salesperson' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'user', label: 'User' }
  ];

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    await dispatch(createUser(user));
    setUser({
      email: '',
      role: '',
    });
    setIsUserModalOpen(false);
  };

  const handleBlockUnblock = async (userId, action) => {
    await dispatch(blockUnblockUser({ user_id: userId, action }));
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      salesperson: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const columns = [
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(row.role)}`}>
          {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'blocked',
      cell: (row) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${!row.blocked ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {!row.blocked ? 'Active' : 'Blocked'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'date',
      cell: (row) => {
        // Format: DD-MM-YYYY HH:mm (manual parsing for non-ISO)
        if (!row.date) return '-';
        // Accepts 'DD-MM-YYYY HH:mm' or 'DD-MM-YYYY HH:mm:ss'
        const [datePart, timePart] = row.date.split(' ');
        if (!datePart) return '-';
        const [day, month, year] = datePart.split('-');
        if (!day || !month || !year) return '-';
        // Optionally parse time
        let formatted = `${day}-${month}-${year}`;
        
        return formatted;
      },
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {!row.blocked ? (
            <button
              onClick={() => handleBlockUnblock(row.id, 'block')}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Block User"
            >
              <ShieldOff className="h-3 w-3" />
              Block
            </button>
          ) : (
            <button
              onClick={() => handleBlockUnblock(row.id, 'unblock')}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Unblock User"
            >
              <Shield className="h-3 w-3" />
              Unblock
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalUsers = users.length;
  const activeUsers = users.filter(user => !user.blocked).length;
  const blockedUsers = users.filter(user => user.blocked).length;
  const adminUsers = users.filter(user => user.role === 'admin').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600">Error loading users: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader 
          title="Users" 
          subtitle="Manage system users and permissions"
          actions={[
            <button
              key="add"
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          ]}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Users" 
            value={totalUsers} 
            icon={Users} 
            color="indigo" 
          />
          <StatsCard 
            title="Active Users" 
            value={activeUsers} 
            icon={UserCheck} 
            color="emerald" 
          />
          <StatsCard 
            title="Blocked Users" 
            value={blockedUsers} 
            icon={UserX} 
            color="rose" 
          />
          <StatsCard 
            title="Administrators" 
            value={adminUsers} 
            icon={Shield} 
            color="purple" 
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">All Users</h3>
            <p className="text-sm text-slate-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <DataTable
            data={users}
            columns={columns}
            pageSize={10}
            showPagination={true}
          />
        </div>
      </div>

      {/* Add User Modal */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-6">
          <div className="space-y-4">
            <FormField label="Email Address" required>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={user.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
              />
            </FormField>

            <FormField label="Role" required>
              <select
                name="role"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={user.role}
                onChange={handleInputChange}
              >
                <option value="">Select a role</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Add User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersManagement;