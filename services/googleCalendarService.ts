
import { Task, Priority } from '../types';
import { addMinutes, format, addDays, isSameDay, isBefore, isValid } from 'date-fns';

// Helper for parseISO reported as missing
const parseISO = (isoString: string) => {
  return new Date(isoString);
};

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Helper to convert Task to Google Calendar Event Resource
const taskToGoogleEvent = (task: Task) => {
  // Ensure we have a valid start date
  const startDateTime = task.dueDate && isValid(new Date(task.dueDate)) 
    ? new Date(task.dueDate) 
    : new Date();
  
  // Calculate End Date
  // If task has an explicit endDate, use it. Otherwise calculate from duration.
  let endDateTime: Date;
  if (task.endDate && isValid(new Date(task.endDate))) {
      endDateTime = new Date(task.endDate);
  } else {
      // Default to 60 mins if no duration specified
      const duration = task.duration || 60;
      endDateTime = addMinutes(startDateTime, duration);
  }

  // Safety check: End time MUST be after start time
  if (isBefore(endDateTime, startDateTime) || isSameDay(endDateTime, startDateTime) && endDateTime.getTime() === startDateTime.getTime()) {
      endDateTime = addMinutes(startDateTime, 60);
  }

  const resource: any = {
    summary: task.title,
    description: task.description || '',
  };

  if (task.isAllDay) {
    // Google Calendar requires YYYY-MM-DD for all-day events
    const startDateStr = format(startDateTime, 'yyyy-MM-dd');
    resource.start = { date: startDateStr };
    
    // Google Calendar end date is EXCLUSIVE for all-day events.
    // e.g. A 1-day event on 2023-10-27 must have start='2023-10-27' and end='2023-10-28'.
    
    // If we have an explicit endDate, we use it, but ensure it's at least start + 1 day
    let endDateForGCal = endDateTime;
    
    // If it ends on the same day as it starts, add 1 day to make it a 1-day event in GCal terms
    if (isSameDay(startDateTime, endDateForGCal)) {
        endDateForGCal = addDays(startDateTime, 1);
    }
    
    resource.end = { date: format(endDateForGCal, 'yyyy-MM-dd') };
  } else {
    // Specific time events use ISO strings with timezone info if available, or just ISO
    resource.start = { dateTime: startDateTime.toISOString() };
    resource.end = { dateTime: endDateTime.toISOString() };
  }

  // Map priority to colorId (1-11 available in GCal)
  // 11: Red (High), 5: Yellow (Medium), 9: Blue (Low)
  if (task.priority === Priority.High) resource.colorId = '11';
  else if (task.priority === Priority.Medium) resource.colorId = '5';
  else if (task.priority === Priority.Low) resource.colorId = '9';

  return resource;
};

// Helper to convert Google Calendar Event to Task
const googleEventToTask = (event: any): Task => {
  const isAllDay = !!event.start.date;
  // Parse dates. Note: start.date is YYYY-MM-DD.
  const startDate = isAllDay ? parseISO(event.start.date) : parseISO(event.start.dateTime);
  
  let endDate: Date;
  if (isAllDay) {
      endDate = parseISO(event.end.date);
  } else {
      endDate = parseISO(event.end.dateTime);
  }
  
  // Calculate duration in minutes
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);

  // Map Color ID to Priority (Rough mapping)
  let priority = Priority.None;
  if (event.colorId === '11') priority = Priority.High;
  else if (event.colorId === '5') priority = Priority.Medium;
  else if (event.colorId === '9') priority = Priority.Low;

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate temporary local ID
    title: event.summary || '(No Title)',
    description: event.description,
    isCompleted: false,
    priority: priority,
    listId: 'inbox', // Default to inbox
    tags: [],
    dueDate: startDate,
    endDate: endDate,
    duration: duration > 0 ? duration : 60,
    isAllDay: isAllDay,
    subtasks: [],
    attachments: [],
    externalId: event.id,
    isNote: false,
    isEvent: true // MARK AS EVENT
  };
};

export const fetchCalendarEvents = async (token: string, start: Date, end: Date): Promise<Task[]> => {
  try {
    const params = new URLSearchParams({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(`${CALENDAR_API_BASE}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Unauthorized");
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();
    return (data.items || []).map(googleEventToTask);
  } catch (error) {
    console.error("GCal Fetch Error:", error);
    throw error;
  }
};

export const createCalendarEvent = async (token: string, task: Task) => {
  try {
    const body = taskToGoogleEvent(task);
    console.log("Creating GCal Event Payload:", body);
    
    const response = await fetch(CALENDAR_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        const err = await response.json();
        console.error("GCal Create Error Response:", err);
        throw new Error("Failed to create event");
    }
    
    const data = await response.json();
    console.log("GCal Event Created Successfully:", data.id);
    return data; 
  } catch (error) {
    console.error("GCal Create Error:", error);
    throw error; // Rethrow to handle in App.tsx
  }
};

export const updateCalendarEvent = async (token: string, task: Task) => {
  if (!task.externalId) {
      console.warn("Skipping GCal update: No externalId");
      return null;
  }

  try {
    const body = taskToGoogleEvent(task);
    console.log("Updating GCal Event Payload:", task.externalId, body);

    const response = await fetch(`${CALENDAR_API_BASE}/${task.externalId}`, {
      method: 'PATCH', // PATCH updates only changed fields
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        const err = await response.json();
        console.error("GCal Update Error Response:", err);
        // If 404/410, maybe we should clear the externalId locally?
        if (response.status === 404 || response.status === 410) {
             throw new Error("EntityNotFound");
        }
        throw new Error("Failed to update event");
    }
    
    const data = await response.json();
    console.log("GCal Event Updated Successfully:", data.id);
    return data;
  } catch (error) {
    console.error("GCal Update Error:", error);
    throw error; // Rethrow to handle in App.tsx
  }
};

export const deleteCalendarEvent = async (token: string, externalId: string) => {
  try {
    console.log("Deleting GCal Event:", externalId);
    const response = await fetch(`${CALENDAR_API_BASE}/${externalId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        if (response.status === 410 || response.status === 404) {
            console.log("GCal Event already deleted or not found.");
            return true;
        }
        const err = await response.json();
        console.error("GCal Delete Error Response:", err);
        throw new Error("Failed to delete event");
    }
    console.log("GCal Event Deleted Successfully");
    return true;
  } catch (error) {
    console.error("GCal Delete Error:", error);
    throw error; // Rethrow to handle in App.tsx
  }
};
