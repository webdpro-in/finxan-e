/**
 * AWS Transcribe Adapter - Speech-to-Text Provider Implementation
 *
 * This adapter implements the STTProvider contract interface using AWS Transcribe service.
 * It handles audio upload to S3, transcription job management, polling for completion,
 * and format conversion internally.
 *
 * Key responsibilities:
 * - Upload audio buffers to S3 for processing
 * - Start AWS Transcribe jobs with appropriate configuration
 * - Poll for job completion with timeout handling
 * - Retrieve and parse transcription results
 * - Normalize output to plain text string format
 * - Handle errors with descriptive messages
 *
 * Requirements: 3.2, 3.4, 3.5
 */
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, TranscriptionJobStatus, } from '@aws-sdk/client-transcribe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
/**
 * AWS Transcribe implementation of the STTProvider contract
 *
 * This adapter wraps AWS Transcribe service and provides speech-to-text functionality
 * through the standard STTProvider interface. It handles the complexity of:
 * - S3 upload for audio files (required by AWS Transcribe)
 * - Asynchronous job management
 * - Polling with configurable timeout
 * - Result retrieval from S3-hosted transcript files
 */
export class AWSTranscribeAdapter {
    transcribeClient;
    s3Client;
    bucketName;
    region;
    /**
     * Initialize the AWS Transcribe adapter
     *
     * Configures AWS clients using environment variables:
     * - AWS_REGION: AWS region for services (default: us-east-1)
     * - S3_BUCKET_NAME: S3 bucket for audio storage (default: haru-ai-teacher-audio)
     */
    constructor() {
        this.region = process.env.AWS_REGION || 'us-east-1';
        this.transcribeClient = new TranscribeClient({ region: this.region });
        this.s3Client = new S3Client({ region: this.region });
        this.bucketName = process.env.S3_BUCKET_NAME || 'haru-ai-teacher-audio';
    }
    /**
     * Transcribe audio to text using AWS Transcribe
     *
     * This method implements the STTProvider contract by:
     * 1. Uploading the audio buffer to S3
     * 2. Starting an AWS Transcribe job
     * 3. Polling for job completion (max 30 attempts, 2 seconds between attempts)
     * 4. Retrieving and parsing the transcript from the result URL
     * 5. Returning the transcribed text as a plain string
     *
     * The method handles format conversion internally - AWS Transcribe supports
     * multiple audio formats (webm, mp3, wav, etc.) and the adapter specifies
     * the format based on the uploaded file.
     *
     * @param audioBuffer - Audio data buffer to transcribe
     * @param languageCode - Optional language code (default: 'en-US')
     * @returns Promise resolving to the transcribed text
     * @throws Error if upload fails, transcription job fails, or timeout occurs
     */
    async transcribe(audioBuffer, languageCode = 'en-US') {
        try {
            // Step 1: Upload audio to S3
            // AWS Transcribe requires audio files to be in S3
            const fileName = `audio-${Date.now()}.webm`;
            const s3Key = `transcribe/${fileName}`;
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
                Body: audioBuffer,
                ContentType: 'audio/webm',
            }));
            // Step 2: Start transcription job
            const jobName = `transcribe-job-${Date.now()}`;
            const mediaFileUri = `s3://${this.bucketName}/${s3Key}`;
            await this.transcribeClient.send(new StartTranscriptionJobCommand({
                TranscriptionJobName: jobName,
                LanguageCode: languageCode,
                MediaFormat: 'webm',
                Media: {
                    MediaFileUri: mediaFileUri,
                },
            }));
            // Step 3: Poll for completion
            // AWS Transcribe is asynchronous, so we need to poll for job completion
            let transcriptText = '';
            let attempts = 0;
            const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait time
            while (attempts < maxAttempts) {
                const jobStatus = await this.transcribeClient.send(new GetTranscriptionJobCommand({
                    TranscriptionJobName: jobName,
                }));
                const status = jobStatus.TranscriptionJob?.TranscriptionJobStatus;
                if (status === TranscriptionJobStatus.COMPLETED) {
                    // Step 4: Retrieve transcript from result URL
                    const transcriptUri = jobStatus.TranscriptionJob?.Transcript?.TranscriptFileUri;
                    if (transcriptUri) {
                        const transcriptResponse = await axios.get(transcriptUri);
                        transcriptText = transcriptResponse.data.results.transcripts[0].transcript;
                    }
                    break;
                }
                else if (status === TranscriptionJobStatus.FAILED) {
                    const failureReason = jobStatus.TranscriptionJob?.FailureReason || 'Unknown reason';
                    throw new Error(`Transcription job failed: ${failureReason}`);
                }
                // Wait 2 seconds before next poll
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
            if (!transcriptText) {
                throw new Error('Transcription timeout - job did not complete within 60 seconds');
            }
            // Step 5: Return normalized output (plain text string)
            return transcriptText;
        }
        catch (error) {
            console.error('AWSTranscribeAdapter error:', error);
            // Provide descriptive error messages
            if (error instanceof Error) {
                throw new Error(`Failed to transcribe audio with AWS Transcribe: ${error.message}`);
            }
            throw new Error('Failed to transcribe audio with AWS Transcribe');
        }
    }
}
