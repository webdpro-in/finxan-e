/**
 * Loading Indicator Component
 * Displays loading states for various operations
 */

import React from 'react';

export type LoadingType = 'app' | 'model' | 'thinking' | 'synthesis' | 'transcription' | 'image';

interface LoadingIndicatorProps {
  type: LoadingType;
  message?: string;
  progress?: number; // 0-100
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ type, message, progress }) => {
  const getDefaultMessage = (): string => {
    switch (type) {
      case 'app':
        return 'Loading Haru AI Teacher...';
      case 'model':
        return 'Loading Haru character...';
      case 'thinking':
        return 'Haru is thinking...';
      case 'synthesis':
        return 'Generating speech...';
      case 'transcription':
        return 'Transcribing audio...';
      case 'image':
        return 'Loading images...';
      default:
        return 'Loading...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  return (
    <div className="loading-indicator">
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <p className="loading-message">{displayMessage}</p>
      {progress !== undefined && (
        <div className="loading-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}
      <style>{`
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
        }

        .spinner {
          width: 100%;
          height: 100%;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4facfe;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-message {
          font-size: 1rem;
          color: #666;
          margin: 0;
        }

        .loading-progress {
          width: 200px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: #f3f3f3;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};
