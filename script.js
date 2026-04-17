// ============================================================
// The Cyclic Modulo 7 Trick — interactive bits
// ============================================================

const MAGIC = '142857';
const PRODUCTS = {
  1: '142857',
  2: '285714',
  3: '428571',
  4: '571428',
  5: '714285',
  6: '857142',
  7: '999999',
};

// ------------------ SECTION 1: the multiplier ------------------
const multButtons = document.querySelectorAll('.mult-btn');
const resultDigits = document.getElementById('result-digits');
const multDisplay = document.getElementById('mult-display');
const trickNote = document.getElementById('trick-note');
const productRows = document.querySelectorAll('.product-row');

const NOTES = {
  1: `Starts with <strong>1</strong> — the natural order.`,
  2: `Same six digits, now starting at <strong>2</strong>. It's a rotation.`,
  3: `Rotated to start at <strong>4</strong>. (Notice: not starting at 3!)`,
  4: `Starts at <strong>5</strong>. The digits 1 4 2 8 5 7 never change — just where you begin.`,
  5: `Starts at <strong>7</strong>. Six digits, six rotations.`,
  6: `Starts at <strong>8</strong> — the last rotation.`,
  7: `Something breaks: ×7 collapses the cycle and gives six <strong>9</strong>'s. That's the secret.`,
};

function paintResult(mult) {
  const product = PRODUCTS[mult];
  [...resultDigits.children].forEach((el, i) => {
    const d = product[i];
    el.textContent = d;
    el.classList.toggle('nine', d === '9');
  });
  multDisplay.textContent = mult;
  trickNote.innerHTML = NOTES[mult];

  multButtons.forEach(b => b.classList.toggle('active', b.dataset.mult === String(mult)));
  productRows.forEach(r => r.classList.toggle('active', r.dataset.mult === String(mult)));

  drawRing(mult);
}

multButtons.forEach(btn => {
  btn.addEventListener('click', () => paintResult(+btn.dataset.mult));
});
productRows.forEach(row => {
  row.addEventListener('click', () => paintResult(+row.dataset.mult));
});

// ------------------ Cycle ring (SVG) ------------------
const ringDigits = document.getElementById('ring-digits');
ringDigits.setAttribute('class', 'ring-digits');

function drawRing(startMult) {
  const radius = 80;
  const digits = MAGIC.split(''); // 1,4,2,8,5,7
  const product = PRODUCTS[startMult] || '142857';
  const startDigit = product[0];

  ringDigits.innerHTML = '';
  digits.forEach((d, i) => {
    const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x);
    t.setAttribute('y', y);
    t.textContent = d;
    if (d === startDigit && startMult !== 7) t.setAttribute('class', 'start');
    ringDigits.appendChild(t);
  });

  // Arrow pointing to the start digit
  if (startMult !== 7) {
    const startIdx = digits.indexOf(startDigit);
    const angle = (startIdx / 6) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * (radius - 28);
    const y = Math.sin(angle) * (radius - 28);
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    arrow.setAttribute('cx', x);
    arrow.setAttribute('cy', y);
    arrow.setAttribute('r', 4);
    arrow.setAttribute('class', 'pointer');
    ringDigits.appendChild(arrow);
  }
}

// ------------------ SECTION 2: long division board ------------------
function renderDivision() {
  const board = document.getElementById('division-board');
  if (!board) return;
  // Simulate dividing 1 by 7, six steps
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
}
renderDivision();

// ------------------ SECTION 3: calculator for k/7 ------------------
const STARTS = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 7, 6: 8 };
const numInput = document.getElementById('numerator');
const calcOutput = document.getElementById('calc-output');
const calcExplain = document.getElementById('calc-explain');

function renderCalc() {
  let k = parseInt(numInput.value, 10);
  if (isNaN(k) || k < 1) k = 1;
  if (k > 6) k = 6;
  numInput.value = k;

  const product = PRODUCTS[k];
  const startDigit = STARTS[k];

  // highlight the starting digit position
  const digitsHtml = product
    .split('')
    .map((d, i) => (i === 0 ? `<span class="start">${d}</span>` : d))
    .join('');

  calcOutput.innerHTML = `0.${digitsHtml}&nbsp;${digitsHtml}…`;
  calcExplain.innerHTML = `For <strong>${k}/7</strong>, start the cycle at digit <strong>${startDigit}</strong>, then read: <strong>${product}</strong>. Repeat forever.`;
}
numInput.addEventListener('input', renderCalc);
renderCalc();

// ------------------ SECTION 4: divisibility by 7 ------------------
const divisInput = document.getElementById('divis-num');
const divisGo = document.getElementById('divis-go');
const divisSteps = document.getElementById('divis-steps');
const divisResult = document.getElementById('divis-result');

function checkDivisible() {
  let raw = divisInput.value.trim();
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

  // Handle zero early
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

  // Verify with BigInt mod
  const isDiv = original % 7n === 0n;
  divisResult.className = 'divis-result ' + (isDiv ? 'good' : 'bad');
  divisResult.textContent = isDiv
    ? `✓ ${original} IS divisible by 7. (${original} ÷ 7 = ${original / 7n})`
    : `✗ ${original} is NOT divisible by 7. (remainder ${original % 7n})`;
}

divisGo.addEventListener('click', checkDivisible);
divisInput.addEventListener('keydown', e => { if (e.key === 'Enter') checkDivisible(); });
checkDivisible();

// ------------------ init ------------------
paintResult(1);
