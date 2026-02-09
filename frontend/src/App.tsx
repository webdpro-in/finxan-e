/**
 * Main App Component
 * Orchestrates the entire Haru AI Teacher application
 */

import { useEffect, useState } from 'react';
import { Live2DCanvas } from './components/Live2DCanvas';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { InputPanel } from './components/InputPanel';
import { DebugPanel } from './components/DebugPanel';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { useAppStore } from './store/useAppStore';
import { aiService } from './services/AIService';
import { motionManager } from './services/MotionManager';
import { sessionManager } from './services/SessionManager';
import './App.css';

const MODEL_PATH = '/haru_greeter_pro_jp/runtime/haru_greeter_t05.model3.json';

function App() {
  const { setLeftPanelContent, setTeachingSegments } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize session
    sessionManager.initializeSession();

    // Initialize with greeting
    const initializeGreeting = async () => {
      const greeting = aiService.getGreeting();
      setLeftPanelContent(greeting.text);
      setTeachingSegments(greeting.segments);
      
      // Wait for model to load before playing greeting gesture
      // Check every 500ms for up to 5 seconds
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = setInterval(() => {
        attempts++;
        if (motionManager.getState() !== 'idle' || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (attempts < maxAttempts) {
            console.log('🎬 Playing greeting animation');
            motionManager.requestGesture('greeting');
          } else {
            console.warn('⚠️ Model not ready after 5 seconds, skipping greeting animation');
          }
        }
      }, 500);
    };

    initializeGreeting();

    // Cleanup on unmount
    return () => {
      motionManager.destroy();
    };
  }, []);

  return (
    <div className="app">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="app-main">
        <div className="left-section">
          <RightPanel />
        </div>

        <div className="center-section">
          <div className="character-container">
            <Live2DCanvas modelPath={MODEL_PATH} />
          </div>
        </div>

        <div className="right-section">
          <LeftPanel />
        </div>
      </main>

      <InputPanel />
      <DebugPanel />
    </div>
  );
}

export default App;
