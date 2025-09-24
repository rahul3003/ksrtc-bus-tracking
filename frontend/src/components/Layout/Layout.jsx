import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationSettings from '../Notifications/NotificationSettings';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  TruckIcon,
  MapIcon,
  CalendarIcon,
  UsersIcon,
  TicketIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { user, logout } = useAuth();
  const { isEnabled } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/', icon: HomeIcon, current: location.pathname === '/' }
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [
          ...baseItems,
          { name: 'Buses', href: '/admin/buses', icon: TruckIcon, current: location.pathname === '/admin/buses' },
          { name: 'Routes', href: '/admin/routes', icon: MapIcon, current: location.pathname === '/admin/routes' },
          { name: 'Trips', href: '/admin/trips', icon: CalendarIcon, current: location.pathname === '/admin/trips' },
          { name: 'Users', href: '/admin/users', icon: UsersIcon, current: location.pathname === '/admin/users' },
          { name: 'Bookings', href: '/admin/bookings', icon: TicketIcon, current: location.pathname === '/admin/bookings' },
          { name: 'Live Tracking', href: '/admin/live-tracking', icon: MapIcon, current: location.pathname === '/admin/live-tracking' }
        ];
      case 'DRIVER':
        return [
          ...baseItems,
          { name: 'My Trips', href: '/driver/trips', icon: CalendarIcon, current: location.pathname === '/driver/trips' },
          { name: 'Live Tracking', href: '/driver/tracking', icon: MapIcon, current: location.pathname === '/driver/tracking' }
        ];
      case 'PASSENGER':
        return [
          ...baseItems,
          { name: 'Find Routes', href: '/passenger/routes', icon: MapIcon, current: location.pathname === '/passenger/routes' },
          { name: 'My Bookings', href: '/passenger/bookings', icon: TicketIcon, current: location.pathname === '/passenger/bookings' },
          { name: 'Track Bus', href: '/passenger/tracking', icon: TruckIcon, current: location.pathname === '/passenger/tracking' }
        ];
      default:
        return baseItems;
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'ADMIN':
        return '/admin';
      case 'DRIVER':
        return '/driver';
      case 'PASSENGER':
        return '/passenger';
      default:
        return '/';
    }
  };

  const navigation = getNavigationItems();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">KSRTC</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    item.current
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-4 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <TruckIcon className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">KSRTC</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => setShowNotificationSettings(true)}
                  className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600"
                  title="Notification Settings"
                >
                  <BellIcon className={`h-5 w-5 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                </button>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
};

export default Layout;
