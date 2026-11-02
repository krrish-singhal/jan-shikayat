import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, User, LogOut, CheckCheck, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, unreadNotifications, refreshNotifications, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotificationsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = () => {
    if (!notificationsOpen) {
      fetchNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotificationsList((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Tricolor Top Stripe */}
      <div className="gov-tricolor-strip w-full" />

      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Mobile Menu & Government Header Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 lg:hidden border border-slate-200"
            aria-label="Open Municipal Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#0f3b68] tracking-tight hidden sm:inline-block">
              Municipal Corporation of India
            </span>
            <span className="text-slate-300 hidden sm:inline-block">•</span>
            <span className="text-xs text-slate-600 font-medium truncate max-w-[200px] sm:max-w-none">
              Grievance Redressal Workspace
            </span>
          </div>
        </div>

        {/* Right Controls: Notifications & Authority Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative p-2 text-slate-600 hover:text-[#0f3b68] hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
              title="Official Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in-50 duration-150">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    System Notifications
                  </span>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-[#0f3b68] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifications ? (
                    <div className="p-6 text-center text-xs text-slate-500">Checking dispatches...</div>
                  ) : notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No new notifications recorded.</div>
                  ) : (
                    notificationsList.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                        className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                          item.isRead ? 'text-slate-500' : 'bg-blue-50/50 text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="leading-snug flex-1">{item.message}</p>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#0f3b68] shrink-0 mt-1" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Authority Mini Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#0f3b68] text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-300/40">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight max-w-[130px] truncate">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                {user?.staffId || user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
