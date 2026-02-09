/**
 * AWS Transcribe Service - Speech-to-Text
 */
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, } from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
export class TranscribeService {
    transcribeClient;
    s3Client;
    bucketName;
    constructor() {
        const region = process.env.AWS_REGION || 'us-east-1';
        this.transcribeClient = new TranscribeClient({ region });
        this.s3Client = new S3Client({ region });
        this.bucketName = process.env.S3_BUCKET_NAME || 'haru-ai-teacher-audio';
    }
    async transcribe(audioBuffer) {
        try {
            // Upload audio to S3
            const fileName = `audio-${Date.now()}.webm`;
            const s3Key = `transcribe/${fileName}`;
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
                Body: audioBuffer,
                ContentType: 'audio/webm',
            }));
            // Start transcription job
            const jobName = `transcribe-job-${Date.now()}`;
            const mediaFileUri = `s3://${this.bucketName}/${s3Key}`;
            await this.transcribeClient.send(new StartTranscriptionJobCommand({
                TranscriptionJobName: jobName,
                LanguageCode: 'en-US',
                MediaFormat: 'webm',
                Media: {
                    MediaFileUri: mediaFileUri,
                },
            }));
            // Poll for completion
            let transcriptText = '';
            let attempts = 0;
            const maxAttempts = 30;
            while (attempts < maxAttempts) {
                const jobStatus = await this.transcribeClient.send(new GetTranscriptionJobCommand({
                    TranscriptionJobName: jobName,
                }));
                const status = jobStatus.TranscriptionJob?.TranscriptionJobStatus;
                if (status === 'COMPLETED') {
                    const transcriptUri = jobStatus.TranscriptionJob?.Transcript?.TranscriptFileUri;
                    if (transcriptUri) {
                        const transcriptResponse = await axios.get(transcriptUri);
                        transcriptText = transcriptResponse.data.results.transcripts[0].transcript;
                    }
                    break;
                }
                else if (status === 'FAILED') {
                    throw new Error('Transcription job failed');
                }
                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
            if (!transcriptText) {
                throw new Error('Transcription timeout');
            }
            return transcriptText;
        }
        catch (error) {
            console.error('Transcribe service error:', error);
            throw error;
        }
    }
}
