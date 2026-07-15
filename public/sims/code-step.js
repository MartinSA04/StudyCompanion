/**
 * Demo of a course-owned simulation that DRIVES a <CodeBlock>.
 * Steps through a tiny array-sum routine: each step advances the highlighted
 * source line (via api.codeBlock) AND paints the matching state (array bars,
 * the current element, the running total) on the canvas. This is the pattern
 * the planned algorithm-visualizer course will use.
 *
 * Contract: default-export init(api); here we additionally use
 * api.codeBlock("sum-loop") to control the linked code block by its id.
 */
export default function init({ ctx, controls, getSize, onResize, codeBlock }) {
  const data = [3, 1, 4, 1, 5];
  const code = codeBlock("sum-loop"); // may be null if the block isn't present

  // Build the step program: { line, i, total } snapshots over the run.
  const steps = [];
  let total = 0;
  steps.push({ line: 2, i: -1, total }); // let total = 0
  for (let i = 0; i < data.length; i++) {
    steps.push({ line: 3, i, total }); // for (const x of xs)
    total += data[i];
    steps.push({ line: 4, i, total }); // total += x
  }
  steps.push({ line: 6, i: -1, total }); // return total
  let step = 0;

  const cssVar = (name, fallback) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback;

  function paint() {
    const { w, h } = getSize();
    const s = steps[step];
    ctx.clearRect(0, 0, w, h);

    const n = data.length;
    const gap = 12;
    const bw = Math.min(64, (w - gap * (n + 1)) / n);
    const maxV = Math.max(...data);
    const baseY = h - 46;
    const maxBarH = baseY - 24;

    ctx.font = "13px ui-monospace, monospace";
    ctx.textAlign = "center";

    for (let k = 0; k < n; k++) {
      const x = gap + k * (bw + gap);
      const bh = (data[k] / maxV) * maxBarH;
      const active = k === s.i;
      const done = k < s.i || (s.line === 6 && true);
      ctx.fillStyle = active
        ? cssVar("--accent", "#1f5f8b")
        : done
          ? cssVar("--accent-weak", "#cfe0ee")
          : cssVar("--border-strong", "#c4ccd7");
      ctx.fillRect(x, baseY - bh, bw, bh);

      ctx.fillStyle = cssVar("--fg", "#11161d");
      ctx.fillText(String(data[k]), x + bw / 2, baseY + 18);
    }

    // Running total readout.
    ctx.textAlign = "left";
    ctx.fillStyle = cssVar("--muted", "#5b6573");
    ctx.fillText(`total = ${s.total}`, gap, 18);
  }

  function show() {
    code?.setActiveLine(steps[step].line);
    paint();
    backBtn.disabled = step === 0;
    nextBtn.disabled = step === steps.length - 1;
  }

  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "sim-btn";
  backBtn.textContent = "‹ Forrige";
  backBtn.addEventListener("click", () => {
    if (step > 0) step--;
    show();
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "sim-btn";
  nextBtn.textContent = "Neste steg ›";
  nextBtn.addEventListener("click", () => {
    if (step < steps.length - 1) step++;
    show();
  });

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "sim-btn";
  resetBtn.textContent = "Start på nytt";
  resetBtn.addEventListener("click", () => {
    step = 0;
    show();
  });

  controls.append(backBtn, nextBtn, resetBtn);

  onResize(paint);
  show();
}
