import type { ReactNode } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  variant: 'job-seeker' | 'recruiter';
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, variant, title }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar variant={variant} />
      <div className="flex-1 flex flex-col ml-64 min-w-0 h-full overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
