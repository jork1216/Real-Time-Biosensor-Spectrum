// BaselineControls.jsx
// Displays a "Set Baseline" button and baseline status above the spectrum chart.
//
// Props:
//   isConnected     {boolean}   From useArduino — disables button if not connected
//   baseline        {Object}    From useBaseline — null if not yet set
//   onSetBaseline   {Function}  Called when user clicks Set Baseline
//   onClear         {Function}  Called when user clicks Clear

export default function BaselineControls({
  isConnected,
  baseline,
  onSetBaseline,
  onClear,
}) {
  return (
    <div style={styles.container}>

      {/* ── Left side: label + status ───────────────────────────────────── */}
      <div style={styles.info}>
        <span style={styles.label}>Baseline</span>

        {baseline ? (
          <span style={styles.timestamp}>
            ✅ Set at {baseline.timestamp}
          </span>
        ) : (
          <span style={styles.noBaseline}>
            ⚠️ No baseline set — connect Arduino and click Set Baseline
          </span>
        )}
      </div>

      {/* ── Right side: buttons ─────────────────────────────────────────── */}
      <div style={styles.buttons}>

        <button
          onClick={onSetBaseline}
          disabled={!isConnected}
          style={{
            ...styles.btn,
            ...(isConnected ? styles.btnActive : styles.btnDisabled),
          }}
        >
          📍 Set Baseline
        </button>

        {baseline && (
          <button onClick={onClear} style={{ ...styles.btn, ...styles.btnClear }}>
            🗑 Clear
          </button>
        )}

      </div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const styles = {
  container: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    background:     '#1a1a2e',
    border:         '1px solid #333',
    borderRadius:   '8px',
    padding:        '12px 16px',
    marginBottom:   '16px',
  },
  info: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  label: {
    fontSize:   '11px',
    fontWeight: '600',
    color:      '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  timestamp: {
    fontSize: '13px',
    color:    '#a8e6a3',   // soft green
  },
  noBaseline: {
    fontSize: '13px',
    color:    '#e6c97a',   // amber warning
  },
  buttons: {
    display: 'flex',
    gap:     '8px',
  },
  btn: {
    padding:      '8px 14px',
    borderRadius: '6px',
    border:       'none',
    fontSize:     '13px',
    cursor:       'pointer',
    fontWeight:   '500',
  },
  btnActive: {
    background: '#4a90d9',
    color:      '#fff',
  },
  btnDisabled: {
    background: '#333',
    color:      '#666',
    cursor:     'not-allowed',
  },
  btnClear: {
    background: '#5a2a2a',
    color:      '#e88',
  },
};