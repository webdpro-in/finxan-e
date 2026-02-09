/**
 * Image Provider Contract Interface
 *
 * This contract defines a stable interface for image providers, enabling the application
 * to switch between different image services (AWS Bedrock, Unsplash, Stable Diffusion, etc.)
 * without modifying core logic. All image provider adapters must implement this interface.
 *
 * The contract follows the Dependency Inversion Principle: high-level application logic
 * depends on this stable interface, while low-level vendor implementations are pluggable
 * adapters that implement the contract.
 */
export {};
