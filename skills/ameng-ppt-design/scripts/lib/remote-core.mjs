// remote-core.mjs — where a remote command lands, and the talk timer. Pure functions, no I/O.
const seek = (slides, from, dir) => {
  for (let n = from; n >= 0 && n < slides.length; n += dir) if (!slides[n].hidden) return n;
  return -1;
};

/** Target position for a command, or null when there is nowhere to go. Mirrors Deck.next / Deck.prev. */
export function resolve(cmd, pos, slides) {
  const total = slides[pos.i]?.steps || 0;
  if (cmd.cmd === "next") {
    if (pos.step < total) return { i: pos.i, step: pos.step + 1 };
    const n = seek(slides, pos.i + 1, 1);
    return n < 0 ? null : { i: n, step: 0 };
  }
  if (cmd.cmd === "prev") {
    if (pos.step > 0) return { i: pos.i, step: pos.step - 1 };
    const n = seek(slides, pos.i - 1, -1);
    return n < 0 ? null : { i: n, step: slides[n].steps || 0 };
  }
  if (cmd.cmd === "go") {
    return Number.isInteger(cmd.i) && cmd.i >= 0 && cmd.i < slides.length ? { i: cmd.i, step: 0 } : null;
  }
  return null;
}

export const TIMER_ZERO = Object.freeze({ running: false, base: 0, since: 0, touched: false });
export const elapsed = (t, now) => t.base + (t.running ? now - t.since : 0);
export const toggle = (t, now) => t.running
  ? { ...t, running: false, base: elapsed(t, now) }
  : { ...t, running: true, since: now, touched: true };
/** The first page turn starts the clock, unless someone already used it. */
export const autoStart = (t, now) => t.touched ? t : toggle(t, now);
