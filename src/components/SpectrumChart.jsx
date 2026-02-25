// SpectrumChart.jsx
// A bar chart that visualises real-time spectral intensity data coming
// from the AS7341 (or compatible) spectral sensor attached to an Arduino.
//
// Each bar represents one wavelength band. The bar is colored to match
// the actual visible-light color for that band (defined in bandColors.js).
//
// Props:
//   data  {Array}  Array of objects shaped as:
//                  [{ wavelength: "415nm", intensity: 120, fill: "#7852FF" }, ...]
//                  Produced by the useArduino hook.

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function SpectrumChart({ data }) {
  return (
    // The outer div gives the chart a subtle card-like background
    <div
      style={{
        width: '100%',
        height: 400,
        backgroundColor: '#f9fafb',
        padding: '20px',
        borderRadius: '10px',
      }}
    >
      {/*
        ResponsiveContainer makes the chart fill 100% of its parent width
        without needing a fixed pixel width.
      */}
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          {/* Light dashed background grid for readability */}
          <CartesianGrid strokeDasharray="3 3" />

          {/*
            X-axis: shows wavelength labels (e.g. "415nm").
            Rotated 45° so labels don't overlap when many bands are shown.
          */}
          <XAxis dataKey="wavelength" angle={-45} textAnchor="end" height={60} />

          {/* Y-axis: raw intensity counts from the sensor (0–65535 typical) */}
          <YAxis />

          {/* Tooltip shown on hover — uses Recharts default styling */}
          <Tooltip />

          {/*
            Bar: isAnimationActive={false} disables the entrance animation.
            This is important for high-frequency live data; animation on every
            update would cause visible flickering.

            Each bar's fill color comes from the `fill` field on the data item,
            which is looked up from BAND_COLORS in the useArduino hook.
          */}
          <Bar dataKey="intensity" isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}