/**
 * Motion Manager - Finite State Machine for Haru gestures
 * Ensures only one motion plays at a time and handles transitions
 */

import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';
import { MotionName, GestureType, HaruState } from '../types';
import { getMotionForGesture, getMotionDuration } from '../config/motionMapping';

export class MotionManager {
  private model: Live2DModel | null = null;
  private currentMotion: MotionName = 'haru_g_idle';
  private currentState: HaruState = 'idle';
  private isTransitioning: boolean = false;
  private motionQueue: GestureType[] = [];
  private returnToIdleTimeout: NodeJS.Timeout | null = null;
  private gestureCounter: Map<GestureType, number> = new Map();

  /**
   * Initialize with Live2D model
   */
  public setModel(model: Live2DModel): void {
    this.model = model;
    console.log('🎬 MotionManager initialized with model');
    this.playMotion('haru_g_idle', true);
  }

  /**
   * Get current state
   */
  public getState(): HaruState {
    return this.currentState;
  }

  /**
   * Get current motion
   */
  public getCurrentMotion(): MotionName {
    return this.currentMotion;
  }

  /**
   * Helper to map our MotionName enum to the actual index in the model's json.
   * Based on haru_greeter_t05.model3.json where '' group has motions 0 to 26.
   */
  private getMotionIndex(motionName: MotionName): number {
    if (motionName === 'haru_g_idle') return 0;
    const match = motionName.match(/m(\d+)/);
    if (match) return parseInt(match[1], 10);
    return 0; // Default fallback to idle
  }

  /**
   * Play a specific motion
   */
  private async playMotion(motionName: MotionName, loop: boolean = false): Promise<void> {
    if (!this.model) {
      console.warn('⚠️ Model not initialized - motion request ignored');
      return;
    }

    try {
      console.log(`🎬 Playing motion: ${motionName} (loop: ${loop})`);

      // Haru Live2D model motions are grouped under the '' (empty) group name, indexed 0-26
      const motionIndex = this.getMotionIndex(motionName);
      
      // 3 = PriorityLoop, 0 = PriorityNone
      await this.model.motion('', motionIndex, loop ? 3 : 3); // Provide 3 as default priority
      
      this.currentMotion = motionName;
      console.log(`✅ Motion ${motionName} (index: ${motionIndex}) started successfully`);

      // If not looping, schedule return to idle
      if (!loop && motionName !== 'haru_g_idle') {
        const duration = getMotionDuration(motionName);
        this.scheduleReturnToIdle(duration);
      }
    } catch (error) {
      console.error(`❌ Error playing motion ${motionName}:`, error);
    }
  }

  /**
   * Request a gesture (queued if currently transitioning)
   */
  public async requestGesture(gesture: GestureType): Promise<void> {
    if (this.isTransitioning) {
      console.log(`⏳ Gesture ${gesture} queued (currently transitioning)`);
      this.motionQueue.push(gesture);
      return;
    }

    this.isTransitioning = true;

    // Clear any pending return to idle
    if (this.returnToIdleTimeout) {
      clearTimeout(this.returnToIdleTimeout);
      this.returnToIdleTimeout = null;
    }

    // Get deterministic motion for gesture using counter
    const counter = this.gestureCounter.get(gesture) || 0;
    const motion = getMotionForGesture(gesture, counter);
    this.gestureCounter.set(gesture, counter + 1);

    console.log(`🎭 [MotionManager] Gesture: ${gesture}, Motion: ${motion}, Counter: ${counter}`);

    // Update state
    if (gesture === 'idle' || gesture === 'listening') {
      this.currentState = gesture;
    } else {
      this.currentState = 'gesturing';
    }

    // Play motion
    await this.playMotion(motion, gesture === 'idle' || gesture === 'listening');

    this.isTransitioning = false;

    // Process queue
    this.processQueue();
  }

  /**
   * Schedule return to idle after motion completes
   */
  private scheduleReturnToIdle(duration: number): void {
    if (this.returnToIdleTimeout) {
      clearTimeout(this.returnToIdleTimeout);
    }

    this.returnToIdleTimeout = setTimeout(() => {
      if (this.currentMotion !== 'haru_g_idle') {
        this.returnToIdle();
      }
    }, duration);
  }

  /**
   * Return to idle state
   */
  public async returnToIdle(): Promise<void> {
    if (this.isTransitioning) {
      return;
    }

    this.currentState = 'idle';
    await this.playMotion('haru_g_idle', true);
  }

  /**
   * Process queued motions
   */
  private async processQueue(): Promise<void> {
    if (this.motionQueue.length === 0 || this.isTransitioning) {
      return;
    }

    const nextGesture = this.motionQueue.shift();
    if (nextGesture) {
      await this.requestGesture(nextGesture);
    }
  }

  /**
   * Set state to listening (microphone active)
   */
  public setListening(listening: boolean): void {
    if (listening) {
      this.requestGesture('listening');
    } else if (this.currentState === 'listening') {
      this.returnToIdle();
    }
  }

  /**
   * Set state to speaking
   */
  public setSpeaking(speaking: boolean): void {
    this.currentState = speaking ? 'speaking' : 'idle';
    if (!speaking && this.currentMotion !== 'haru_g_idle') {
      this.returnToIdle();
    }
  }

  /**
   * Emergency stop - clear queue and return to idle
   */
  public stop(): void {
    this.motionQueue = [];
    if (this.returnToIdleTimeout) {
      clearTimeout(this.returnToIdleTimeout);
      this.returnToIdleTimeout = null;
    }
    this.isTransitioning = false;
    this.returnToIdle();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stop();
    this.model = null;
  }
}

// Singleton instance
export const motionManager = new MotionManager();
