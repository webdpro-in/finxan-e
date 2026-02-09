/**
 * AWS Polly Service - Text-to-Speech
 */

import { PollyClient, SynthesizeSpeechCommand, VoiceId, LanguageCode } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class PollyService {
  private pollyClient: PollyClient;
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    this.pollyClient = new PollyClient({ region: this.region });
    this.s3Client = new S3Client({ region: this.region });
    this.bucketName = process.env.S3_BUCKET_NAME || 'haru-ai-teacher-audio';
  }

  async synthesize(text: string, voiceId: string, languageCode: string): Promise<string> {
    try {
      // Synthesize speech
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voiceId as VoiceId,
        LanguageCode: languageCode as LanguageCode,
        Engine: 'neural', // Use neural engine for better quality
      });

      const response = await this.pollyClient.send(command);

      if (!response.AudioStream) {
        throw new Error('No audio stream returned');
      }

      // Convert stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);

      // Upload to S3
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

      // Return public URL
      const audioUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      
      return audioUrl;
    } catch (error) {
      console.error('Polly service error:', error);
      throw error;
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }
}
