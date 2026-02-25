// StressIndexPanel.jsx
// Displays the four computed algae stress indices in a card grid.
// Each card shows the current value, baseline value, % delta, and status color.
//
// Props:
//   indices   {Object}   The full object returned by useStressIndices

export default function StressIndexPanel({ indices }) {

  // ── Don't render anything if no live data yet ─────────────────────────────
  if (!indices.hasLiveData) return null;

  // ── Status → color mapping ─────────────────────────────────────────────────
  const statusColor = {
    healthy: { bg: '#0f2a1a', border: '#2d6a3f', text: '#6fcf97', dot: '#27ae60' },
    mild:    { bg: '#2a2200', border: '#6a5500', text: '#f2c94c', dot: '#f2c94c' },
    stress:  { bg: '#2a0f0f', border: '#6a2020', text: '#eb5757', dot: '#eb5757' },
    unknown: { bg: '#1a1a1a', border: '#333',    text: '#888',    dot: '#555'    },
  };

  const overallColors = statusColor[indices.overall] || statusColor.unknown;

  // ── Four index cards ───────────────────────────────────────────────────────
  const cards = [
    indices.chlorophyll,
    indices.carChl,
    indices.yellow,
    indices.stress,
  ];

  return (
    <div style={styles.wrapper}>

      {/* ── Overall status banner ─────────────────────────────────────────── */}
      <div style={{
        ...styles.banner,
        background:   overallColors.bg,
        borderColor:  overallColors.border,
      }}>
        <span style={{ ...styles.bannerDot, background: overallColors.dot }} />
        <span style={{ ...styles.bannerLabel, color: overallColors.text }}>
          Overall Status:&nbsp;
          <strong style={{ textTransform: 'uppercase' }}>{indices.overall}</strong>
        </span>

        {!indices.hasBaseline && (
          <span style={styles.noBaselineNote}>
            ⚠️ Set a baseline to enable stress assessment
          </span>
        )}
      </div>

      {/* ── Index cards grid ──────────────────────────────────────────────── */}
      <div style={styles.grid}>
        {cards.map((idx) => {
          const colors = statusColor[idx.status] || statusColor.unknown;
          const deltaText = idx.delta !== null
            ? `${idx.delta >= 0 ? '+' : ''}${(idx.delta * 100).toFixed(1)}% from baseline`
            : 'No baseline';

          return (
            <div
              key={idx.label}
              style={{
                ...styles.card,
                background:  colors.bg,
                borderColor: colors.border,
              }}
            >
              {/* Status dot + label */}
              <div style={styles.cardHeader}>
                <span style={{ ...styles.dot, background: colors.dot }} />
                <span style={{ ...styles.cardLabel, color: colors.text }}>
                  {idx.label}
                </span>
              </div>

              {/* Current value */}
              <div style={styles.valueRow}>
                <span style={styles.valueNumber}>
                  {idx.value !== null ? idx.value.toFixed(3) : '—'}
                </span>
                <span style={{ ...styles.statusBadge, color: colors.text, borderColor: colors.border }}>
                  {idx.status}
                </span>
              </div>

              {/* Baseline + delta */}
              <div style={styles.metaRow}>
                <span style={styles.metaText}>
                  Baseline: {idx.baseline !== null ? idx.baseline.toFixed(3) : '—'}
                </span>
                <span style={{ ...styles.deltaText, color: colors.text }}>
                  {deltaText}
                </span>
              </div>

              {/* Formula hint */}
              <div style={styles.formula}>{idx.formula}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    marginBottom: '20px',
  },
  banner: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    border:       '1px solid',
    borderRadius: '8px 8px 0 0',
    padding:      '10px 16px',
  },
  bannerDot: {
    width:        '10px',
    height:       '10px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  bannerLabel: {
    fontSize:   '14px',
    flexGrow:   1,
  },
  noBaselineNote: {
    fontSize: '12px',
    color:    '#e6c97a',
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 '1px',
    background:          '#333',   // gap color between cards
    border:              '1px solid #333',
    borderTop:           'none',
    borderRadius:        '0 0 8px 8px',
    overflow:            'hidden',
  },
  card: {
    padding:   '14px 16px',
    display:   'flex',
    flexDirection: 'column',
    gap:       '6px',
    border:    '1px solid transparent',
  },
  cardHeader: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  dot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  cardLabel: {
    fontSize:   '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  valueRow: {
    display:     'flex',
    alignItems:  'baseline',
    gap:         '10px',
  },
  valueNumber: {
    fontSize:   '28px',
    fontWeight: '700',
    color:      '#fff',
    lineHeight: 1,
  },
  statusBadge: {
    fontSize:     '11px',
    border:       '1px solid',
    borderRadius: '4px',
    padding:      '2px 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metaRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  metaText: {
    fontSize: '12px',
    color:    '#888',
  },
  deltaText: {
    fontSize:   '12px',
    fontWeight: '500',
  },
  formula: {
    fontSize:    '11px',
    color:       '#555',
    fontFamily:  'monospace',
    marginTop:   '2px',
  },
};