/**
 * Placeholder Image Provider Adapter
 * 
 * Implements the ImageProvider contract using free image sources.
 * Uses Unsplash Source (no API key needed) for search results
 * and placeholder.com for generated images.
 * 
 * This provides working image functionality without requiring
 * any paid API keys or cloud services.
 */

import { ImageProvider } from '../../contracts/ImageProvider.js';

export class PlaceholderImageAdapter implements ImageProvider {
  constructor() {
    console.log('🖼️ Placeholder Image Adapter initialized');
    console.log('   Search: Unsplash Source (free, no API key)');
    console.log('   Generate: Placeholder images');
  }

  /**
   * Search for images using Unsplash Source (free, no API key needed)
   */
  async search(query: string, count: number = 3): Promise<string[]> {
    console.log('🖼️ Image search:', query, 'count:', count);

    const images: string[] = [];
    const encodedQuery = encodeURIComponent(query);

    for (let i = 0; i < count; i++) {
      // Unsplash Source provides random images by keyword without API key
      // Each URL gets a different image due to the random parameter
      images.push(
        `https://source.unsplash.com/800x600/?${encodedQuery}&sig=${Date.now() + i}`
      );
    }

    console.log('🖼️ Generated', images.length, 'image URLs');
    return images;
  }

  /**
   * Generate a placeholder image for the given prompt
   */
  async generate(prompt: string): Promise<string> {
    console.log('🖼️ Image generation (placeholder):', prompt);

    // Use Unsplash Source for a relevant image based on the prompt
    const encodedPrompt = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
    const imageUrl = `https://source.unsplash.com/1024x768/?${encodedPrompt}&sig=${Date.now()}`;

    console.log('🖼️ Generated image URL:', imageUrl);
    return imageUrl;
  }
}
