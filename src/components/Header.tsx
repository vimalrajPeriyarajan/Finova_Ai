import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Globe,
  Bell,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/apiClient';
import { NotificationItem } from '../types/education';

interface HeaderProps {
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, isAuthenticated, isAdmin, logout, switchUser } = useAuth();
  const { language, setLanguage, languages, currentLanguageObj, t } = useLanguage();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.notifications.getAll();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => setActiveTab('dashboard')}
          id="brand-logo-button"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                FINOVA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                v2.6
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              AI Personal Finance & Resource Discovery
            </p>
          </div>
        </div>

        {/* Right Controls: Language, Notifications, User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick Demo Switcher Pill (Alex Student vs Admin) */}
          <div className="hidden lg:flex items-center bg-slate-100 rounded-lg p-1 text-xs border border-slate-200">
            <button
              onClick={() => switchUser('STUDENT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                !isAdmin ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="switch-student-btn"
            >
              Alex (Student)
            </button>
            <button
              onClick={() => switchUser('ADMIN')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                isAdmin ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              id="switch-admin-btn"
            >
              Compliance Admin
            </button>
          </div>

          {/* 15 Languages Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              id="language-picker-btn"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-xs">
                {currentLanguageObj.code === 'en' ? 'EN' : currentLanguageObj.nativeName}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Supported Languages (15)
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50/50 transition-colors ${
                      language === l.code ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span>
                      {l.name} <span className="text-slate-400 font-normal">({l.nativeName})</span>
                    </span>
                    {language === l.code && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                id="notifications-bell-btn"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-xs font-semibold text-slate-800">
                      Notifications ({notifications.length})
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs transition-colors ${
                            !n.isRead ? 'bg-emerald-50/40' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                              {n.type === 'BUDGET_ALERT' && (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              {n.type === 'SAVINGS_REMINDER' && (
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                              )}
                              {n.type === 'REPORT_UPDATE' && (
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              )}
                              <span>{n.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Pill & Dropdown */}
          {isAuthenticated ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                id="user-profile-menu-btn"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-800 leading-none">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {user?.role === 'ADMIN' ? '🛡️ Admin' : 'Student / Youth'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        user?.role === 'ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {user?.role === 'ADMIN' ? 'Compliance Administrator' : 'Standard User'}
                    </span>
                  </div>

                  <div className="py-1">
                    <div className="px-4 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                      Quick Demo Switch
                    </div>
                    <button
                      onClick={() => {
                        switchUser('STUDENT');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Switch to Alex (Student)</span>
                      {!isAdmin && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => {
                        switchUser('ADMIN');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Switch to Compliance Admin</span>
                      {isAdmin && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                      id="logout-btn"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('auth_logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
              id="login-register-header-btn"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
