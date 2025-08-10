// src/pages/Routes.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRoutes, createRoute, updateRoute, deleteRoute } from '../redux/routesSlice';

const Routes = () => {
  const { routes, loading: loadingRoutes } = useSelector((state) => state.routes);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user); // Assuming you have user info in auth state
  const [route, setRoute] = useState({
    name: '',
    date: '',
    start_time: '',
    end_time: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    dispatch(fetchRoutes());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoute({ ...route, [name]: value });
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    const newRoute = { ...route, salesperson: user.id }; // Set salesperson to the current user
    await dispatch(createRoute(newRoute));
    setRoute({
      name: '',
      date: '',
      start_time: '',
      end_time: '',
    });
  };

  const handleUpdateRoute = async (e) => {
    e.preventDefault();
    const updatedRoute = { id: editId, ...route, salesperson: user.id }; // Set salesperson to the current user
    await dispatch(updateRoute(updatedRoute));
    setEditMode(false);
    setRoute({
      name: '',
      date: '',
      start_time: '',
      end_time: '',
    });
  };

  const handleDeleteRoute = async (id) => {
    await dispatch(deleteRoute(id));
  };

  const handleEditRoute = (route) => {
    setEditMode(true);
    setEditId(route.id);
    setRoute(route);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Manage Routes
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={editMode ? handleUpdateRoute : handleCreateRoute}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Route Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={route.name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="mt-1">
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={route.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <div className="mt-1">
                <input
                  id="start_time"
                  name="start_time"
                  type="time"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={route.start_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <div className="mt-1">
                <input
                  id="end_time"
                  name="end_time"
                  type="time"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={route.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editMode ? 'Update Route' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{route.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{route.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{route.start_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{route.end_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="ml-4 text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Routes;