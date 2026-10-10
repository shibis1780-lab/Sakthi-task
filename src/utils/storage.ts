import { Task, ChatMessage, SavedPlace, VoiceSettings, RecurrenceType } from '../types';
import { DEFAULT_PRESET_PLACES } from './geolocation';

const TASKS_KEY = 'sakthi_ai_tasks_v1';
const CHAT_KEY = 'sakthi_ai_chat_v1';
const PLACES_KEY = 'sakthi_ai_places_v1';
const SETTINGS_KEY = 'sakthi_ai_settings_v1';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  pitch: 0.90, // resonant male pitch
  rate: 0.98,
  volume: 1,
  autoSpeak: true,
  soundAlerts: true,
  preferredInputLang: 'en-IN', // Thanglish/Indian English or Tamil
};

function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export const INITIAL_SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    title: 'Pay TNEB Current Bill',
    priority: 'high',
    dueDate: getTodayDateString(),
    dueTime: '18:00',
    completed: false,
    category: 'urgent',
    recurrence: 'monthly',
    notes: 'Last day for discount! Use GPay or TNEB portal.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-2',
    title: 'Client Demo & Sprint Review Meeting',
    priority: 'high',
    dueDate: getTomorrowDateString(),
    dueTime: '10:30',
    completed: false,
    category: 'work',
    recurrence: 'weekly',
    notes: 'Prepare slides and architecture demo in Google Meet.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-3',
    title: 'Buy fresh milk & snacks at Nilgiris',
    priority: 'medium',
    dueDate: getTodayDateString(),
    dueTime: '19:30',
    completed: false,
    category: 'personal',
    recurrence: 'none',
    locationTrigger: {
      type: 'arrive',
      placeName: 'Supermarket / Grocery',
      latitude: 13.0604,
      longitude: 80.2496,
      radiusMeters: 150,
      triggered: false,
    },
    notes: 'Aavin milk packet + tea leaves',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-4',
    title: 'Check laptop charger & office key before leaving',
    priority: 'medium',
    dueDate: getTodayDateString(),
    dueTime: '18:30',
    completed: false,
    category: 'work',
    recurrence: 'daily',
    locationTrigger: {
      type: 'depart',
      placeName: 'Office (Velai)',
      latitude: 12.9716,
      longitude: 80.2435,
      radiusMeters: 200,
      triggered: false,
    },
    notes: 'Do not forget laptop bag in conference room!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-5',
    title: 'Morning Yoga & 20 mins Walking',
    priority: 'medium',
    dueDate: getTomorrowDateString(),
    dueTime: '06:30',
    completed: false,
    category: 'health',
    recurrence: 'daily',
    notes: 'Health is wealth boss! Keep continuous streak.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-task-6',
    title: 'Read 15 pages of Ponniyin Selvan',
    priority: 'low',
    dueDate: getTomorrowDateString(),
    dueTime: '21:30',
    completed: false,
    category: 'routine',
    recurrence: 'daily',
    notes: 'Wind down before sleep without smartphone screen.',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'seed-msg-1',
    sender: 'sakthi',
    text: 'Vanakkam thalaiva! Naan unga personal assistant சக்தி (Sakthi). Enna tasks, reminders, illana calendar schedule pannanum-nu sollunga, naan paathukren!',
    tamilScript: 'வணக்கம் தலைவா! நான் உங்கள் தனிப்பட்ட உதவியாளர் சக்தி. என்ன வேலைகள் இருந்தாலும் சொல்லுங்கள், நான் பார்த்துக் கொள்கிறேன்!',
    timestamp: new Date().toISOString(),
  },
];

export function loadTasksFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      saveTasksToStorage(INITIAL_SEED_TASKS);
      return INITIAL_SEED_TASKS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tasks:', e);
    return INITIAL_SEED_TASKS;
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks:', e);
  }
}

export function loadChatFromStorage(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) {
      saveChatToStorage(INITIAL_CHAT_MESSAGES);
      return INITIAL_CHAT_MESSAGES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_CHAT_MESSAGES;
  }
}

export function saveChatToStorage(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save chat:', e);
  }
}

export function loadPlacesFromStorage(): SavedPlace[] {
  try {
    const raw = localStorage.getItem(PLACES_KEY);
    if (!raw) {
      savePlacesToStorage(DEFAULT_PRESET_PLACES);
      return DEFAULT_PRESET_PLACES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PRESET_PLACES;
  }
}

export function savePlacesToStorage(places: SavedPlace[]) {
  try {
    localStorage.setItem(PLACES_KEY, JSON.stringify(places));
  } catch (e) {
    console.error('Failed to save places:', e);
  }
}

export function loadSettingsFromStorage(): VoiceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: VoiceSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Compute next recurring due date when a task is completed
export function computeNextRecurringDate(currentDateStr: string, recurrence: RecurrenceType): string {
  const date = new Date(currentDateStr);
  if (isNaN(date.getTime())) return currentDateStr;

  if (recurrence === 'daily') {
    date.setDate(date.getDate() + 1);
  } else if (recurrence === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else if (recurrence === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (recurrence === 'custom') {
    date.setDate(date.getDate() + 2); // Default custom interval
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
