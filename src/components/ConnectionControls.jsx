// ConnectionControls.jsx
// Renders the connect/disconnect UI bar.
//
// Props:
//   isConnected  {boolean}   Whether the Arduino is currently connected
//   onConnect    {Function}  Called when the "Connect Arduino" button is clicked
//   onDisconnect {Function}  Called when the "Disconnect" button is clicked

import React from 'react';

export default function ConnectionControls({ isConnected, onConnect, onDisconnect }) {
  // ── Styles ─────────────────────────────────────────────────────────────────
  // Inline styles are used here for portability — no CSS file required.

  const btnBase = {
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
  };

  const connectBtn   = { ...btnBase, backgroundColor: '#2563eb' }; // Blue
  const disconnectBtn = { ...btnBase, backgroundColor: '#ef4444' }; // Red
  const statusBadge  = { ...btnBase, cursor: 'default', backgroundColor: '#10b981' }; // Green

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
      {!isConnected ? (
        // ── Not connected: show a single Connect button ──────────────────────
        <button onClick={onConnect} style={connectBtn}>
          Connect Arduino
        </button>
      ) : (
        // ── Connected: show a status badge and a Disconnect button ───────────
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={statusBadge}>
            Connected &amp; Receiving Data
          </div>
          <button onClick={onDisconnect} style={disconnectBtn}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}