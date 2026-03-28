/**
 * Browser-Native STT Provider Adapter
 * 
 * Implements the STTProvider contract for cases where
 * server-side transcription is requested (e.g., uploaded audio files).
 * 
 * For real-time speech recognition, the frontend uses Web Speech API
 * directly (handled by RealtimeSpeechService.ts). This adapter handles
 * the REST API fallback for file uploads.
 * 
 * Since we don't have AWS/cloud STT credentials, this returns a
 * helpful message directing the user to use the real-time mic instead.
 */

import { STTProvider } from '../../contracts/STTProvider.js';

export class BrowserSTTAdapter implements STTProvider {
  constructor() {
    console.log('🎤 Browser STT Adapter initialized');
    console.log('   Real-time STT: Handled by frontend Web Speech API');
    console.log('   File upload STT: Basic fallback mode');
  }

  /**
   * Transcribe audio buffer to text.
   * Since browser-native STT runs on the client, this server-side
   * method provides a graceful fallback message.
   */
  async transcribe(
    audioBuffer: Buffer,
    languageCode: string = 'en-US'
  ): Promise<string> {
    console.log('🎤 Browser STT: Received audio buffer');
    console.log('   Buffer size:', audioBuffer.length, 'bytes');
    console.log('   Language:', languageCode);
    console.log('   Note: Real-time STT runs in browser via Web Speech API');

    // For file-based transcription without cloud STT,
    // return a message indicating the user should use the mic button
    return '[Please use the microphone button for real-time voice input. File-based transcription requires a cloud STT provider.]';
  }
}
