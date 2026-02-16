import type { ReactNode } from 'react';
import Sidebar from './sidebar';
import Navbar from './navbar';
import Footer from './footer';

interface DashboardLayoutProps {
  children: ReactNode;
  variant: 'job-seeker' | 'recruiter';
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, variant, title }) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar variant={variant} />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Navbar title={title} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
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
