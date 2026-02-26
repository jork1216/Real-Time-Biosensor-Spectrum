// SnapHistoryPanel.jsx
// Displays a scrollable table of past snap recordings.
// Each row shows: snap number, timestamp, all 4 index values,
// delta % from baseline, and overall status (color coded).
//
// Props:
//   history        {Array}     From useSnapHistory
//   onClear        {Function}  From useSnapHistory

export default function SnapHistoryPanel({ history, onClear }) {

  // ── Status color mapping ──────────────────────────────────────────────────
  const statusColor = {
    healthy: { text: '#6fcf97', bg: '#0f2a1a' },
    mild:    { text: '#f2c94c', bg: '#2a2200' },
    stress:  { text: '#eb5757', bg: '#2a0f0f' },
    unknown: { text: '#888',    bg: '#1a1a1a' },
  };

  const dot = { healthy: '🟢', mild: '🟡', stress: '🔴', unknown: '⚪' };

  // ── Helper: format delta as "+12.3%" ──────────────────────────────────────
  function fmtDelta(delta) {
    if (delta === null || delta === undefined) return '—';
    return `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
  }

  // ── Helper: format value to 3 decimal places ──────────────────────────────
  function fmtVal(val) {
    if (val === null || val === undefined) return '—';
    return val.toFixed(3);
  }

  return (
    <div style={styles.wrapper}>

      {/* ── Header row ───────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <span style={styles.title}>📋 Snap History</span>
        <div style={styles.headerRight}>
          <span style={styles.count}>{history.length} snap{history.length !== 1 ? 's' : ''} recorded</span>
          {history.length > 0 && (
            <button onClick={onClear} style={styles.clearBtn}>
              🗑 Clear History
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {history.length === 0 && (
        <div style={styles.empty}>
          No snaps recorded yet. Snaps will appear here after you click ⚡ Snap.
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Status</th>
                {/* Chlorophyll */}
                <th style={styles.th}>Chl Index</th>
                <th style={{ ...styles.th, ...styles.deltaCol }}>Δ</th>
                {/* Car:Chl */}
                <th style={styles.th}>Car:Chl</th>
                <th style={{ ...styles.th, ...styles.deltaCol }}>Δ</th>
                {/* Yellow */}
                <th style={styles.th}>Yellow</th>
                <th style={{ ...styles.th, ...styles.deltaCol }}>Δ</th>
                {/* Stress Ratio */}
                <th style={styles.th}>Stress Ratio</th>
                <th style={{ ...styles.th, ...styles.deltaCol }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => {
                const oc = statusColor[entry.overall] || statusColor.unknown;
                const isLatest = i === 0;
                return (
                  <tr
                    key={entry.snapNumber}
                    style={{
                      background: isLatest ? '#1a1f2e' : 'transparent',
                      borderLeft: isLatest ? '3px solid #4a90d9' : '3px solid transparent',
                    }}
                  >
                    {/* Snap number */}
                    <td style={{ ...styles.td, ...styles.snapNum }}>
                      snap{entry.snapNumber}
                    </td>

                    {/* Timestamp */}
                    <td style={{ ...styles.td, ...styles.tsCell }}>
                      {entry.timestamp}
                    </td>

                    {/* Overall status */}
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        color:      oc.text,
                        background: oc.bg,
                      }}>
                        {dot[entry.overall]} {entry.overall}
                      </span>
                    </td>

                    {/* Chlorophyll Index */}
                    <IndexCell val={entry.chlorophyll.value} status={entry.chlorophyll.status} fmtVal={fmtVal} statusColor={statusColor} />
                    <DeltaCell delta={entry.chlorophyll.delta} status={entry.chlorophyll.status} fmtDelta={fmtDelta} statusColor={statusColor} />

                    {/* Car:Chl */}
                    <IndexCell val={entry.carChl.value} status={entry.carChl.status} fmtVal={fmtVal} statusColor={statusColor} />
                    <DeltaCell delta={entry.carChl.delta} status={entry.carChl.status} fmtDelta={fmtDelta} statusColor={statusColor} />

                    {/* Yellow Index */}
                    <IndexCell val={entry.yellow.value} status={entry.yellow.status} fmtVal={fmtVal} statusColor={statusColor} />
                    <DeltaCell delta={entry.yellow.delta} status={entry.yellow.status} fmtDelta={fmtDelta} statusColor={statusColor} />

                    {/* Stress Ratio */}
                    <IndexCell val={entry.stress.value} status={entry.stress.status} fmtVal={fmtVal} statusColor={statusColor} />
                    <DeltaCell delta={entry.stress.delta} status={entry.stress.status} fmtDelta={fmtDelta} statusColor={statusColor} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IndexCell({ val, status, fmtVal, statusColor }) {
  const c = statusColor[status] || statusColor.unknown;
  return (
    <td style={{ ...cellStyle.td, color: c.text }}>
      {fmtVal(val)}
    </td>
  );
}

function DeltaCell({ delta, status, fmtDelta, statusColor }) {
  const c = statusColor[status] || statusColor.unknown;
  return (
    <td style={{ ...cellStyle.td, ...cellStyle.deltaCol, color: c.text, fontWeight: 600 }}>
      {fmtDelta(delta)}
    </td>
  );
}

const cellStyle = {
  td: { padding: '8px 10px', fontSize: '12px', color: '#ccc', borderBottom: '1px solid #222' },
  deltaCol: { color: '#888', fontStyle: 'italic' },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    background:   '#111',
    border:       '1px solid #333',
    borderRadius: '8px',
    marginBottom: '16px',
    overflow:     'hidden',
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '12px 16px',
    borderBottom:   '1px solid #222',
  },
  title: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#ccc',
  },
  headerRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  count: {
    fontSize: '12px',
    color:    '#555',
  },
  clearBtn: {
    background:   '#2a1a1a',
    color:        '#e88',
    border:       '1px solid #5a2a2a',
    borderRadius: '5px',
    padding:      '4px 10px',
    fontSize:     '12px',
    cursor:       'pointer',
  },
  empty: {
    padding:   '20px 16px',
    fontSize:  '13px',
    color:     '#555',
    textAlign: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',   // scroll horizontally on small screens
  },
  table: {
    width:          '100%',
    borderCollapse: 'collapse',
    fontSize:       '12px',
  },
  th: {
    padding:         '8px 10px',
    textAlign:       'left',
    color:           '#666',
    fontWeight:      '600',
    fontSize:        '11px',
    textTransform:   'uppercase',
    letterSpacing:   '0.05em',
    borderBottom:    '1px solid #333',
    whiteSpace:      'nowrap',
    background:      '#0d0d0d',
  },
  deltaCol: {
    color:      '#444',
    fontStyle:  'italic',
  },
  td: {
    padding:      '8px 10px',
    fontSize:     '12px',
    color:        '#ccc',
    borderBottom: '1px solid #222',
    whiteSpace:   'nowrap',
  },
  snapNum: {
    color:      '#4a90d9',
    fontWeight: '600',
  },
  tsCell: {
    color:    '#666',
    fontSize: '11px',
  },
  badge: {
    display:      'inline-block',
    padding:      '2px 8px',
    borderRadius: '4px',
    fontSize:     '11px',
    fontWeight:   '600',
    textTransform: 'uppercase',
    whiteSpace:   'nowrap',
  },
};