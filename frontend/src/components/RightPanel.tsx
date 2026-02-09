/**
 * Right Panel Component
 * Displays generated images
 */

import React from 'react';
import { useAppStore } from '../store/useAppStore';
import './RightPanel.css';

export const RightPanel: React.FC = () => {
  const { generatedImages } = useAppStore();

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h2>Generated Images</h2>
      </div>
      <div className="panel-content">
        {generatedImages && generatedImages.length > 0 ? (
          <div className="image-grid">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="image-container">
                <img
                  src={imageUrl}
                  alt={`Generated ${index + 1}`}
                  className="reference-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="placeholder">
            <p>🎨 Generated images will appear here</p>
            <p className="placeholder-hint">Ask me to create or explain something visual!</p>
          </div>
        )}
      </div>
    </div>
  );
};
