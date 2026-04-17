# 142857 — The Cyclic Modulo 7 Trick

An interactive single-page site about the magic number **142857**, the cyclic number hidden inside `1/7`.

Multiply 142857 by 1, 2, 3, 4, 5, or 6 and you get the same six digits — rotated.
Multiply by 7 and you get `999999`. This site explains why, and shows you how
to use it for fast mental math with sevenths.

## What's inside

- **The Trick** — tap × 1 through × 7 and watch the digits rotate on a ring.
- **Why It Works** — long division of 1 ÷ 7, the full-reptend cycle of remainders, and a one-line proof that `142857 × 7 = 999999`.
- **How to Use It** — memorize one cycle, look up the starting digit, read off any `k/7` in your head. Includes a live calculator.
- **Divisibility by 7** — a companion trick: chop the last digit, double it, subtract, repeat. Step-by-step visualizer included.
- **Fun Facts** — Kaprekar splits, 142 + 857 = 999, primitive roots, and cyclic siblings (1/17, 1/19, 1/23…).

## Running locally

It's static HTML/CSS/JS — no build step, no dependencies.

```bash
# any static server works
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

- `index.html` — content & structure
- `styles.css` — dark, glassy UI
- `script.js` — interactive multiplier, ring visualizer, calculator, divisibility checker (uses BigInt)
