/**
 * Live2D Setup
 * Ensures PIXI is available globally for pixi-live2d-display
 */

import * as PIXI from 'pixi.js';

// Expose PIXI globally
if (typeof window !== 'undefined') {
  (window as any).PIXI = PIXI;
  console.log('✅ PIXI exposed to window');
}

// Check if Cubism Core is loaded
if (typeof window !== 'undefined') {
  const checkCubism = () => {
    const hasLive2D = (window as any).Live2D;
    const hasCubismCore = (window as any).Live2DCubismCore;
    
    if (hasLive2D) {
      console.log('✅ Cubism 2 Core loaded successfully');
      return true;
    }
    
    if (hasCubismCore) {
      console.log('✅ Cubism 4 Core loaded successfully');
      console.log('Cubism Core Version:', hasCubismCore.Version);
      return true;
    }
    
    console.warn('⚠️ Cubism Core not found yet, waiting...');
    return false;
  };
  
  // Check immediately
  if (!checkCubism()) {
    // Check again after delays
    setTimeout(checkCubism, 100);
    setTimeout(checkCubism, 500);
    setTimeout(checkCubism, 1000);
  }
}

export {};
