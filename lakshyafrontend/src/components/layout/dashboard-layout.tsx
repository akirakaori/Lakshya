import React, { useEffect, useState, type ReactNode } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import Footer from './footer';

interface DashboardLayoutProps {
  children: ReactNode;
  variant: 'job-seeker' | 'recruiter' | 'admin';
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, variant, title }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('dashboard-sidebar-collapsed');
    if (savedState === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
      return;
    }

    setIsSidebarCollapsed((prev) => !prev);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <Sidebar
        variant={variant}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={handleCloseMobileSidebar}
      />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-[margin] duration-300 ease-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Navbar
          title={title}
          onToggleSidebar={handleToggleSidebar}
          showLogo={variant === 'admin'}
        />
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
          <main className="min-h-screen p-6">
            {children}
          </main>
          <Footer variant="dashboard" />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
