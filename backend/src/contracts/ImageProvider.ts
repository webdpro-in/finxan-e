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

/**
 * Image Provider interface that all image service adapters must implement
 * 
 * This interface abstracts away vendor-specific implementation details and provides
 * a consistent API for image search and generation. Adapters are responsible for:
 * - Handling vendor-specific authentication and configuration
 * - Normalizing vendor responses to return publicly accessible URLs
 * - Managing image format conversions if needed
 * - Handling errors and providing descriptive error messages
 */
export interface ImageProvider {
  /**
   * Search for images by query
   * 
   * This method searches for existing images based on a text query. The provider
   * should return publicly accessible URLs that can be displayed in the application
   * without authentication. Results should be relevant to the query and appropriate
   * for educational content.
   * 
   * @param query - Search query string describing the desired images
   * @param count - Optional number of images to return (default: 3)
   * @returns Promise resolving to an array of publicly accessible image URLs
   * @throws Error if the search request fails or returns invalid data
   * 
   * @example
   * ```typescript
   * const provider = new AWSImageAdapter();
   * const images = await provider.search("photosynthesis diagram", 3);
   * console.log(images); // ['https://...', 'https://...', 'https://...']
   * ```
   */
  search(query: string, count?: number): Promise<string[]>;

  /**
   * Generate an image from a text prompt
   * 
   * This method uses AI to generate a new image based on a text description.
   * The provider should return a publicly accessible URL to the generated image
   * that can be displayed in the application without authentication.
   * 
   * @param prompt - Text description of the image to generate
   * @returns Promise resolving to a publicly accessible URL of the generated image
   * @throws Error if the generation request fails or returns invalid data
   * 
   * @example
   * ```typescript
   * const provider = new AWSImageAdapter();
   * const imageUrl = await provider.generate("A diagram showing the water cycle");
   * console.log(imageUrl); // 'https://...'
   * ```
   */
  generate(prompt: string): Promise<string>;
}
