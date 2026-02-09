/**
 * Eye Controller Service
 * Controls Haru's eye and head direction
 * - Look left when images appear
 * - Look right when chat response
 * - Look center when idle
 */

import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

export class EyeController {
  private model: Live2DModel | null = null;
  private currentDirection: 'left' | 'right' | 'center' = 'center';
  private returnToCenterTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize with Live2D model
   */
  public setModel(model: Live2DModel): void {
    this.model = model;
    console.log('👀 EyeController initialized');
  }

  /**
   * Look left (at images panel)
   */
  public lookLeft(duration: number = 3000): void {
    if (!this.model) {
      console.warn('⚠️ Model not set for eye control');
      return;
    }

    try {
      const coreModel = (this.model.internalModel as any).coreModel;
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById('ParamAngleX', -15);
        this.currentDirection = 'left';
        console.log('👀 Looking left (images)');

        // Auto return to center after duration
        this.scheduleReturnToCenter(duration);
      }
    } catch (error) {
      console.error('❌ Error looking left:', error);
    }
  }

  /**
   * Look right (at chat panel)
   */
  public lookRight(duration: number = 3000): void {
    if (!this.model) {
      console.warn('⚠️ Model not set for eye control');
      return;
    }

    try {
      const coreModel = (this.model.internalModel as any).coreModel;
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById('ParamAngleX', 15);
        this.currentDirection = 'right';
        console.log('👀 Looking right (chat)');

        // Auto return to center after duration
        this.scheduleReturnToCenter(duration);
      }
    } catch (error) {
      console.error('❌ Error looking right:', error);
    }
  }

  /**
   * Look center (at user)
   */
  public lookCenter(): void {
    if (!this.model) {
      console.warn('⚠️ Model not set for eye control');
      return;
    }

    try {
      const coreModel = (this.model.internalModel as any).coreModel;
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById('ParamAngleX', 0);
        this.currentDirection = 'center';
        console.log('👀 Looking center (user)');

        // Clear any pending return to center
        if (this.returnToCenterTimeout) {
          clearTimeout(this.returnToCenterTimeout);
          this.returnToCenterTimeout = null;
        }
      }
    } catch (error) {
      console.error('❌ Error looking center:', error);
    }
  }

  /**
   * Get current direction
   */
  public getCurrentDirection(): 'left' | 'right' | 'center' {
    return this.currentDirection;
  }

  /**
   * Schedule automatic return to center
   */
  private scheduleReturnToCenter(duration: number): void {
    // Clear any existing timeout
    if (this.returnToCenterTimeout) {
      clearTimeout(this.returnToCenterTimeout);
    }

    // Schedule return to center
    this.returnToCenterTimeout = setTimeout(() => {
      this.lookCenter();
    }, duration);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.returnToCenterTimeout) {
      clearTimeout(this.returnToCenterTimeout);
      this.returnToCenterTimeout = null;
    }
    this.model = null;
  }
}

// Singleton instance
export const eyeController = new EyeController();
