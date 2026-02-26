// useSnapHistory.js
// Manages a persistent log of snap recordings.
// Each entry stores the snap number, timestamp, all 4 index values,
// their deltas from baseline, and the overall status.
//
// Returns:
//   history        {Array}      List of snap entries, newest first
//   addEntry       {Function}   Call after a successful snap write
//   clearHistory   {Function}   Wipes all history from state + localStorage

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'biosensor_snap_history';

export default function useSnapHistory() {

  // ── Load persisted history on first mount ─────────────────────────────────
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ── addEntry ──────────────────────────────────────────────────────────────
  // Called after each successful snap write.
  // Accepts the snap number and the indices object from useStressIndices.
  const addEntry = useCallback((snapNumber, indices) => {
    const entry = {
      snapNumber,
      timestamp: new Date().toLocaleString(),
      overall:   indices?.overall ?? 'unknown',
      chlorophyll: {
        value: indices?.chlorophyll?.value  ?? null,
        delta: indices?.chlorophyll?.delta  ?? null,
        status: indices?.chlorophyll?.status ?? 'unknown',
      },
      carChl: {
        value: indices?.carChl?.value  ?? null,
        delta: indices?.carChl?.delta  ?? null,
        status: indices?.carChl?.status ?? 'unknown',
      },
      yellow: {
        value: indices?.yellow?.value  ?? null,
        delta: indices?.yellow?.delta  ?? null,
        status: indices?.yellow?.status ?? 'unknown',
      },
      stress: {
        value: indices?.stress?.value  ?? null,
        delta: indices?.stress?.delta  ?? null,
        status: indices?.stress?.status ?? 'unknown',
      },
    };

    setHistory(prev => {
      const updated = [entry, ...prev]; // newest first
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── clearHistory ──────────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}