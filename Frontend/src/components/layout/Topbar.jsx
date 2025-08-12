import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiMenu, FiLogOut, FiSearch, FiUser } from "react-icons/fi";
import { logout } from "../../redux/authSlice";

const Topbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  const userInitials = React.useMemo(() => {
    if (!user) return "";
    const name = user.name || user.full_name || user.email || "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          aria-label="Open sidebar"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          onClick={onToggleSidebar}
        >
          <FiMenu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <span className="hidden sm:inline">Prospello CRM</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <div className="relative hidden md:block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                {userInitials || <FiUser className="h-4 w-4" />}
              </div>
              <div className="hidden sm:flex sm:flex-col">
                <span className="text-sm font-medium text-slate-800">
                  {user?.name || user?.full_name || user?.email || ""}
                </span>
                <span className="text-xs text-slate-500">{user?.role || "User"}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <FiLogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;


