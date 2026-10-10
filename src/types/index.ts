export type PriorityLevel = 'high' | 'medium' | 'low';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type LocationTriggerType = 'arrive' | 'depart';

export type TaskCategory = 'work' | 'personal' | 'health' | 'routine' | 'urgent';

export interface LocationTrigger {
  type: LocationTriggerType;
  placeName: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number; // e.g. 150m
  triggered?: boolean;
  lastTriggeredAt?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: PriorityLevel;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm (24hr)
  completed: boolean;
  completedAt?: string;
  category: TaskCategory;
  recurrence: RecurrenceType;
  customInterval?: string; // e.g., "Every 2 days"
  locationTrigger?: LocationTrigger;
  notes?: string;
  createdAt: string;
  reminderNotified?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sakthi';
  text: string;
  tamilScript?: string;
  timestamp: string;
  actionsExecuted?: string[];
  isOfflineGenerated?: boolean;
}

export interface SavedPlace {
  id: string;
  name: string;
  labelThanglish: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface VoiceSettings {
  pitch: number; // 0.5 to 1.5, default 0.88
  rate: number; // 0.7 to 1.5, default 0.96
  volume: number; // 0 to 1, default 1
  voiceURI?: string;
  autoSpeak: boolean;
  soundAlerts: boolean;
  preferredInputLang: 'ta-IN' | 'en-IN';
}

export interface ActiveReminder {
  task: Task;
  triggerReason: 'time' | 'location';
  locationInfo?: {
    placeName: string;
    triggerType: LocationTriggerType;
    distanceMeters: number;
  };
}
