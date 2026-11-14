// A play clock for the landing page's animations: milliseconds from 0 to `duration`, started the
// first time the element is scrolled into view, with play, pause and seeking. With `loop` it starts
// over after a short hold. With reduced motion it stays on the end, still.
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const LOOP_HOLD_MS = 2500;

export function usePlayClock(duration: number, root: RefObject<Element | null>, { loop = false } = {}) {
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [ms, setMs] = useState(still ? duration : 0);
  const [playing, setPlaying] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (still || !el || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !touched.current) {
        touched.current = true;
        setPlaying(true);
      }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [root, still]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dt = now - last;
      last = now;
      setMs((t) => {
        const next = t + dt;
        if (loop && next >= duration + LOOP_HOLD_MS) return 0;
        return loop ? next : Math.min(next, duration);
      });
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, loop]);

  const time = Math.min(ms, duration);
  const done = !loop && time >= duration;
  useEffect(() => {
    if (done) setPlaying(false);
  }, [done]);

  const toggle = useCallback(() => {
    touched.current = true;
    if (done) setMs(0);
    setPlaying((p) => !p || done);
  }, [done]);
  const seek = useCallback((to: number) => {
    touched.current = true;
    setPlaying(false);
    setMs(to);
  }, []);
  const restart = useCallback(() => {
    touched.current = true;
    setMs(still ? duration : 0);
    setPlaying(!still);
  }, [still, duration]);

  return { time, playing, done, toggle, seek, restart };
}
