/**
 * AI Provider Contract Interface
 *
 * This contract defines a stable interface for AI chat providers, enabling the application
 * to switch between different AI services (AWS Bedrock, OpenAI, local models, etc.) without
 * modifying core logic. All AI provider adapters must implement this interface.
 *
 * The contract follows the Dependency Inversion Principle: high-level application logic
 * depends on this stable interface, while low-level vendor implementations are pluggable
 * adapters that implement the contract.
 */
export {};
