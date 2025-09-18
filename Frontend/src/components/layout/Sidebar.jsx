import React, { useEffect, useState } from "react";
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
  FiX,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { useSelector } from "react-redux";

const navigationGroups = [
  {
    label: "Dashboard",
    items: [
      { label: "Dashboard", to: "/", icon: FiHome, roles: ["admin", "accountant", "salesperson"] },
    ]
  },
  {
    label: "Management",
    items: [
      { label: "Users", to: "/main/users", icon: FiUsers, roles: ["admin"] },
      { label: "Customers", to: "/main/customers", icon: FiUsers, roles: ["admin"] },
      { label: "Suppliers", to: "/main/suppliers", icon: FiUsers, roles: ["admin"] },
      { label: "Products", to: "/main/products", icon: FiBox, roles: ["admin"] },
    ]
  },
  {
    label: "Transactions",
    items: [
      { label: "Sales Orders", to: "/transactions/sales-orders", icon: FiShoppingCart, roles: ["admin", "accountant","salesperson"] },
      { label: "Purchase Orders", to: "/transactions/purchase-orders", icon: FiFileText, roles: ["admin", "accountant"] },
      { label: "Invoices", to: "/transactions/invoices", icon: FiDollarSign, roles: ["admin", "accountant"] },
      { label: "Payments", to: "/transactions/payments", icon: FiDollarSign, roles: ["admin", "accountant"] },
    ]
  },
  {
    label: "Routes & Tracking",
    items: [
      { label: "Routes", to: "/transactions/routes", icon: FiMap, roles: ["admin"] },
      { label: "Route Visits", to: "/transactions/route-visits", icon: FiMapPin, roles: ["admin", "salesperson"] },
      { label: "Live Tracking", to: "/transactions/route-live-tracker", icon: FiActivity, roles: ["admin", "salesperson"] },
    ]
  },
  {
    label: "System",
    items: [
      { label: "Audit Logs", to: "/audit/audit-logs", icon: FiFileText, roles: ["admin"] },
      { label: "Reports", to: "/reports", icon: FiBarChart2, roles: ["admin"] },
    ]
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const userRole = useSelector((state) => state.auth.user?.role);
  const [expandedGroups, setExpandedGroups] = useState({});
  

  // Filter navigation groups based on user role and initialize expanded state
  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.roles.includes(userRole?.toLowerCase() || '')
    )
  })).filter(group => group.items.length > 0);

  // Initialize expanded state for groups that have items
  useEffect(() => {
    const initialExpandedState = {};
    filteredGroups.forEach(group => {
      // Auto-expand Dashboard and single-item groups
      if (group.label === "Dashboard" || group.items.length === 1) {
        initialExpandedState[group.label] = true;
      } else {
        initialExpandedState[group.label] = false;
      }
    });
    setExpandedGroups(initialExpandedState);
  }, [userRole]);

  const toggleGroup = (groupLabel) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupLabel]: !prev[groupLabel]
    }));
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

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
        
        <nav className="mt-2 flex flex-col gap-2">
          {filteredGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {/* Group Header */}
              {group.items.length > 1 ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <span>{group.label}</span>
                  {expandedGroups[group.label] ? (
                    <FiChevronDown className="h-4 w-4" />
                  ) : (
                    <FiChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : null}
              
              {/* Group Items */}
              {(expandedGroups[group.label] || group.items.length === 1) && (
                <div className={group.items.length > 1 ? "ml-3 mt-1 space-y-1" : "space-y-1"}>
                  {group.items.map(({ label, to, icon: Icon }) => (
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
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;