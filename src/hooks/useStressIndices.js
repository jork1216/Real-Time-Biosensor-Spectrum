// useStressIndices.js
// Computes algae stress indices in real time by comparing live Arduino readings
// against a stored baseline.
//
// Indices calculated:
//   1. Chlorophyll Index   = F8(680nm) / F2(445nm)
//   2. Car:Chl Ratio       = F3(480nm) / F8(680nm)
//   3. Yellow Index        = F6(590nm) / F3(480nm)   ← UPDATED: was F6/F5, now F6/F3 for wider gap
//   4. Stress Ratio        = (F5+F6) / (F2+F8)       ← UPDATED: channels normalized by Clear first
//
// Each index returns:
//   value      {number}         Current computed value
//   baseline   {number}         Same index computed from baseline reading
//   delta      {number}         % change from baseline (+ = increased, - = decreased)
//   status     {string}         "healthy" | "mild" | "stress"
//
// Thresholds (% deviation from baseline):
//   0–10%   → healthy  🟢
//   10–25%  → mild     🟡
//   >25%    → stress   🔴

import { useMemo } from 'react';

// ── Threshold config ──────────────────────────────────────────────────────────
const MILD_THRESHOLD   = 0.10;   // 10%
const STRESS_THRESHOLD = 0.25;   // 25%

// ── Helper: extract a single channel value from chartData array ───────────────
function ch(data, wavelength) {
  if (!data || data.length === 0) return null;
  const found = data.find(d => d.wavelength === wavelength);
  return found ? found.intensity : null;
}

// ── Helper: extract a single channel value from baseline.channels object ──────
function bch(baseline, wavelength) {
  if (!baseline || !baseline.channels) return null;
  return baseline.channels[wavelength] ?? null;
}

