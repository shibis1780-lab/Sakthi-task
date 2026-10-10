import { Task } from '../types';

// Generate 1-Click Google Calendar Event URL
export function generateGoogleCalendarUrl(task: Task): string {
  const title = encodeURIComponent(task.title);
  const details = encodeURIComponent(
    `[Sakthi AI Task]\nPriority: ${task.priority.toUpperCase()}\nCategory: ${task.category}\nRecurrence: ${task.recurrence}\n${task.notes ? 'Notes: ' + task.notes : ''}`
  );

  let datePart = task.dueDate.replace(/-/g, '');
  let timePart = task.dueTime ? task.dueTime.replace(/:/g, '') + '00' : '090000';
  let startIso = `${datePart}T${timePart}`;

  // 1 hour duration default
  const endHour = task.dueTime ? String(parseInt(task.dueTime.split(':')[0], 10) + 1).padStart(2, '0') : '10';
  const endMinute = task.dueTime ? task.dueTime.split(':')[1] : '00';
  let endIso = `${datePart}T${endHour}${endMinute}00`;

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startIso}/${endIso}`;

  if (task.locationTrigger) {
    url += `&location=${encodeURIComponent(task.locationTrigger.placeName)}`;
  }

  if (task.recurrence === 'daily') {
    url += `&recur=RRULE:FREQ=DAILY`;
  } else if (task.recurrence === 'weekly') {
    url += `&recur=RRULE:FREQ=WEEKLY`;
  } else if (task.recurrence === 'monthly') {
    url += `&recur=RRULE:FREQ=MONTHLY`;
  }

  return url;
}

// Generate .ics calendar content for export
export function generateICSContent(tasks: Task[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sakthi AI//Tamil Thanglish Personal Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Sakthi AI Tasks & Reminders',
    'X-WR-TIMEZONE:Asia/Kolkata',
  ];

  for (const task of tasks) {
    const uid = `${task.id}@sakthi.ai`;
    const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const dateStr = task.dueDate.replace(/-/g, '');
    const timeStr = task.dueTime ? task.dueTime.replace(/:/g, '') + '00' : '090000';
    const startStr = `${dateStr}T${timeStr}`;

    const endHour = task.dueTime ? String(parseInt(task.dueTime.split(':')[0], 10) + 1).padStart(2, '0') : '10';
    const endMin = task.dueTime ? task.dueTime.split(':')[1] : '00';
    const endStr = `${dateStr}T${endHour}${endMin}00`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowIso}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:${escapeICS(task.title)}`);
    lines.push(`DESCRIPTION:${escapeICS(`Priority: ${task.priority.toUpperCase()} | Category: ${task.category} | ${task.notes || ''}`)}`);
    lines.push(`STATUS:${task.completed ? 'COMPLETED' : 'CONFIRMED'}`);

    if (task.locationTrigger) {
      lines.push(`LOCATION:${escapeICS(task.locationTrigger.placeName)}`);
    }

    if (task.recurrence === 'daily') {
      lines.push('RRULE:FREQ=DAILY');
    } else if (task.recurrence === 'weekly') {
      lines.push('RRULE:FREQ=WEEKLY');
    } else if (task.recurrence === 'monthly') {
      lines.push('RRULE:FREQ=MONTHLY');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Download .ics file
export function downloadICSFile(tasks: Task[], filename = 'sakthi-assistant-calendar.ics') {
  const icsData = generateICSContent(tasks);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Parse imported .ics file into Task objects
export function parseICSContent(icsText: string): Partial<Task>[] {
  const events: Partial<Task>[] = [];
  const lines = icsText.split(/\r\n|\n|\r/);
  let currentEvent: Partial<Task> | null = null;

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {
        priority: 'medium',
        completed: false,
        category: 'routine',
        recurrence: 'none',
      };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.title && currentEvent.dueDate) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8).trim();
      } else if (line.startsWith('DTSTART:')) {
        const val = line.substring(8).trim();
        // Format: YYYYMMDDTHHMMSS or YYYYMMDD
        if (val.length >= 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentEvent.dueDate = `${y}-${m}-${d}`;
        }
        if (val.includes('T') && val.length >= 13) {
          const tPart = val.split('T')[1];
          const h = tPart.substring(0, 2);
          const min = tPart.substring(2, 4);
          currentEvent.dueTime = `${h}:${min}`;
        }
      } else if (line.startsWith('LOCATION:')) {
        const loc = line.substring(9).trim();
        if (loc) {
          currentEvent.locationTrigger = {
            type: 'arrive',
            placeName: loc,
            radiusMeters: 150,
          };
        }
      } else if (line.startsWith('RRULE:')) {
        if (line.includes('FREQ=DAILY')) currentEvent.recurrence = 'daily';
        else if (line.includes('FREQ=WEEKLY')) currentEvent.recurrence = 'weekly';
        else if (line.includes('FREQ=MONTHLY')) currentEvent.recurrence = 'monthly';
      }
    }
  }

  return events;
}
