import { useEffect, useState } from 'react';

interface UseAutoCarouselResult {
  active: number;
  paused: boolean;
  setActive: (index: number) => void;
  setPaused: (paused: boolean) => void;
}

export function useAutoCarousel(length: number, intervalMs: number): UseAutoCarouselResult {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setActive((prev) => (prev + 1) % length), intervalMs);
    return () => window.clearTimeout(id);
  }, [active, paused, length, intervalMs]);

  return { active, paused, setActive, setPaused };
}
