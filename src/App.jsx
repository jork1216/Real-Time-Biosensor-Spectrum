// App.jsx
// Root component. Wires together the serial connection hook, snap hook,
// the connection controls UI, snap button, and live spectrum chart.

import React from 'react';
import useArduino from './hooks/useArduino';
import useSnap    from './hooks/useSnap';
import ConnectionControls from './components/ConnectionControls';
import SnapButton         from './components/SnapButton';
import SpectrumChart      from './components/SpectrumChart';
import useBaseline from './hooks/useBaseline';
import BaselineControls from './components/BaselineControls';
import useStressIndices from './hooks/useStressIndices';
import StressIndexPanel from './components/StressIndexPanel';

export default function App() {
  // ── Serial connection ──────────────────────────────────────────────────────
  const {
    chartData,
    isConnected,
    connect,
    disconnect,
    getLatestReading, // passed to useSnap for sampling
  } = useArduino();

  // ── Snap recording ─────────────────────────────────────────────────────────
  const {
    isSnapping,
    countdown,
    snapCount,
    startSnap,
    pickDirectory,
    dirName,
  } = useSnap(getLatestReading);

  const { baseline, setBaseline, clearBaseline } = useBaseline();

  const indices = useStressIndices(chartData, baseline);

  // ── Toolbar style ──────────────────────────────────────────────────────────
  const toolbarStyle = {
    display:        'flex',
    justifyContent: 'center',
    alignItems:     'flex-start',  // align tops in case heights differ
    gap:            '24px',
    marginBottom:   '20px',
    flexWrap:       'wrap',
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>
        Real-Time Biosensor Spectrum
      </h1>

      {/* ── Toolbar: connection controls + snap button ──────────────────────── */}
      <div style={toolbarStyle}>
        {/* Connect / Disconnect */}
        <ConnectionControls
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        {/* Vertical divider */}
        <div style={{ width: '1px', background: '#e5e7eb', alignSelf: 'stretch' }} />

        {/* Snap button / countdown */}
        <SnapButton
          isSnapping={isSnapping}
          countdown={countdown}
          snapCount={snapCount}
          dirName={dirName}
          onSnap={startSnap}
          onPickDir={pickDirectory}
          // Snap is only useful while live data is streaming
          disabled={!isConnected}
        />
      </div>

      <BaselineControls
        isConnected={isConnected}
        baseline={baseline}
        onSetBaseline={() => setBaseline(getLatestReading())}
        onClear={clearBaseline}
      />

      <StressIndexPanel indices={indices} />

      {/* ── Live spectrum chart ─────────────────────────────────────────────── */}
      <SpectrumChart data={chartData} />
    </div>
  );
}