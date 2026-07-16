/**
 * Demo simulation for the <Simulation host="dom"> host. Lives in the (demo)
 * course's public/ — the framework never ships course sims. Renders a labelled
 * unit-circle diagram as SVG into `api.stage`: a vinkel-slider sweeps the radius
 * and the sin/cos projections update with crisp, selectable labels (the reason
 * to pick the DOM host over a canvas). Colours come from the page's CSS custom
 * properties, so the diagram re-themes for free; the framework re-runs the
 * onResize callback on both resize and theme change, which reflows the viewBox.
 *
 * Contract: default-export init(api), api = { stage, controls, getSize, onResize }.
 */
export default function init({ stage, controls, getSize, onResize }) {
  let deg = 45;

  const label = document.createElement("label");
  label.append("Vinkel θ ");
  const out = document.createElement("output");
  out.textContent = `${deg}°`;
  const input = document.createElement("input");
  input.type = "range";
  input.min = "0";
  input.max = "90";
  input.step = "1";
  input.value = String(deg);
  input.setAttribute("aria-label", "Vinkel i grader");
  label.append(out, input);

  const readout = document.createElement("div");
  readout.className = "sim-readout";

  controls.append(label, readout);

  function render() {
    const { w, h } = getSize();
    const rad = (deg * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);

    // Origin near the lower-left so the 0–90° arc fills the upper-right quadrant;
    // R leaves room for the top/right side labels.
    const cx = 66;
    const cy = h - 42;
    const R = Math.max(40, Math.min(cy - 26, w - cx - 104));
    const px = cx + R * cos;
    const py = cy - R * sin;

    // Angle arc (small radius) from the +x axis up to the radius.
    const ar = 24;
    const arc = `M ${(cx + ar).toFixed(1)} ${cy.toFixed(1)} A ${ar} ${ar} 0 0 0 ${(cx + ar * cos).toFixed(1)} ${(cy - ar * sin).toFixed(1)}`;

    stage.innerHTML =
      `<svg width="100%" height="100%" viewBox="0 0 ${w.toFixed(0)} ${h.toFixed(0)}" preserveAspectRatio="none" role="img" aria-hidden="true" style="display:block">` +
      // Axes through the origin.
      `<line x1="24" y1="${cy}" x2="${(w - 16).toFixed(1)}" y2="${cy}" stroke="var(--border-strong)" stroke-width="1"/>` +
      `<line x1="${cx}" y1="24" x2="${cx}" y2="${(h - 12).toFixed(1)}" stroke="var(--border-strong)" stroke-width="1"/>` +
      // Unit circle.
      `<path d="M ${cx} ${(cy - R).toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${(cx + R).toFixed(1)} ${cy}" fill="none" stroke="var(--border)" stroke-width="1.5"/>` +
      // cos projection along the x-axis, sin projection dropped from the point.
      `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${cy}" stroke="var(--accent-ink)" stroke-width="2.5"/>` +
      `<line x1="${px.toFixed(1)}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--green)" stroke-width="2.5"/>` +
      // Radius (= 1) and the point on the circle.
      `<line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--accent)" stroke-width="2.5"/>` +
      `<path d="${arc}" fill="none" stroke="var(--muted)" stroke-width="1.5"/>` +
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" style="fill:var(--accent)"/>` +
      // Labels — crisp and selectable, the point of the DOM host.
      `<text x="${(cx + ar + 6).toFixed(1)}" y="${(cy - 8).toFixed(1)}" style="fill:var(--muted);font-family:var(--font-mono);font-size:12px">θ</text>` +
      `<text x="${(px + 8).toFixed(1)}" y="${(cy - (R * sin) / 2).toFixed(1)}" dominant-baseline="middle" style="fill:var(--green);font-family:var(--font-mono);font-size:12px">sin θ</text>` +
      `<text x="${(cx + (R * cos) / 2).toFixed(1)}" y="${(cy + 16).toFixed(1)}" text-anchor="middle" style="fill:var(--accent-ink);font-family:var(--font-mono);font-size:12px">cos θ</text>` +
      `</svg>`;

    out.textContent = `${deg}°`;
    readout.innerHTML = `sin θ = <b>${sin.toFixed(2)}</b>&ensp;·&ensp;cos θ = <b>${cos.toFixed(2)}</b>`;
  }

  input.addEventListener("input", () => {
    deg = Number(input.value);
    render();
  });

  onResize(render);
  render();
}
