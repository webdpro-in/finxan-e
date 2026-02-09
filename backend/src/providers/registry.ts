// backend/src/providers/registry.ts

import { AIProvider } from '../contracts/AIProvider';
import { TTSProvider } from '../contracts/TTSProvider';
import { STTProvider } from '../contracts/STTProvider';
import { ImageProvider } from '../contracts/ImageProvider';

/**
 * Provider Registry - Factory system for selecting and instantiating provider adapters
 * 
 * This registry implements the singleton pattern for each provider type and uses
 * environment variables to determine which adapter implementation to instantiate.
 * 
 * Environment Variables:
 * - AI_PROVIDER: Controls AI provider selection (default: 'gemini')
 * - TTS_PROVIDER: Controls TTS provider selection (default: 'aws-polly')
 * - STT_PROVIDER: Controls STT provider selection (default: 'aws-transcribe')
 * - IMAGE_PROVIDER: Controls Image provider selection (default: 'aws-bedrock')
 */
export class ProviderRegistry {
  private static aiProvider: AIProvider | null = null;
  private static ttsProvider: TTSProvider | null = null;
  private static sttProvider: STTProvider | null = null;
  private static imageProvider: ImageProvider | null = null;

  /**
   * Get AI provider instance (singleton)
   * @returns AIProvider implementation based on AI_PROVIDER environment variable
   * @throws Error if provider name is unknown
   */
  static async getAIProvider(): Promise<AIProvider> {
    if (!this.aiProvider) {
      const providerName = process.env.AI_PROVIDER || 'gemini';
      this.aiProvider = await this.createAIProvider(providerName);
    }
    return this.aiProvider;
  }

  /**
   * Get TTS provider instance (singleton)
   * @returns TTSProvider implementation based on TTS_PROVIDER environment variable
   * @throws Error if provider name is unknown
   */
  static async getTTSProvider(): Promise<TTSProvider> {
    if (!this.ttsProvider) {
      const providerName = process.env.TTS_PROVIDER || 'aws-polly';
      this.ttsProvider = await this.createTTSProvider(providerName);
    }
    return this.ttsProvider;
  }

  /**
   * Get STT provider instance (singleton)
   * @returns STTProvider implementation based on STT_PROVIDER environment variable
   * @throws Error if provider name is unknown
   */
  static async getSTTProvider(): Promise<STTProvider> {
    if (!this.sttProvider) {
      const providerName = process.env.STT_PROVIDER || 'aws-transcribe';
      this.sttProvider = await this.createSTTProvider(providerName);
    }
    return this.sttProvider;
  }

  /**
   * Get Image provider instance (singleton)
   * @returns ImageProvider implementation based on IMAGE_PROVIDER environment variable
   * @throws Error if provider name is unknown
   */
  static async getImageProvider(): Promise<ImageProvider> {
    if (!this.imageProvider) {
      const providerName = process.env.IMAGE_PROVIDER || 'aws-bedrock';
      this.imageProvider = await this.createImageProvider(providerName);
    }
    return this.imageProvider;
  }

  /**
   * Factory method for AI providers
   * @param providerName - Name of the provider to instantiate
   * @returns AIProvider implementation
   * @throws Error if provider name is unknown
   */
  private static async createAIProvider(providerName: string): Promise<AIProvider> {
    switch (providerName) {
      case 'gemini':
        const { GeminiAdapter } = await import('./gemini/GeminiAdapter.js');
        return new GeminiAdapter();
      case 'aws-bedrock':
        const { AWSBedrockAdapter } = await import('./aws/AWSBedrockAdapter.js');
        return new AWSBedrockAdapter();
      // Future providers:
      // case 'openai':
      //   const { OpenAIAdapter } = await import('./openai/OpenAIAdapter.js');
      //   return new OpenAIAdapter();
      // case 'local-llama':
      //   const { LocalLlamaAdapter } = await import('./local/LocalLlamaAdapter.js');
      //   return new LocalLlamaAdapter();
      default:
        throw new Error(`Unknown AI provider: ${providerName}`);
    }
  }

  /**
   * Factory method for TTS providers
   * @param providerName - Name of the provider to instantiate
   * @returns TTSProvider implementation
   * @throws Error if provider name is unknown
   */
  private static async createTTSProvider(providerName: string): Promise<TTSProvider> {
    switch (providerName) {
      case 'aws-polly':
        const { AWSPollyAdapter } = await import('./aws/AWSPollyAdapter.js');
        return new AWSPollyAdapter();
      // Future providers:
      // case 'elevenlabs':
      //   const { ElevenLabsAdapter } = await import('./elevenlabs/ElevenLabsAdapter.js');
      //   return new ElevenLabsAdapter();
      default:
        throw new Error(`Unknown TTS provider: ${providerName}`);
    }
  }

  /**
   * Factory method for STT providers
   * @param providerName - Name of the provider to instantiate
   * @returns STTProvider implementation
   * @throws Error if provider name is unknown
   */
  private static async createSTTProvider(providerName: string): Promise<STTProvider> {
    switch (providerName) {
      case 'aws-transcribe':
        const { AWSTranscribeAdapter } = await import('./aws/AWSTranscribeAdapter.js');
        return new AWSTranscribeAdapter();
      // Future providers:
      // case 'whisper':
      //   const { WhisperAdapter } = await import('./whisper/WhisperAdapter.js');
      //   return new WhisperAdapter();
      default:
        throw new Error(`Unknown STT provider: ${providerName}`);
    }
  }

  /**
   * Factory method for Image providers
   * @param providerName - Name of the provider to instantiate
   * @returns ImageProvider implementation
   * @throws Error if provider name is unknown
   */
  private static async createImageProvider(providerName: string): Promise<ImageProvider> {
    switch (providerName) {
      case 'aws-bedrock':
        const { AWSImageAdapter } = await import('./aws/AWSImageAdapter.js');
        return new AWSImageAdapter();
      // Future providers:
      // case 'stable-diffusion':
      //   const { StableDiffusionAdapter } = await import('./stablediffusion/StableDiffusionAdapter.js');
      //   return new StableDiffusionAdapter();
      default:
        throw new Error(`Unknown Image provider: ${providerName}`);
    }
  }

  /**
   * Reset all providers (useful for testing)
   * This clears all singleton instances, forcing new instances to be created
   * on the next get call.
   */
  static reset(): void {
    this.aiProvider = null;
    this.ttsProvider = null;
    this.sttProvider = null;
    this.imageProvider = null;
  }
}
