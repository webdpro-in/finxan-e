/**
 * Error Handler Utility
 * Provides consistent error handling and user-friendly messages
 */

export type ErrorCode =
  | 'MODEL_LOAD_FAILED'
  | 'MOTION_PLAYBACK_FAILED'
  | 'TTS_FAILED'
  | 'STT_FAILED'
  | 'AI_SERVICE_FAILED'
  | 'IMAGE_LOAD_FAILED'
  | 'MICROPHONE_ACCESS_DENIED'
  | 'NETWORK_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  userMessage: string;
  recoverable: boolean;
}

const ERROR_MESSAGES: Record<ErrorCode, { userMessage: string; recoverable: boolean }> = {
  MODEL_LOAD_FAILED: {
    userMessage: 'Unable to load Haru character. You can still use text-based teaching.',
    recoverable: true,
  },
  MOTION_PLAYBACK_FAILED: {
    userMessage: 'Animation playback issue detected. Teaching will continue.',
    recoverable: true,
  },
  TTS_FAILED: {
    userMessage: 'Voice synthesis unavailable. Teaching will continue with text only.',
    recoverable: true,
  },
  STT_FAILED: {
    userMessage: 'Voice recognition failed. Please try typing your question instead.',
    recoverable: true,
  },
  AI_SERVICE_FAILED: {
    userMessage: 'Unable to generate response. Please try again.',
    recoverable: true,
  },
  IMAGE_LOAD_FAILED: {
    userMessage: 'Images unavailable. Teaching will continue without visual aids.',
    recoverable: true,
  },
  MICROPHONE_ACCESS_DENIED: {
    userMessage: 'Microphone access denied. Please enable microphone permissions or use text input.',
    recoverable: true,
  },
  NETWORK_ERROR: {
    userMessage: 'Network connection issue. Please check your internet connection.',
    recoverable: true,
  },
};

/**
 * Create an AppError from an error code
 */
export function createAppError(code: ErrorCode, technicalMessage?: string): AppError {
  const errorInfo = ERROR_MESSAGES[code];
  
  return {
    code,
    message: technicalMessage || code,
    userMessage: errorInfo.userMessage,
    recoverable: errorInfo.recoverable,
  };
}

/**
 * Handle error and return user-friendly message
 */
export function handleError(error: unknown, code: ErrorCode): AppError {
  console.error(`[${code}]`, error);
  
  const technicalMessage = error instanceof Error ? error.message : String(error);
  return createAppError(code, technicalMessage);
}

/**
 * Display error to user
 */
export function displayError(error: AppError): void {
  // In a real app, this would show a toast/notification
  console.warn(`[User Message] ${error.userMessage}`);
  
  // Could integrate with a toast library here
  if (typeof window !== 'undefined') {
    // Simple alert for now - can be replaced with better UI
    alert(error.userMessage);
  }
}

/**
 * Log error for debugging
 */
export function logError(error: AppError, context?: Record<string, any>): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    recoverable: error.recoverable,
    context,
  };
  
  console.error('[Error Log]', JSON.stringify(logEntry, null, 2));
  
  // In production, send to error tracking service (e.g., Sentry)
}
