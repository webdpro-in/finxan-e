/**
 * API Configuration Modal
 * Allows users to configure their own AI API providers
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './APIConfigModal.css';

interface APIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = {
  textGeneration: [
    {
      id: 'gemini',
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.0-flash',
      recommended: true,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      endpoint: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-sonnet-20240229',
    },
    {
      id: 'custom',
      name: 'Custom API',
      endpoint: '',
      defaultModel: '',
    },
  ],
  imageGeneration: [
    {
      id: 'dalle',
      name: 'DALL-E (OpenAI)',
      endpoint: 'https://api.openai.com/v1/images/generations',
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      endpoint: '',
    },
    {
      id: 'custom',
      name: 'Custom API',
      endpoint: '',
    },
  ],
};

export const APIConfigModal: React.FC<APIConfigModalProps> = ({ isOpen, onClose }) => {
  const { user, updateAPIConfig } = useAuth();
  
  const [textProvider, setTextProvider] = useState<string>('gemini');
  const [textApiKey, setTextApiKey] = useState<string>('');
  const [textModel, setTextModel] = useState<string>('');
  const [textEndpoint, setTextEndpoint] = useState<string>('');
  
  const [imageProvider, setImageProvider] = useState<string>('dalle');
  const [imageApiKey, setImageApiKey] = useState<string>('');
  const [imageEndpoint, setImageEndpoint] = useState<string>('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load existing config
  useEffect(() => {
    if (user?.apiConfig) {
      const config = user.apiConfig;
      setTextProvider(config.textGeneration.provider);
      setTextApiKey(config.textGeneration.apiKey);
      setTextModel(config.textGeneration.model || '');
      setTextEndpoint(config.textGeneration.endpoint || '');
      
      if (config.imageGeneration) {
        setImageProvider(config.imageGeneration.provider);
        setImageApiKey(config.imageGeneration.apiKey);
        setImageEndpoint(config.imageGeneration.endpoint || '');
      }
    }
  }, [user]);

  // Update model and endpoint when provider changes
  useEffect(() => {
    const provider = PROVIDERS.textGeneration.find(p => p.id === textProvider);
    if (provider) {
      setTextModel(provider.defaultModel || '');
      setTextEndpoint(provider.endpoint || '');
    }
  }, [textProvider]);

  useEffect(() => {
    const provider = PROVIDERS.imageGeneration.find(p => p.id === imageProvider);
    if (provider) {
      setImageEndpoint(provider.endpoint || '');
    }
  }, [imageProvider]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Simple validation
      if (!textApiKey) {
        setTestResult({ success: false, message: 'API key is required' });
        setIsTesting(false);
        return;
      }

      // Test connection by making a simple API call
      const testMessage = 'Hello';
      let response;

      if (textProvider === 'openai') {
        response = await fetch(`${textEndpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${textApiKey}`,
          },
          body: JSON.stringify({
            model: textModel,
            messages: [{ role: 'user', content: testMessage }],
            max_tokens: 10,
          }),
        });
      } else if (textProvider === 'gemini') {
        response = await fetch(`${textEndpoint}/models/${textModel}:generateContent?key=${textApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testMessage }] }],
          }),
        });
      } else {
        setTestResult({ success: false, message: 'Provider not supported for testing yet' });
        setIsTesting(false);
        return;
      }

      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        const error = await response.text();
        setTestResult({ success: false, message: `Connection failed: ${error}` });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const config = {
      textGeneration: {
        provider: textProvider as any,
        apiKey: textApiKey,
        model: textModel,
        endpoint: textEndpoint,
      },
      imageGeneration: imageApiKey ? {
        provider: imageProvider as any,
        apiKey: imageApiKey,
        endpoint: imageEndpoint,
      } : undefined,
    };

    updateAPIConfig(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="api-modal-overlay" onClick={onClose}>
      <div className="api-modal" onClick={(e) => e.stopPropagation()}>
        <div className="api-modal-header">
          <h2>API Configuration</h2>
          <button className="api-modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>

        <div className="api-modal-content">
          {/* Text Generation API */}
          <div className="api-section">
            <h3 className="api-section-title">Text Generation API</h3>
            
            <div className="api-form-group">
              <label>Provider</label>
              <select 
                value={textProvider} 
                onChange={(e) => setTextProvider(e.target.value)}
                className="api-select"
              >
                {PROVIDERS.textGeneration.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} {provider.recommended ? '(Recommended)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="api-form-group">
              <label>API Key</label>
              <input
                type="password"
                value={textApiKey}
                onChange={(e) => setTextApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="api-input"
              />
            </div>

            <div className="api-form-group">
              <label>Model (Optional)</label>
              <input
                type="text"
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                placeholder="e.g., gpt-4o-mini"
                className="api-input"
              />
            </div>

            {textProvider === 'custom' && (
              <div className="api-form-group">
                <label>Endpoint URL</label>
                <input
                  type="text"
                  value={textEndpoint}
                  onChange={(e) => setTextEndpoint(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="api-input"
                />
              </div>
            )}
          </div>

          {/* Image Generation API */}
          <div className="api-section">
            <h3 className="api-section-title">Image Generation API (Optional)</h3>
            
            <div className="api-form-group">
              <label>Provider</label>
              <select 
                value={imageProvider} 
                onChange={(e) => setImageProvider(e.target.value)}
                className="api-select"
              >
                {PROVIDERS.imageGeneration.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="api-form-group">
              <label>API Key</label>
              <input
                type="password"
                value={imageApiKey}
                onChange={(e) => setImageApiKey(e.target.value)}
                placeholder="Enter your API key (optional)"
                className="api-input"
              />
            </div>

            {imageProvider === 'custom' && (
              <div className="api-form-group">
                <label>Endpoint URL</label>
                <input
                  type="text"
                  value={imageEndpoint}
                  onChange={(e) => setImageEndpoint(e.target.value)}
                  placeholder="https://api.example.com/generate"
                  className="api-input"
                />
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`api-test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.message}
            </div>
          )}
        </div>

        <div className="api-modal-footer">
          <button 
            className="api-button api-button-secondary" 
            onClick={handleTestConnection}
            disabled={isTesting || !textApiKey}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button 
            className="api-button api-button-primary" 
            onClick={handleSave}
            disabled={!textApiKey}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
