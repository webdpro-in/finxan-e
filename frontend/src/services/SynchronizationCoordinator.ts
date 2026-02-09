/**
 * Synchronization Coordinator
 * Coordinates text, speech, gestures, and images across all modalities
 * Ensures all updates happen within 100ms of each other
 */

import { TeachingSegment } from '../types';
import { motionManager } from './MotionManager';
import { speechController } from './SpeechController';
import { eyeController } from './EyeController';
import { useAppStore } from '../store/useAppStore';

export class SynchronizationCoordinator {
  private isExecuting: boolean = false;
  private eventQueue: SynchronizationEvent[] = [];
  private currentSegmentIndex: number = 0;

  /**
   * Execute a synchronized teaching sequence
   * CRITICAL: TTS must always play, lip sync must be audio-driven
   */
  public async executeTeachingSequence(
    segments: TeachingSegment[],
    fullText: string,
    images: string[]
  ): Promise<void> {
    if (this.isExecuting) {
      console.log('[SyncCoordinator] Queueing teaching sequence');
      this.eventQueue.push({ segments, fullText, images });
      return;
    }

    this.isExecuting = true;
    this.currentSegmentIndex = 0;

    const store = useAppStore.getState();

    try {
      console.log('[SyncCoordinator] 🎬 Starting teaching sequence');
      const syncStart = performance.now();

      // 1. Update text content
      store.setLeftPanelContent(fullText);

      // 2. Update images if present
      if (images && images.length > 0) {
        store.setRightPanelImages(images);
        // Look left at images
        eyeController.lookLeft(4000);
      }

      // 3. Generate TTS audio (CRITICAL - must not fail silently)
      console.log('[SyncCoordinator] 🔊 Generating TTS audio...');
      let audioUrl: string;
      try {
        audioUrl = await speechController.textToSpeech(fullText);
        console.log('[SyncCoordinator] ✅ TTS audio generated:', audioUrl);
      } catch (error) {
        console.error('[SyncCoordinator] ❌ TTS generation failed:', error);
        // Retry once
        console.log('[SyncCoordinator] 🔄 Retrying TTS generation...');
        try {
          audioUrl = await speechController.textToSpeech(fullText);
          console.log('[SyncCoordinator] ✅ TTS retry successful');
        } catch (retryError) {
          console.error('[SyncCoordinator] ❌ TTS retry failed:', retryError);
          throw new Error('Failed to generate speech after retry');
        }
      }

      const syncEnd = performance.now();
      console.log(`[SyncCoordinator] ⚡ Synchronization completed in ${syncEnd - syncStart}ms`);

      // 4. Execute gesture sequence (parallel with speech preparation)
      const gesturePromise = this.executeGestureSequence(segments);

      // 5. Play speech with lip sync (CRITICAL - this is where voice plays)
      console.log('[SyncCoordinator] 🎤 Starting speech playback with lip sync');
      store.setSpeaking(true);
      
      // Look right at chat while speaking
      eyeController.lookRight(5000);
      
      // Play audio with lip sync
      await speechController.playAudio(audioUrl);
      
      console.log('[SyncCoordinator] ✅ Speech playback completed');
      store.setSpeaking(false);

      // Wait for gestures to complete
      await gesturePromise;

      // 6. Return to idle
      await motionManager.returnToIdle();
      eyeController.lookCenter();

      console.log('[SyncCoordinator] 🎉 Teaching sequence completed');

    } catch (error) {
      console.error('[SyncCoordinator] ❌ Error in teaching sequence:', error);
      store.setSpeaking(false);
      await motionManager.returnToIdle();
      eyeController.lookCenter();
      
      // Show error to user
      store.setLeftPanelContent('Sorry, I encountered an error with speech generation. Please try again.');
    } finally {
      this.isExecuting = false;
      store.setIsTeaching(false);

      // Process queued events
      if (this.eventQueue.length > 0) {
        const nextEvent = this.eventQueue.shift();
        if (nextEvent) {
          await this.executeTeachingSequence(
            nextEvent.segments,
            nextEvent.fullText,
            nextEvent.images
          );
        }
      }
    }
  }

  /**
   * Execute gesture sequence for teaching segments
   */
  private async executeGestureSequence(segments: TeachingSegment[]): Promise<void> {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      this.currentSegmentIndex = i;

      if (segment.gesture) {
        console.log(`[SyncCoordinator] Segment ${i}: ${segment.gesture}`);
        
        // Request gesture
        await motionManager.requestGesture(segment.gesture);

        // Calculate wait time based on content length
        const words = segment.content.split(/\s+/).length;
        const readingTime = (words / 150) * 60 * 1000; // 150 words per minute
        const waitTime = Math.max(readingTime, 2000); // Minimum 2 seconds

        // Wait for gesture to complete
        await this.delay(waitTime);
      }
    }
  }

  /**
   * Handle interruption (e.g., microphone activation)
   */
  public interrupt(): void {
    console.log('[SyncCoordinator] Interruption detected - stopping all modalities');

    // Stop speech
    speechController.stopAudio();

    // Stop motion
    motionManager.stop();

    // Return eyes to center
    eyeController.lookCenter();

    // Clear queue
    this.eventQueue = [];
    this.isExecuting = false;

    // Update state
    const store = useAppStore.getState();
    store.setSpeaking(false);
    store.setIsTeaching(false);
  }

  /**
   * Check if coordinator is currently executing
   */
  public isActive(): boolean {
    return this.isExecuting;
  }

  /**
   * Get current segment index
   */
  public getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  /**
   * Utility: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

interface SynchronizationEvent {
  segments: TeachingSegment[];
  fullText: string;
  images: string[];
}

// Singleton instance
export const synchronizationCoordinator = new SynchronizationCoordinator();
