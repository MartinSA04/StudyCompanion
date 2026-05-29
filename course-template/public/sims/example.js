/**
 * Minimal course-owned simulation, to show the shape. It lives in the COURSE
 * repo's public/sims/ and is mounted by <Simulation src="/sims/example.js">.
 * The framework owns the chrome (title, DPR-scaled canvas, controls, caption);
 * you own only the drawing + inputs.
 *
 * Contract: default-export init(api), where
 *   api = { canvas, ctx, controls, getSize, onResize, codeBlock }.
 * Coordinates are CSS pixels (the context is pre-scaled for devicePixelRatio).
 * Call onResize(draw) so the framework can repaint after a resize / theme change.
 */
export default function init({ ctx, controls, getSize, onResize }) {
  let b = 4; // length of one leg (the slider controls it)

  const label = document.createElement("label");
  label.append("Katet b ");
  const out = document.createElement("output");
  const input = document.createElement("input");
  input.type = "range";
  input.min = "1";
  input.max = "8";
  input.step = "1";
  input.value = String(b);
  input.setAttribute("aria-label", "Lengden på katet b");
  label.append(out, input);
  controls.append(label);

  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback;

  function draw() {
    const { w, h } = getSize();
    ctx.clearRect(0, 0, w, h);
    const a = 3;
    const c = Math.hypot(a, b);
    out.textContent = `c = ${c.toFixed(2)}`;

    // Map the (3, b) right triangle into the canvas with some padding.
    const pad = 24;
    const sx = (w - 2 * pad) / 8;
    const sy = (h - 2 * pad) / 8;
    const ox = pad;
    const oy = h - pad;

    ctx.strokeStyle = cssVar("--accent", "#2f6df6");
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + b * sx, oy);
    ctx.lineTo(ox, oy - a * sy);
    ctx.closePath();
    ctx.stroke();
  }

  input.addEventListener("input", () => {
    b = Number(input.value);
    draw();
  });

  onResize(draw);
  draw();
}
