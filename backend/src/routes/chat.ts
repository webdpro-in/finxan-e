/**
 * Chat Route - AI conversation endpoint
 * 
 * This route uses the Provider Abstraction Layer to remain vendor-agnostic.
 * The actual AI provider (AWS Bedrock, OpenAI, etc.) is determined by the
 * AI_PROVIDER environment variable and instantiated through ProviderRegistry.
 */

import express from 'express';
import { ProviderRegistry } from '../providers/registry.js';

export const chatRouter = express.Router();

chatRouter.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt for teaching mode
    const systemPrompt = `You are Haru, a professional AI teacher. Your role is to:
- Explain concepts clearly and step-by-step
- Use simple language first, then provide deeper explanations
- Reference visual aids when helpful (mention "look at the image" or "see the diagram")
- Emphasize important points using phrases like "important:", "key point:", "remember:"
- Warn about common mistakes using phrases like "careful:", "avoid:", "common error:"
- Be friendly, patient, and encouraging
- Structure your responses with clear paragraphs and bullet points when appropriate

Format your response as teaching content that will be displayed on the left side of the screen.

${context ? `\nPrevious conversation:\n${context}` : ''}`;

    // Get AI provider from registry (vendor-agnostic)
    const aiProvider = await ProviderRegistry.getAIProvider();

    // Call provider through contract interface
    const response = await aiProvider.chat(message, systemPrompt);

    res.json({
      response: response.text,
      images: response.images || [],
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});
