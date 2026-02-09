/**
 * Gesture Router - Determines which gesture to use based on content
 * Coordinates text, images, and gestures
 */

import { GestureType, TeachingSegment } from '../types';

export class GestureRouter {
  /**
   * Analyze text and determine appropriate gestures
   */
  public static parseTeachingContent(text: string): TeachingSegment[] {
    const segments: TeachingSegment[] = [];
    
    // Split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      // Detect emphasis keywords
      if (this.isEmphasis(trimmed)) {
        segments.push({
          type: 'emphasis',
          content: trimmed,
          gesture: 'emphasis',
        });
      }
      // Detect warning keywords
      else if (this.isWarning(trimmed)) {
        segments.push({
          type: 'text',
          content: trimmed,
          gesture: 'warning',
        });
      }
      // Detect image references
      else if (this.hasImageReference(trimmed)) {
        const imageQuery = this.extractImageQuery(trimmed);
        segments.push({
          type: 'image',
          content: trimmed,
          gesture: 'pointRight',
          imageQuery,
        });
      }
      // Default text explanation
      else {
        segments.push({
          type: 'text',
          content: trimmed,
          gesture: 'pointLeft',
        });
      }
    }

    return segments;
  }

  /**
   * Check if text contains emphasis keywords
   */
  private static isEmphasis(text: string): boolean {
    const emphasisKeywords = [
      'important',
      'crucial',
      'key point',
      'remember',
      'note that',
      'pay attention',
      'critical',
      'essential',
      'fundamental',
    ];

    const lowerText = text.toLowerCase();
    return emphasisKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check if text contains warning keywords
   */
  private static isWarning(text: string): boolean {
    const warningKeywords = [
      'warning',
      'caution',
      'careful',
      'avoid',
      'don\'t',
      'mistake',
      'error',
      'wrong',
      'incorrect',
      'beware',
    ];

    const lowerText = text.toLowerCase();
    return warningKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Check if text references an image
   */
  private static hasImageReference(text: string): boolean {
    const imageKeywords = [
      'look at',
      'see the',
      'observe',
      'notice',
      'image',
      'picture',
      'diagram',
      'chart',
      'graph',
      'illustration',
      'example here',
      'shown here',
    ];

    const lowerText = text.toLowerCase();
    return imageKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Extract image query from text
   */
  private static extractImageQuery(text: string): string {
    // Simple extraction - can be enhanced with NLP
    const match = text.match(/(?:look at|see|observe|notice)\s+(?:the\s+)?([^.!?]+)/i);
    return match ? match[1].trim() : text.substring(0, 50);
  }

  /**
   * Determine gesture sequence for a teaching session
   */
  public static planGestureSequence(segments: TeachingSegment[]): GestureType[] {
    const gestures: GestureType[] = [];

    for (const segment of segments) {
      if (segment.gesture) {
        gestures.push(segment.gesture);
      }
    }

    return gestures;
  }

  /**
   * Calculate timing for gesture sequence
   */
  public static calculateTiming(segments: TeachingSegment[]): number[] {
    const timings: number[] = [];
    let currentTime = 0;

    for (const segment of segments) {
      // Estimate reading time (words per minute = 150)
      const words = segment.content.split(/\s+/).length;
      const readingTime = (words / 150) * 60 * 1000; // in milliseconds
      
      // Add gesture duration
      const gestureDuration = segment.duration || 3000;
      
      timings.push(currentTime);
      currentTime += Math.max(readingTime, gestureDuration);
    }

    return timings;
  }

  /**
   * Merge consecutive segments of same type
   */
  public static optimizeSegments(segments: TeachingSegment[]): TeachingSegment[] {
    if (segments.length === 0) return segments;

    const optimized: TeachingSegment[] = [];
    let current = { ...segments[0] };

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      
      // Merge if same gesture and type
      if (segment.gesture === current.gesture && segment.type === current.type) {
        current.content += ' ' + segment.content;
      } else {
        optimized.push(current);
        current = { ...segment };
      }
    }

    optimized.push(current);
    return optimized;
  }
}
