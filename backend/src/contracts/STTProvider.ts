/**
 * Speech-to-Text Provider Contract Interface
 * 
 * This contract defines a stable interface for STT (Speech-to-Text) providers, enabling
 * the application to switch between different transcription services (AWS Transcribe,
 * OpenAI Whisper, local STT engines, etc.) without modifying core logic. All STT provider
 * adapters must implement this interface.
 * 
 * The contract follows the Dependency Inversion Principle: high-level application logic
 * depends on this stable interface, while low-level vendor implementations are pluggable
 * adapters that implement the contract.
 */

/**
 * STT Provider interface that all speech-to-text service adapters must implement
 * 
 * This interface abstracts away vendor-specific implementation details and provides
 * a consistent API for audio transcription. Adapters are responsible for:
 * - Handling vendor-specific authentication and configuration
 * - Converting audio data to text using the vendor's API
 * - Managing audio format conversion internally if required by the vendor
 * - Supporting language detection or accepting language hints
 * - Handling errors and providing descriptive error messages
 */
export interface STTProvider {
  /**
   * Transcribe audio data to text
   * 
   * This method converts the provided audio buffer into text using speech recognition.
   * The adapter handles any necessary format conversions internally, so callers can
   * provide audio in various formats (webm, mp3, wav, etc.) without concern for
   * vendor-specific requirements.
   * 
   * @param audioBuffer - Audio data as a Buffer containing the audio file content
   * @param languageCode - Optional language hint following BCP-47 standard (e.g., 'en-US', 'ja-JP', 'es-ES')
   *                       If not provided, the provider may attempt automatic language detection
   * @returns Promise resolving to the transcribed text as a string
   * @throws Error if transcription fails or audio format is unsupported
   * 
   * @example
   * ```typescript
   * const provider = new AWSTranscribeAdapter();
   * const audioBuffer = fs.readFileSync('recording.webm');
   * const text = await provider.transcribe(audioBuffer, 'en-US');
   * console.log(text); // "Hello, this is a test recording."
   * ```
   */
  transcribe(
    audioBuffer: Buffer,
    languageCode?: string
  ): Promise<string>;
}
