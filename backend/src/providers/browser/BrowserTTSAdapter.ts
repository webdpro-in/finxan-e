/**
 * Browser-Native TTS Provider Adapter
 * 
 * Implements the TTSProvider contract using a simple approach:
 * Returns a special URL scheme that tells the frontend to use
 * browser-native Web Speech API (SpeechSynthesis) instead of
 * requiring cloud TTS services.
 * 
 * This enables zero-cost, zero-latency TTS that works offline.
 * The frontend's SpeechController handles the actual synthesis.
 */

import { TTSProvider } from '../../contracts/TTSProvider.js';

export class BrowserTTSAdapter implements TTSProvider {
  constructor() {
    console.log('🔊 Browser TTS Adapter initialized');
    console.log('   Using: Web Speech API (browser-native)');
    console.log('   Cost: Free');
    console.log('   Latency: <10ms');
  }

  /**
   * "Synthesize" text by encoding it in a special URL scheme.
   * The frontend will detect this scheme and use browser SpeechSynthesis.
   * 
   * Format: browser-tts://<base64-encoded-text>
   */
  async synthesize(
    text: string,
    voiceId: string = 'default',
    languageCode: string = 'en-US'
  ): Promise<string> {
    console.log('🔊 Browser TTS: Encoding text for browser synthesis');
    console.log('   Text length:', text.length, 'characters');
    console.log('   Voice:', voiceId);
    console.log('   Language:', languageCode);

    // Encode the text, voice, and language into a special URL
    // The frontend will intercept this and use SpeechSynthesis
    const payload = JSON.stringify({
      text,
      voiceId,
      languageCode,
    });

    const encoded = Buffer.from(payload).toString('base64');
    return `browser-tts://${encoded}`;
  }
}
