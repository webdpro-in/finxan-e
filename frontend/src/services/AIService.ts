/**
 * AI Service - Handles communication with AI backend
 * Processes user queries and returns structured teaching responses
 */

import axios from 'axios';
import { AIResponse } from '../types';
import { GestureRouter } from './GestureRouter';
import { sessionManager } from './SessionManager';
import { HARU_SYSTEM_PROMPT, HARU_GREETING_MESSAGE } from '../config/systemPrompt';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class AIService {
  /**
   * Send user query to AI and get teaching response
   */
  public async query(userInput: string): Promise<AIResponse> {
    try {
      // Get conversation history for context
      const conversationHistory = sessionManager.getConversationHistory();

      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userInput,
        context: conversationHistory,
        systemPrompt: HARU_SYSTEM_PROMPT,
      });

      const aiText = response.data.response || '';
      
      // Add to session
      sessionManager.addExchange(userInput, aiText);
      
      // Parse response into teaching segments
      const segments = GestureRouter.parseTeachingContent(aiText);
      
      // Optimize segments
      const optimizedSegments = GestureRouter.optimizeSegments(segments);

      // Extract image queries
      const images = this.extractImageUrls(response.data.images || []);

      return {
        text: aiText,
        segments: optimizedSegments,
        images,
      };
    } catch (error) {
      console.error('AI query error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  /**
   * Search for images based on query
   */
  public async searchImages(query: string): Promise<string[]> {
    try {
      const response = await axios.post(`${API_BASE_URL}/images/search`, {
        query,
        count: 3,
      });

      return this.extractImageUrls(response.data.images || []);
    } catch (error) {
      console.error('Image search error:', error);
      return [];
    }
  }

  /**
   * Generate image based on description
   */
  public async generateImage(description: string): Promise<string | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/images/generate`, {
        prompt: description,
      });

      return response.data.imageUrl || null;
    } catch (error) {
      console.error('Image generation error:', error);
      return null;
    }
  }

  /**
   * Extract image URLs from response
   */
  private extractImageUrls(images: any[]): string[] {
    return images
      .map(img => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        if (img.imageUrl) return img.imageUrl;
        return null;
      })
      .filter((url): url is string => url !== null);
  }

  /**
   * Get greeting message for new session
   */
  public getGreeting(): AIResponse {
    return {
      text: HARU_GREETING_MESSAGE,
      segments: [
        {
          type: 'text',
          content: HARU_GREETING_MESSAGE,
          gesture: 'greeting',
        },
      ],
      images: [],
    };
  }
}

// Singleton instance
export const aiService = new AIService();
