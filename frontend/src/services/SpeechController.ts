/**
 * Speech Controller - Handles TTS and STT
 * Supports both browser-native TTS (via browser-tts:// URLs from BrowserTTSAdapter)
 * and cloud TTS (via HTTP audio URLs from AWS Polly etc.)
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
        if (event.data.size > 0) this.audioChunks.push(event.data);
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
      if (!this.mediaRecorder) { reject(new Error('No active recording')); return; }
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }
        resolve(audioBlob);
      };
      this.mediaRecorder.stop();
    });
  }

  /**
   * Transcribe audio to text via backend STT provider
   */
  public async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await axios.post(`${API_BASE_URL}/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Convert text to speech via backend TTS provider.
   * Returns either a browser-tts:// URL (browser-native) or an HTTP audio URL.
   */
  public async textToSpeech(text: string): Promise<string> {
    try {
      const response = await axios.post(`${API_BASE_URL}/synthesize`, {
        text,
        voiceId: 'Joanna',
        languageCode: 'en-US',
      });
      return response.data.audioUrl;
    } catch (error) {
      console.error('TTS error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Play audio from URL with lip sync.
   * Handles browser-tts:// (Web Speech API) and http(s):// (HTMLAudioElement).
   */
  public async playAudio(audioUrl: string): Promise<void> {
    if (audioUrl.startsWith('browser-tts://')) {
      return this.playWithSpeechSynthesis(audioUrl);
    }
    return this.playWithAudioElement(audioUrl);
  }

  /**
   * Decode browser-tts:// URL and play using Web Speech API SpeechSynthesis
   */
  private async playWithSpeechSynthesis(browserTtsUrl: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const encoded = browserTtsUrl.replace('browser-tts://', '');
        const decoded = atob(encoded);
        const payload = JSON.parse(decoded) as { text: string; voiceId: string; languageCode: string };

        console.log('🔊 Web Speech API TTS | length:', payload.text.length);

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(payload.text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;

        const pickVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const female = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Female') || v.name.includes('Samantha') ||
             v.name.includes('Victoria') || v.name.includes('Karen') ||
             v.name.includes('Aria') || v.name.includes('Ava') ||
             v.name.includes('Jenny') || v.name.includes('Zira'))
          );
          if (female) { utterance.voice = female; console.log('🔊 Voice:', female.name); }
          else {
            const eng = voices.find(v => v.lang.startsWith('en'));
            if (eng) utterance.voice = eng;
          }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', pickVoice, { once: true });
        } else {
          pickVoice();
        }

        utterance.onstart = () => { lipSyncService.startSimpleLipSync(); };
        utterance.onend = () => { lipSyncService.stopLipSync(); resolve(); };
        utterance.onerror = (e) => {
          console.error('SpeechSynthesis error:', e.error);
          lipSyncService.stopLipSync();
          resolve(); // Graceful — don't block the teaching flow
        };

        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('browser-tts parse error:', error);
        lipSyncService.stopLipSync();
        resolve();
      }
    });
  }

  /**
   * Play from HTTP audio URL using HTMLAudioElement with lip sync
   */
  private async playWithAudioElement(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopAudio();
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.onended = () => { lipSyncService.stopLipSync(); resolve(); };
      this.currentAudio.onerror = () => { lipSyncService.stopLipSync(); reject(new Error('Audio playback failed')); };
      this.currentAudio.onplay = () => { lipSyncService.startLipSync(this.currentAudio!); };
      this.currentAudio.play().catch((e) => { lipSyncService.stopLipSync(); reject(e); });
    });
  }

  /**
   * Stop all audio (Web Speech API + HTMLAudio) and lip sync
   */
  public stopAudio(): void {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    lipSyncService.stopLipSync();
  }

  public isPlaying(): boolean {
    return window.speechSynthesis.speaking || (this.currentAudio !== null && !this.currentAudio.paused);
  }

  public destroy(): void {
    this.stopAudio();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
  }
}

// Singleton instance
export const speechController = new SpeechController();
