import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useProfile } from '../../hooks';
import { useUnreadNotificationCount } from '../../hooks/use-notifications';
import { getFileUrl, getInitials } from '../../Utils';
import { useQueryClient } from '@tanstack/react-query';
import NotificationDropdown from '../notification-dropdown';
import { ThemeToggle } from '../ui';
import lakshyaLogo from '../../assets/lakhsya-logo.svg';

interface NavbarProps {
  title?: string;
  onToggleSidebar?: () => void;
  showLogo?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ title, onToggleSidebar, showLogo = true }) => {
  const { user, logout } = useAuth();
  const { data: profileData } = useProfile();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: unreadCountResponse } = useUnreadNotificationCount();

  const profile = profileData?.data;
  const avatarUrl = getFileUrl(profile?.profileImageUrl || user?.profileImageUrl);
  const displayName = profile?.fullName || user?.fullName || user?.name || 'User';
  const initials = getInitials(displayName);
  const unreadCount = unreadCountResponse?.data?.unreadCount || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole = user?.role || 'job_seeker';
  const profilePath = userRole === 'admin' ? '/admin/profile' :
                      userRole === 'recruiter' ? '/recruiter/profile' :
                      '/job-seeker/profile';

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/50 px-6 py-4 transition-colors duration-300 dark:border-slate-800/50">
      <div className="flex items-center gap-4">
        {showLogo && (
          <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
            <img
              src={lakshyaLogo}
              alt="Lakshya Logo"
              className="h-8 w-auto"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        {userRole !== 'admin' && (
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setShowDropdown(false);
              }}
              className="relative rounded-full border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        )}

        <ThemeToggle />

        {/* User Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-slate-200 hover:bg-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-100 dark:bg-indigo-500/15">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    {initials}
                  </span>
                </div>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{displayName}</p>
              <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role?.replace('_', ' ') || 'Guest'}</p>
            </div>
            <svg 
              className={`w-4 h-4 text-slate-400 transition-transform dark:text-slate-500 ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="font-medium text-slate-900 dark:text-slate-100">{displayName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <Link
                to={profilePath}
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Profile
              </Link>
              <button
                onClick={async () => {
                  setShowDropdown(false);
                  // Clear all queries before logout to prevent stale data
                  await queryClient.cancelQueries();
                  queryClient.clear();
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
