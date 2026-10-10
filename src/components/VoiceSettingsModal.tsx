import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Sliders,
  Play,
  Check,
  Sparkles,
} from 'lucide-react';
import { VoiceSettings } from '../types';
import { getAvailableVoices, speakThanglish, stopSpeaking } from '../utils/speech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSaveSettings: (settings: VoiceSettings) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      getAvailableVoices().then((voices) => {
        setSystemVoices(voices);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestVoice = () => {
    stopSpeaking();
    setIsPlayingTest(true);
    const testPhrase = 'Vanakkam thalaiva! Naan ungaloda personal assistant Sakthi. Naan eppavume ungaluku assist panna alert-ah ready-ah iruppen!';
    speakThanglish(
      testPhrase,
      localSettings,
      () => setIsPlayingTest(true),
      () => setIsPlayingTest(false)
    );
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <span>Sakthi Male Voice Engine</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure Tamil / Thanglish male speech synthesis parameters
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Pitch Slider (Male Voice Tuning) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-200">Voice Pitch (Male Timbre Tuning)</span>
              <span className="font-mono text-amber-400 font-bold">{localSettings.pitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.2"
              step="0.02"
              value={localSettings.pitch}
              onChange={(e) => setLocalSettings({ ...localSettings, pitch: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Deep Male (0.6)</span>
              <span className="text-amber-300 font-semibold">Recommended (0.88 - 0.92)</span>
              <span>Higher (1.2)</span>
            </div>
          </div>

          {/* Speed / Rate Slider */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-200">Speech Rate (Speaking Speed)</span>
              <span className="font-mono text-amber-400 font-bold">{localSettings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.4"
              step="0.05"
              value={localSettings.rate}
              onChange={(e) => setLocalSettings({ ...localSettings, rate: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Slow (0.75x)</span>
              <span>Natural (0.98x)</span>
              <span>Fast (1.4x)</span>
            </div>
          </div>

          {/* System Voice Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              System Voice Engine
            </label>
            <select
              value={localSettings.voiceURI || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, voiceURI: e.target.value || undefined })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="">Auto Select Best Tamil/Indian Male Voice</option>
              {systemVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speech Input Language */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Voice Recognition Language (Mic Input)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, preferredInputLang: 'en-IN' })}
                className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                  localSettings.preferredInputLang === 'en-IN'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                🇮🇳 Thanglish (en-IN)
              </button>
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, preferredInputLang: 'ta-IN' })}
                className={`py-2 px-3 rounded-xl border font-bold transition cursor-pointer ${
                  localSettings.preferredInputLang === 'ta-IN'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                தமிழ் Pure Tamil (ta-IN)
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Auto-speak replies aloud</span>
              <input
                type="checkbox"
                checked={localSettings.autoSpeak}
                onChange={(e) => setLocalSettings({ ...localSettings, autoSpeak: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Play reminder chimes</span>
              <input
                type="checkbox"
                checked={localSettings.soundAlerts}
                onChange={(e) => setLocalSettings({ ...localSettings, soundAlerts: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
              />
            </label>
          </div>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            className={`w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer ${
              isPlayingTest ? 'animate-pulse' : ''
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlayingTest ? 'Speaking sample...' : 'Test Sakthi Male Voice Preview'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
