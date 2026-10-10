import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  offlineForceMode: boolean;
  onToggleForceOffline: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  offlineForceMode,
  onToggleForceOffline,
}) => {
  const effectiveOffline = !isOnline || offlineForceMode;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleForceOffline}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
          effectiveOffline
            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
            : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
        }`}
        title={
          effectiveOffline
            ? 'Running with Sakthi Offline Engine (Click to switch to Cloud)'
            : 'Online Cloud Active (Click to simulate/test Offline Mode)'
        }
      >
        {effectiveOffline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Offline Sakthi Active</span>
            <span className="sm:hidden">Offline</span>
            {offlineForceMode && <span className="text-[10px] opacity-75">(Test)</span>}
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cloud Online</span>
            <span className="sm:hidden">Online</span>
          </>
        )}
      </button>
    </div>
  );
};
