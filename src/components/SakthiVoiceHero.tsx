import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  Flame,
  Clock,
  MapPin,
  Repeat,
  RotateCcw,
  Languages,
} from 'lucide-react';
import { ChatMessage, Task, VoiceSettings } from '../types';
import { createSpeechRecognizer } from '../utils/speech';

interface SakthiVoiceHeroProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isProcessing: boolean;
  isSpeaking: boolean;
  onReplaySpeech: (text: string) => void;
  voiceSettings: VoiceSettings;
  onApplyPromptChip: (prompt: string) => void;
  isOnline: boolean;
  offlineForceMode: boolean;
}

export const SakthiVoiceHero: React.FC<SakthiVoiceHeroProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  isSpeaking,
  onReplaySpeech,
  voiceSettings,
  onApplyPromptChip,
  isOnline,
  offlineForceMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [sttSupported, setSttSupported] = useState(true);
  const [showTamilScript, setShowTamilScript] = useState(false);

  const recognizerRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const recognizer = createSpeechRecognizer(voiceSettings.preferredInputLang, {
      onStart: () => {
        setIsListening(true);
        setInterimSpeech('Listening to Tamil / Thanglish...');
      },
      onResult: (transcript, isFinal) => {
        setInterimSpeech(transcript);
        if (isFinal) {
          setInputText(transcript);
          setIsListening(false);
          setInterimSpeech('');
          onSendMessage(transcript);
        }
      },
      onError: (err) => {
        console.warn('Speech Recognition error:', err);
        setIsListening(false);
        setInterimSpeech('');
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    setSttSupported(recognizer.isSupported);
  }, [voiceSettings.preferredInputLang, onSendMessage]);

  const toggleMic = () => {
    if (!recognizerRef.current?.isSupported) {
      alert('Voice microphone input is not supported in this browser. You can type in Thanglish below!');
      return;
    }

    if (isListening) {
      recognizerRef.current.stop();
      setIsListening(false);
      setInterimSpeech('');
    } else {
      recognizerRef.current.start();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const promptChips = [
    { label: '🔥 High Priority mattum kaatu', prompt: 'High priority tasks mattum kaatu thalaiva' },
    { label: '⏰ Naalaki 10 AM client meeting', prompt: 'Naalaki 10:00 AM-ku client demo meeting schedule pannu, high priority' },
    { label: '🥛 Veetuku poga bothu pal vaangu', prompt: 'Veetuku poga bothu pal vaanga reminder vai (Arrive Home)' },
    { label: '⚡ Office vittu kelamba charger', prompt: 'Office vittu kelambum bothu laptop charger eduka remind pannu (Depart Office)' },
    { label: '🔄 Dhinamum morning walk 6:30 AM', prompt: 'Dhinamum morning 6:30 AM-ku walking poga reminder podu' },
    { label: '📋 Today tasks enna?', prompt: 'Today schedule and pending tasks enna irukku Sakthi?' },
  ];

  const latestSakthiMessage = [...messages].reverse().find((m) => m.sender === 'sakthi');

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-4 sm:p-6 shadow-2xl">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-12 right-12 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Voice Assistant Orb & Personality Showcase */}
      <div className="relative flex flex-col md:flex-row items-center gap-6 justify-between border-b border-slate-800/80 pb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Animated AI Orb */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsating ring */}
            <div
              className={`absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full border border-amber-500/30 transition-all duration-700 ${
                isSpeaking
                  ? 'scale-125 border-amber-400 bg-amber-500/15 animate-ping'
                  : isListening
                  ? 'scale-115 border-rose-400 bg-rose-500/15 animate-pulse'
                  : 'scale-100 bg-amber-500/5'
              }`}
            />
            {/* Mid orbital glow */}
            <div
              className={`absolute h-20 w-20 sm:h-22 sm:w-22 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 opacity-30 blur-md transition-all duration-500 ${
                isSpeaking || isListening ? 'scale-110 opacity-70' : 'scale-95'
              }`}
            />

            {/* Core Orb */}
            <div className="relative flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 shadow-xl shadow-amber-500/20">
              <span className="text-3xl font-black bg-gradient-to-br from-amber-300 via-amber-400 to-rose-400 bg-clip-text text-transparent">
                ச
              </span>

              {/* Holographic Sound Waveform inside orb */}
              {(isSpeaking || isListening) && (
                <div className="absolute inset-x-2 bottom-2.5 flex items-center justify-center gap-0.5">
                  <span className="h-2 w-0.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-4 w-0.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-3 w-0.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="h-4 w-0.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="h-2 w-0.5 rounded-full bg-amber-300 animate-bounce" style={{ animationDelay: '250ms' }} />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">சக்தி (Sakthi)</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                <Volume2 className="w-3 h-3 text-indigo-400" />
                Tamil Male Voice
              </span>
              {(!isOnline || offlineForceMode) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-300">
                  ⚡ 100% Offline Engine
                </span>
              )}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              "Vanakkam thalaiva! Priority tasks, recurring reminders, location alerts, calendar sync — Thanglish-la sollu, naan pathukren!"
            </p>
          </div>
        </div>

        {/* Status & Tamil Script Switch */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-xs">
          <button
            onClick={() => setShowTamilScript(!showTamilScript)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition cursor-pointer"
            title="Toggle Tamil Script Translation"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{showTamilScript ? 'Hide Tamil Script' : 'தமிழ் Script காண்'}</span>
          </button>

          {isSpeaking ? (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Sakthi speaks in Male voice...
            </span>
          ) : isProcessing ? (
            <span className="text-indigo-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Thinking...
            </span>
          ) : (
            <span className="text-slate-400">Ready to assist</span>
          )}
        </div>
      </div>

      {/* Latest Voice Conversation Balloon */}
      {latestSakthiMessage && (
        <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400">
                ச
              </span>
              <span className="text-xs font-bold text-amber-300">Sakthi says:</span>
              {latestSakthiMessage.isOfflineGenerated && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Offline Parsed
                </span>
              )}
            </div>
            <button
              onClick={() => onReplaySpeech(latestSakthiMessage.text)}
              className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
              title="Hear reply in Male Voice again"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Play Voice</span>
            </button>
          </div>

          <p className="mt-2 text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
            "{latestSakthiMessage.text}"
          </p>

          {showTamilScript && latestSakthiMessage.tamilScript && (
            <p className="mt-2 text-xs sm:text-sm text-amber-200/90 font-sans border-t border-amber-500/15 pt-2">
              🇮🇳 {latestSakthiMessage.tamilScript}
            </p>
          )}

          {latestSakthiMessage.actionsExecuted && latestSakthiMessage.actionsExecuted.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {latestSakthiMessage.actionsExecuted.map((act, i) => (
                <span
                  key={i}
                  className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300"
                >
                  ✓ {act}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Voice / Text Input Box */}
      <form onSubmit={handleSend} className="mt-4">
        <div className="relative flex items-center rounded-2xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-inner focus-within:border-amber-500/60 transition-all">
          {/* Push-to-talk Mic Button */}
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-amber-400'
            }`}
            title={
              sttSupported
                ? isListening
                  ? 'Tap to stop recording'
                  : 'Tap to speak in Tamil or Thanglish'
                : 'Speech recognition not supported in this browser'
            }
          >
            {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? interimSpeech || 'Listening to your voice...'
                : 'Thanglish-la sollunga... (e.g. "High priority task podu: Client demo meeting 10 AM")'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-white placeholder-slate-500 outline-none"
            disabled={isProcessing}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Listening status feedback */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 animate-pulse px-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Listening... Speak in Thanglish or Tamil now!</span>
          </div>
        )}
      </form>

      {/* Quick Thanglish Prompt Chips */}
      <div className="mt-3.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Quick Thanglish Voice & Text Prompts:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onApplyPromptChip(chip.prompt)}
              className="rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/40 hover:bg-slate-800 hover:text-amber-300 transition-all cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
