
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from './redux/authSlice';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainRouter from './router/MainRouter';
import LoginPage from './pages/Login';

function App() {
  // Clean up any invalid tokens on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refresh = localStorage.getItem('refresh');
    
    // If we have tokens but they're invalid (causing 401s), clear them
    if (token && refresh) {
      // Check if we're on login page - if so, clear tokens to prevent refresh loops
      if (window.location.pathname === '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
         <MainRouter  />
      </BrowserRouter>
    </Provider>
  );
}

export default App;