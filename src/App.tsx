import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SakthiVoiceHero } from './components/SakthiVoiceHero';
import { TaskDashboard } from './components/TaskDashboard';
import { CalendarView } from './components/CalendarView';
import { TaskModal } from './components/TaskModal';
import { LocationManagerModal } from './components/LocationManagerModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { ReminderAlertModal } from './components/ReminderAlertModal';
import {
  Task,
  ChatMessage,
  SavedPlace,
  VoiceSettings,
  PriorityLevel,
  ActiveReminder,
} from './types';
import {
  loadTasksFromStorage,
  saveTasksToStorage,
  loadChatFromStorage,
  saveChatToStorage,
  loadPlacesFromStorage,
  savePlacesToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  computeNextRecurringDate,
} from './utils/storage';
import { speakThanglish, stopSpeaking, playChime } from './utils/speech';
import { parseThanglishOffline } from './utils/offlineNLP';
import { evaluateLocationTriggers } from './utils/geolocation';

export default function App() {
  // State
  const [tasks, setTasks] = useState<Task[]>(loadTasksFromStorage);
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatFromStorage);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>(loadPlacesFromStorage);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(loadSettingsFromStorage);

  const [activeView, setActiveView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [activePriorityFilter, setActivePriorityFilter] = useState<PriorityLevel | 'all'>('all');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Network State & Offline simulation
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineForceMode, setOfflineForceMode] = useState<boolean>(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultPriority, setModalDefaultPriority] = useState<PriorityLevel>('medium');

  const [isPlacesModalOpen, setIsPlacesModalOpen] = useState(false);
  const [isVoiceSettingsModalOpen, setIsVoiceSettingsModalOpen] = useState(false);

  // Active Reminder alert
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  // Geolocation tracking
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const prevCoordsRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined);

  // Sync state to storage
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveChatToStorage(messages);
  }, [messages]);

  useEffect(() => {
    savePlacesToStorage(savedPlaces);
  }, [savedPlaces]);

  useEffect(() => {
    saveSettingsToStorage(voiceSettings);
  }, [voiceSettings]);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Request Notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Real-time GPS Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const previous = prevCoordsRef.current;

        setUserCoords({ latitude, longitude });

        // Evaluate location triggers
        const triggered = evaluateLocationTriggers(
          tasks,
          latitude,
          longitude,
          previous?.latitude,
          previous?.longitude,
          savedPlaces
        );

        if (triggered.length > 0) {
          handleLocationTriggerFired(triggered[0]);
        }

        prevCoordsRef.current = { latitude, longitude };
      },
      (err) => {
        console.warn('Geolocation watch notice:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [tasks, savedPlaces]);

  // Periodic Reminder Timer check (runs every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      for (const task of tasks) {
        if (task.completed || task.reminderNotified) continue;

        if (task.dueDate === todayStr && task.dueTime) {
          // Check if dueTime matches or passed within last 2 minutes
          if (task.dueTime <= currentTimeStr) {
            handleTimeReminderFired(task);
            break;
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Trigger time-based reminder
  const handleTimeReminderFired = (task: Task) => {
    // Mark notified
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, reminderNotified: true } : t))
    );

    if (voiceSettings.soundAlerts) {
      playChime('alert');
    }

    const reminder: ActiveReminder = {
      task,
      triggerReason: 'time',
    };
    setActiveReminder(reminder);

    // Speak in Sakthi's male voice
    const speakText = `Thalaiva! Ungaloda reminder time vandhuduchu: ${task.title}. ${task.priority === 'high' ? 'Idhu romba mukkiyamana high priority task!' : ''}`;
    speakAssistant(speakText);

    // Browser Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Sakthi AI Task Reminder', {
        body: `${task.title} (${task.priority.toUpperCase()} Priority)`,
        icon: '/pwa-192x192.png',
      });
    }
  };

  // Trigger location-based reminder
  const handleLocationTriggerFired = (res: { task: Task; triggerType: 'arrive' | 'depart'; distance: number; placeName: string }) => {
    // Mark as triggered
    setTasks((prev) =>
      prev.map((t) =>
        t.id === res.task.id && t.locationTrigger
          ? {
              ...t,
              locationTrigger: {
                ...t.locationTrigger,
                triggered: true,
                lastTriggeredAt: new Date().toISOString(),
              },
            }
          : t
      )
    );

    if (voiceSettings.soundAlerts) {
      playChime('alert');
    }

    const reminder: ActiveReminder = {
      task: res.task,
      triggerReason: 'location',
      locationInfo: {
        placeName: res.placeName,
        triggerType: res.triggerType,
        distanceMeters: res.distance,
      },
    };
    setActiveReminder(reminder);

    const eventName = res.triggerType === 'arrive' ? 'vandhutinga' : 'vittu kelambureenga';
    const speakText = `Thalaiva! Neenga ${res.placeName} ${eventName}! Sakthi reminder: ${res.task.title}!`;
    speakAssistant(speakText);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Sakthi AI: Location Alert at ${res.placeName}`, {
        body: `${res.task.title} - ${res.triggerType.toUpperCase()} trigger`,
        icon: '/pwa-192x192.png',
      });
    }
  };

  // Speak assistant text
  const speakAssistant = (text: string) => {
    if (!voiceSettings.autoSpeak) return;
    setIsSpeaking(true);
    speakThanglish(
      text,
      voiceSettings,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  // Stop speaking
  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  // Execute actions returned by online Gemini or offline NLP
  const executeActions = (actions: any[]) => {
    const executedTags: string[] = [];

    for (const action of actions) {
      if (action.type === 'create_task' && (action.taskData || action.title)) {
        const newTaskData = action.taskData || {
          title: action.title,
          priority: action.priority || 'medium',
          dueDate: action.dueDate || new Date().toISOString().split('T')[0],
          dueTime: action.dueTime || '09:00',
          recurrence: action.recurrence || 'none',
          customInterval: action.customInterval,
          locationTrigger: action.locationTrigger,
          category: action.category || 'routine',
          notes: action.notes || 'Created via Sakthi voice assistant',
          completed: false,
        };

        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: newTaskData.title || 'Quick Task',
          priority: (newTaskData.priority as PriorityLevel) || 'medium',
          dueDate: newTaskData.dueDate || new Date().toISOString().split('T')[0],
          dueTime: newTaskData.dueTime || '09:00',
          completed: false,
          category: newTaskData.category || 'routine',
          recurrence: newTaskData.recurrence || 'none',
          customInterval: newTaskData.customInterval,
          locationTrigger: newTaskData.locationTrigger,
          notes: newTaskData.notes || '',
          createdAt: new Date().toISOString(),
        };

        setTasks((prev) => [newTask, ...prev]);
        executedTags.push(`Task Created: "${newTask.title}" [${newTask.priority.toUpperCase()}]`);

        if (newTask.priority === 'high') {
          setActivePriorityFilter('all');
        }
      } else if (action.type === 'complete_task') {
        const target = action.targetTitle?.toLowerCase();
        setTasks((prev) =>
          prev.map((t) => {
            if (!t.completed && (!target || t.title.toLowerCase().includes(target))) {
              executedTags.push(`Marked Done: "${t.title}"`);
              return { ...t, completed: true, completedAt: new Date().toISOString() };
            }
            return t;
          })
        );
      } else if (action.type === 'filter_priority') {
        const p = action.priority || action.filterPriority;
        if (p) {
          setActivePriorityFilter(p as any);
          executedTags.push(`Filtered by ${p.toUpperCase()} Priority`);
        }
      } else if (action.type === 'query_tasks') {
        setActiveView('dashboard');
        executedTags.push('Summary Displayed');
      }
    }

    return executedTags;
  };

  // Send message to Sakthi (Online Gemini or Offline NLP Engine)
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      const effectiveOffline = !isOnline || offlineForceMode;

      // Offline flow
      if (effectiveOffline) {
        setTimeout(() => {
          const offlineResult = parseThanglishOffline(text, tasks);
          const executed = executeActions(offlineResult.actions);

          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            sender: 'sakthi',
            text: offlineResult.reply,
            tamilScript: offlineResult.tamilScript,
            timestamp: new Date().toISOString(),
            actionsExecuted: executed,
            isOfflineGenerated: true,
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setIsProcessing(false);
          speakAssistant(offlineResult.speechText || offlineResult.reply);
          if (voiceSettings.soundAlerts) playChime('ding');
        }, 300);
        return;
      }

      // Online flow via server proxy
      try {
        const res = await fetch('/api/sakthi/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: text,
            existingTasks: tasks,
            userLocation: userCoords,
          }),
        });

        if (!res.ok) {
          throw new Error('Server returned non-200');
        }

        const data = await res.json();
        const executed = executeActions(data.actions || []);

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sakthi',
          text: data.reply || 'Vanakkam thalaiva! Request processed!',
          tamilScript: data.tamilScript,
          timestamp: new Date().toISOString(),
          actionsExecuted: executed,
          isOfflineGenerated: false,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);
        speakAssistant(data.speechText || data.reply);
        if (voiceSettings.soundAlerts) playChime('ding');
      } catch (err) {
        console.warn('Online request failed, switching to local offline engine:', err);
        // Fallback to offline engine seamlessly!
        const offlineResult = parseThanglishOffline(text, tasks);
        const executed = executeActions(offlineResult.actions);

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'sakthi',
          text: offlineResult.reply,
          tamilScript: offlineResult.tamilScript,
          timestamp: new Date().toISOString(),
          actionsExecuted: executed,
          isOfflineGenerated: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsProcessing(false);
        speakAssistant(offlineResult.speechText || offlineResult.reply);
        if (voiceSettings.soundAlerts) playChime('ding');
      }
    },
    [isOnline, offlineForceMode, isProcessing, tasks, userCoords, voiceSettings]
  );

  // Toggle complete task
  const handleToggleComplete = (task: Task) => {
    if (!task.completed) {
      if (voiceSettings.soundAlerts) playChime('success');

      // Check if recurring
      if (task.recurrence !== 'none') {
        const nextDate = computeNextRecurringDate(task.dueDate, task.recurrence);
        const recurringInstance: Task = {
          ...task,
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          dueDate: nextDate,
          completed: false,
          reminderNotified: false,
          createdAt: new Date().toISOString(),
        };

        setTasks((prev) => [
          recurringInstance,
          ...prev.map((t) => (t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t)),
        ]);

        speakAssistant(`Super thalaiva! Task completed! Next recurrence ${task.recurrence} scheduled for ${nextDate}!`);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t))
        );
        speakAssistant(`Super thalaiva! "${task.title}" task mudinjithu! Great job!`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: false, completedAt: undefined } : t))
      );
    }
  };

  // Edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (voiceSettings.soundAlerts) playChime('ding');
  };

  // Open modal for new task
  const handleOpenNewTaskModal = (initialPriority: PriorityLevel = 'medium', date?: string) => {
    setEditingTask(null);
    setModalDefaultPriority(initialPriority);
    setIsTaskModalOpen(true);
  };

  // Save task from modal
  const handleSaveTaskFromModal = (taskData: Partial<Task>) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? ({ ...t, ...taskData } as Task) : t))
      );
      speakAssistant(`Task updated thalaiva: ${taskData.title}`);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || 'New Task',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        dueTime: taskData.dueTime,
        completed: false,
        category: taskData.category || 'routine',
        recurrence: taskData.recurrence || 'none',
        customInterval: taskData.customInterval,
        locationTrigger: taskData.locationTrigger,
        notes: taskData.notes,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      speakAssistant(`Kandippa boss, ${newTask.title} task add aagiduchu!`);
    }
  };

  // Speak task details
  const handleSpeakTaskDetails = (task: Task) => {
    const priorityDesc = task.priority === 'high' ? 'Romba mukkiyamana High priority' : task.priority === 'low' ? 'Low priority' : 'Medium priority';
    const recDesc = task.recurrence !== 'none' ? `Idhu ${task.recurrence} repeat aagum.` : '';
    const locDesc = task.locationTrigger ? `Location trigger: ${task.locationTrigger.placeName} ${task.locationTrigger.type === 'arrive' ? 'reach aagum bothu' : 'kelambum bothu'}.` : '';

    const text = `Task: ${task.title}. Due date: ${task.dueDate} at ${task.dueTime || 'anytime'}. ${priorityDesc}. ${recDesc} ${locDesc}`;
    speakAssistant(text);
  };

  // Snooze reminder
  const handleSnoozeReminder = (minutes: number) => {
    if (!activeReminder) return;
    const task = activeReminder.task;
    setActiveReminder(null);

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const newHours = String(now.getHours()).padStart(2, '0');
    const newMins = String(now.getMinutes()).padStart(2, '0');
    const newTime = `${newHours}:${newMins}`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, dueTime: newTime, reminderNotified: false } : t
      )
    );

    speakAssistant(`Seri thalaiva, ${minutes} minutes snooze panniyachu!`);
  };

  // Complete reminder
  const handleCompleteReminder = () => {
    if (!activeReminder) return;
    handleToggleComplete(activeReminder.task);
    setActiveReminder(null);
  };

  // Import external tasks
  const handleImportTasks = (importedList: Partial<Task>[]) => {
    const newItems: Task[] = importedList.map((item, index) => ({
      id: `task-imported-${Date.now()}-${index}`,
      title: item.title || 'Imported Task',
      priority: item.priority || 'medium',
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      dueTime: item.dueTime || '09:00',
      completed: item.completed || false,
      category: item.category || 'routine',
      recurrence: item.recurrence || 'none',
      locationTrigger: item.locationTrigger,
      notes: item.notes || 'Imported from .ics calendar',
      createdAt: new Date().toISOString(),
    }));

    setTasks((prev) => [...newItems, ...prev]);
    speakAssistant(`Calendar file imported successfully boss! ${newItems.length} tasks added!`);
  };

  // Simulate Location (Test geofence arrive/depart)
  const handleSimulateLocation = (
    lat: number,
    lng: number,
    placeName: string,
    eventType: 'arrive' | 'depart'
  ) => {
    setUserCoords({ latitude: lat, longitude: lng });

    // Check which task has this place and event
    const matchedTask = tasks.find(
      (t) =>
        !t.completed &&
        t.locationTrigger &&
        t.locationTrigger.type === eventType &&
        (t.locationTrigger.placeName.toLowerCase().includes(placeName.toLowerCase()) ||
          placeName.toLowerCase().includes(t.locationTrigger.placeName.toLowerCase()))
    );

    if (matchedTask) {
      handleLocationTriggerFired({
        task: matchedTask,
        triggerType: eventType,
        distance: eventType === 'arrive' ? 20 : 350,
        placeName,
      });
    } else {
      const verb = eventType === 'arrive' ? 'reach aagitinga' : 'vittu kelambitinga';
      speakAssistant(`Location simulated thalaiva! Neenga ${placeName} ${verb}. Currently indha spot-ku pending triggers edhum illa.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Global Header */}
      <Header
        tasks={tasks}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewTaskModal={() => handleOpenNewTaskModal(activePriorityFilter !== 'all' ? activePriorityFilter : 'medium')}
        onOpenPlacesModal={() => setIsPlacesModalOpen(true)}
        onOpenVoiceSettingsModal={() => setIsVoiceSettingsModalOpen(true)}
        isOnline={isOnline}
        offlineForceMode={offlineForceMode}
        onToggleForceOffline={() => setOfflineForceMode(!offlineForceMode)}
        isSpeaking={isSpeaking}
        onStopSpeaking={handleStopSpeaking}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Sakthi Voice Assistant Hero (Cockpit) */}
        <SakthiVoiceHero
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
          isSpeaking={isSpeaking}
          onReplaySpeech={speakAssistant}
          voiceSettings={voiceSettings}
          onApplyPromptChip={handleSendMessage}
          isOnline={isOnline}
          offlineForceMode={offlineForceMode}
        />

        {/* View Switch: Dashboard vs Calendar */}
        {activeView === 'dashboard' ? (
          <TaskDashboard
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewTaskModal={handleOpenNewTaskModal}
            onSpeakTaskDetails={handleSpeakTaskDetails}
            activePriorityFilter={activePriorityFilter}
            onChangePriorityFilter={setActivePriorityFilter}
            userCoords={userCoords}
          />
        ) : (
          <CalendarView
            tasks={tasks}
            onSelectTask={handleEditTask}
            onOpenNewTaskModal={(date) => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            onImportTasks={handleImportTasks}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTaskFromModal}
        initialTask={editingTask}
        defaultPriority={modalDefaultPriority}
        savedPlaces={savedPlaces}
      />

      <LocationManagerModal
        isOpen={isPlacesModalOpen}
        onClose={() => setIsPlacesModalOpen(false)}
        savedPlaces={savedPlaces}
        onSavePlaces={setSavedPlaces}
        onSimulateLocation={handleSimulateLocation}
        userCoords={userCoords}
      />

      <VoiceSettingsModal
        isOpen={isVoiceSettingsModalOpen}
        onClose={() => setIsVoiceSettingsModalOpen(false)}
        settings={voiceSettings}
        onSaveSettings={setVoiceSettings}
      />

      <ReminderAlertModal
        activeReminder={activeReminder}
        onDismiss={() => setActiveReminder(null)}
        onComplete={handleCompleteReminder}
        onSnooze={handleSnoozeReminder}
        onReplayVoice={() => {
          if (activeReminder) {
            speakAssistant(`Reminder: ${activeReminder.task.title}!`);
          }
        }}
      />
    </div>
  );
}
