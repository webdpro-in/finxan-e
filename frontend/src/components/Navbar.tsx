/**
 * Navbar Component
 * Small circle menu button (top-left) that opens sidebar
 */

import React from 'react';
import './Navbar.css';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className="navbar">
      <button className="menu-button" onClick={onMenuClick} title="Menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </nav>
  );
};
