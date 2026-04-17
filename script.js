// ============================================================
// 142857 — The Cyclic Modulo 7 Trick
// ============================================================

const MAGIC = '142857';
const DIGITS = MAGIC.split('').map(Number); // [1,4,2,8,5,7]
const PRODUCTS = {
  1: '142857', 2: '285714', 3: '428571',
  4: '571428', 5: '714285', 6: '857142', 7: '999999',
};
const STARTS = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 7, 6: 8 };

// Remainder cycle: each step multiplies by 10 mod 7
// Starting from 1: 1 → 3 → 2 → 6 → 4 → 5 → 1
// The "digit written" on each step is floor(remainder * 10 / 7)
const REMAINDER_CYCLE = [1, 3, 2, 6, 4, 5]; // order of remainders
const DIGIT_FROM_REMAINDER = { 1: 1, 3: 4, 2: 2, 6: 8, 4: 5, 5: 7 };

const NOTES = {
  1: `Starts with <strong>1</strong> — the natural order.`,
  2: `Same six digits, now starting at <strong>2</strong>. It's a rotation.`,
  3: `Rotated to start at <strong>4</strong>. (Notice: not starting at 3!)`,
  4: `Starts at <strong>5</strong>. The digits 1 4 2 8 5 7 never change — just where you begin.`,
  5: `Starts at <strong>7</strong>. Six digits, six rotations.`,
  6: `Starts at <strong>8</strong> — the last rotation.`,
  7: `Something breaks: ×7 collapses the cycle and gives six <strong>9</strong>'s. That's the secret.`,
};

