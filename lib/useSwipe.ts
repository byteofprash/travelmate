import { useRef } from 'react';

/**
 * Horizontal swipe detection for touch screens, with no animation: the page just changes.
 * Ignores mostly-vertical gestures (scrolling) and gestures that start inside [data-noswipe] (the day strip).
 * Swiping left calls onNext; swiping right calls onPrev.
 */
export function useSwipe({ onNext, onPrev, minDist = 60 }: { onNext: () => void; onPrev: () => void; minDist?: number }) {
  const start = useRef<{ x: number; y: number; ok: boolean } | null>(null);
  return {
    onTouchStart(e: React.TouchEvent) {
      const t = e.touches[0];
      const blocked = e.touches.length !== 1 || !!(e.target as HTMLElement).closest('[data-noswipe]');
      start.current = { x: t.clientX, y: t.clientY, ok: !blocked };
    },
    onTouchEnd(e: React.TouchEvent) {
      const s = start.current;
      start.current = null;
      if (!s || !s.ok) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) < minDist || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onNext();
      else onPrev();
    },
    onTouchCancel() {
      start.current = null;
    },
  };
}
