import React, { useState } from 'react';
import {
  Flame,
  AlertCircle,
  CheckCircle2,
  Clock,
  Repeat,
  MapPin,
  Calendar,
  Share2,
  MoreVertical,
  Trash2,
  Edit2,
  Volume2,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, PriorityLevel, RecurrenceType } from '../types';
import { generateGoogleCalendarUrl } from '../utils/calendar';

interface TaskDashboardProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskModal: (initialPriority?: PriorityLevel) => void;
  onSpeakTaskDetails: (task: Task) => void;
  activePriorityFilter: PriorityLevel | 'all';
  onChangePriorityFilter: (filter: PriorityLevel | 'all') => void;
  userCoords?: { latitude: number; longitude: number };
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
  onSpeakTaskDetails,
  activePriorityFilter,
  onChangePriorityFilter,
  userCoords,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'due_earliest' | 'due_latest' | 'title'>('priority_desc');

  // Trigger celebration confetti
  const handleToggle = (task: Task) => {
    if (!task.completed) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
        });
      } catch (e) {
        // Ignored
      }
    }
    onToggleComplete(task);
  };

  // Priority counts
  const highCount = tasks.filter((t) => !t.completed && t.priority === 'high').length;
  const mediumCount = tasks.filter((t) => !t.completed && t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => !t.completed && t.priority === 'low').length;
  const totalPending = tasks.filter((t) => !t.completed).length;

  // Filter and Sort
  const filteredTasks = tasks.filter((task) => {
    // Priority filter
    if (activePriorityFilter !== 'all' && task.priority !== activePriorityFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    // Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = task.notes?.toLowerCase().includes(q);
      const matchPlace = task.locationTrigger?.placeName.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchPlace) return false;
    }
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks stay at bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    if (sortBy === 'priority_desc') {
      const pWeight: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
      return pWeight[b.priority] - pWeight[a.priority];
    }
    if (sortBy === 'priority_asc') {
      const pWeight: Record<PriorityLevel, number> = { high: 3, medium: 2, low: 1 };
      return pWeight[a.priority] - pWeight[b.priority];
    }
    if (sortBy === 'due_earliest') {
      return (a.dueDate + (a.dueTime || '00:00')).localeCompare(b.dueDate + (b.dueTime || '00:00'));
    }
    if (sortBy === 'due_latest') {
      return (b.dueDate + (b.dueTime || '00:00')).localeCompare(a.dueDate + (a.dueTime || '00:00'));
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-4">
      {/* Priority Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Priority Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => onChangePriorityFilter('all')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activePriorityFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>All Tasks</span>
            <span className="rounded-full bg-slate-950/30 px-1.5 py-0.2 text-[10px]">
              {totalPending}
            </span>
          </button>

          <button
            onClick={() => onChangePriorityFilter('high')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activePriorityFilter === 'high'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>High (Mukkiyam)</span>
            <span className="rounded-full bg-rose-950/60 px-1.5 py-0.2 text-[10px]">
              {highCount}
            </span>
          </button>

          <button
            onClick={() => onChangePriorityFilter('medium')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activePriorityFilter === 'medium'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Medium (Normal)</span>
            <span className="rounded-full bg-amber-950/60 px-1.5 py-0.2 text-[10px]">
              {mediumCount}
            </span>
          </button>

          <button
            onClick={() => onChangePriorityFilter('low')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              activePriorityFilter === 'low'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Low (Poruma)</span>
            <span className="rounded-full bg-emerald-950/60 px-1.5 py-0.2 text-[10px]">
              {lowCount}
            </span>
          </button>
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => onOpenNewTaskModal(activePriorityFilter !== 'all' ? activePriorityFilter : 'medium')}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-800 bg-slate-900/70 p-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, locations, notes..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-950 p-0.5 text-xs">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              statusFilter === 'completed' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-700/80 bg-slate-950 py-1.5 px-2.5 text-xs text-slate-200 outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="priority_desc">Priority (High to Low)</option>
            <option value="priority_asc">Priority (Low to High)</option>
            <option value="due_earliest">Due Date (Earliest First)</option>
            <option value="due_latest">Due Date (Latest First)</option>
            <option value="title">Alphabetical (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Task Cards List */}
      {sortedTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
          <AlertCircle className="mx-auto w-10 h-10 text-slate-500 mb-2" />
          <h4 className="text-base font-bold text-slate-300">Indha list-la tasks edhum illa thalaiva!</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Try speaking to Sakthi ("High priority task podu...") or tap "New Task" above to add one.
          </p>
          <button
            onClick={() => onOpenNewTaskModal(activePriorityFilter !== 'all' ? activePriorityFilter : 'medium')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedTasks.map((task) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = task.dueDate === todayStr;
            const isOverdue = !task.completed && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                  task.completed
                    ? 'border-slate-800 bg-slate-900/30 opacity-60'
                    : task.priority === 'high'
                    ? 'border-rose-500/30 bg-gradient-to-br from-rose-950/20 via-slate-900/90 to-slate-900 shadow-lg shadow-rose-950/20 hover:border-rose-500/50'
                    : task.priority === 'medium'
                    ? 'border-amber-500/30 bg-gradient-to-br from-amber-950/15 via-slate-900/90 to-slate-900 hover:border-amber-500/50'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Priority Badge + Category + More Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Priority Badge */}
                      {task.priority === 'high' ? (
                        <span className="flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-extrabold text-rose-300">
                          <Flame className="w-3 h-3 fill-rose-500" />
                          HIGH PRIORITY
                        </span>
                      ) : task.priority === 'medium' ? (
                        <span className="flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          <AlertCircle className="w-3 h-3" />
                          MEDIUM
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          LOW
                        </span>
                      )}

                      {/* Recurrence Badge */}
                      {task.recurrence !== 'none' && (
                        <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300" title={`Repeats: ${task.recurrence}`}>
                          <Repeat className="w-3 h-3" />
                          {task.recurrence.toUpperCase()}
                        </span>
                      )}

                      {/* Location Trigger Badge */}
                      {task.locationTrigger && (
                        <span
                          className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                            task.locationTrigger.type === 'arrive'
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          }`}
                          title={`Activates on ${task.locationTrigger.type === 'arrive' ? 'Arriving at' : 'Departing from'} ${task.locationTrigger.placeName}`}
                        >
                          <MapPin className="w-3 h-3" />
                          {task.locationTrigger.type === 'arrive' ? 'Arrive' : 'Depart'}: {task.locationTrigger.placeName}
                        </span>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSpeakTaskDetails(task)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition cursor-pointer"
                        title="Hear task spoken by Sakthi male voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditTask(task)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Checkbox & Title */}
                  <div className="flex items-start gap-3 mt-1">
                    <button
                      onClick={() => handleToggle(task)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                        task.completed
                          ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                          : 'border-slate-600 bg-slate-950/80 hover:border-amber-400'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1">
                      <h3
                        className={`text-sm sm:text-base font-bold text-slate-100 ${
                          task.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.notes && (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Date & Sync Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span
                      className={
                        isOverdue
                          ? 'text-rose-400 font-bold'
                          : isToday
                          ? 'text-amber-400 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {isToday ? 'Today' : task.dueDate} {task.dueTime ? `at ${task.dueTime}` : ''}
                    </span>
                    {isOverdue && <span className="text-[10px] text-rose-400">(Overdue)</span>}
                  </div>

                  {/* Google Calendar 1-Click Sync */}
                  <a
                    href={generateGoogleCalendarUrl(task)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-400 transition cursor-pointer"
                    title="Add to Google Calendar"
                  >
                    <span>Sync Cal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
