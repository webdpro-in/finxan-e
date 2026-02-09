/**
 * AWS Polly Adapter - Text-to-Speech Provider Implementation
 * 
 * This adapter implements the TTSProvider contract interface using AWS Polly for
 * speech synthesis. It handles:
 * - Text-to-speech conversion using AWS Polly's neural engine
 * - Audio stream processing and conversion to Buffer
 * - S3 upload for public audio file hosting
 * - Consistent URL format output for audio files
 * - Error handling with descriptive messages
 * 
 * The adapter follows the Contracts + Adapters architecture pattern, decoupling
 * the application from AWS-specific implementation details.
 */

import { PollyClient, SynthesizeSpeechCommand, VoiceId, LanguageCode } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TTSProvider } from '../../contracts/TTSProvider';

/**
 * AWS Polly implementation of the TTSProvider contract
 * 
 * This adapter wraps AWS Polly and S3 services to provide text-to-speech
 * functionality. It synthesizes speech using Polly's neural engine, uploads
 * the audio to S3, and returns a publicly accessible URL.
 */
export class AWSPollyAdapter implements TTSProvider {
  private pollyClient: PollyClient;
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  /**
   * Initialize the AWS Polly adapter with AWS SDK clients
   * 
   * Configuration is read from environment variables:
   * - AWS_REGION: AWS region for Polly and S3 (default: 'us-east-1')
   * - S3_BUCKET_NAME: S3 bucket for audio file storage (default: 'haru-ai-teacher-audio')
   */
  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.pollyClient = new PollyClient({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });
    this.bucketName = process.env.S3_BUCKET_NAME || 'haru-ai-teacher-audio';
  }

  /**
   * Synthesize text to speech using AWS Polly and return a public audio URL
   * 
   * This method:
   * 1. Calls AWS Polly to synthesize speech using the neural engine
   * 2. Converts the audio stream to a Buffer
   * 3. Uploads the audio file to S3 with public-read ACL
   * 4. Returns a consistent, publicly accessible URL format
   * 
   * @param text - Text to convert to speech
   * @param voiceId - AWS Polly voice identifier (e.g., 'Joanna', 'Matthew', 'Mizuki')
   * @param languageCode - Language code (e.g., 'en-US', 'ja-JP')
   * @returns Publicly accessible URL to the synthesized audio file (mp3 format)
   * @throws Error if synthesis fails, audio stream is missing, or S3 upload fails
   */
  async synthesize(
    text: string,
    voiceId: string,
    languageCode: string
  ): Promise<string> {
    try {
      // Synthesize speech using AWS Polly
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId as VoiceId,
        LanguageCode: languageCode as LanguageCode,
        Engine: 'neural', // Use neural engine for better quality
      });

      const response = await this.pollyClient.send(command);

      if (!response.AudioStream) {
        throw new Error('No audio stream returned from Polly');
      }

      // Convert stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);

      // Upload to S3 with public access
      const fileName = `speech-${Date.now()}.mp3`;
      const s3Key = `synthesize/${fileName}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: audioBuffer,
          ContentType: 'audio/mpeg',
          ACL: 'public-read', // Make publicly accessible
        })
      );

      // Return consistent URL format (normalized output)
      const audioUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      return audioUrl;
    } catch (error) {
      console.error('AWSPollyAdapter error:', error);
      throw new Error('Failed to synthesize speech with AWS Polly');
    }
  }

  /**
   * Convert an AWS SDK stream to a Buffer
   * 
   * This helper method processes the audio stream returned by Polly,
   * collecting all chunks and concatenating them into a single Buffer
   * for S3 upload.
   * 
   * @param stream - Audio stream from Polly SynthesizeSpeech response
   * @returns Buffer containing the complete audio data
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
}
