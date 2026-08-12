import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { SidebarProvider, useSidebar } from '../context/SidebarContext';
import { useLanguage } from '../context/useLanguage';

const LayoutInner = ({ titleKey }) => {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Must match Sidebar.jsx inline style widths exactly
  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 270;

  const pageTitle = t(titleKey);

  return (
    <div className="app-container flex min-h-screen w-screen bg-app transition-colors duration-200">
      {/* Mobile overlay — dims background when sidebar is open */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[98]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content — margin exactly equals sidebar width, no gap */}
      <div
        className="flex-1 flex flex-col min-h-screen overflow-y-auto bg-app"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <Navbar pageTitle={pageTitle} />
        <main className="flex-1 p-6 md:p-8 bg-app transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = ({ titleKey }) => (
  <SidebarProvider>
    <LayoutInner titleKey={titleKey} />
  </SidebarProvider>
);

export default DashboardLayout;
