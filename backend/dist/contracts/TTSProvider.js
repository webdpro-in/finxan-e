/**
 * Text-to-Speech Provider Contract Interface
 *
 * This contract defines a stable interface for TTS (Text-to-Speech) providers, enabling
 * the application to switch between different speech synthesis services (AWS Polly,
 * ElevenLabs, local TTS engines, etc.) without modifying core logic. All TTS provider
 * adapters must implement this interface.
 *
 * The contract follows the Dependency Inversion Principle: high-level application logic
 * depends on this stable interface, while low-level vendor implementations are pluggable
 * adapters that implement the contract.
 */
export {};
