import { useRef, type RefObject } from 'react';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Horizontal swipe between pages, with the content following the finger.
 * - Mostly-vertical gestures (scrolling) and gestures that start inside [data-noswipe] (the day strip) are ignored.
 * - While dragging, `target` is moved with a transform only (no layout, no React state), so it stays on the compositor.
 * - Past `minDist` the content slides out and `onNext` / `onPrev` fire; if there is no page that way, it springs back.
 * Swiping left means next, right means previous.
 */
export function useSwipe({
  target,
  can,
  onNext,
  onPrev,
  minDist = 70,
}: {
  target: RefObject<HTMLElement | null>;
  can: (dir: 1 | -1) => boolean;
  onNext: () => void;
  onPrev: () => void;
  minDist?: number;
}) {
  const g = useRef<{ x: number; y: number; mode: 'idle' | 'h' | 'v'; dx: number } | null>(null);

  const apply = (dx: number) => {
    const el = target.current;
    if (!el) return;
    const eased = dx * 0.55;
    el.style.transform = `translate3d(${eased}px,0,0)`;
    el.style.opacity = String(1 - Math.min(Math.abs(dx) / 420, 0.45));
  };
  const settle = (dx: number) => {
    const el = target.current;
    if (!el) return;
    const from = { transform: `translate3d(${dx * 0.55}px,0,0)`, opacity: 1 - Math.min(Math.abs(dx) / 420, 0.45) };
    el.style.transform = '';
    el.style.opacity = '';
    if (!reduced()) el.animate([from, { transform: 'translate3d(0,0,0)', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };

  return {
    onTouchStart(e: React.TouchEvent) {
      const t = e.touches[0];
      const blocked = e.touches.length !== 1 || !!(e.target as HTMLElement).closest('[data-noswipe]');
      g.current = { x: t.clientX, y: t.clientY, mode: blocked ? 'v' : 'idle', dx: 0 };
    },
    onTouchMove(e: React.TouchEvent) {
      const s = g.current;
      if (!s || s.mode === 'v') return;
      const t = e.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.mode === 'idle') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        s.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'h' : 'v';
        if (s.mode === 'v') return;
      }
      s.dx = dx;
      // Rubber-band less when there is nothing in that direction.
      apply(can(dx < 0 ? 1 : -1) ? dx : dx * 0.3);
    },
    onTouchEnd() {
      const s = g.current;
      g.current = null;
      if (!s || s.mode !== 'h') return;
      const dir: 1 | -1 = s.dx < 0 ? 1 : -1;
      if (Math.abs(s.dx) < minDist || !can(dir)) return settle(s.dx);
      const el = target.current;
      const go = () => {
        if (el) {
          el.style.transform = '';
          el.style.opacity = '';
        }
        (dir === 1 ? onNext : onPrev)();
      };
      if (!el || reduced()) return go();
      const cur = { transform: `translate3d(${s.dx * 0.55}px,0,0)`, opacity: 1 - Math.min(Math.abs(s.dx) / 420, 0.45) };
      const a = el.animate([cur, { transform: `translate3d(${-dir * 70}px,0,0)`, opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
      a.onfinish = () => {
        go();
        a.cancel();
      };
    },
    onTouchCancel() {
      const s = g.current;
      g.current = null;
      if (s?.mode === 'h') settle(s.dx);
    },
  };
}
