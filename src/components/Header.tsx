import React from 'react';
import {
  Calendar,
  MapPin,
  Volume2,
  Plus,
  Sparkles,
  Flame,
  Clock,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { OfflineIndicator } from './OfflineIndicator';
import { Task } from '../types';

interface HeaderProps {
  tasks: Task[];
  activeView: 'dashboard' | 'calendar';
  onSelectView: (view: 'dashboard' | 'calendar') => void;
  onOpenNewTaskModal: () => void;
  onOpenPlacesModal: () => void;
  onOpenVoiceSettingsModal: () => void;
  isOnline: boolean;
  offlineForceMode: boolean;
  onToggleForceOffline: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tasks,
  activeView,
  onSelectView,
  onOpenNewTaskModal,
  onOpenPlacesModal,
  onOpenVoiceSettingsModal,
  isOnline,
  offlineForceMode,
  onToggleForceOffline,
  isSpeaking,
  onStopSpeaking,
}) => {
  const pendingTasks = tasks.filter((t) => !t.completed);
  const highPriorityCount = pendingTasks.filter((t) => t.priority === 'high').length;
  const locationTasksCount = pendingTasks.filter((t) => t.locationTrigger && !t.locationTrigger.triggered).length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand & Sakthi Identity */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                  ச
                </span>
              </div>
            </div>
            {/* Live voice pulse dot */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                isSpeaking ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                சக்தி AI
                <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Sakthi
                </span>
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Thanglish Personal Assistant • Tamil Male Voice
            </p>
          </div>
        </div>

        {/* Quick Task Stats Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {highPriorityCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-500/40" />
              <span>{highPriorityCount} High Priority</span>
            </div>
          )}
          {locationTasksCount > 0 && (
            <button
              onClick={onOpenPlacesModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs hover:bg-cyan-900/40 transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{locationTasksCount} Location Triggers</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{pendingTasks.length} Pending</span>
          </div>
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Speaking Indicator & Stop button */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs animate-pulse hover:bg-amber-500/30 cursor-pointer"
              title="Stop Sakthi speech audio"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaking... (Stop)</span>
            </button>
          )}

          {/* Offline / Online Indicator */}
          <OfflineIndicator
            isOnline={isOnline}
            offlineForceMode={offlineForceMode}
            onToggleForceOffline={onToggleForceOffline}
          />

          {/* View Switcher: Dashboard vs Calendar */}
          <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => onSelectView('calendar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeView === 'calendar'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Geofence / Places Button */}
          <button
            onClick={onOpenPlacesModal}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition cursor-pointer"
            title="Manage Places & Geofence Locations"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {/* Voice Settings Button */}
          <button
            onClick={onOpenVoiceSettingsModal}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition cursor-pointer"
            title="Configure Tamil Male Voice (Pitch, Speed, Timbre)"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Add Task Button */}
          <button
            onClick={onOpenNewTaskModal}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