// ── Helper: safe division (returns null if denominator is 0 or missing) ───────
function safeDivide(a, b) {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

// ── Helper: normalize a channel value by the Clear channel ───────────────────
// Compensates for ambient light intensity shifts so ratios stay
// stable even if room light changes between readings.
function normalize(val, clear) {
  if (val === null || clear === null || clear === 0) return null;
  return val / clear;
}

// ── Helper: compute % delta and status ───────────────────────────────────────
function assess(current, base) {
  if (current === null || base === null || base === 0) {
    return { delta: null, status: 'unknown' };
  }
  const delta = (current - base) / base;
  let status;
  if (Math.abs(delta) <= MILD_THRESHOLD)        status = 'healthy';
  else if (Math.abs(delta) <= STRESS_THRESHOLD) status = 'mild';
  else                                           status = 'stress';
  return { delta, status };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export default function useStressIndices(chartData, baseline) {

  const indices = useMemo(() => {

    // ── Pull live channel values ────────────────────────────────────────────
    const live = {
      F2:    ch(chartData, '445nm'),
      F3:    ch(chartData, '480nm'),
      F5:    ch(chartData, '555nm'),
      F6:    ch(chartData, '590nm'),
      F8:    ch(chartData, '680nm'),
      Clear: ch(chartData, 'Clear'),
    };

    // ── Pull baseline channel values ────────────────────────────────────────
    const base = {
      F2:    bch(baseline, '445nm'),
      F3:    bch(baseline, '480nm'),
      F5:    bch(baseline, '555nm'),
      F6:    bch(baseline, '590nm'),
      F8:    bch(baseline, '680nm'),
      Clear: bch(baseline, 'Clear'),
    };

    // ────────────────────────────────────────────────────────────────────────
    // INDEX 1 — Chlorophyll Index: F8 / F2
    // Unchanged — consistently correct in validation tests.
    // Drops as chlorophyll degrades under heavy metal stress.
    // ────────────────────────────────────────────────────────────────────────
    const chlLive   = safeDivide(live.F8, live.F2);
    const chlBase   = safeDivide(base.F8, base.F2);
    const chlAssess = assess(chlLive, chlBase);

    // ────────────────────────────────────────────────────────────────────────
    // INDEX 2 — Car:Chl Ratio: F3 / F8
    // Unchanged — consistently correct in validation tests.
    // Rises under stress as carotenoids degrade slower than chlorophyll.
    // ────────────────────────────────────────────────────────────────────────
    const carChlLive   = safeDivide(live.F3, live.F8);
    const carChlBase   = safeDivide(base.F3, base.F8);
    const carChlAssess = assess(carChlLive, carChlBase);

    // ────────────────────────────────────────────────────────────────────────
    // INDEX 3 — Yellow Index: F6 / F3   ← UPDATED from F6/F5
    // Previous formula used F5(555nm) which is too close to F6(590nm) — only
    // 35nm apart — making the ratio insensitive to yellowing events.
    // New formula uses F3(480nm) — a 110nm gap — giving much stronger contrast
    // when algae yellows (F6 rises, F3 stays low or drops).
    // Rises as algae yellows/bleaches under heavy metal exposure.
    // ────────────────────────────────────────────────────────────────────────
    const yellowLive   = safeDivide(live.F6, live.F3);
    const yellowBase   = safeDivide(base.F6, base.F3);
    const yellowAssess = assess(yellowLive, yellowBase);

    // ────────────────────────────────────────────────────────────────────────
    // INDEX 4 — Stress Ratio: normalized (F5+F6) / (F2+F8)   ← UPDATED
    // Previous formula used raw channel values making it sensitive to ambient
    // light intensity shifts — room light change moved the ratio for the
    // wrong reason.
    // Each channel is now divided by Clear first to normalize out ambient
    // light, so the ratio responds only to spectral shape changes.
    // ────────────────────────────────────────────────────────────────────────
    const nLiveF2 = normalize(live.F2, live.Clear);
    const nLiveF5 = normalize(live.F5, live.Clear);
    const nLiveF6 = normalize(live.F6, live.Clear);
    const nLiveF8 = normalize(live.F8, live.Clear);

    const nBaseF2 = normalize(base.F2, base.Clear);
    const nBaseF5 = normalize(base.F5, base.Clear);
    const nBaseF6 = normalize(base.F6, base.Clear);
    const nBaseF8 = normalize(base.F8, base.Clear);

    const stressLive = safeDivide(
      nLiveF5 !== null && nLiveF6 !== null ? nLiveF5 + nLiveF6 : null,
      nLiveF2 !== null && nLiveF8 !== null ? nLiveF2 + nLiveF8 : null
    );
    const stressBase = safeDivide(
      nBaseF5 !== null && nBaseF6 !== null ? nBaseF5 + nBaseF6 : null,
      nBaseF2 !== null && nBaseF8 !== null ? nBaseF2 + nBaseF8 : null
    );
    const stressAssess = assess(stressLive, stressBase);

    // ── Overall status: worst of all four indices ───────────────────────────
    const statusRank = { unknown: 0, healthy: 1, mild: 2, stress: 3 };
    const allStatuses = [
      chlAssess.status,
      carChlAssess.status,
      yellowAssess.status,
      stressAssess.status,
    ];
    const overallStatus = allStatuses.reduce((worst, s) =>
      statusRank[s] > statusRank[worst] ? s : worst, 'unknown'
    );

    return {
      overall:     overallStatus,
      hasBaseline: baseline !== null,
      hasLiveData: chartData && chartData.length > 0,

      chlorophyll: {
        label:    'Chlorophyll Index',
        formula:  'F8(680nm) / F2(445nm)',
        value:    chlLive,
        baseline: chlBase,
        ...chlAssess,
        // Chlorophyll drops under stress so we flip: negative delta = bad
        status: chlAssess.delta !== null && chlAssess.delta < -MILD_THRESHOLD
          ? (chlAssess.delta < -STRESS_THRESHOLD ? 'stress' : 'mild')
          : chlAssess.delta !== null ? 'healthy' : 'unknown',
      },

      carChl: {
        label:    'Car:Chl Ratio',
        formula:  'F3(480nm) / F8(680nm)',
        value:    carChlLive,
        baseline: carChlBase,
        ...carChlAssess,
      },

      yellow: {
        label:    'Yellow Index',
        formula:  'F6(590nm) / F3(480nm)',
        value:    yellowLive,
        baseline: yellowBase,
        ...yellowAssess,
      },

      stress: {
        label:    'Stress Ratio',
        formula:  '(F5+F6) / (F2+F8) normalized by Clear',
        value:    stressLive,
        baseline: stressBase,
        ...stressAssess,
      },
    };

  }, [chartData, baseline]);

  return indices;
}