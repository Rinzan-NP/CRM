import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout } from './redux/authSlice';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import MainRouter from './router/MainRouter';
import LoginPage from './pages/Login';

function App() {
  // const dispatch = useDispatch();
  // const auth = useSelector((state) => state.auth);

 

  // const handleLogout = () => {
  //   dispatch(logout());
  //   localStorage.removeItem('token');
  // };

  return (
    <Provider store={store}>
      <BrowserRouter>
         <MainRouter  />
      </BrowserRouter>
    </Provider>
  );
}

export default App;