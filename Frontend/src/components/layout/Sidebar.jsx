import React, { useEffect } from "react";
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
  FiX, // Added X icon
} from "react-icons/fi";
import { useSelector } from "react-redux";

const allNavItems = [
  { label: "Dashboard", to: "/", icon: FiHome, roles: ["admin", "accountant", "salesperson"] },
  { label: "Users", to: "/main/users", icon: FiUsers, roles: ["admin"] },
  { label: "Customers", to: "/main/customers", icon: FiUsers, roles: ["admin"] },
  { label: "Suppliers", to: "/main/suppliers", icon: FiUsers, roles: ["admin"] },
  { label: "Products", to: "/main/products", icon: FiBox, roles: ["admin"] },
  { label: "Sales Orders", to: "/transactions/sales-orders", icon: FiShoppingCart, roles: ["admin", "accountant"] },
  { label: "Purchase Orders", to: "/transactions/purchase-orders", icon: FiFileText, roles: ["admin", "accountant"] },
  { label: "Invoices", to: "/transactions/invoices", icon: FiDollarSign, roles: ["admin", "accountant"] },
  { label: "Payments", to: "/transactions/payments", icon: FiDollarSign, roles: ["admin", "accountant"] },
  { label: "Routes", to: "/transactions/routes", icon: FiMap, roles: ["admin", "salesperson"] },
  { label: "Route Visits", to: "/transactions/route-visits", icon: FiMapPin, roles: ["admin", "salesperson"] },
  { label: "Live Tracking", to: "/transactions/route-live-tracker", icon: FiActivity, roles: ["admin", "salesperson"] },
  { label: "Audit Logs", to: "/audit/audit-logs", icon: FiFileText, roles: ["admin"] },
  { label: "Reports", to: "/reports", icon: FiBarChart2, roles: ["admin"] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const userRole = useSelector((state) => state.auth.user?.role);
  console.log(userRole);
 
  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item =>
    item.roles.includes(userRole?.toLowerCase() || '')
  );

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle clicks outside on mobile (when sidebar is open and screen is small)
      if (isOpen && window.innerWidth < 1024) { // lg breakpoint is 1024px
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          onClose();
        }
      }
    };

    // Add event listener when sidebar is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    // Cleanup event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white p-4 transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-800">Navigation</span>
          <button
            className="lg:hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX className="h-5 w-5" />
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
              onClick={() => {
                // Close sidebar on mobile when a link is clicked
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;