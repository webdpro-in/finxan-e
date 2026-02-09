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
export {};
