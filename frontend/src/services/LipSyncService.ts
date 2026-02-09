/**
 * Lip Sync Service
 * Synchronizes mouth movements with speech audio
 */

import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

export class LipSyncService {
  private model: Live2DModel | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationFrameId: number | null = null;
  private isSpeaking: boolean = false;

  /**
   * Initialize with Live2D model
   */
  public setModel(model: Live2DModel): void {
    this.model = model;
    console.log('🎤 LipSyncService initialized');
  }

  /**
   * Start lip sync with audio element
   */
  public async startLipSync(audioElement: HTMLAudioElement): Promise<void> {
    if (!this.model) {
      console.warn('⚠️ Model not set for lip sync');
      return;
    }

    try {
      // Create audio context if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength)) as Uint8Array<ArrayBuffer>;
      }

      // Connect audio element to analyser
      const source = this.audioContext.createMediaElementSource(audioElement);
      if (this.analyser) {
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      this.isSpeaking = true;
      this.updateMouthMovement();

      console.log('🎤 Lip sync started');
    } catch (error) {
      console.error('❌ Failed to start lip sync:', error);
      // Fallback to simple lip sync if audio analysis fails
      this.startSimpleLipSync();
    }
  }

  /**
   * Start lip sync with simple animation (no audio analysis)
   */
  public startSimpleLipSync(): void {
    if (!this.model) {
      console.warn('⚠️ Model not set for lip sync');
      return;
    }

    this.isSpeaking = true;
    this.updateSimpleMouthMovement();
    console.log('🎤 Simple lip sync started');
  }

  /**
   * Stop lip sync
   */
  public stopLipSync(): void {
    this.isSpeaking = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Close mouth
    if (this.model) {
      const coreModel = (this.model.internalModel as any).coreModel;
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById('ParamMouthOpenY', 0);
      }
    }

    console.log('🎤 Lip sync stopped');
  }

  /**
   * Update mouth movement based on audio analysis
   */
  private updateMouthMovement(): void {
    if (!this.isSpeaking || !this.model || !this.analyser || !this.dataArray) {
      return;
    }

    // Get audio frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;

    // Normalize to 0-1 range
    const mouthOpen = Math.min(average / 128, 1.0);

    // Apply to model
    const coreModel = (this.model.internalModel as any).coreModel;
    if (coreModel && coreModel.setParameterValueById) {
      coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
    }

    // Continue animation
    this.animationFrameId = requestAnimationFrame(() => this.updateMouthMovement());
  }

  /**
   * Update mouth movement with simple animation (no audio analysis)
   */
  private updateSimpleMouthMovement(): void {
    if (!this.isSpeaking || !this.model) {
      return;
    }

    // Simple random mouth movement
    const mouthOpen = Math.random() * 0.8 + 0.2; // 0.2 to 1.0

    // Apply to model
    const coreModel = (this.model.internalModel as any).coreModel;
    if (coreModel && coreModel.setParameterValueById) {
      coreModel.setParameterValueById('ParamMouthOpenY', mouthOpen);
    }

    // Continue animation with varying speed
    const delay = Math.random() * 100 + 50; // 50-150ms
    setTimeout(() => {
      if (this.isSpeaking) {
        this.updateSimpleMouthMovement();
      }
    }, delay);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopLipSync();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.model = null;
  }
}

// Singleton instance
export const lipSyncService = new LipSyncService();
