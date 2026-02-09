/**
 * Sidebar Component
 * Slide-in menu with profile, settings, logout, and subscription info
 */

import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const handleLogout = () => {
    console.log('Logout clicked');
    // Implement logout logic
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // Implement settings logic
  };

  const handleProfile = () => {
    console.log('Profile clicked');
    // Implement profile logic
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-brand">Finxan AI</h2>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="sidebar-section-title">Account</h3>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <button className="sidebar-menu-button" onClick={handleProfile}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  Profile Details
                </button>
              </li>
              <li className="sidebar-menu-item">
                <button className="sidebar-menu-button" onClick={handleSettings}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                  Settings
                </button>
              </li>
              <li className="sidebar-menu-item">
                <button className="sidebar-menu-button" onClick={handleLogout}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414 0L4 7.414 5.414 6l3.293 3.293L13.586 5 15 6.414z" clipRule="evenodd"/>
                  </svg>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="subscription-info">
            <div className="subscription-title">Subscription</div>
            <div className="subscription-plan">Free Plan</div>
          </div>
        </div>
      </div>
    </>
  );
};
