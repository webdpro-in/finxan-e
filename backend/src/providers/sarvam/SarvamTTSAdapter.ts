/**
 * Sarvam AI TTS Provider Adapter
 * 
 * Implements the TTSProvider contract for Sarvam AI's Text-to-Speech API.
 * Supports multiple Indian languages and English.
 */

import axios from 'axios';
import { TTSProvider } from '../../contracts/TTSProvider.js';

export class SarvamTTSAdapter implements TTSProvider {
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY || 'sk_rkxkt9c6_cJWUXozIXQURs3Jzd5IYGKrv';
    this.apiEndpoint = 'https://api.sarvam.ai/text-to-speech';
    console.log('🔊 Sarvam TTS Adapter initialized');
  }

  async synthesize(
    text: string,
    voiceId: string = 'ritu',
    languageCode: string = 'en-US'
  ): Promise<string> {
    console.log('🔊 Sarvam TTS API called', { length: text.length, voiceId, languageCode });

    // Map common language codes to Sarvam supported codes
    let targetLang = 'en-IN';
    if (languageCode.startsWith('hi')) {
       targetLang = 'hi-IN';
    } else if (languageCode.startsWith('ta')) {
       targetLang = 'ta-IN';
    } else if (languageCode.startsWith('te')) {
       targetLang = 'te-IN';
    } else if (languageCode.startsWith('kn')) {
       targetLang = 'kn-IN';
    } else if (languageCode.startsWith('ml')) {
       targetLang = 'ml-IN';
    } else if (languageCode.startsWith('mr')) {
       targetLang = 'mr-IN';
    } else if (languageCode.startsWith('bn')) {
       targetLang = 'bn-IN';
    } else if (languageCode.startsWith('gu')) {
       targetLang = 'gu-IN';
    }

    try {
      const payload = {
        inputs: [text],
        target_language_code: targetLang,
        speaker: voiceId === 'Joanna' ? 'ritu' : voiceId, // map fallback
        pace: 1.0,
        speech_sample_rate: 24000,
        enable_preprocessing: true,
        model: 'bulbul:v3'
      };

      const response = await axios.post(this.apiEndpoint, payload, {
        headers: {
          'api-subscription-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.audios && response.data.audios.length > 0) {
        const base64Audio = response.data.audios[0];
        // Return a data URL that can be played by the HTMLAudioElement
        return `data:audio/wav;base64,${base64Audio}`;
      } else {
        throw new Error('Sarvam API returned unexpected format.');
      }
    } catch (error: any) {
      console.error('Sarvam TTS error:', error?.response?.data || error.message);
      throw new Error(`Failed to synthesize speech with Sarvam API: ${error.message}`);
    }
  }
}
