/**
 * Google Gemini AI Provider Adapter
 *
 * Implements the AIProvider contract for Google Gemini API.
 * This is the CURRENT PRIMARY AI provider for the Haru platform.
 *
 * Architecture: This adapter normalizes Gemini's API responses to match
 * the stable AIProvider contract, ensuring the core application remains
 * vendor-agnostic and can switch to other providers via environment variables.
 */
export class GeminiAdapter {
    apiKey;
    model;
    apiEndpoint;
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta';
        if (!this.apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not set. Gemini adapter will fail at runtime.');
        }
        console.log('🤖 Gemini Adapter initialized');
        console.log('   Model:', this.model);
        console.log('   Endpoint:', this.apiEndpoint);
        console.log('   API Key:', this.apiKey ? '✓ Set' : '✗ Not set');
    }
    async chat(message, systemPrompt, history) {
        try {
            // Build contents array - simple format matching the curl example
            const contents = [];
            // Add conversation history if provided
            if (history && history.length > 0) {
                for (const msg of history) {
                    contents.push({
                        parts: [{ text: msg.content }],
                    });
                }
            }
            // Add system prompt as first message if no history
            if (!history || history.length === 0) {
                contents.push({
                    parts: [{ text: systemPrompt }],
                });
            }
            // Add current user message
            contents.push({
                parts: [{ text: message }],
            });
            // Prepare request payload - matching your curl example format
            const payload = {
                contents,
            };
            // Call Gemini API - using header for API key like your curl example
            const url = `${this.apiEndpoint}/models/${this.model}:generateContent`;
            console.log('🔗 Calling Gemini API:', url);
            console.log('📦 Payload:', JSON.stringify(payload, null, 2));
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': this.apiKey,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Gemini API error:', response.status, errorText);
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log('✅ Gemini API response received');
            // Normalize output to AIResponse contract format
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response from Gemini API');
            }
            const candidate = data.candidates[0];
            const text = candidate.content.parts.map(part => part.text).join('');
            // Return normalized response matching the contract
            return {
                text,
                images: [], // Gemini text model doesn't return images
            };
        }
        catch (error) {
            console.error('GeminiAdapter error:', error);
            throw new Error(`Failed to get AI response from Google Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
