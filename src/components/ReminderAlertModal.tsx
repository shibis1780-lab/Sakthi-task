import React from 'react';
import {
  Bell,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Volume2,
  Repeat,
  Flame,
} from 'lucide-react';
import { ActiveReminder } from '../types';

interface ReminderAlertModalProps {
  activeReminder: ActiveReminder | null;
  onDismiss: () => void;
  onComplete: () => void;
  onSnooze: (minutes: number) => void;
  onReplayVoice: () => void;
}

export const ReminderAlertModal: React.FC<ReminderAlertModalProps> = ({
  activeReminder,
  onDismiss,
  onComplete,
  onSnooze,
  onReplayVoice,
}) => {
  if (!activeReminder) return null;

  const { task, triggerReason, locationInfo } = activeReminder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-500 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl text-slate-100 shadow-amber-500/20">
        {/* Glowing badge */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-lg shadow-amber-500/30 animate-bounce">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {triggerReason === 'location' ? 'Location Trigger Alert!' : 'Scheduled Task Reminder!'}
              </h3>
              <p className="text-xs text-amber-300 font-medium">
                Sakthi AI Assistant Alert
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2">
            {task.priority === 'high' && (
              <span className="flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-xs font-bold text-rose-300">
                <Flame className="w-3.5 h-3.5 fill-rose-500" />
                HIGH PRIORITY (Mukkiyam)
              </span>
            )}
            {task.recurrence !== 'none' && (
              <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                <Repeat className="w-3.5 h-3.5" />
                {task.recurrence.toUpperCase()}
              </span>
            )}
          </div>

          <h4 className="text-xl font-black text-white leading-tight">
            {task.title}
          </h4>

          {triggerReason === 'location' && locationInfo && (
            <div className="rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-2.5 text-xs text-cyan-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Triggered: You are <strong>{locationInfo.triggerType === 'arrive' ? 'arriving at' : 'departing from'} {locationInfo.placeName}</strong>!
              </span>
            </div>
          )}

          {task.notes && (
            <p className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              {task.notes}
            </p>
          )}

          {/* Voice Replay button */}
          <button
            onClick={onReplayVoice}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Hear reminder spoken by Sakthi again</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Task Completed (முடிந்தது)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSnooze(5)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze 5 mins</span>
            </button>
            <button
              onClick={() => onSnooze(15)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze 15 mins</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
