
import { Priority } from "../types";
import { addDays, getDay } from "date-fns";

// Helper functions for date-fns members reported as missing
const nextMonday = (date: Date) => addDays(date, (8 - getDay(date)) % 7 || 7);
const setHours = (date: Date, hours: number) => {
    const d = new Date(date);
    d.setHours(hours);
    return d;
};
const setMinutes = (date: Date, minutes: number) => {
    const d = new Date(date);
    d.setMinutes(minutes);
    return d;
};

export const parseSmartInput = (input: string) => {
  let cleanTitle = input;
  let priority = Priority.None;
  let tags: string[] = [];
  let dueDate: Date | undefined = undefined;
  let isAllDay = true;

  // 1. Parse Priority (!high, !medium, !low, !1, !2, !3)
  if (input.match(/!high|!3/i)) {
    priority = Priority.High;
    cleanTitle = cleanTitle.replace(/!high|!3/i, '');
  } else if (input.match(/!medium|!2/i)) {
    priority = Priority.Medium;
    cleanTitle = cleanTitle.replace(/!medium|!2/i, '');
  } else if (input.match(/!low|!1/i)) {
    priority = Priority.Low;
    cleanTitle = cleanTitle.replace(/!low|!1/i, '');
  }

  // 2. Parse Tags (#tag)
  const tagMatches = input.match(/#\w+/g);
  if (tagMatches) {
    tags = tagMatches.map(t => t.substring(1));
    cleanTitle = cleanTitle.replace(/#\w+/g, '');
  }

  // 3. Simple Date Parsing (today, tomorrow, next week)
  const lowerInput = input.toLowerCase();
  const today = new Date();

  if (lowerInput.includes('today')) {
    dueDate = today;
    cleanTitle = cleanTitle.replace(/today/i, '');
  } else if (lowerInput.includes('tomorrow') || lowerInput.includes('tmrw')) {
    dueDate = addDays(today, 1);
    cleanTitle = cleanTitle.replace(/tomorrow|tmrw/i, '');
  } else if (lowerInput.includes('next week')) {
    dueDate = nextMonday(today);
    cleanTitle = cleanTitle.replace(/next week/i, '');
  }

  // 4. Simple Time Parsing (at 5pm, @5pm, 17:00)
  const timeMatch = input.match(/(?:at|@)\s?(\d{1,2})(?::(\d{2}))?\s?(am|pm)?/i);
  if (timeMatch && dueDate) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();

    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    dueDate = setHours(setMinutes(dueDate, minutes), hours);
    isAllDay = false;
    cleanTitle = cleanTitle.replace(timeMatch[0], '');
  }

  // Cleanup extra spaces
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle,
    priority,
    tags,
    dueDate,
    isAllDay
  };
};
