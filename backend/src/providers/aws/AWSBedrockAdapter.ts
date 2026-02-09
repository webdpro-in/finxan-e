/**
 * AWS Bedrock Adapter
 * 
 * This adapter implements the AIProvider contract using AWS Bedrock with Claude models.
 * It wraps the AWS Bedrock Runtime API and normalizes responses to match the AIProvider
 * contract format, enabling the application to switch AI providers without modifying
 * core logic.
 * 
 * Features:
 * - Supports conversation history for multi-turn dialogues
 * - Normalizes AWS Bedrock responses to AIResponse format
 * - Handles errors with descriptive messages
 * - Configurable via environment variables (AWS_REGION, BEDROCK_MODEL_ID)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AIProvider, AIMessage, AIResponse } from '../../contracts/AIProvider';

/**
 * AWS Bedrock adapter implementing the AIProvider contract
 * 
 * This adapter uses AWS Bedrock with Claude models to provide AI chat capabilities.
 * It handles conversation history, normalizes responses, and provides robust error handling.
 */
export class AWSBedrockAdapter implements AIProvider {
  private client: BedrockRuntimeClient;
  private modelId: string;

  /**
   * Initialize the AWS Bedrock adapter
   * 
   * Configuration is read from environment variables:
   * - AWS_REGION: AWS region for Bedrock service (default: 'us-east-1')
   * - BEDROCK_MODEL_ID: Claude model ID (default: 'anthropic.claude-3-sonnet-20240229-v1:0')
   */
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';
  }

  /**
   * Send a chat message and receive a response from AWS Bedrock
   * 
   * This method implements the AIProvider contract, handling conversation history
   * and normalizing AWS Bedrock's response format to match the AIResponse interface.
   * 
   * @param message - The user's message text
   * @param systemPrompt - System instructions for the AI
   * @param history - Optional conversation history for context
   * @returns Promise resolving to normalized AIResponse
   * @throws Error with descriptive message if the request fails
   */
  async chat(
    message: string,
    systemPrompt: string,
    history?: AIMessage[]
  ): Promise<AIResponse> {
    try {
      // Build messages array with conversation history
      const messages: any[] = [];
      
      // Add conversation history if provided
      if (history && history.length > 0) {
        messages.push(...history.map(msg => ({
          role: msg.role === 'system' ? 'user' : msg.role, // Claude doesn't support 'system' role in messages
          content: msg.content,
        })));
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: message,
      });

      // Prepare request payload for Claude via Bedrock
      const payload = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        system: systemPrompt,
        messages,
      };

      // Invoke the model
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload),
      });

      const response = await this.client.send(command);
      
      // Parse the response body
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Extract text from Claude's response format
      // Claude returns: { content: [{ type: 'text', text: '...' }], ... }
      const text = responseBody.content[0].text;

      // Normalize output to AIResponse contract format
      return {
        text,
        images: [], // AWS Bedrock Claude models don't generate images in responses
      };
    } catch (error) {
      // Log the error for debugging
      console.error('AWSBedrockAdapter error:', error);
      
      // Throw a descriptive error message
      throw new Error('Failed to get AI response from AWS Bedrock');
    }
  }
}
