import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  FlagIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: HomeIcon },
  { path: "/users", label: "Users", icon: UsersIcon },
  { path: "/listings", label: "Listings", icon: ShoppingBagIcon },
  { path: "/reports", label: "Reports", icon: FlagIcon },
  { path: "/announcements", label: "Announcements", icon: MegaphoneIcon },
  { path: "/analytics", label: "Analytics", icon: ChartBarIcon },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-primary/25">
            CT
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">CampusTrade</h1>
            <p className="text-[10px] font-medium text-primary uppercase tracking-widest">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="px-4 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src={admin?.avatar}
            alt={admin?.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{admin?.name}</p>
            <p className="text-[11px] text-secondary truncate">{admin?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-secondary hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? "text-primary" : "text-secondary group-hover:text-white"
                  }`}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary hover:text-danger hover:bg-danger/10 w-full transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-surface border border-border text-white"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-secondary hover:text-white"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-surface/80 backdrop-blur-xl border-r border-border/50 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
