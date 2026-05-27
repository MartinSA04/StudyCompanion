/**
 * Demo simulation for the <Simulation> widget. Lives in the (demo) course's
 * public/ — the framework never ships course sims. Draws a sine wave whose
 * wavelength is set by a slider, repainting on resize and on theme change
 * (the framework calls the onResize callback for both).
 *
 * Contract: default-export init(api), api = { ctx, controls, getSize, onResize }.
 */
export default function init({ ctx, controls, getSize, onResize }) {
  let lambda = 80; // px per wavelength

  const label = document.createElement("label");
  label.append("Bølgelengde ");
  const out = document.createElement("output");
  out.textContent = `${lambda} px`;
  const input = document.createElement("input");
  input.type = "range";
  input.min = "30";
  input.max = "170";
  input.step = "1";
  input.value = String(lambda);
  input.setAttribute("aria-label", "Bølgelengde i piksler");
  label.append(out, input);
  controls.append(label);

  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback;

  function draw() {
    const { w, h } = getSize();
    ctx.clearRect(0, 0, w, h);

    const mid = h / 2;
    const amp = h * 0.32;

    // Midline.
    ctx.strokeStyle = cssVar("--border-strong", "#c4ccd7");
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    // Wave.
    ctx.strokeStyle = cssVar("--accent", "#1f5f8b");
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x++) {
      const y = mid - Math.sin((x / lambda) * Math.PI * 2) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  input.addEventListener("input", () => {
    lambda = Number(input.value);
    out.textContent = `${lambda} px`;
    draw();
  });

  onResize(draw);
  draw();
}
