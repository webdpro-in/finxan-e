/**
 * Greeting Detection Utility
 * Detects if user input is a greeting to trigger hand wave
 */

export function isGreeting(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  const greetingPattern = /^(hi|hello|hey|hai|hii|yo|sup|greetings|howdy|hiya)$/i;
  return greetingPattern.test(trimmed);
}

export function isGreetingPhrase(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  const greetingPhrases = [
    'hi there',
    'hello there',
    'hey there',
    'good morning',
    'good afternoon',
    'good evening',
    'nice to meet you',
  ];
  return greetingPhrases.some(phrase => trimmed.startsWith(phrase));
}

export function shouldWave(text: string): boolean {
  return isGreeting(text) || isGreetingPhrase(text);
}
