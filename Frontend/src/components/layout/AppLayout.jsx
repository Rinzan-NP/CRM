import React from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar onToggleSidebar={toggleSidebar} />

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="lg:pl-72">
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;


