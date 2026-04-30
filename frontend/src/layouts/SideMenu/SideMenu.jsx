import React, { useState } from 'react';
import UserIcon from '../../../svg/User.svg';
import AssetIcon from '../../../svg/Asset.svg';
import SetupIcon from '../../../svg/Setup.svg';
import ProfileIcon from '../../../svg/Profile.svg';
import PasswordIcon from '../../../svg/Password.svg';
import LogoutIcon from '../../../svg/Logout.svg';
import './SideMenu.css';

const menuItems = [
  { href: 'user', label: 'User', icon: UserIcon },
  { href: 'asset', label: 'Asset', icon: AssetIcon },
  { href: 'setup', label: 'Setup', icon: SetupIcon },
];

const userDropdownItems = [
  { label: 'Profile', icon: ProfileIcon },
  { label: 'Change Password', icon: PasswordIcon },
  { label: 'Logout', icon: LogoutIcon },
];

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
          {menuItems.map((item, index) => (
            <li key={index}>
              <a href={item.href} className="side-menu__link">
                <img src={item.icon} className="side-menu__icon" alt={`${item.label} icon`} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
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
              {userDropdownItems.map((item, index) => (
                <li key={index}>
                  <button type="button" className="side-menu__dropdown-item">
                    <img
                      src={item.icon}
                      className="side-menu__dropdown-icon"
                      alt={`${item.label} icon`}
                    />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SideMenu;