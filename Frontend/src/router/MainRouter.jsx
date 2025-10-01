import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import NotFound from "../pages/NotFound";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";
import { path } from "framer-motion/client";
import CreditListingPage from "../pages/Credit";

// Lazy load components for better performance
const LoginScreen = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Customers = lazy(() => import("../pages/Customers"));
const Suppliers = lazy(() => import("../pages/Suppliers"));
const Products = lazy(() => import("../pages/Products"));
const SalesOrders = lazy(() => import("../pages/SalesOrder"));
const PurchaseOrders = lazy(() => import("../pages/PurchaseOrder"));
const Invoices = lazy(() => import("../pages/Invoices"));
const Payments = lazy(() => import("../pages/Payments"));
const RoutesPage = lazy(() => import("../pages/Routes")); // Renamed to avoid conflict with React Router's Routes
const RouteVisits = lazy(() => import("../pages/RouteVisits"));
const RouteLiveTracker = lazy(() => import("../pages/RouteLiveTracker"));
const AuditLogs = lazy(() => import("../pages/AuditLogs")); // Fixed typo: AuditLoges -> AuditLogs
const Reports = lazy(() => import("../pages/Reports"));
const CustomerDetail = lazy(() => import("../pages/CustomerDetail")); // Added CustomerDetail page
const Users = lazy(() => import("../pages/UserManagement")); // Added Users page
const Credit = lazy(() => import("../pages/Credit"))
// Loading component for suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Helper component to wrap private routes
const PrivateRoute = ({ children }) => (
  <PrivateRouter>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </PrivateRouter>
);

// Helper component to wrap public routes
const PublicRoute = ({ children }) => (
  <PublicRouter>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </PublicRouter>
);

// Route configuration for better maintainability
const routeConfig = [
  // Public routes
  {
    path: "/login",
    component: LoginScreen,
    isPrivate: false
  },
  
  // Dashboard
  {
    path: "/",
    component: Dashboard,
    isPrivate: true
  },
  
  // Main section routes
  {
    path: "/main/customers",
    component: Customers,
    isPrivate: true
  },
  {
    path: "/main/users",
    component: Users,
    isPrivate: true
  },
  {
    path: "/main/suppliers",
    component: Suppliers,
    isPrivate: true
  },
  {
    path: "/main/products",
    component: Products,
    isPrivate: true
  },
  
  // Transaction routes
  {
    path: "/transactions/sales-orders",
    component: SalesOrders,
    isPrivate: true
  },
  {
    path: "/transactions/purchase-orders",
    component: PurchaseOrders,
    isPrivate: true
  },
  {
    path: "/transactions/invoices",
    component: Invoices,
    isPrivate: true
  },
  {
    path: "/transactions/payments",
    component: Payments,
    isPrivate: true
  },
  {
    path: "/transactions/routes",
    component: RoutesPage,
    isPrivate: true
  },
  {
    path: "/transactions/route-visits",
    component: RouteVisits,
    isPrivate: true
  },
  {
    path: "/transactions/route-live-tracker",
    component: RouteLiveTracker,
    isPrivate: true
  },
  
  // Audit routes
  {
    path: "/audit/audit-logs",
    component: AuditLogs,
    isPrivate: true
  },
  {
    path:"/customers/:id",
    component : CustomerDetail,
    isPrivate: true
  },
  
  // Reports
  {
    path: "/reports",
    component: Reports,
    isPrivate: true
  },
  {
    path:"/credits",
    component : Credit,
    isPrivate : true,
  }

];

const MainRouter = () => {
  return (
    <Routes>
      {routeConfig.map(({ path, component: Component, isPrivate }) => (
        <Route
          key={path}
          path={path}
          element={
            isPrivate ? (
              <PrivateRoute>
                <Component />
              </PrivateRoute>
            ) : (
              <PublicRoute>
                <Component />
              </PublicRoute>
            )
          }
        />
      ))}
      
      {/* 404 Route - Keep this at the end */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MainRouter;