// ------------------ Background particles ------------------
(function particles() {
  const canvas = document.getElementById('bg-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth * devicePixelRatio;
    h = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['251,191,36', '56,189,248', '167,139,250'];
  const count = Math.min(60, Math.floor((w * h) / 40000));
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.6 + 0.3) * devicePixelRatio,
      vx: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.15 * devicePixelRatio,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      freq: 0.01 + Math.random() * 0.02,
    });
  }

  function tick(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      const alpha = 0.35 + 0.35 * Math.sin(t * 0.001 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${alpha})`;
      ctx.shadowColor = `rgba(${p.c},0.8)`;
      ctx.shadowBlur = 10 * devicePixelRatio;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ------------------ Wait for D3 ------------------
function whenReady(fn) {
  if (window.d3) return fn();
  const iv = setInterval(() => {
    if (window.d3) { clearInterval(iv); fn(); }
  }, 40);
}

whenReady(() => {

  // ============================================================
  //  SECTION 1 — the multiplier, equation, and D3 clockface
  // ============================================================
  const multButtons = document.querySelectorAll('.mult-btn');
  const resultDigits = document.getElementById('result-digits');
  const multDisplay = document.getElementById('mult-display');
  const trickNote = document.getElementById('trick-note');
  const productRows = document.querySelectorAll('.product-row');

  // Build the D3 clockface
  const ringEl = document.getElementById('cycle-ring');
  const ringW = 320, ringH = 320, cx = ringW / 2, cy = ringH / 2;
  const ringSvg = d3.select(ringEl)
    .append('svg')
    .attr('viewBox', `0 0 ${ringW} ${ringH}`);

  // gradient definitions
  const defs = ringSvg.append('defs');
  const grad = defs.append('linearGradient')
    .attr('id', 'ring-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24');
  grad.append('stop').attr('offset', '50%').attr('stop-color', '#38bdf8');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa');

  const glow = defs.append('radialGradient').attr('id', 'center-halo');
  glow.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(251,191,36,0.4)');
  glow.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(251,191,36,0)');

  // Rotating background rim with tick marks
  const rotator = ringSvg.append('g').attr('class', 'ring-rotator');
  const rOuter = 140, rInner = 120, rDigits = 96;
  rotator.append('circle').attr('class', 'ring-outer').attr('cx', cx).attr('cy', cy).attr('r', rOuter);
  rotator.append('circle').attr('class', 'ring-inner').attr('cx', cx).attr('cy', cy).attr('r', rInner);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const major = i % 10 === 0;
    const r1 = rInner + 2;
    const r2 = rInner + (major ? 10 : 5);
    rotator.append('line')
      .attr('class', 'ring-tick' + (major ? ' major' : ''))
      .attr('x1', cx + Math.cos(a) * r1).attr('y1', cy + Math.sin(a) * r1)
      .attr('x2', cx + Math.cos(a) * r2).attr('y2', cy + Math.sin(a) * r2);
  }

  // Halo in center
  ringSvg.append('circle')
    .attr('cx', cx).attr('cy', cy).attr('r', 60)
    .attr('fill', 'url(#center-halo)');

  // Dashed cycle path connecting digits in sequence
  const digitPts = DIGITS.map((_, i) => {
    const a = (i / 6) * 2 * Math.PI - Math.PI / 2;
    return [cx + Math.cos(a) * rDigits, cy + Math.sin(a) * rDigits];
  });
  const cyclePath = d3.line().curve(d3.curveCardinalClosed.tension(0.4));
  ringSvg.append('path')
    .attr('d', cyclePath(digitPts))
    .attr('class', 'cycle-path')
    .attr('stroke-dasharray', '4 6');

  // Digit nodes
  const nodes = ringSvg.selectAll('.digit-node')
    .data(DIGITS)
    .join('g')
    .attr('class', 'digit-node')
    .attr('transform', (_, i) => `translate(${digitPts[i][0]},${digitPts[i][1]})`);
  nodes.append('circle').attr('r', 22);
  nodes.append('text').text(d => d);

  // Clock hand
  const handG = ringSvg.append('g').attr('class', 'clock-hand-group')
    .attr('transform', `translate(${cx},${cy})`);
  const hand = handG.append('g').attr('class', 'clock-hand-rotor');
  hand.append('line')
    .attr('class', 'clock-hand')
    .attr('x1', 0).attr('y1', 0)
    .attr('x2', 0).attr('y2', -(rDigits - 26));
  hand.append('circle')
    .attr('class', 'clock-hand-tip')
    .attr('cx', 0).attr('cy', -(rDigits - 26)).attr('r', 5);
  handG.append('circle').attr('class', 'clock-hub').attr('r', 7);

  // Center readout
  const centerLabel = ringSvg.append('text')
    .attr('x', cx).attr('y', cy + 42)
    .attr('text-anchor', 'middle')
    .attr('class', 'cycle-center-text')
    .text('× 1');

  function updateClock(mult) {
    const product = PRODUCTS[mult];
    const startDigit = product[0];
    const isNine = product[0] === '9';

    // Node highlighting
    nodes.classed('active', d => !isNine && d === +startDigit)
         .classed('nine', () => isNine);

    // Rotate the hand toward the start digit
    let angleDeg = 0;
    if (!isNine) {
      const startIdx = DIGITS.indexOf(+startDigit);
      angleDeg = (startIdx / 6) * 360;
    }
    hand.transition().duration(800)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr('transform', `rotate(${angleDeg})`)
      .style('opacity', isNine ? 0.25 : 1);

    centerLabel.text(isNine ? '× 7 → 999999' : `× ${mult}`);
  }

  function paintResult(mult) {
    const product = PRODUCTS[mult];
    [...resultDigits.children].forEach((el, i) => {
      const newD = product[i];
      if (el.textContent !== newD) {
        el.classList.remove('flip');
        // force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('flip');
        setTimeout(() => { el.textContent = newD; }, 275);
      }
      // toggle nine class in sync with flip midpoint
      setTimeout(() => el.classList.toggle('nine', newD === '9'), 275);
    });
    multDisplay.textContent = mult;
    trickNote.innerHTML = NOTES[mult];

    multButtons.forEach(b => b.classList.toggle('active', b.dataset.mult === String(mult)));
    productRows.forEach(r => r.classList.toggle('active', r.dataset.mult === String(mult)));

    updateClock(mult);
  }

  multButtons.forEach(btn => {
    btn.addEventListener('click', () => paintResult(+btn.dataset.mult));
  });
  productRows.forEach(row => {
    row.addEventListener('click', () => paintResult(+row.dataset.mult));
  });

  // ============================================================
  //  SECTION 2 — long division board + full-reptend cycle diagram
  // ============================================================
  (function renderDivision() {
    const board = document.getElementById('division-board');
    if (!board) return;
    let rem = 1;
    const lines = [];
    for (let i = 0; i < 6; i++) {
      const numerator = rem * 10;
      const digit = Math.floor(numerator / 7);
      const nextRem = numerator % 7;
      lines.push(
        `<div class="step">
          <span><b>${rem}</b>0 ÷ 7</span>
          <span>= <span class="digit">${digit}</span>, remainder <b>${nextRem}</b></span>
        </div>`
      );
      rem = nextRem;
    }
    board.innerHTML = lines.join('');
  })();

  // Full-reptend cycle diagram
  (function cycleDiagram() {
    const el = document.getElementById('cycle-diagram');
    if (!el) return;
    const W = 520, H = 520, CX = W / 2, CY = H / 2, R = 175;

    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`);
    const defs = svg.append('defs');

    // Center gradient
    const cg = defs.append('linearGradient').attr('id', 'center-gradient').attr('x1', '0%').attr('x2', '100%');
    cg.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24');
    cg.append('stop').attr('offset', '100%').attr('stop-color', '#a78bfa');

    // Arrow marker
    defs.append('marker')
      .attr('id', 'arrow-head')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#fbbf24');

    // Node positions on circle (order = REMAINDER_CYCLE)
    const NODE_COLORS = ['#fbbf24', '#38bdf8', '#a78bfa', '#fbbf24', '#38bdf8', '#a78bfa'];
    const nodes = REMAINDER_CYCLE.map((r, i) => {
      const a = (i / 6) * 2 * Math.PI - Math.PI / 2;
      return {
        rem: r,
        digit: DIGIT_FROM_REMAINDER[r],
        x: CX + Math.cos(a) * R,
        y: CY + Math.sin(a) * R,
        color: NODE_COLORS[i],
      };
    });

    // Center label
    svg.append('text').attr('x', CX).attr('y', CY - 14)
      .attr('class', 'cycle-center-text').text('× 10 mod 7');
    svg.append('text').attr('x', CX).attr('y', CY + 18)
      .attr('class', 'cycle-center-big').text('142857');

    // Background decorative ring
    svg.append('circle')
      .attr('cx', CX).attr('cy', CY).attr('r', R + 30)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(251,191,36,0.08)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 8');
    svg.append('circle')
      .attr('cx', CX).attr('cy', CY).attr('r', R - 30)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(56,189,248,0.08)')
      .attr('stroke-width', 1);

    // Arrows between consecutive nodes (curved)
    const arrowG = svg.append('g').attr('class', 'cycle-arrows');
    for (let i = 0; i < nodes.length; i++) {
      const from = nodes[i];
      const to = nodes[(i + 1) % nodes.length];

      // Shorten endpoints so arrows don't overlap the circles
      const dx = to.x - from.x, dy = to.y - from.y;
      const dist = Math.hypot(dx, dy);
      const ux = dx / dist, uy = dy / dist;
      const pad = 28;
      const x1 = from.x + ux * pad, y1 = from.y + uy * pad;
      const x2 = to.x - ux * pad,   y2 = to.y - uy * pad;

      // Curve control point — bend toward center
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const toCx = CX - mx, toCy = CY - my;
      const curveAmt = 22;
      const cxCtrl = mx + (toCx / Math.hypot(toCx, toCy)) * curveAmt;
      const cyCtrl = my + (toCy / Math.hypot(toCx, toCy)) * curveAmt;

      const path = `M ${x1} ${y1} Q ${cxCtrl} ${cyCtrl} ${x2} ${y2}`;

      arrowG.append('path')
        .attr('class', 'cycle-arrow')
        .attr('d', path)
        .attr('stroke', from.color)
        .attr('marker-end', 'url(#arrow-head)')
        .append('title')
        .text(`${from.rem} → ${to.rem} (writes digit ${from.digit})`);

      // Digit label at midpoint
      const lx = cxCtrl + (CX - cxCtrl) * 0.25;
      const ly = cyCtrl + (CY - cyCtrl) * 0.25;
      // Place label slightly further out toward the arc midpoint
      const labelX = (x1 + x2) / 2 + (cxCtrl - mx) * 0.6;
      const labelY = (y1 + y2) / 2 + (cyCtrl - my) * 0.6;

      arrowG.append('circle')
        .attr('cx', labelX).attr('cy', labelY).attr('r', 13)
        .attr('fill', 'rgba(7,10,20,0.85)')
        .attr('stroke', from.color)
        .attr('stroke-width', 1.5);
      arrowG.append('text')
        .attr('x', labelX).attr('y', labelY)
        .attr('class', 'cycle-arrow-label')
        .attr('fill', from.color)
        .text(from.digit);
    }

    // Nodes (drawn on top of arrows)
    const nodeG = svg.append('g').attr('class', 'cycle-nodes')
      .selectAll('g.remainder-node')
      .data(nodes)
      .join('g')
      .attr('class', 'remainder-node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('color', d => d.color);

    nodeG.append('circle')
      .attr('r', 28)
      .attr('fill', 'rgba(10,15,30,0.95)')
      .attr('stroke', d => d.color);

    nodeG.append('text')
      .attr('class', 'label')
      .attr('y', -3)
      .attr('fill', d => d.color)
      .text(d => `${d.rem}/7`);

    nodeG.append('text')
      .attr('class', 'sub')
      .attr('y', 12)
      .text('rem ' + 0); // placeholder — we'll overwrite
    nodeG.selectAll('text.sub').text(d => `rem ${d.rem}`);

    // Gentle pulsing animation on nodes
    nodeG.each(function(d, i) {
      const c = d3.select(this).select('circle');
      (function pulse() {
        c.transition()
          .duration(1800)
          .delay(i * 200)
          .attr('r', 30)
          .transition()
          .duration(1800)
          .attr('r', 28)
          .on('end', pulse);
      })();
    });
  })();

  // ============================================================
  //  SECTION 3 — k/7 calculator
  // ============================================================
  (function calcSevenths() {
    const numInput = document.getElementById('numerator');
    const calcOutput = document.getElementById('calc-output');
    const calcExplain = document.getElementById('calc-explain');
    if (!numInput) return;

    function render() {
      let k = parseInt(numInput.value, 10);
      if (isNaN(k) || k < 1) k = 1;
      if (k > 6) k = 6;
      numInput.value = k;

      const product = PRODUCTS[k];
      const startDigit = STARTS[k];
      const digitsHtml = product
        .split('')
        .map((d, i) => (i === 0 ? `<span class="start">${d}</span>` : d))
        .join('');

      calcOutput.innerHTML = `0.${digitsHtml}&nbsp;${digitsHtml}…`;
      calcExplain.innerHTML = `For <strong>${k}/7</strong>, start the cycle at digit <strong>${startDigit}</strong>, then read: <strong>${product}</strong>. Repeat forever.`;
    }
    numInput.addEventListener('input', render);
    render();
  })();

  // ============================================================
  //  SECTION 4 — divisibility by 7
  // ============================================================
  (function divisibility() {
    const divisInput = document.getElementById('divis-num');
    const divisGo = document.getElementById('divis-go');
    const divisSteps = document.getElementById('divis-steps');
    const divisResult = document.getElementById('divis-result');
    if (!divisInput) return;

    function check() {
      const raw = divisInput.value.trim();
      if (!/^\d+$/.test(raw)) {
        divisSteps.innerHTML = `<div class="dstep" style="color:var(--bad)">Please enter a non-negative whole number.</div>`;
        divisResult.className = 'divis-result';
        divisResult.textContent = '';
        return;
      }

      let current = BigInt(raw);
      const original = current;
      const steps = [];
      let iters = 0;

      if (current === 0n) {
        divisSteps.innerHTML = `<div class="dstep"><b>0</b><span>0 is divisible by every integer.</span><span></span></div>`;
        divisResult.className = 'divis-result good';
        divisResult.textContent = '✓ 0 is divisible by 7';
        return;
      }

      while (current >= 10n && iters < 40) {
        const s = current.toString();
        const a = BigInt(s.slice(0, -1));
        const b = BigInt(s.slice(-1));
        const next = a - 2n * b;
        steps.push(
          `<div class="dstep">
            <span><b>${s}</b></span>
            <span>split → <em>${a}</em> and last digit <em>${b}</em>; ${a} − 2×${b} = <em>${next}</em></span>
            <span>step ${iters + 1}</span>
          </div>`
        );
        current = next < 0n ? -next : next;
        iters++;
      }

      steps.push(
        `<div class="dstep"><b>Final</b><span>Reduced to <em>${current}</em>.</span><span></span></div>`
      );

      divisSteps.innerHTML = steps.join('');

      const isDiv = original % 7n === 0n;
      divisResult.className = 'divis-result ' + (isDiv ? 'good' : 'bad');
      divisResult.textContent = isDiv
        ? `✓ ${original} IS divisible by 7. (${original} ÷ 7 = ${original / 7n})`
        : `✗ ${original} is NOT divisible by 7. (remainder ${original % 7n})`;
    }

    divisGo.addEventListener('click', check);
    divisInput.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    check();
  })();

  // init
  paintResult(1);
});
