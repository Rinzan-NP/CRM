import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiBox,
  FiFileText,
  FiShoppingCart,
  FiDollarSign,
  FiMap,
  FiMapPin,
  FiActivity,
  FiBarChart2,
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard", to: "/", icon: FiHome },
  { label: "Customers", to: "/main/customers", icon: FiUsers },
  { label: "Suppliers", to: "/main/suppliers", icon: FiUsers },
  { label: "Products", to: "/main/products", icon: FiBox },
  { label: "Sales Orders", to: "/transactions/sales-orders", icon: FiShoppingCart },
  { label: "Purchase Orders", to: "/transactions/purchase-orders", icon: FiFileText },
  { label: "Invoices", to: "/transactions/invoices", icon: FiDollarSign },
  { label: "Payments", to: "/transactions/payments", icon: FiDollarSign },
  { label: "Routes", to: "/transactions/routes", icon: FiMap },
  { label: "Route Visits", to: "/transactions/route-visits", icon: FiMapPin },
  { label: "Live Tracker", to: "/transactions/route-live-tracker", icon: FiActivity },
  { label: "Audit Logs", to: "/audit/audit-logs", icon: FiFileText },
  { label: "Reports", to: "/reports", icon: FiBarChart2 },
];

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white p-4 transition-transform duration-200 ease-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-slate-800">Navigation</span>
        <button
          className="lg:hidden rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <nav className="mt-2 flex flex-col gap-1">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-slate-100 font-medium text-slate-900"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
            end={to === "/"}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;


