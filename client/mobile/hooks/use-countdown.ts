import { useEffect, useState } from 'react';

/**
 * Ticks every second and returns the seconds remaining until `target`.
 * Returns 0 when expired. Stops ticking once 0 is reached.
 */
export function useCountdown(target: string | Date | null | undefined): number {
  const compute = () => {
    if (!target) return 0;
    const ms = new Date(target).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(compute);

  useEffect(() => {
    if (!target) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(compute());
    const id = setInterval(() => {
      const next = compute();
      setSecondsLeft(next);
      if (next <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return secondsLeft;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
