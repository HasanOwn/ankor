export interface ReminderSettings {
  enabled: boolean;
  time: string; // "HH:MM"
}

export const REMINDER_KEY = 'ankor-reminder';

export const getReminder = (): ReminderSettings => {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, time: '20:00' };
};

export const saveReminder = (r: ReminderSettings) => {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(r));
  scheduleReminder();
};

let timer: number | undefined;

export const scheduleReminder = () => {
  if (timer) { window.clearTimeout(timer); timer = undefined; }
  const r = getReminder();
  if (!r.enabled) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const [h, m] = r.time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  timer = window.setTimeout(() => {
    try {
      new Notification('AnKor', { body: 'Time to review your cards ✨' });
    } catch {}
    scheduleReminder();
  }, delay);
};

export const requestReminderPermission = async (): Promise<boolean> => {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const p = await Notification.requestPermission();
  return p === 'granted';
};
