/**
 * Sidebar Component
 * Professional slide-in menu with organized sections
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APIConfigModal } from './APIConfigModal';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isAPIModalOpen, setIsAPIModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowSettings(false);
    onClose();
  };

  const handleAPIConnect = () => {
    if (!isAuthenticated) {
      alert('Please login with Google first to configure your APIs.');
      return;
    }
    setIsAPIModalOpen(true);
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {isAuthenticated ? (
            <>
              {/* Project Notes */}
              <div className="sidebar-section">
                <button className="sidebar-menu-button">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                  </svg>
                  <span>Project Notes</span>
                </button>
              </div>

              {/* Your Chats */}
              <div className="sidebar-section">
                <button className="sidebar-menu-button">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                  </svg>
                  <span>Your Chats</span>
                </button>
              </div>

              {/* Spacer */}
              <div className="sidebar-spacer"></div>

              {/* Bottom Section */}
              <div className="sidebar-bottom">
                {/* API Connect */}
                <button className="sidebar-menu-button" onClick={handleAPIConnect}>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>API Connect</span>
                </button>

                {/* API Status */}
                {user?.apiConfig && (
                  <div className="api-status-compact">
                    <span className="status-dot active"></span>
                    <span className="status-text">
                      {user.apiConfig.textGeneration.provider.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Google Profile */}
                <div className="google-profile-compact">
                  <img src={user?.picture} alt={user?.name} className="profile-picture-small" />
                  <div className="profile-info-compact">
                    <div className="profile-name-small">{user?.name}</div>
                    <div className="profile-email-small">{user?.email}</div>
                  </div>
                </div>

                {/* Settings */}
                <button 
                  className="sidebar-menu-button" 
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                  </svg>
                  <span>Settings</span>
                  <svg 
                    className={`chevron ${showSettings ? 'open' : ''}`}
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>

                {/* Settings Submenu */}
                {showSettings && (
                  <div className="settings-submenu">
                    <button className="submenu-button" onClick={handleLogout}>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Empty state when not logged in */}
              <div className="login-prompt">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <p>Sign in to access your workspace</p>
              </div>

              {/* Sign in with Google at bottom */}
              <div className="sidebar-bottom">
                <button 
                  className="google-login-button" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* API Configuration Modal */}
      <APIConfigModal 
        isOpen={isAPIModalOpen} 
        onClose={() => setIsAPIModalOpen(false)} 
      />
    </>
  );
};
