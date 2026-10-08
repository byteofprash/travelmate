import { useRef } from 'react';

/**
 * Horizontal swipe detection for touch screens. Ignores mostly-vertical gestures (scrolling) and
 * gestures that start inside something that scrolls sideways (the day strip, map cards).
 * Swiping left calls onLeft (next); swiping right calls onRight (previous).
 */
export function useSwipe(onLeft: () => void, onRight: () => void, minDist = 60) {
  const start = useRef<{ x: number; y: number; ok: boolean } | null>(null);
  return {
    onTouchStart(e: React.TouchEvent) {
      const t = e.touches[0];
      const inSideScroller = !!(e.target as HTMLElement).closest('[data-noswipe]');
      start.current = { x: t.clientX, y: t.clientY, ok: e.touches.length === 1 && !inSideScroller };
    },
    onTouchEnd(e: React.TouchEvent) {
      const s = start.current;
      start.current = null;
      if (!s || !s.ok) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (Math.abs(dx) < minDist || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onLeft();
      else onRight();
    },
    onTouchCancel() {
      start.current = null;
    },
  };
}
