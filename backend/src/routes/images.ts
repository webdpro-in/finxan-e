/**
 * Images Route - Image search and generation
 * 
 * This route uses the Provider Registry to obtain an ImageProvider implementation
 * based on environment configuration. The route depends on the ImageProvider contract
 * interface, not on any specific vendor implementation.
 */

import express from 'express';
import { ProviderRegistry } from '../providers/registry.js';

export const imagesRouter = express.Router();

// Search for images
imagesRouter.post('/search', async (req, res) => {
  try {
    const { query, count = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get Image provider from registry (depends on contract, not implementation)
    const imageProvider = await ProviderRegistry.getImageProvider();

    // Call provider through contract interface
    const images = await imageProvider.search(query, count);

    res.json({ images });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

// Generate image
imagesRouter.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get Image provider from registry (depends on contract, not implementation)
    const imageProvider = await ProviderRegistry.getImageProvider();

    // Call provider through contract interface
    const imageUrl = await imageProvider.generate(prompt);

    res.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});
