// src/components/MainRouter.js
import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import LoginScreen from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";
import Customers from "../pages/Customers";
import Suppliers from "../pages/Suppliers";

const MainRouter = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <PublicRouter>
                        <LoginScreen />
                    </PublicRouter>
                }
            />
            <Route
                path="/"
                element={
                    <PrivateRouter>
                        <Dashboard />
                    </PrivateRouter>
                }
            />
            <Route
                path="/main/customers"
                element={
                    <PrivateRouter>
                        <Customers />
                    </PrivateRouter>
                }
            /><Route
                path="/main/customers"
                element={
                    <PrivateRouter>
                        <Customers />
                    </PrivateRouter>
                }
            />
            <Route
                path="/main/suppliers"
                element={
                    <PrivateRouter>
                        <Suppliers />
                    </PrivateRouter>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default MainRouter;