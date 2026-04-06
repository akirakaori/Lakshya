import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import lakshyaLogo from '../../assets/lakhsya-logo.svg';
import { useAuth } from '../../context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '../ui';

interface SidebarProps {
  variant: 'job-seeker' | 'recruiter' | 'admin';
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ variant, isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const jobSeekerLinks = [
    { path: '/job-seeker/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/job-seeker/browse-jobs', label: 'Job Search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { path: '/job-seeker/saved-jobs', label: 'Saved Jobs', icon: 'M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364l-7.682-7.682a4.5 4.5 0 010-6.364z' },
    { path: '/job-seeker/my-applications', label: 'My Applications', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { path: '/job-seeker/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const recruiterLinks = [
    { path: '/recruiter/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/recruiter/post-job', label: 'Post New Job', icon: 'M12 4v16m8-8H4' },
    { path: '/recruiter/manage-jobs', label: 'Manage Job Posts', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/recruiter/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const adminLinks = [
    { path: '/AdminDashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6' },
    { path: '/admin/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  const links =
    variant === 'job-seeker'
      ? jobSeekerLinks
      : variant === 'recruiter'
        ? recruiterLinks
        : adminLinks;
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition-all duration-300 ease-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className={`border-b border-slate-200 dark:border-slate-800 ${isCollapsed ? 'p-4' : 'p-6'}`}>
          <Link
            to="/"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}
            onClick={onCloseMobile}
          >
            <div className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
              <img src={lakshyaLogo} alt="Lakshya Logo" className="h-6 w-auto" />
            </div>
            {!isCollapsed && <span className="text-xl font-bold text-slate-900 dark:text-white">Lakshya</span>}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#2563EB] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                  title={isCollapsed ? link.label : undefined}
                >
                  <svg
                    className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                      isCollapsed ? 'scale-110' : 'scale-100'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  <span
                    className={`overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ${
                      isCollapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-[11rem] translate-x-0 opacity-100'
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 p-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full px-4 py-3 text-left text-slate-600 dark:text-slate-300 transition-colors hover:bg-red-600 hover:text-white ${
              isCollapsed ? 'px-2 text-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <svg
                className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
                  isCollapsed ? 'scale-110' : 'scale-100'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ${
                  isCollapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-[11rem] translate-x-0 opacity-100'
                }`}
              >
                Logout
              </span>
            </span>
          </button>
        </div>

        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            logout();
            navigate('/login', { replace: true });
          }}
          title="Logout Confirmation"
          message="Are you sure you want to logout? You will need to login again to access your account."
          confirmText="Logout"
          cancelText="Cancel"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
        />
      </aside>
    </>
  );
};

export default Sidebar;
