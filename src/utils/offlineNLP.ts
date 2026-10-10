import { Task, PriorityLevel, RecurrenceType, LocationTriggerType } from '../types';

export interface OfflineParseResult {
  reply: string;
  tamilScript: string;
  speechText: string;
  actions: {
    type: 'create_task' | 'complete_task' | 'delete_task' | 'filter_priority' | 'query_tasks';
    taskData?: Partial<Task>;
    filterPriority?: PriorityLevel | 'all';
    targetTitle?: string;
  }[];
}

// Helper to format date YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseThanglishOffline(
  text: string,
  existingTasks: Task[] = []
): OfflineParseResult {
  const lower = text.toLowerCase().trim();
  const now = new Date();

  // 1. Detect Priority (High / Medium / Low)
  let priority: PriorityLevel = 'medium';
  if (
    lower.includes('high priority') ||
    lower.includes('mukkiyam') ||
    lower.includes('romba mukkiyam') ||
    lower.includes('urgent') ||
    lower.includes('avasiyam') ||
    lower.includes('high')
  ) {
    priority = 'high';
  } else if (
    lower.includes('low priority') ||
    lower.includes('poruma') ||
    lower.includes('porumaiya') ||
    lower.includes('casual') ||
    lower.includes('low')
  ) {
    priority = 'low';
  } else if (lower.includes('medium') || lower.includes('normal')) {
    priority = 'medium';
  }

  // 2. Detect Recurrence (Daily, Weekly, Monthly, Custom)
  let recurrence: RecurrenceType = 'none';
  let customInterval: string | undefined = undefined;

  if (
    lower.includes('dhinamum') ||
    lower.includes('daily') ||
    lower.includes('every day') ||
    lower.includes('dhina') ||
    lower.includes('dhinam')
  ) {
    recurrence = 'daily';
  } else if (
    lower.includes('vaaram') ||
    lower.includes('weekly') ||
    lower.includes('every week') ||
    lower.includes('vaarathukku')
  ) {
    recurrence = 'weekly';
  } else if (
    lower.includes('maadham') ||
    lower.includes('monthly') ||
    lower.includes('every month') ||
    lower.includes('month')
  ) {
    recurrence = 'monthly';
  } else if (lower.includes('every 2 days') || lower.includes('rendu naalaikku')) {
    recurrence = 'custom';
    customInterval = 'Every 2 days';
  }

  // 3. Detect Location Trigger (Arrive / Depart)
  let locationTrigger:
    | {
        type: LocationTriggerType;
        placeName: string;
        radiusMeters: number;
      }
    | undefined = undefined;

  const places = ['office', 'veedu', 'home', 'gym', 'market', 'store', 'college', 'clinic', 'shop', 'nilgiris', 'hospital'];
  let detectedPlace: string | null = null;
  for (const place of places) {
    if (lower.includes(place)) {
      detectedPlace = place === 'veedu' ? 'Home' : place.charAt(0).toUpperCase() + place.slice(1);
      break;
    }
  }

  // Arrive or Depart detection
  if (
    lower.includes('arrive') ||
    lower.includes('reach') ||
    lower.includes('poirundha') ||
    lower.includes('pona') ||
    lower.includes('pogumbothu') ||
    lower.includes('reach aagum') ||
    lower.includes('varumbothu')
  ) {
    locationTrigger = {
      type: 'arrive',
      placeName: detectedPlace || 'Designated Location',
      radiusMeters: 150,
    };
  } else if (
    lower.includes('depart') ||
    lower.includes('leave') ||
    lower.includes('kelambum') ||
    lower.includes('vittu') ||
    lower.includes('kelamba') ||
    lower.includes('leaving')
  ) {
    locationTrigger = {
      type: 'depart',
      placeName: detectedPlace || 'Designated Location',
      radiusMeters: 150,
    };
  } else if (detectedPlace) {
    // If place was mentioned with reminder
    locationTrigger = {
      type: 'arrive',
      placeName: detectedPlace,
      radiusMeters: 150,
    };
  }

  // 4. Detect Date & Time
  let targetDate = formatDate(now);
  let targetTime = '09:00';

  if (
    lower.includes('naalaki') ||
    lower.includes('nalaki') ||
    lower.includes('tomorrow') ||
    lower.includes('naalai')
  ) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    targetDate = formatDate(tmrw);
  }

  // Extract time like "9am", "10:30", "5 pm", "kaalaila 8", "sayangalam 6"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|manikku|mani)?/i;
  const timeMatch = lower.match(timeRegex);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3]?.toLowerCase();

    if (
      meridian === 'pm' ||
      lower.includes('sayangalam') ||
      lower.includes('evening') ||
      lower.includes('iravu') ||
      lower.includes('night')
    ) {
      if (hours < 12) hours += 12;
    }
    targetTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  // 5. Query / List Tasks Intent
  if (
    lower.includes('tasks enna') ||
    lower.includes('list') ||
    lower.includes('pending') ||
    lower.includes('schedule') ||
    lower.includes('paaru') ||
    lower.includes('what are my tasks') ||
    lower.includes('today schedule')
  ) {
    const pendingCount = existingTasks.filter((t) => !t.completed).length;
    const highCount = existingTasks.filter((t) => !t.completed && t.priority === 'high').length;

    const reply = `Thalaiva, total-ah ${pendingCount} pending tasks irukku. Idhula ${highCount} tasks high priority! Naan list kaatren paalunga.`;
    const tamilScript = `பாஸ், மொத்தம் ${pendingCount} பணிகள் உள்ளன. அதில் ${highCount} மிக முக்கியம்!`;
    return {
      reply,
      tamilScript,
      speechText: reply,
      actions: [{ type: 'query_tasks' }],
    };
  }

  // 6. Filter by Priority Intent
  if (lower.includes('high priority mattum') || lower.includes('only high') || lower.includes('mukkiyam mattum')) {
    const reply = 'Kandippa boss, High Priority tasks mattum filter panni kaatren!';
    return {
      reply,
      tamilScript: 'நிச்சயமாக பாஸ், முக்கிய பணிகள் மட்டும் திரையிடப்படுகின்றன.',
      speechText: reply,
      actions: [{ type: 'filter_priority', filterPriority: 'high' }],
    };
  }

  // 7. Complete Task Intent
  if (
    lower.includes('mudinjithu') ||
    lower.includes('complete pannu') ||
    lower.includes('done') ||
    lower.includes('mark done') ||
    lower.includes('finish aagiduchu')
  ) {
    // Find matching task
    const match = existingTasks.find(
      (t) => !t.completed && lower.includes(t.title.toLowerCase().slice(0, 5))
    ) || existingTasks.find((t) => !t.completed);

    if (match) {
      const reply = `Super thalaiva! "${match.title}" task-ah completed-nu mark panniten! Great progress!`;
      return {
        reply,
        tamilScript: `அற்புதம் பாஸ்! "${match.title}" பணி முடிந்தது என குறித்துவிட்டேன்!`,
        speechText: reply,
        actions: [{ type: 'complete_task', targetTitle: match.title }],
      };
    }
  }

  // 8. Default: Create Task / Reminder Intent
  // Extract title by stripping command phrases
  let cleanTitle = text
    .replace(/add task/gi, '')
    .replace(/task podu/gi, '')
    .replace(/reminder vai/gi, '')
    .replace(/remind me to/gi, '')
    .replace(/remind me/gi, '')
    .replace(/reminder podu/gi, '')
    .replace(/schedule pannu/gi, '')
    .replace(/high priority/gi, '')
    .replace(/mukkiyam/gi, '')
    .replace(/low priority/gi, '')
    .replace(/dhinamum/gi, '')
    .replace(/daily/gi, '')
    .replace(/weekly/gi, '')
    .replace(/monthly/gi, '')
    .replace(/naalaki/gi, '')
    .replace(/tomorrow/gi, '')
    .replace(/today/gi, '')
    .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm|manikku)?\b/gi, '')
    .trim();

  if (!cleanTitle || cleanTitle.length < 2) {
    cleanTitle = 'Quick Task';
  }

  // Category determination
  let category: Task['category'] = 'routine';
  if (priority === 'high') category = 'urgent';
  else if (lower.includes('meeting') || lower.includes('office') || lower.includes('client') || lower.includes('mail')) category = 'work';
  else if (lower.includes('gym') || lower.includes('walk') || lower.includes('tablet') || lower.includes('water')) category = 'health';
  else if (lower.includes('veedu') || lower.includes('home') || lower.includes('family')) category = 'personal';

  const priorityLabel = priority === 'high' ? 'High Priority (Mukkiyam)' : priority === 'low' ? 'Low Priority' : 'Normal Priority';
  const recurrenceLabel = recurrence !== 'none' ? ` (${recurrence.toUpperCase()} repeat)` : '';
  const locationLabel = locationTrigger ? ` - ${locationTrigger.placeName} ${locationTrigger.type === 'arrive' ? 'reach aagum bothu' : 'kelambum bothu'}` : '';

  const reply = `Kandippa thalaiva! Offline-la irundhaalum Sakthi alert-ah iruppan. "${cleanTitle}" task add panniyachi! [${priorityLabel}${recurrenceLabel}${locationLabel}]`;
  const tamilScript = `நிச்சயமாக பாஸ்! இணையம் இல்லாவிட்டாலும் சக்தி தயாராக உள்ளேன். "${cleanTitle}" பதிவு செய்யப்பட்டது!`;

  return {
    reply,
    tamilScript,
    speechText: `Kandippa thalaiva! ${cleanTitle} task add panniyachi. Priority: ${priority}.`,
    actions: [
      {
        type: 'create_task',
        taskData: {
          title: cleanTitle,
          priority,
          dueDate: targetDate,
          dueTime: targetTime,
          recurrence,
          customInterval,
          locationTrigger,
          category,
          completed: false,
          notes: 'Created via Sakthi voice assistant (Offline mode)',
        },
      },
    ],
  };
}
