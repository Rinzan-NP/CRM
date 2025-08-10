// src/components/MainRouter.js
import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import LoginScreen from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";
import Customers from "../pages/Customers";
import Suppliers from "../pages/Suppliers";
import Products from "../pages/Products";
import SalesOrders from "../pages/SalesOrder";
import PurchaseOrders from "../pages/PurchaseOrder";
import Invoices from "../pages/Invoices";
import Payments from "../pages/Payments";
import Roote from "../pages/Routes"; // Assuming you have a Routes component
import RouteVisits from "../pages/RouteVisits"; // Import the RouteVisits component

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
            />
            <Route
                path="/main/suppliers"
                element={
                    <PrivateRouter>
                        <Suppliers />
                    </PrivateRouter>
                }
            />
            <Route
                path="/main/products"
                element={
                    <PrivateRouter>
                        <Products />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/sales-orders"
                element={
                    <PrivateRouter>
                        <SalesOrders />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/purchase-orders"
                element={
                    <PrivateRouter>
                        <PurchaseOrders />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/invoices"
                element={
                    <PrivateRouter>
                        <Invoices />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/payments"
                element={
                    <PrivateRouter>
                        <Payments />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/routes"
                element={
                    <PrivateRouter>
                        <Roote />
                    </PrivateRouter>
                }
            />
            <Route
                path="/transactions/route-visits"
                element={
                    <PrivateRouter>
                        <RouteVisits />
                    </PrivateRouter>
                }
            />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default MainRouter;