
import { Preferences } from '@capacitor/preferences';
import { Habit } from '../types';
import { format } from 'date-fns';

export const WIDGET_STORAGE_KEY = 'habits_widget_data';

export const updateWidgetData = async (habits: Habit[]) => {
  try {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Filter for active habits and simple data structure for Java/Kotlin parsing
    const widgetData = habits
      .filter(h => !h.isArchived)
      .map(h => ({
        id: h.id,
        name: h.name,
        icon: h.icon || '📝',
        color: h.color || '#3b82f6',
        isCompleted: !!h.history[todayStr]?.completed
      }));

    // Save to Capacitor Preferences (which uses SharedPreferences on Android)
    await Preferences.set({
      key: WIDGET_STORAGE_KEY,
      value: JSON.stringify(widgetData),
    });

    console.log('Widget data synced:', widgetData.length);
  } catch (error) {
    console.error('Failed to sync widget data', error);
  }
};
