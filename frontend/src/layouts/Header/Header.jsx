import React from 'react';
import './Header.css';

const Header = ({ onMenuClick }) => {
  return (
    <header className="header">
      <div className="header__brand">
        <button
          className="header__menu-button"
          aria-label="Toggle sidebar"
          onClick={onMenuClick}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="header__logo-block">
          <span className="header__logo-pill">A</span>
          <span className="header__app-name">ABCD 2.0</span>
        </div>
      </div>

      <div className="header__placeholder">
        {/* Add future top-right controls here if needed */}
      </div>
    </header>
  );
};

export default Header;