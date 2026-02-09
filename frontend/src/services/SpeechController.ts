/**
 * Speech Controller - Handles speech-to-text and text-to-speech
 * Integrates with AWS Transcribe and Polly
 */

import axios from 'axios';
import { lipSyncService } from './LipSyncService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class SpeechController {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Start recording audio from microphone
   */
  public async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to access microphone');
    }
  }

  /**
   * Stop recording and return audio blob
   */
  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        
        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        console.log('Recording stopped');
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Transcribe audio to text using AWS Transcribe
   */
  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Convert text to speech using AWS Polly (Female voice)
   */
  public async textToSpeech(text: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/synthesize`, {
        text,
        voiceId: 'Joanna', // Female voice - warm and friendly
        languageCode: 'en-US',
      });

      return response.data.audioUrl;
    } catch (error) {
      console.error('TTS error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Play audio from URL with lip sync
   */
  public async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      this.stopAudio();

      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        console.log('Audio playback finished');
        lipSyncService.stopLipSync();
        resolve();
      };

      this.currentAudio.onerror = (error) => {
        console.error('Audio playback error:', error);
        lipSyncService.stopLipSync();
        reject(new Error('Failed to play audio'));
      };

      // Start lip sync when audio starts playing
      this.currentAudio.onplay = () => {
        console.log('🎤 Starting lip sync with audio');
        lipSyncService.startLipSync(this.currentAudio!);
      };

      this.currentAudio.play().catch((error) => {
        lipSyncService.stopLipSync();
        reject(error);
      });
    });
  }

  /**
   * Stop currently playing audio and lip sync
   */
  public stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    lipSyncService.stopLipSync();
  }

  /**
   * Check if audio is currently playing
   */
  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopAudio();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}

// Singleton instance
export const speechController = new SpeechController();
