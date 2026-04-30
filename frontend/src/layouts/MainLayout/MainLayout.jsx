import React, { useState, useEffect } from 'react';
import Header from '../Header/Header.jsx';
import SideMenu from '../SideMenu/SideMenu.jsx';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="main-layout">
      <Header onMenuClick={handleToggleSidebar} />

      <div className="main-layout__body">
        <SideMenu isOpen={isSidebarOpen} />
        {isMobile && isSidebarOpen && (
          <div className="main-layout__overlay" onClick={() => setIsSidebarOpen(false)} />
        )}
        <main className="main-layout__main">
          {children}
        </main>
      </div>

    </div>
  );
};

export default MainLayout;