import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  Search,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
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

interface SidebarNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  search?: string;
}

type SidebarNavByVariant = Record<SidebarProps['variant'], SidebarNavItem[]>;

const sidebarNavItems: SidebarNavByVariant = {
  'job-seeker': [
    { path: '/job-seeker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/job-seeker/browse-jobs', label: 'Job Search', icon: Search },
    { path: '/job-seeker/saved-jobs', label: 'Saved Jobs', icon: Heart },
    { path: '/job-seeker/my-applications', label: 'My Applications', icon: FileText },
    { path: '/job-seeker/profile', label: 'Profile', icon: User },
  ],
  recruiter: [
    { path: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/recruiter/post-job', label: 'Post New Job', icon: PlusSquare },
    { path: '/recruiter/manage-jobs', label: 'Manage Job Posts', icon: BriefcaseBusiness },
    { path: '/recruiter/profile', label: 'Profile', icon: User },
  ],
  admin: [
    { path: '/AdminDashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/AdminDashboard', search: '?tab=users', label: 'Users', icon: Users },
    { path: '/AdminDashboard', search: '?tab=posts', label: 'Posts', icon: BriefcaseBusiness },
    { path: '/admin/profile', label: 'Profile', icon: User },
  ],
};

const Sidebar: React.FC<SidebarProps> = ({ variant, isCollapsed, isMobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const links = sidebarNavItems[variant];

  const isLinkActive = (item: SidebarNavItem, isPathActive: boolean) => {
    if (!isPathActive) {
      return false;
    }

    if (item.search) {
      return location.search === item.search;
    }

    return true;
  };

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
              <li key={`${link.path}${link.search ?? ''}`}>
                <NavLink
                  to={`${link.path}${link.search ?? ''}`}
                  onClick={onCloseMobile}
                  end={!link.search}
                  className={({ isActive }) => {
                    const active = isLinkActive(link, isActive);

                    return `flex items-center gap-3 px-4 py-3 transition-colors ${
                      active
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`;
                  }}
                  title={isCollapsed ? link.label : undefined}
                >
                  <link.icon
                    size={20}
                    className={`flex-shrink-0 transition-transform duration-300 ${
                      isCollapsed ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  <span
                    className={`overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ${
                      isCollapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-[11rem] translate-x-0 opacity-100'
                    }`}
                  >
                    {link.label}
                  </span>
                </NavLink>
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
              <LogOut
                size={20}
                className={`flex-shrink-0 transition-transform duration-300 ${
                  isCollapsed ? 'scale-110' : 'scale-100'
                }`}
              />
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
