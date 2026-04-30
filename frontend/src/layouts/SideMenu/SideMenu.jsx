import React, { useState } from 'react';
import UserIcon from '../../../svg/User.svg';
import AssetIcon from '../../../svg/Asset.svg';
import SetupIcon from '../../../svg/Setup.svg';
import ProfileIcon from '../../../svg/Profile.svg';
import PasswordIcon from '../../../svg/Password.svg';
import LogoutIcon from '../../../svg/Logout.svg';
import './SideMenu.css';

const user = {
  name: 'Super Admin',
  initials: 'SA',
};

const SideMenu = ({ isOpen }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
  };

  return (
    <aside className={`side-menu ${isOpen ? 'open' : 'closed'}`}>
      <nav className="side-menu__nav">
        <ul>
          <li>
            <a href="user" className="side-menu__link">
              <img src={UserIcon} className="side-menu__icon" alt="User icon" />
              <span>User</span>
            </a>
          </li>
          <li>
            <a href="asset" className="side-menu__link">
              <img src={AssetIcon} className="side-menu__icon" alt="Asset icon" />
              <span>Asset</span>
            </a>
          </li>
          <li>
            <a href="setup" className="side-menu__link">
              <img src={SetupIcon} className="side-menu__icon" alt="Setup icon" />
              <span>Setup</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="side-menu__footer">
        <button
          type="button"
          className="side-menu__user-button"
          onClick={toggleUserMenu}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="true"
          title={user.name}
        >
          <span className="side-menu__user-avatar">{user.initials}</span>
        </button>

        {isUserMenuOpen && (
          <div className="side-menu__user-dropdown">
            <ul>
              <li>
                <button type="button" className="side-menu__dropdown-item">
                  <img src={ProfileIcon} className="side-menu__dropdown-icon" alt="Profile icon" />
                  <span>Profile</span>
                </button>
              </li>
              <li>
                <button type="button" className="side-menu__dropdown-item">
                  <img src={PasswordIcon} className="side-menu__dropdown-icon" alt="Change Password icon" />
                  <span>Change Password</span>
                </button>
              </li>
              <li>
                <button type="button" className="side-menu__dropdown-item">
                  <img src={LogoutIcon} className="side-menu__dropdown-icon" alt="Logout icon" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SideMenu;