// bandColors.js
// Maps each spectral band (by wavelength) to its corresponding visible color.
// These are used to color the bars in the spectrum chart so that
// each band visually represents its actual light color.

const BAND_COLORS = {
  "415nm": "#7852FF", // Violet
  "445nm": "#0000FF", // Indigo/Blue
  "480nm": "#007FFF", // Blue
  "515nm": "#00FFFF", // Cyan
  "555nm": "#00FF00", // Green
  "590nm": "#FFFF00", // Yellow
  "630nm": "#FF7F00", // Orange
  "680nm": "#FF0000", // Red
  "Clear": "#CCCCCC"  // Gray — the unfiltered "clear" channel
};

export default BAND_COLORS;