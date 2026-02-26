# Real-Time Algae Biosensor — AS7431 + Arduino Uno

A React web application for monitoring algae health in real time using spectral analysis. Designed to detect heavy metal stress by tracking pigment changes across four computed stress indices, with live serial data streaming from an Arduino Uno and an AS7431 spectral sensor.

---

## What This Does

Heavy metals (copper, lead, cadmium, zinc, etc.) disrupt chlorophyll synthesis in algae, causing a characteristic color progression:

> **Dark green → Light green → Yellow → Brown/White → Death**

This app captures that progression numerically — before it's even visible to the naked eye — by computing four spectral indices from live sensor readings and comparing them against a stored healthy baseline.

---

## Hardware Setup

### Components

| Part | Role |
|---|---|
| Arduino Uno | Microcontroller, serial host |
| AS7431 spectral sensor | 8-channel + Clear + NIR spectral readings |
| Quartz 10mm cuvette | Sample holder (quartz passes UV/visible cleanly) |
| 5V white LED | Broadband excitation light source |

### Sensor Channels Used

The AS7431 outputs intensity across 8 spectral bands. The indices in this app use:

| Channel | Wavelength | Pigment relevance |
|---|---|---|
| F2 | 445 nm | Chlorophyll-a absorption peak (blue) |
| F3 | 480 nm | Carotenoid / accessory pigment region |
| F5 | 555 nm | Green reflectance (healthy algae) |
| F6 | 590 nm | Yellow/orange — rises as chlorophyll degrades |
| F8 | 680 nm | Chlorophyll-a absorption peak (red) |
| Clear | — | Broadband — used to normalize ambient light |

### Physical Assembly Tips

- Position the white LED and cuvette so the light path runs straight through the sample and into the AS7431 window.
- Keep the assembly shielded from ambient room light (a small dark enclosure, black paper, or black foam works well). Room light changes will shift the Clear channel and can affect raw readings; the Stress Ratio index normalizes for this using the Clear channel.
- Use the quartz cuvette (not glass) — borosilicate glass absorbs in the blue region near 445 nm and will distort the Chlorophyll Index.
- Fill the cuvette with your algae suspension. For heavy metal experiments, prepare dilutions of your metal salt in the algae growth medium and replace the cuvette contents between measurements.

### Optional: Colored Films / Papers

The colored films and papers available can be useful for:

- **Calibration checks** — a green film simulates a healthy algae spectrum; yellow/orange films simulate a stressed state. Run a snap on each to verify your indices respond in the expected direction before using live algae.
- **Blocking unwanted wavelengths** — if ambient fluorescent or LED room lighting is leaking into readings, a deep red or NIR-pass film over the sensor aperture can reduce visible-light contamination while still passing the 680 nm chlorophyll peak.
- **Background subtraction reference** — photograph the cuvette against white paper under different stress levels to visually correlate with the numerical indices.

---

## The Four Stress Indices

All indices are computed live and compared against a stored baseline. The **delta** (% change from baseline) determines the status:

| Delta from baseline | Status |
|---|---|
| 0 – 10% | 🟢 Healthy |
| 10 – 25% | 🟡 Mild stress |
| > 25% | 🔴 Stressed |

### 1. Chlorophyll Index — `F8(680nm) / F2(445nm)`

Measures chlorophyll-a concentration by ratioing its two main absorption peaks.

- **Under stress:** decreases — chlorophyll breaks down faster than carotenoids
- **Direction to watch:** falling value = deteriorating chlorophyll
- **Note:** This index uses inverted thresholds internally — a negative delta is the danger sign, not a positive one.

### 2. Car:Chl Ratio — `F3(480nm) / F8(680nm)`

Carotenoids (480 nm) are more stable than chlorophyll under heavy metal exposure. As chlorophyll degrades, this ratio rises.

- **Under stress:** increases — classic early-warning signal, often changes before visible yellowing
- **Direction to watch:** rising value = stress beginning

### 3. Yellow Index — `F6(590nm) / F3(480nm)`

As chlorophyll degrades, yellow and orange xanthophyll pigments become dominant, pushing up the 590 nm band. The 110 nm gap between F6 and F3 gives strong contrast for this shift.

- **Under stress:** increases — direct measure of yellowing / bleaching
- **Direction to watch:** rising value = visible color shift underway or imminent

### 4. Stress Ratio — `(F5+F6) / (F2+F8)` normalized by Clear

Summarizes the overall spectral shift from blue-red (healthy) to green-yellow (stressed). Each channel is divided by the Clear broadband reading first to remove ambient light intensity effects, so only spectral *shape* changes are measured.

- **Under stress:** increases — broad indicator of physiological deterioration
- **Direction to watch:** rising value = overall pigment composition shifting

---

## App Features

### Live Serial Streaming
Connects to the Arduino over Web Serial (Chrome/Edge required). Data is parsed as JSON from the serial port at 115200 baud and fed into a live Recharts spectrum chart.

### Baseline Capture
Snapshot the healthy algae spectrum as your reference point. Baselines persist across page refreshes via `localStorage`. All four index deltas are computed against this reference.

### Snap Recording
Records 20 samples over 10 seconds (one every 500 ms) and writes them to a CSV file in a user-chosen directory using the File System Access API. Each CSV row includes:
- Timestamp
- All spectral channel intensities
- All four computed index values at that moment
- Overall stress status

Snap files are numbered sequentially (`snap1.csv`, `snap2.csv`, …) and the counter persists across sessions.

### Snap History Panel
Displays a log of all completed snaps for the current session, including index values, deltas from baseline, and overall status — so you can track progression across time points or metal concentration steps without opening the CSV files.

---

## Suggested Experiment Protocol

1. Prepare a healthy algae culture and let it stabilize.
2. Fill the cuvette with the control (no metal), connect the sensor, and click **Set Baseline**.
3. Confirm all four indices show 🟢 Healthy with delta near 0%.
4. Replace the cuvette contents with your lowest metal concentration sample.
5. Wait a few minutes for the algae to respond, then click **Snap** to record a 10-second time series.
6. Repeat steps 4–5 across increasing concentrations.
7. Export or review the snap CSVs and snap history panel to plot index trajectories against concentration.

Expected pattern as metal concentration increases:
- Chlorophyll Index ↓
- Car:Chl Ratio ↑
- Yellow Index ↑
- Stress Ratio ↑
- Overall status progresses: 🟢 → 🟡 → 🔴

---

## Technical Stack

- **React** (Vite) — UI framework
- **Recharts** — live spectrum bar chart
- **Web Serial API** — serial communication with Arduino (Chrome/Edge only)
- **File System Access API** — CSV file writing to local directory
- **localStorage** — baseline and snap counter persistence

---

## Browser Requirements

Chrome or Edge (desktop). Web Serial and File System Access APIs are not available in Firefox or Safari.