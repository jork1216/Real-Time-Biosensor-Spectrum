// useBaseline.js
// Captures a spectral baseline from the current Arduino reading and persists
// it to localStorage so it survives page refreshes.
//
// Returns:
//   baseline         {Object|null}   { timestamp, channels: { "415nm": val, ... } }
//   setBaseline      {Function}      Call with getLatestReading() result to save
//   clearBaseline    {Function}      Wipes baseline from state + localStorage

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'biosensor_baseline';

export default function useBaseline() {

  // ── Load persisted baseline on first mount ────────────────────────────────
  const [baseline, setBaselineState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // ── setBaseline ───────────────────────────────────────────────────────────
  // Accepts the array returned by getLatestReading():
  //   [{ wavelength: "415nm", intensity: 120, fill: "#..." }, ...]
  // Converts it to a plain { wavelength: intensity } map for easy lookup.
  const setBaseline = useCallback((latestReading) => {
    if (!latestReading || latestReading.length === 0) return;

    const channels = {};
    latestReading.forEach(({ wavelength, intensity }) => {
      channels[wavelength] = intensity;
    });

    const newBaseline = {
      timestamp: new Date().toLocaleString(), // human-readable, e.g. "6/10/2025, 2:34:01 PM"
      channels,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBaseline));
    setBaselineState(newBaseline);
  }, []);

  // ── clearBaseline ─────────────────────────────────────────────────────────
  const clearBaseline = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBaselineState(null);
  }, []);

  return { baseline, setBaseline, clearBaseline };
}