import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import PublicRouter from './PublicRouter';
import PrivateRouter from './PrivateRouter';

function MainRouter() {
  return (
    <BrowserRouter>
       <Provider store={store}>
          <Routes>
            <Route path="/" element={<PublicRouter />} />
            <Route path="/app" element={<PrivateRouter />} />
          </Routes>
       </Provider>
    </BrowserRouter>
  );
}

export default MainRouter;