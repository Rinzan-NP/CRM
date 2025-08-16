import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addUser } from '../redux/usersSlice';
import { FiUserPlus, FiMail, FiKey, FiUser, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

const roles = [
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'admin', label: 'Administrator' }
];

export default function AddUserPage() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.users);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'salesperson'
  });

  const generatePassword = (role) => {
    const passwords = {
      salesperson: 'sales123',
      accountant: 'accountant123',
      admin: 'admin123'
    };
    return passwords[role] || 'default123';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter an email address');
      return;
    }

    const userData = {
      email: formData.email,
      role: formData.role,
      password: generatePassword(formData.role),
      temporaryPassword: true
    };

    try {
      await dispatch(addUser(userData)).unwrap();
      toast.success(`User created successfully! Password: ${userData.password}`);
      setFormData({ email: '', role: 'salesperson' });
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const selectRole = (role) => {
    setFormData({ ...formData, role });
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4 flex items-center">
            <FiUserPlus className="h-6 w-6 text-white mr-2" />
            <h2 className="text-xl font-bold text-white">Add New User</h2>
          </div>

          {/* Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  User Role
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-10 pr-3 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <span className="flex items-center">
                      <FiUser className="h-5 w-5 text-gray-400 absolute left-3" />
                      <span className="ml-3 block truncate">
                        {roles.find(r => r.value === formData.role)?.label}
                      </span>
                    </span>
                    <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <FiChevronDown className="h-5 w-5 text-gray-400" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {roles.map((role) => (
                        <div
                          key={role.value}
                          onClick={() => selectRole(role.value)}
                          className={`flex items-center px-4 py-2 hover:bg-indigo-50 cursor-pointer ${
                            formData.role === role.value ? 'bg-indigo-100' : ''
                          }`}
                        >
                          <span className="ml-3 block truncate">{role.label}</span>
                          {formData.role === role.value && (
                            <FiCheck className="ml-auto h-5 w-5 text-indigo-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Password Info */}
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiKey className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Password Information</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        A default password will be generated based on the role:
                      </p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Salesperson: <span className="font-mono">sales123</span></li>
                        <li>Accountant: <span className="font-mono">accountant123</span></li>
                        <li>Admin: <span className="font-mono">admin123</span></li>
                      </ul>
                      <p className="mt-2 font-medium">
                        The user will be prompted to change this password on first login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiUserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error creating user</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}