import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';

// One shared shell (sidebar + topbar + content outlet) reused by
// Admin, Teacher, and Student sections — each passes its own nav
// items so we don't duplicate this layout three times.
const DashboardLayout = ({ navItems = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-gray-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-lg font-bold text-primary-700">LearnSync</span>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden items-center gap-2 text-sm text-gray-500 lg:flex">
            <LayoutDashboard size={16} />
            <span className="capitalize">{user?.role} panel</span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-danger-700">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
