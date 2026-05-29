// Demo course-owned <Stepper> module: linear scan for the maximum of an array.
// Lives in public/ (course territory) — the framework only steps the frames and
// owns the chrome. Drawing is an SVG bar chart grounded on a baseline; fills use
// CSS custom properties via inline `style` so they track the page theme.
// Deterministic so the build screenshot of frame 0 is stable (the size control
// still varies the array).

/** @param {number} size */
function makeData(size) {
  const n = Math.max(2, size | 0);
  // Deterministic pseudo-shuffle (no Math.random → stable first frame).
  return Array.from({ length: n }, (_, i) => ((i * 37 + 11) % (n * 3)) + 2);
}

export default {
  sizeRange: { min: 5, max: 9, default: 7 },
  defaultData: makeData,

  /** @param {number[]} a */
  run(a) {
    const frames = [];
    let best = 0;
    frames.push({
      line: 2,
      desc: `Start: max ← a[0] = ${a[0]}.`,
      data: a.slice(),
      vars: { i: 0, max: a[0] },
      cursor: 0,
      best: 0,
    });
    for (let i = 1; i < a.length; i++) {
      frames.push({
        line: 3,
        desc: `Sammenlign a[${i}] = ${a[i]} med max = ${a[best]}.`,
        data: a.slice(),
        vars: { i, max: a[best] },
        cursor: i,
        best,
      });
      if (a[i] > a[best]) {
        best = i;
        frames.push({
          line: 4,
          desc: `a[${i}] er større, så max ← ${a[i]}.`,
          data: a.slice(),
          vars: { i, max: a[best] },
          cursor: i,
          best,
        });
      }
    }
    frames.push({
      line: 6,
      desc: `Ferdig: største verdi er ${a[best]}.`,
      data: a.slice(),
      vars: { i: a.length - 1, max: a[best] },
      cursor: best,
      best,
    });
    return frames;
  },

  /** @param {HTMLElement} stage @param {any} frame @param {{getSize:()=>{w:number,h:number}}} api */
  render(stage, frame, api) {
    const { w, h } = api.getSize();
    const data = frame.data || [];
    const n = data.length;
    if (!n) return;
    const maxV = Math.max(1, ...data);
    const padX = 16;
    const padTop = 14;
    const labelH = 24;
    const chartH = Math.max(20, h - padTop - labelH);
    const baseY = padTop + chartH;
    const gap = Math.max(6, w * 0.014);
    const bw = Math.max(6, (w - padX * 2 - gap * (n - 1)) / n);
    const labelFs = Math.min(15, Math.max(10, bw * 0.42));

    const fillFor = (i) =>
      i === frame.cursor
        ? "var(--accent)"
        : i === frame.best
          ? "var(--green)"
          : "color-mix(in srgb, var(--fg) 14%, transparent)";

    let body = `<line x1="${padX}" y1="${baseY}" x2="${(w - padX).toFixed(1)}" y2="${baseY}" stroke="var(--border)" stroke-width="1"/>`;
    data.forEach((v, i) => {
      const bh = (v / maxV) * chartH;
      const x = padX + i * (bw + gap);
      const cx = x + bw / 2;
      body +=
        `<rect x="${x.toFixed(1)}" y="${(baseY - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" style="fill:${fillFor(i)}"/>` +
        `<text x="${cx.toFixed(1)}" y="${(baseY + 16).toFixed(1)}" text-anchor="middle" style="fill:var(--faint);font-family:var(--font-mono);font-size:${labelFs.toFixed(1)}px">${v}</text>`;
    });
    stage.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="none" role="img" aria-hidden="true" style="display:block">${body}</svg>`;
  },
};
