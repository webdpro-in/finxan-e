/**
 * Input Panel Component - WITH REAL-TIME VOICE
 * Text input and microphone button at bottom center
 * Implements real-time speech recognition with auto-pause detection
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { aiService } from '../services/AIService';
import { motionManager } from '../services/MotionManager';
import { synchronizationCoordinator } from '../services/SynchronizationCoordinator';
import { eyeController } from '../services/EyeController';
import { lipSyncService } from '../services/LipSyncService';
import { realtimeSpeechService, RealtimeSpeechService } from '../services/RealtimeSpeechService';
import { VoiceState } from '../types';
import { shouldWave } from '../utils/greetingDetector';
import { getRandomGreeting } from '../config/systemPrompt';
import './InputPanel.css';

export const InputPanel: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [liveTranscript, setLiveTranscript] = useState(''); // Real-time transcription
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.IDLE);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isSpeaking,
    setLeftPanelContent,
    setTeachingSegments,
    setIsTeaching,
    addChatMessage,
    setSpeaking,
  } = useAppStore();

  // Setup real-time speech recognition callbacks
  useEffect(() => {
    // Check browser support
    if (!RealtimeSpeechService.isSupported()) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    // Real-time transcript updates
    realtimeSpeechService.onTranscript((text, isFinal) => {
      setLiveTranscript(text);
      
      if (isFinal) {
        console.log('📝 Final transcript:', text);
      }
    });

    // Speech complete (after 1s pause)
    realtimeSpeechService.onComplete((finalText) => {
      console.log('✅ Speech complete:', finalText);
      setLiveTranscript('');
      
      // Process the speech
      if (finalText.trim()) {
        handleSubmit(finalText);
      }
      
      // Continue listening (continuous mode)
      // The service will auto-restart
    });

    // Handle errors
    realtimeSpeechService.onError((error) => {
      console.error('Speech recognition error:', error);
      
      if (error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access to use voice input.');
        setVoiceState(VoiceState.IDLE);
      }
    });
  }, []);

  // Update voice state when AI starts/stops speaking
  useEffect(() => {
    if (isSpeaking) {
      setVoiceState(VoiceState.SPEAKING);
    } else if (voiceState === VoiceState.SPEAKING) {
      setVoiceState(VoiceState.IDLE);
    }
  }, [isSpeaking]);

  // Update motion manager when voice state changes
  useEffect(() => {
    motionManager.setListening(voiceState === VoiceState.LISTENING);
  }, [voiceState]);

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setInputText('');

    // Add user message to chat
    addChatMessage('user', text);

    // Check if greeting - handle locally WITHOUT calling AI backend
    if (shouldWave(text)) {
      console.log('👋 Greeting detected - atomic local handling (no AI call)');
      
      try {
        const greetingResponse = getRandomGreeting();
        addChatMessage('assistant', greetingResponse);
        
        const greetingPromise = motionManager.requestGesture('greeting');
        setSpeaking(true);
        eyeController.lookRight(3000);
        
        const utterance = new SpeechSynthesisUtterance(greetingResponse);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }
        
        utterance.onstart = () => {
          lipSyncService.startSimpleLipSync();
        };
        
        utterance.onend = async () => {
          lipSyncService.stopLipSync();
          await greetingPromise;
          setSpeaking(false);
          eyeController.lookCenter();
          motionManager.returnToIdle();
        };
        
        window.speechSynthesis.speak(utterance);
        
        console.log('✅ Atomic greeting: wave + speech + lip-sync started');
      } catch (error) {
        console.error('Error handling greeting:', error);
        setSpeaking(false);
        eyeController.lookCenter();
        motionManager.returnToIdle();
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // For non-greetings, call AI backend
    try {
      const response = await aiService.query(text);
      addChatMessage('assistant', response.text);
      setTeachingSegments(response.segments);
      setIsTeaching(true);

      await synchronizationCoordinator.executeTeachingSequence(
        response.segments,
        response.text,
        response.images || []
      );

    } catch (error) {
      console.error('Error processing input:', error);
      const errorMsg = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      setLeftPanelContent(errorMsg);
      addChatMessage('assistant', errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = async () => {
    if (voiceState === VoiceState.IDLE) {
      // Start real-time listening
      try {
        await realtimeSpeechService.startListening();
        setVoiceState(VoiceState.LISTENING);
        console.log('🎤 Started real-time listening');
      } catch (error) {
        console.error('Error starting listening:', error);
        alert('Failed to access microphone. Please check permissions.');
      }
    } else if (voiceState === VoiceState.LISTENING) {
      // Stop listening
      realtimeSpeechService.stopListening();
      setVoiceState(VoiceState.IDLE);
      setLiveTranscript('');
      console.log('🛑 Stopped listening');
    } else if (voiceState === VoiceState.SPEAKING) {
      // Stop AI speaking and start listening
      synchronizationCoordinator.interrupt();
      setSpeaking(false);
      setVoiceState(VoiceState.IDLE);
      
      // Start listening
      try {
        await realtimeSpeechService.startListening();
        setVoiceState(VoiceState.LISTENING);
      } catch (error) {
        console.error('Error starting listening:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputText);
    }
  };

  const getMicButtonLabel = () => {
    if (voiceState === VoiceState.LISTENING) return 'Stop';
    if (voiceState === VoiceState.SPEAKING) return 'Speak';
    return 'Speak';
  };

  return (
    <div className="input-panel">
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className="text-input"
          placeholder="Ask me anything..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={voiceState === VoiceState.LISTENING || isProcessing}
        />
        
        <button
          className={`mic-button ${voiceState === VoiceState.LISTENING ? 'recording' : ''}`}
          onClick={handleMicClick}
          disabled={isProcessing}
          title={getMicButtonLabel()}
          aria-label={getMicButtonLabel()}
        >
          {voiceState === VoiceState.LISTENING ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        <button
          className="send-button"
          onClick={() => handleSubmit(inputText)}
          disabled={!inputText.trim() || isProcessing || voiceState === VoiceState.LISTENING}
          aria-label="Send message"
        >
          {isProcessing ? (
            <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      {/* Real-time transcription display */}
      {voiceState === VoiceState.LISTENING && liveTranscript && (
        <div className="live-transcript">
          <span className="transcript-label">You're saying:</span>
          <span className="transcript-text">{liveTranscript}</span>
        </div>
      )}

      {voiceState === VoiceState.LISTENING && !liveTranscript && (
        <div className="listening-indicator">
          <span className="pulse"></span>
          Listening... (speak naturally, I'll respond after you pause)
        </div>
      )}

      {voiceState === VoiceState.SPEAKING && (
        <div className="speaking-indicator">
          <span className="wave"></span>
          Haru is speaking...
        </div>
      )}
    </div>
  );
};
