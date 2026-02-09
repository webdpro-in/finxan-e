/**
 * Live2D Canvas Component
 * Renders Haru character using PixiJS and pixi-live2d-display
 */

import '../live2d-setup'; // Import setup first
import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { motionManager } from '../services/MotionManager';
import { lipSyncService } from '../services/LipSyncService';
import { eyeController } from '../services/EyeController';
import { useAppStore } from '../store/useAppStore';

interface Live2DCanvasProps {
  modelPath: string;
}

export const Live2DCanvas: React.FC<Live2DCanvasProps> = ({ modelPath }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const modelRef = useRef<Live2DModel | null>(null);

  const { setHaruState } = useAppStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    const initApp = async () => {
      try {
        // Get container dimensions
        const canvas = canvasRef.current!;
        const parent = canvas.parentElement!;
        const width = parent.clientWidth || 600;
        const height = parent.clientHeight || 600;

        console.log('🎨 Initializing canvas:', { width, height });

        // Create PixiJS Application
        const app = new PIXI.Application({
          view: canvas,
          width: width,
          height: height,
          backgroundColor: 0xffffff,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!mounted) return;

        appRef.current = app;
        console.log('✅ PixiJS Application initialized');

        // Load Live2D Model
        await loadModel(app, modelPath);

        // Handle resize - only update x position, never touch scale
        const handleResize = () => {
          if (!appRef.current || !canvasRef.current) return;
          const parent = canvasRef.current.parentElement!;
          const newWidth = parent.clientWidth || 600;
          const newHeight = parent.clientHeight || 600;
          appRef.current.renderer.resize(newWidth, newHeight);
          
          // Only recenter horizontally - keep scale and y position locked
          if (modelRef.current) {
            modelRef.current.x = newWidth / 2;
            // DO NOT touch y or scale - this prevents zoom drift
          }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
          mounted = false;
          window.removeEventListener('resize', handleResize);
          if (modelRef.current) {
            modelRef.current.destroy();
          }
          if (appRef.current) {
            appRef.current.destroy(true);
          }
        };
      } catch (error) {
        console.error('❌ Failed to initialize application:', error);
      }
    };

    initApp();

    return () => {
      mounted = false;
    };
  }, [modelPath]);

  const loadModel = async (app: PIXI.Application, path: string) => {
    try {
      console.log('📦 Loading Live2D model from:', path);
      console.log('🌐 Full URL:', window.location.origin + path);

      // Load model
      const model = await Live2DModel.from(path, {
        autoInteract: false,
      });
      
      modelRef.current = model;
      console.log('✅ Model loaded successfully!');

      // Log model info
      console.log('📊 Model dimensions:', {
        width: model.width,
        height: model.height,
      });

      // FIXED: Set anchor FIRST - center horizontally, top vertically
      // This prevents the "zoomed into body" issue
      model.anchor.set(0.5, 0);

      // FIXED: Use proper scale for full upper body view (head + shoulders + upper torso)
      // 0.32 is the sweet spot for professional AI teacher look
      const scale = 0.32;
      model.scale.set(scale);

      console.log('📏 Applying fixed scale:', scale);

      // FIXED: Position to show full upper body
      // Center horizontally, push down slightly so head is fully visible
      model.x = app.screen.width / 2;
      model.y = 40; // Push down from top to show head

      console.log('📍 Model positioned at:', { x: model.x, y: model.y, scale });

      // Lock model in place - prevent drift and zoom
      model.interactive = false;

      // Add to stage
      app.stage.addChild(model);
      console.log('🎭 Model added to stage');

      // Initialize motion manager
      motionManager.setModel(model);

      // Initialize lip sync service
      lipSyncService.setModel(model);

      // Initialize eye controller
      eyeController.setModel(model);

      // Log available motions for debugging
      console.log('📋 Available motions:', model.internalModel.motionManager.definitions);

      // Set initial state
      setHaruState('idle');

      console.log('🎉 Live2D model loaded and displayed successfully!');
      console.log('✅ Full upper body visible - professional AI teacher view');

    } catch (error) {
      console.error('❌ Failed to load Live2D model:', error);
      console.error('📋 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        path,
        fullURL: window.location.origin + path,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Display error message on canvas
      const errorText = new PIXI.Text('Failed to load character\nCheck console for details', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xff0000,
        align: 'center',
      });
      errorText.anchor.set(0.5);
      errorText.x = app.screen.width / 2;
      errorText.y = app.screen.height / 2;
      app.stage.addChild(errorText);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};
