import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Repeat,
  MapPin,
  Tag,
  Save,
} from 'lucide-react';
import { Task, PriorityLevel, RecurrenceType, LocationTriggerType, SavedPlace } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Partial<Task>) => void;
  initialTask?: Task | null;
  defaultPriority?: PriorityLevel;
  savedPlaces: SavedPlace[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  initialTask,
  defaultPriority = 'medium',
  savedPlaces,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00');
  const [category, setCategory] = useState<Task['category']>('routine');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customInterval, setCustomInterval] = useState('Every 2 days');
  const [enableLocationTrigger, setEnableLocationTrigger] = useState(false);
  const [locationType, setLocationType] = useState<LocationTriggerType>('arrive');
  const [selectedPlaceName, setSelectedPlaceName] = useState('Home (Veedu)');
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime || '09:00');
      setCategory(initialTask.category);
      setRecurrence(initialTask.recurrence);
      setCustomInterval(initialTask.customInterval || 'Every 2 days');
      setNotes(initialTask.notes || '');

      if (initialTask.locationTrigger) {
        setEnableLocationTrigger(true);
        setLocationType(initialTask.locationTrigger.type);
        setSelectedPlaceName(initialTask.locationTrigger.placeName);
        setRadiusMeters(initialTask.locationTrigger.radiusMeters || 150);
      } else {
        setEnableLocationTrigger(false);
      }
    } else {
      // Defaults
      setTitle('');
      setPriority(defaultPriority);
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('09:00');
      setCategory(defaultPriority === 'high' ? 'urgent' : 'routine');
      setRecurrence('none');
      setEnableLocationTrigger(false);
      setNotes('');
      if (savedPlaces.length > 0) {
        setSelectedPlaceName(savedPlaces[0].name);
      }
    }
  }, [initialTask, defaultPriority, isOpen, savedPlaces]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let locationTrigger: Task['locationTrigger'] = undefined;
    if (enableLocationTrigger) {
      const matched = savedPlaces.find((p) => p.name === selectedPlaceName);
      locationTrigger = {
        type: locationType,
        placeName: selectedPlaceName,
        latitude: matched?.latitude,
        longitude: matched?.longitude,
        radiusMeters,
        triggered: false,
      };
    }

    onSaveTask({
      id: initialTask?.id,
      title: title.trim(),
      priority,
      dueDate,
      dueTime,
      category,
      recurrence,
      customInterval: recurrence === 'custom' ? customInterval : undefined,
      locationTrigger,
      notes: notes.trim(),
      completed: initialTask ? initialTask.completed : false,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <span>{initialTask ? 'Edit Task' : 'New Task / Reminder'}</span>
            <span className="text-xs font-normal text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Sakthi AI
            </span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Task Title (Thanglish or English) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pay TNEB Bill, Buy milk at Nilgiris, Client meeting..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Priority Level Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Priority Level (முக்கியத்துவம்)</span>
              <span className="text-[11px] font-normal text-slate-400">Sort & filter priority</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition cursor-pointer ${
                  priority === 'high'
                    ? 'border-rose-500 bg-rose-950/60 text-rose-200 ring-2 ring-rose-500/50'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Flame className={`w-4 h-4 ${priority === 'high' ? 'text-rose-400 fill-rose-500' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">High</span>
                <span className="text-[10px] text-rose-300/80">Mukkiyam</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition cursor-pointer ${
                  priority === 'medium'
                    ? 'border-amber-500 bg-amber-950/60 text-amber-200 ring-2 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <AlertCircle className={`w-4 h-4 ${priority === 'medium' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">Medium</span>
                <span className="text-[10px] text-amber-300/80">Normal</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition cursor-pointer ${
                  priority === 'low'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${priority === 'low' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold">Low</span>
                <span className="text-[10px] text-emerald-300/80">Porumai</span>
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Time (Optional)</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Recurring Reminders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
            <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recurring Reminder (மறுபடி நினைவூட்டு)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
              {(['none', 'daily', 'weekly', 'monthly', 'custom'] as RecurrenceType[]).map((rec) => (
                <button
                  key={rec}
                  type="button"
                  onClick={() => setRecurrence(rec)}
                  className={`rounded-lg py-1.5 px-2 font-medium capitalize transition cursor-pointer ${
                    recurrence === rec
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {rec === 'none' ? 'Once' : rec}
                </button>
              ))}
            </div>
            {recurrence === 'custom' && (
              <input
                type="text"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
                placeholder="e.g. Every 2 days, Weekdays"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* Location-Based Reminders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Location-Based Reminder (இட நினைவூட்டல்)</span>
              </label>
              <input
                type="checkbox"
                id="locToggle"
                checked={enableLocationTrigger}
                onChange={(e) => setEnableLocationTrigger(e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-500 cursor-pointer"
              />
            </div>

            {enableLocationTrigger && (
              <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
                {/* Arrive vs Depart */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setLocationType('arrive')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition cursor-pointer ${
                      locationType === 'arrive'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    📍 Arriving At (வந்தவுடன்)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationType('depart')}
                    className={`py-1.5 px-3 rounded-lg font-bold transition cursor-pointer ${
                      locationType === 'depart'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🚪 Departing From (கிளம்பும்போது)
                  </button>
                </div>

                {/* Target Place */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Select Place</label>
                  <select
                    value={selectedPlaceName}
                    onChange={(e) => setSelectedPlaceName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {savedPlaces.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Geofence Radius */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Geofence Radius</span>
                    <span className="font-bold text-cyan-300">{radiusMeters} meters</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={radiusMeters}
                    onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details for Sakthi to remember..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{initialTask ? 'Update Task' : 'Save Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
