import React, { useState } from 'react';
import Header from '../Header/Header.jsx';
import SideMenu from '../SideMenu/SideMenu.jsx';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="main-layout">
      <Header onMenuClick={handleToggleSidebar} />

      <div className="main-layout__body">
        <SideMenu isOpen={isSidebarOpen} />
        <main className="main-layout__main">
          {children}
        </main>
      </div>

    </div>
  );
};

export default MainLayout;