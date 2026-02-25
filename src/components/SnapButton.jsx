// SnapButton.jsx
// The Snap button — morphs into an animated countdown timer while recording.
//
// States it renders:
//   1. Idle, no directory chosen  → "📁 Choose Folder" prompt
//   2. Idle, directory chosen     → "⚡ Snap" button (shows snap count badge)
//   3. Snapping                   → Circular countdown ring + seconds remaining
//
// Props:
//   isSnapping    {boolean}   Whether a recording is in progress
//   countdown     {number}    Seconds remaining (10 → 0)
//   snapCount     {number}    Total snaps saved so far (shown as badge)
//   dirName       {string}    Name of the chosen output directory (or null)
//   onSnap        {Function}  Start a new snap
//   onPickDir     {Function}  Open directory picker
//   disabled      {boolean}   True when Arduino is not connected

import React from 'react';

// ── SVG ring parameters ────────────────────────────────────────────────────
const RADIUS        = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 163.4

export default function SnapButton({
  isSnapping,
  countdown,
  snapCount,
  dirName,
  onSnap,
  onPickDir,
  disabled,
}) {
  // Progress fraction: 1 = full ring (just started), 0 = empty (done)
  const progress     = countdown / 10;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  // ── Styles ────────────────────────────────────────────────────────────────

  const containerStyle = {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '6px',
  };

  const folderBtnStyle = {
    padding:         '8px 16px',
    fontSize:        '13px',
    cursor:          'pointer',
    backgroundColor: '#6b7280',
    color:           'white',
    border:          'none',
    borderRadius:    '6px',
  };

  const snapBtnStyle = {
    position:        'relative',
    padding:         '10px 24px',
    fontSize:        '16px',
    fontWeight:      '700',
    cursor:          disabled ? 'not-allowed' : 'pointer',
    backgroundColor: disabled ? '#9ca3af' : '#f59e0b',
    color:           'white',
    border:          'none',
    borderRadius:    '8px',
    letterSpacing:   '0.05em',
    transition:      'background-color 0.2s',
    opacity:         disabled ? 0.6 : 1,
  };

  const badgeStyle = {
    position:        'absolute',
    top:             '-8px',
    right:           '-8px',
    backgroundColor: '#1f2937',
    color:           'white',
    borderRadius:    '999px',
    fontSize:        '11px',
    fontWeight:      '700',
    padding:         '2px 6px',
    lineHeight:      '1.4',
  };

  const dirLabelStyle = {
    fontSize:   '11px',
    color:      '#6b7280',
    fontStyle:  'italic',
    maxWidth:   '160px',
    overflow:   'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const countdownWrapStyle = {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '4px',
  };

  const countdownLabelStyle = {
    fontSize:    '11px',
    fontWeight:  '600',
    color:       '#ef4444',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  // ── Render: countdown ring ─────────────────────────────────────────────────
  if (isSnapping) {
    return (
      <div style={countdownWrapStyle}>
        <span style={countdownLabelStyle}>Recording…</span>

        {/* SVG circular progress ring */}
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring (gray) */}
          <circle
            cx="36" cy="36" r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="5"
          />
          {/* Foreground ring (red, shrinks as time passes) */}
          <circle
            cx="36" cy="36" r={RADIUS}
            fill="none"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 0.45s linear' }}
          />
          {/* Countdown number in centre — un-rotate for readability */}
          <text
            x="36" y="36"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              transform:  'rotate(90deg)',
              transformOrigin: '36px 36px',
              fontSize:   '18px',
              fontWeight: '800',
              fill:       '#1f2937',
            }}
          >
            {countdown}
          </text>
        </svg>

        <span style={{ fontSize: '11px', color: '#6b7280' }}>
          saving to {dirName ?? '…'}
        </span>
      </div>
    );
  }

  // ── Render: idle ───────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      {/* Directory picker sub-button */}
      <button onClick={onPickDir} style={folderBtnStyle} title="Choose save folder">
        📁 {dirName ? dirName : 'Choose Folder'}
      </button>

      {/* Main Snap button */}
      <button
        onClick={onSnap}
        disabled={disabled || isSnapping}
        style={snapBtnStyle}
      >
        ⚡ Snap
        {/* Badge showing how many snaps have been saved */}
        {snapCount > 0 && (
          <span style={badgeStyle}>#{snapCount}</span>
        )}
      </button>

      {/* Helper label */}
      <span style={dirLabelStyle}>
        {dirName
          ? `Next: snap${snapCount + 1}.csv`
          : 'Pick a folder first'}
      </span>
    </div>
  );
}