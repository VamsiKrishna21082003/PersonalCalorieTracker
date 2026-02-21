'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Sidebar from './Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { 
      isMobileOpen: false, 
      setIsMobileOpen: () => {},
      isCollapsed: false,
      setIsCollapsed: () => {},
    };
  }
  return context;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { isAuthenticated } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const sidebarWidth = isCollapsed ? 64 : 240;

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-x-hidden">
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Menu"
            className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Content wrapper with dynamic padding for desktop */}
          <div 
            className="pt-16 md:pt-0 min-h-screen transition-all duration-300 ease-in-out"
            style={{ 
              paddingLeft: isDesktop ? `${sidebarWidth}px` : 0,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
