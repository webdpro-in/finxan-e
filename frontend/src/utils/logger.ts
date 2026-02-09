/**
 * Logger Utility
 * Provides structured logging for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDebugMode: boolean = false;

  constructor() {
    // Check if debug mode is enabled
    this.isDebugMode = localStorage.getItem('haru_debug_mode') === 'true';
  }

  /**
   * Enable or disable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    localStorage.setItem('haru_debug_mode', enabled ? 'true' : 'false');
  }

  /**
   * Check if debug mode is enabled
   */
  public isDebug(): boolean {
    return this.isDebugMode;
  }

  /**
   * Log a debug message
   */
  public debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  /**
   * Log an info message
   */
  public info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  /**
   * Log a warning message
   */
  public warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  /**
   * Log an error message
   */
  public error(category: string, message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // Add to logs array
    this.logs.push(entry);

    // Trim logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (this.isDebugMode || level === 'error' || level === 'warn') {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${category}]`;
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      
      if (data) {
        logFn(prefix, message, data);
      } else {
        logFn(prefix, message);
      }
    }
  }

  /**
   * Get all logs
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by category
   */
  public getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Log state transition
   */
  public logStateTransition(from: string, to: string, reason?: string): void {
    this.info('StateTransition', `${from} → ${to}`, { from, to, reason });
  }

  /**
   * Log gesture selection
   */
  public logGestureSelection(gesture: string, motion: string, reason?: string): void {
    this.info('GestureSelection', `Gesture: ${gesture}, Motion: ${motion}`, { gesture, motion, reason });
  }

  /**
   * Log synchronization event
   */
  public logSynchronization(event: string, timing: number): void {
    this.info('Synchronization', `${event} completed in ${timing}ms`, { event, timing });
  }
}

// Singleton instance
export const logger = new Logger();

// Expose logger to window for debugging
if (typeof window !== 'undefined') {
  (window as any).haruLogger = logger;
}
