/**
 * Session Manager
 * Manages teaching session context and persistence
 */

export interface Exchange {
  userInput: string;
  aiResponse: string;
  timestamp: number;
}

export interface SessionContext {
  sessionId: string;
  exchanges: Exchange[];
  startTime: number;
  lastActivityTime: number;
}

export class SessionManager {
  private static readonly STORAGE_KEY = 'haru_session_context';
  private static readonly MAX_EXCHANGES = 10;
  private context: SessionContext | null = null;

  /**
   * Initialize a new session
   */
  public initializeSession(): SessionContext {
    this.context = {
      sessionId: this.generateSessionId(),
      exchanges: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
    };

    this.saveToStorage();
    return this.context;
  }

  /**
   * Get current session context
   */
  public getContext(): SessionContext | null {
    if (!this.context) {
      this.context = this.loadFromStorage();
    }
    return this.context;
  }

  /**
   * Add an exchange to the session
   */
  public addExchange(userInput: string, aiResponse: string): void {
    if (!this.context) {
      this.initializeSession();
    }

    if (this.context) {
      this.context.exchanges.push({
        userInput,
        aiResponse,
        timestamp: Date.now(),
      });

      this.context.lastActivityTime = Date.now();

      // Summarize if exceeds max exchanges
      if (this.context.exchanges.length > SessionManager.MAX_EXCHANGES) {
        this.summarizeContext();
      }

      this.saveToStorage();
    }
  }

  /**
   * Get conversation history for AI context
   */
  public getConversationHistory(): string {
    if (!this.context || this.context.exchanges.length === 0) {
      return '';
    }

    return this.context.exchanges
      .map(exchange => `User: ${exchange.userInput}\nHaru: ${exchange.aiResponse}`)
      .join('\n\n');
  }

  /**
   * Clear session context (start new topic)
   */
  public clearContext(): void {
    this.context = null;
    this.removeFromStorage();
    this.initializeSession();
  }

  /**
   * Summarize earlier context when exceeding max exchanges
   */
  private summarizeContext(): void {
    if (!this.context) return;

    // Keep only the last MAX_EXCHANGES exchanges
    const recentExchanges = this.context.exchanges.slice(-SessionManager.MAX_EXCHANGES);
    
    // Create a summary of older exchanges
    const olderExchanges = this.context.exchanges.slice(0, -SessionManager.MAX_EXCHANGES);
    
    if (olderExchanges.length > 0) {
      const summary = `[Earlier conversation summary: ${olderExchanges.length} exchanges about various topics]`;
      
      // Add summary as first exchange
      this.context.exchanges = [
        {
          userInput: '[Context Summary]',
          aiResponse: summary,
          timestamp: this.context.startTime,
        },
        ...recentExchanges,
      ];
    }
  }

  /**
   * Save context to localStorage
   */
  private saveToStorage(): void {
    if (this.context) {
      try {
        localStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(this.context));
      } catch (error) {
        console.error('Failed to save session context:', error);
      }
    }
  }

  /**
   * Load context from localStorage
   */
  private loadFromStorage(): SessionContext | null {
    try {
      const stored = localStorage.getItem(SessionManager.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load session context:', error);
    }
    return null;
  }

  /**
   * Remove context from localStorage
   */
  private removeFromStorage(): void {
    try {
      localStorage.removeItem(SessionManager.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove session context:', error);
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session duration in minutes
   */
  public getSessionDuration(): number {
    if (!this.context) return 0;
    return Math.floor((Date.now() - this.context.startTime) / 60000);
  }

  /**
   * Get number of exchanges
   */
  public getExchangeCount(): number {
    return this.context?.exchanges.length || 0;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
