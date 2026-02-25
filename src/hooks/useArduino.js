// useArduino.js
// Custom hook for Web Serial API connection + data streaming.
//
// CHANGE from v1: exposes `getLatestReading` — a stable function that returns
// the most recent chart data array. useSnap calls this every 500 ms to sample
// readings without needing to subscribe to re-renders.
//
// Returns:
//   chartData         {Array}     Formatted spectrum data for Recharts
//   isConnected       {boolean}   Whether a serial port is currently open
//   connect           {Function}  Open port and begin read loop
//   disconnect        {Function}  Cancel reader and close port
//   getLatestReading  {Function}  Returns the current chartData snapshot

import { useState, useRef, useCallback } from 'react';
import BAND_COLORS from '../constants/bandColors';

export default function useArduino() {
  const [chartData,   setChartData]   = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Active stream reader — stored in a ref so disconnect() can reach it
  const readerRef = useRef(null);

  // Mirror of chartData in a ref so getLatestReading() is always fresh
  // without useSnap needing to re-subscribe on every render cycle.
  const latestDataRef = useRef([]);

  // ── getLatestReading ───────────────────────────────────────────────────────
  // Returns the most recently received array of { wavelength, intensity, fill }.
  // Stable reference (wrapped in useCallback) so useSnap can receive it once
  // as a prop without triggering re-renders.
  const getLatestReading = useCallback(() => latestDataRef.current, []);

  // ── connect ────────────────────────────────────────────────────────────────
  const connect = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnected(true);

      const decoder       = new TextDecoderStream();
      const closedPromise = port.readable.pipeTo(decoder.writable);
      const reader        = decoder.readable.getReader();
      readerRef.current   = reader;

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }

        buffer += value;
        let lines = buffer.split('\n');
        buffer    = lines.pop();

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              const jsonData = JSON.parse(line);
              const formatted = Object.keys(jsonData).map(key => ({
                wavelength: key,
                intensity:  jsonData[key],
                fill:       BAND_COLORS[key] || "#8884d8"
              }));

              // Update both state (triggers re-render) and the ref (for snap)
              latestDataRef.current = formatted;
              setChartData(formatted);
            } catch (error) {
              console.error("JSON parsing error:", error);
            }
          }
        }
      }

      readerRef.current = null;
      await decoder.writable.abort();
      await closedPromise.catch(() => {});
      await port.close();
      setIsConnected(false);
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnected(false);
    }
  };

  // ── disconnect ─────────────────────────────────────────────────────────────
  const disconnect = async () => {
    if (readerRef.current) {
      await readerRef.current.cancel();
    }
  };

  return { chartData, isConnected, connect, disconnect, getLatestReading };
}