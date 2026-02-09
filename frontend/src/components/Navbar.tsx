/**
 * Navbar Component
 * Logo button (top-left) that opens sidebar
 */

import React from 'react';
import './Navbar.css';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  return (
    <nav className="navbar">
      <button className="logo-button" onClick={onMenuClick} title="Menu">
        <img src="/finxan.png" alt="Finxan" className="logo-image" />
      </button>
    </nav>
  );
};
