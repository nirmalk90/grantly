import { useEffect, useState } from 'react';
import { todayKeyInTimeZone } from './dates';

/** Keeps calendar-day labels fresh across midnight and after tab restore. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayKeyInTimeZone());

  useEffect(() => {
    const update = (): void => {
      setToday((current) => {
        const next = todayKeyInTimeZone();
        return current === next ? current : next;
      });
    };
    const interval = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, []);

  return today;
}
