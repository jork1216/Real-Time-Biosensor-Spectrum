// useSnap.js
// Custom hook that manages the "Snap" recording feature.
//
// Behavior:
//  - On startSnap(), samples `getLatestReading()` every 500ms for 10 seconds
//    (producing up to 20 rows per snap).
//  - Uses the File System Access API to write snap1.csv, snap2.csv, etc. into
//    a user-chosen directory. The snap counter persists across sessions via
//    localStorage so numbering never resets.
//  - During recording, exposes `countdown` (10 → 0) and `isSnapping` so the
//    UI can render a live timer.
//  - CHANGE from v2: startSnap() now accepts an `indices` object (from
//    useStressIndices) and appends the four computed index values + overall
//    status to every row in the CSV.
//
// Returns:
//   isSnapping      {boolean}         True while recording is active
//   countdown       {number}          Seconds remaining (10 → 0)
//   snapCount       {number}          How many snaps have been saved so far
//   startSnap       {Function}        Begin a new snap — call as startSnap(indices)
//   pickDirectory   {Function}        Let user choose (or re-choose) save folder
//   dirName         {string|null}     Display name of the chosen directory

import { useState, useRef, useCallback } from 'react';

// ── Persistence key for the snap counter ─────────────────────────────────────
const STORAGE_KEY = 'biosensor_snap_count';

// ── Recording parameters ──────────────────────────────────────────────────────
const DURATION_MS   = 10_000; // 10 seconds total
const INTERVAL_MS   =    500; // one sample every 500 ms
const TOTAL_SAMPLES = DURATION_MS / INTERVAL_MS; // 20

export default function useSnap(getLatestReading) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [isSnapping,  setIsSnapping]  = useState(false);
  const [countdown,   setCountdown]   = useState(10);
  // Initialise from localStorage so numbering survives a page refresh
  const [snapCount,   setSnapCount]   = useState(
    () => parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
  );
  const [dirName,     setDirName]     = useState(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  // Holds the FileSystemDirectoryHandle between calls
  const dirHandleRef  = useRef(null);
  // Interval / timeout ids so we can clear them if needed
  const intervalRef   = useRef(null);
  const timeoutRef    = useRef(null);

  // ── pickDirectory ──────────────────────────────────────────────────────────
  const pickDirectory = useCallback(async () => {
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      dirHandleRef.current = handle;
      setDirName(handle.name);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Directory pick failed:', err);
    }
  }, []);

  // ── startSnap ──────────────────────────────────────────────────────────────
  // Now accepts `indices` from useStressIndices so index values can be
  // captured at the moment each sample is taken and written to the CSV.
  const startSnap = useCallback(async (indices) => {
    // Make sure we have a directory to write to
    if (!dirHandleRef.current) {
      await pickDirectory();
      if (!dirHandleRef.current) return;
    }

    const thisSnapNumber = snapCount + 1;
    const filename = `snap${thisSnapNumber}.csv`;

    let headers = null;
    const rows  = [];
    let samplesCollected = 0;

    setIsSnapping(true);
    setCountdown(10);

    // ── Sampling interval (every 500 ms) ──────────────────────────────────────
    intervalRef.current = setInterval(() => {
      const reading = getLatestReading();
      if (!reading || reading.length === 0) return;

      // Build header row from first sample — now includes index columns
      if (!headers) {
        headers = [
          'Timestamp',
          ...reading.map(r => r.wavelength),
          // ── Index columns ────────────────────────────────────────────────
          'Chl_Index',
          'CarChl_Ratio',
          'Yellow_Index',
          'Stress_Ratio',
          'Overall_Status',
        ];
        rows.push(headers);
      }

      const now     = new Date();
      const timeStr = now.toTimeString().slice(0, 8); // "HH:MM:SS"
      const intensities = reading.map(r => r.intensity);

      // ── Snapshot the current index values at this exact tick ──────────────
      // We round to 4 decimal places to keep the CSV clean.
      const chlVal    = indices?.chlorophyll?.value  != null ? indices.chlorophyll.value.toFixed(4)  : '';
      const carChlVal = indices?.carChl?.value       != null ? indices.carChl.value.toFixed(4)       : '';
      const yellowVal = indices?.yellow?.value       != null ? indices.yellow.value.toFixed(4)       : '';
      const stressVal = indices?.stress?.value       != null ? indices.stress.value.toFixed(4)       : '';
      const overall   = indices?.overall             ?? '';

      rows.push([
        timeStr,
        ...intensities,
        chlVal,
        carChlVal,
        yellowVal,
        stressVal,
        overall,
      ]);

      samplesCollected++;

      const remaining = Math.ceil((TOTAL_SAMPLES - samplesCollected) * (INTERVAL_MS / 1000));
      setCountdown(Math.max(0, remaining));
    }, INTERVAL_MS);

    // ── Stop after DURATION_MS ────────────────────────────────────────────────
    timeoutRef.current = setTimeout(async () => {
      clearInterval(intervalRef.current);
      setIsSnapping(false);
      setCountdown(10);

      try {
        const csvString  = rows.map(r => r.join(',')).join('\n');
        const fileHandle = await dirHandleRef.current.getFileHandle(filename, { create: true });
        const writable   = await fileHandle.createWritable();
        await writable.write(csvString);
        await writable.close();

        localStorage.setItem(STORAGE_KEY, String(thisSnapNumber));
        setSnapCount(thisSnapNumber);
      } catch (err) {
        console.error('Failed to write CSV:', err);
      }
    }, DURATION_MS);
  }, [snapCount, getLatestReading, pickDirectory]);

  return {
    isSnapping,
    countdown,
    snapCount,
    startSnap,
    pickDirectory,
    dirName,
  };
}