export interface ParsedICSEvent {
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
}

export const parseICS = (icsContent: string): ParsedICSEvent[] => {
  const events: ParsedICSEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);

  let inEvent = false;
  let currentEvent: Partial<ParsedICSEvent> = {};
  let currentField = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent.title && currentEvent.dueDate) {
        events.push({
          title: currentEvent.title,
          description: currentEvent.description,
          dueDate: currentEvent.dueDate,
          dueTime: currentEvent.dueTime,
          estimatedDuration: currentEvent.estimatedDuration || 60,
          priority: currentEvent.priority || 'medium',
        });
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
      } else {
        if (currentField) {
          processField(currentField, currentValue, currentEvent);
        }
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1) {
          currentField = line.substring(0, colonIndex);
          currentValue = line.substring(colonIndex + 1);
        }
      }
    }
  }

  if (currentField && inEvent) {
    processField(currentField, currentValue, currentEvent);
  }

  return events;
};

const processField = (
  field: string,
  value: string,
  event: Partial<ParsedICSEvent>
): void => {
  const fieldName = field.split(';')[0];

  switch (fieldName) {
    case 'SUMMARY':
      event.title = unescapeICS(value);
      break;
    case 'DESCRIPTION':
      event.description = unescapeICS(value);
      break;
    case 'DTSTART':
      const start = parseICSDateTime(value);
      event.dueDate = start.date;
      event.dueTime = start.time;
      break;
    case 'DTEND':
      const end = parseICSDateTime(value);
      if (event.dueDate && event.dueTime && end.date && end.time) {
        const startMins = parseTime(end.time) - parseTime(event.dueTime);
        event.estimatedDuration = Math.max(30, startMins);
      }
      break;
    case 'PRIORITY':
      const priorityNum = parseInt(value, 10);
      if (priorityNum >= 1 && priorityNum <= 4) {
        event.priority = 'high';
      } else if (priorityNum === 5) {
        event.priority = 'medium';
      } else {
        event.priority = 'low';
      }
      break;
  }
};

const parseICSDateTime = (
  value: string
): { date?: string; time?: string } => {
  const cleaned = value.replace(/[TZ\-:]/g, '');

  if (cleaned.length >= 8) {
    const date = cleaned.substring(0, 8);
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);

    if (cleaned.length >= 13) {
      const time = cleaned.substring(9, 13);
      const hours = time.substring(0, 2);
      const minutes = time.substring(2, 4);
      return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
    }

    return { date: `${year}-${month}-${day}` };
  }

  return {};
};

const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const unescapeICS = (value: string): string => {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
};
