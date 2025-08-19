import React from 'react';
import { Search, Bell, User, Menu, ShoppingCart, LogOut } from 'lucide-react';
import { usePharmacyStore } from '../../store';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export const Header: React.FC = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    searchQuery, 
    setSearchQuery,
    cartItems,
    notifications,
    addNotification
  } = usePharmacyStore();
  
  const { user, logout } = useAuthStore();

  const unreadNotifications = notifications.filter(n => n.type === 'warning' || n.type === 'error').length;

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        addNotification('error', 'Failed to logout properly');
      }
      
      // Clear application state
      logout();
      
      // Clear any additional stored data
      localStorage.removeItem('google_drive_token');
      
      addNotification('success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      addNotification('error', 'An error occurred during logout');
    }
  };
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Rx</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 hidden sm:block">
              PharmaCare
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search medicines, batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Cart */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
              <p className="text-xs text-gray-500">Authenticated User</p>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Logout"
              aria-label="Logout from application"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};