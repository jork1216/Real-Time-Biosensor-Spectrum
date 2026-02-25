// useStressIndices.js
// Computes algae stress indices in real time by comparing live Arduino readings
// against a stored baseline.
//
// Indices calculated:
//   1. Chlorophyll Index   = F8(680nm) / F2(445nm)
//   2. Car:Chl Ratio       = F3(480nm) / F8(680nm)
//   3. Yellow Index        = F6(590nm) / F5(555nm)
//   4. Stress Ratio        = (F5+F6) / (F2+F8)
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

// ── Threshold config — tweak these if your algae species behaves differently ──
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

// ── Helper: compute % delta and status ───────────────────────────────────────
function assess(current, base) {
  if (current === null || base === null || base === 0) {
    return { delta: null, status: 'unknown' };
  }
  const delta = (current - base) / base;   // e.g. 0.15 = 15% increase
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
      F2: ch(chartData, '445nm'),
      F3: ch(chartData, '480nm'),
      F5: ch(chartData, '555nm'),
      F6: ch(chartData, '590nm'),
      F8: ch(chartData, '680nm'),
    };

    // ── Pull baseline channel values ────────────────────────────────────────
    const base = {
      F2: bch(baseline, '445nm'),
      F3: bch(baseline, '480nm'),
      F5: bch(baseline, '555nm'),
      F6: bch(baseline, '590nm'),
      F8: bch(baseline, '680nm'),
    };

    // ── Compute each index (live + baseline version) ────────────────────────

    // 1. Chlorophyll Index: F8 / F2
    //    Drops as chlorophyll degrades under heavy metal stress
    const chlLive  = safeDivide(live.F8, live.F2);
    const chlBase  = safeDivide(base.F8, base.F2);
    const chlAssess = assess(chlLive, chlBase);

    // 2. Carotenoid:Chlorophyll Ratio: F3 / F8
    //    Rises under stress — carotenoids degrade slower than chlorophyll
    const carChlLive  = safeDivide(live.F3, live.F8);
    const carChlBase  = safeDivide(base.F3, base.F8);
    const carChlAssess = assess(carChlLive, carChlBase);

    // 3. Yellow Index: F6 / F5
    //    Rises as algae yellows/bleaches under heavy metal exposure
    const yellowLive  = safeDivide(live.F6, live.F5);
    const yellowBase  = safeDivide(base.F6, base.F5);
    const yellowAssess = assess(yellowLive, yellowBase);

    // 4. Stress Ratio: (F5 + F6) / (F2 + F8)
    //    Reflectance over absorption — rises as absorption peaks weaken
    const stressLive = safeDivide(
      live.F5 !== null && live.F6 !== null ? live.F5 + live.F6 : null,
      live.F2 !== null && live.F8 !== null ? live.F2 + live.F8 : null
    );
    const stressBase = safeDivide(
      base.F5 !== null && base.F6 !== null ? base.F5 + base.F6 : null,
      base.F2 !== null && base.F8 !== null ? base.F2 + base.F8 : null
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
      overall: overallStatus,
      hasBaseline: baseline !== null,
      hasLiveData: chartData && chartData.length > 0,

      chlorophyll: {
        label:    'Chlorophyll Index',
        formula:  'F8(680nm) / F2(445nm)',
        value:    chlLive,
        baseline: chlBase,
        ...chlAssess,
        // For chlorophyll, a DROP is stress (inverse of others)
        // So we flip the status logic: delta negative = bad
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
        formula:  'F6(590nm) / F5(555nm)',
        value:    yellowLive,
        baseline: yellowBase,
        ...yellowAssess,
      },

      stress: {
        label:    'Stress Ratio',
        formula:  '(F5+F6) / (F2+F8)',
        value:    stressLive,
        baseline: stressBase,
        ...stressAssess,
      },
    };

  }, [chartData, baseline]);   // Recomputes every time Arduino sends new data

  return indices;
}