import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Upload,
  ExternalLink,
  Flame,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Repeat,
  Plus,
} from 'lucide-react';
import { Task, PriorityLevel } from '../types';
import { downloadICSFile, parseICSContent, generateGoogleCalendarUrl } from '../utils/calendar';

interface CalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onOpenNewTaskModal: (date?: string) => void;
  onImportTasks: (imported: Partial<Task>[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectTask,
  onOpenNewTaskModal,
  onImportTasks,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January (தை / மார்கழி)',
    'February (மாசி)',
    'March (பங்குனி)',
    'April (சித்திரை)',
    'May (வைகாசி)',
    'June (ஆனி)',
    'July (ஆடி)',
    'August (ஆவணி)',
    'September (புரட்டாசி)',
    'October (ஐப்பசி)',
    'November (கார்த்திகை)',
    'December (மார்கழி)',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days in current month
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Handle ICS file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = parseICSContent(content);
        if (imported.length > 0) {
          onImportTasks(imported);
          alert(`Successfully imported ${imported.length} tasks into Sakthi AI!`);
        } else {
          alert('No compatible tasks found in this .ics calendar file.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Group tasks by date
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.dueDate]) acc[task.dueDate] = [];
    acc[task.dueDate].push(task);
    return acc;
  }, {});

  const selectedDateTasks = tasksByDate[selectedDate] || [];

  return (
    <div className="space-y-4">
      {/* Calendar Top Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base sm:text-lg font-black text-white">
            {monthNames[month]} {year}
          </h3>

          <button
            onClick={goToToday}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Calendar Sync & Export Tools */}
        <div className="flex items-center gap-2">
          {/* Export to .ics */}
          <button
            onClick={() => downloadICSFile(tasks)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-amber-400 transition cursor-pointer"
            title="Download .ics file for Google Calendar, Apple Calendar or Outlook"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .ics Calendar</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* Import .ics */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".ics,text/calendar"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-cyan-400 transition cursor-pointer"
            title="Import external .ics calendar file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import .ics</span>
            <span className="sm:hidden">Import</span>
          </button>

          {/* Add Task on Selected Date */}
          <button
            onClick={() => onOpenNewTaskModal(selectedDate)}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add on Day</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Month Grid (2 cols on large screen) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-xs font-bold text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-slate-950/20" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayTasks = tasksByDate[dateStr] || [];
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              const hasHigh = dayTasks.some((t) => !t.completed && t.priority === 'high');
              const hasMedium = dayTasks.some((t) => !t.completed && t.priority === 'medium');
              const hasLow = dayTasks.some((t) => !t.completed && t.priority === 'low');

              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col justify-between h-16 sm:h-20 p-1.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10'
                      : isToday
                      ? 'border-indigo-500/50 bg-indigo-950/30'
                      : 'border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-500 text-slate-950'
                          : isSelected
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Priority Indicator Dots */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {hasHigh && <span className="h-2 w-2 rounded-full bg-rose-500" title="High Priority Task" />}
                    {hasMedium && <span className="h-2 w-2 rounded-full bg-amber-400" title="Medium Priority Task" />}
                    {hasLow && <span className="h-2 w-2 rounded-full bg-emerald-400" title="Low Priority Task" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Timeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>Agenda for {selectedDate}</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {selectedDateTasks.length} task(s) scheduled for this day
                </p>
              </div>
              <button
                onClick={() => onOpenNewTaskModal(selectedDate)}
                className="rounded-lg bg-amber-500/20 text-amber-300 px-2 py-1 text-xs font-bold hover:bg-amber-500/30 transition cursor-pointer"
              >
                + Add
              </button>
            </div>

            {selectedDateTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No tasks scheduled for this day yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      task.completed
                        ? 'border-slate-800 bg-slate-950/40 opacity-60'
                        : task.priority === 'high'
                        ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500'
                        : task.priority === 'medium'
                        ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        {task.priority === 'high' ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-400">
                            <Flame className="w-3 h-3 fill-rose-500" />
                            HIGH
                          </span>
                        ) : task.priority === 'medium' ? (
                          <span className="text-[10px] font-bold text-amber-400">MED</span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-400">LOW</span>
                        )}
                        {task.recurrence !== 'none' && (
                          <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" />
                            {task.recurrence}
                          </span>
                        )}
                      </div>

                      {task.dueTime && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {task.dueTime}
                        </span>
                      )}
                    </div>

                    <h5 className={`text-xs font-bold text-white ${task.completed ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h5>

                    {task.locationTrigger && (
                      <p className="mt-1 text-[10px] text-cyan-300 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {task.locationTrigger.type === 'arrive' ? 'Arriving' : 'Departing'} {task.locationTrigger.placeName}
                      </p>
                    )}

                    <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-end">
                      <a
                        href={generateGoogleCalendarUrl(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>Google Cal</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            💡 <strong>Calendar Sync:</strong> Click "Export .ics" to sync all Sakthi tasks with your Google Calendar or phone calendar app.
          </div>
        </div>
      </div>
    </div>
  );
};
