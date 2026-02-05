
export const STORAGE_KEYS = {
  TASKS: 'ticktick_clone_tasks',
  LISTS: 'ticktick_clone_lists',
  HABITS: 'ticktick_clone_habits',
  FOCUS: 'ticktick_clone_focus_categories',
  FOCUS_SESSIONS: 'ticktick_clone_focus_sessions',
  TRANSACTIONS: 'ticktick_clone_transactions',
  DEBTORS: 'ticktick_clone_debtors',
  DEBTS: 'ticktick_clone_debts',
  GOALS: 'ticktick_clone_goals',
  SUBSCRIPTIONS: 'ticktick_clone_subscriptions',
  INVESTMENTS: 'ticktick_clone_investments',
  SETTINGS: 'ticktick_clone_settings',
  TOKEN: 'ticktick_clone_token',
  USER: 'ticktick_clone_user'
};

export const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item, (key, value) => {
        // Revive dates
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
        }
        return value;
    });
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
    return defaultValue;
  }
};

export const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
};
