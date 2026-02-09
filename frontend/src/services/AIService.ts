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
      // Get user's API configuration from localStorage
      const storedUser = localStorage.getItem('finxan_user');
      let apiConfig = null;
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          apiConfig = user.apiConfig;
        } catch (error) {
          console.warn('Failed to parse user config:', error);
        }
      }

      // Get conversation history for context
      const conversationHistory = sessionManager.getConversationHistory();

      // If user has custom API config, use it directly
      if (apiConfig?.textGeneration) {
        const response = await this.queryWithCustomAPI(
          userInput,
          apiConfig.textGeneration,
          conversationHistory
        );
        
        // Add to session
        sessionManager.addExchange(userInput, response.text);
        
        return response;
      }

      // Otherwise, use backend default provider
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
      
      // Better error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API authentication failed. Please check your API key in settings.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to server. Please ensure the backend is running.');
        }
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  /**
   * Query using user's custom API configuration
   */
  private async queryWithCustomAPI(
    userInput: string,
    config: any,
    _conversationHistory: string
  ): Promise<AIResponse> {
    const { provider, apiKey, model, endpoint } = config;

    let response;
    let aiText = '';

    try {
      if (provider === 'openai') {
        // Build messages for OpenAI
        const messages = [
          { role: 'system', content: HARU_SYSTEM_PROMPT },
          { role: 'user', content: userInput },
        ];

        response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        aiText = data.choices[0]?.message?.content || '';

      } else if (provider === 'gemini') {
        // Gemini API format
        response = await fetch(
          `${endpoint}/models/${model || 'gemini-2.0-flash'}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${HARU_SYSTEM_PROMPT}\n\nUser: ${userInput}` },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        aiText = data.candidates[0]?.content?.parts[0]?.text || '';

      } else if (provider === 'anthropic') {
        // Anthropic Claude API format
        response = await fetch(`${endpoint}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            system: HARU_SYSTEM_PROMPT,
            messages: [
              { role: 'user', content: userInput },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        aiText = data.content[0]?.text || '';

      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Parse response into teaching segments
      const segments = GestureRouter.parseTeachingContent(aiText);
      const optimizedSegments = GestureRouter.optimizeSegments(segments);

      return {
        text: aiText,
        segments: optimizedSegments,
        images: [],
      };

    } catch (error) {
      console.error('Custom API query error:', error);
      throw new Error(`Failed to query ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
