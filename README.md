# Real-Time Biosensor Spectrum Viewer

A React app that connects to an Arduino spectral sensor over USB (Web Serial API)
and plots live intensity readings as a color-coded bar chart.

---

## Project Structure

```
src/
├── App.jsx                          # Root component — composes the whole UI
├── constants/
│   └── bandColors.js                # Wavelength → hex color lookup table
├── hooks/
│   └── useArduino.js                # Custom hook: all Web Serial API logic
└── components/
    ├── ConnectionControls.jsx       # Connect / Disconnect button bar
    └── SpectrumChart.jsx            # Recharts bar chart for spectral data
```

---

## How It Works

### 1. `constants/bandColors.js`

A plain JavaScript object that maps each sensor band label (e.g. `"415nm"`) to its
corresponding visible-light hex color. This is imported by `useArduino.js` to
annotate chart data with a `fill` color before passing it to the chart.

```js
// Example entry
"555nm": "#00FF00"  // Green band → green bar
```

No logic here — pure data. If you add or rename channels on the Arduino side,
update this file to match.

---

### 2. `hooks/useArduino.js`

The brain of the app. A custom React hook that owns all Web Serial state and logic.

**Returns:**

| Name          | Type       | Description                                      |
|---------------|------------|--------------------------------------------------|
| `chartData`   | `Array`    | Formatted data ready for Recharts                |
| `isConnected` | `boolean`  | `true` while a port is open and streaming        |
| `connect`     | `Function` | Opens port, starts read loop                     |
| `disconnect`  | `Function` | Cancels the reader, closes the port gracefully   |

**`connect()` — step by step:**

1. `navigator.serial.requestPort()` — shows the browser's port-picker dialog.
2. `port.open({ baudRate: 115200 })` — opens the port. Must match the Arduino sketch.
3. A `TextDecoderStream` is piped from `port.readable` so raw bytes become strings.
4. A `while (true)` loop calls `reader.read()` on every iteration, appending chunks
   to a string buffer, then splitting on `\n` to extract complete lines.
5. Any line that looks like `{...}` (a JSON object) is parsed. The result is mapped
   into the shape `{ wavelength, intensity, fill }` and stored via `setChartData`.
6. When `disconnect()` is called, `reader.cancel()` resolves the pending `read()`
   with `{ done: true }`, which exits the loop and runs the cleanup block.

**Why `isAnimationActive={false}` on the chart bar?**
Recharts animates on every data change by default. At the update frequency of a
live sensor this causes flickering, so animation is disabled.

---

### 3. `components/ConnectionControls.jsx`

Pure presentational component. Renders either:
- A blue **Connect Arduino** button (when `isConnected` is `false`), or
- A green **Connected & Receiving Data** badge + a red **Disconnect** button.

All interactivity is delegated upward via `onConnect` / `onDisconnect` props —
this component holds no state of its own.

---

### 4. `components/SpectrumChart.jsx`

Renders a Recharts `BarChart` inside a `ResponsiveContainer` (full-width, 400 px tall).

- **X-axis** — wavelength labels, rotated 45° to prevent overlap.
- **Y-axis** — raw intensity counts (typically 0–65535 for a 16-bit sensor).
- **Bars** — each bar's `fill` is taken directly from the `data` prop (set by
  `useArduino`), so every band automatically gets its spectrum color.
- **Tooltip** — default Recharts hover tooltip showing `wavelength` + `intensity`.

**Prop:**

| Name   | Type    | Description                                             |
|--------|---------|---------------------------------------------------------|
| `data` | `Array` | `[{ wavelength, intensity, fill }, ...]` from the hook |

---

### 5. `App.jsx`

Thin root component. Calls `useArduino()` and passes the returned values down to
`ConnectionControls` and `SpectrumChart`. Contains no serial or chart logic itself.

```jsx
const { chartData, isConnected, connect, disconnect } = useArduino();
```

---

## Arduino Serial Format

The app expects the Arduino to send **one JSON object per line** at 115200 baud.
Each key is a band label matching the keys in `bandColors.js`, and each value
is an integer intensity reading:

```json
{"415nm":120,"445nm":340,"480nm":890,"515nm":1204,"555nm":980,"590nm":760,"630nm":430,"680nm":210,"Clear":3200}
```

Any line that does not start with `{` and end with `}` is silently ignored,
so debug `Serial.print()` statements won't crash the parser.

---

## Browser Requirements

The Web Serial API is required. As of 2024 it is supported in:

- **Chrome / Edge** 89+ (desktop only)
- **Opera** 75+

It is **not** supported in Firefox or Safari. The user must also grant the
browser permission to access the serial port (the browser dialog handles this
automatically when `requestPort()` is called).

---

## Getting Started

```bash
# Install dependencies (Recharts is the only non-standard one)
npm install recharts

# Start the dev server
npm start
```

1. Plug the Arduino in via USB.
2. Upload your spectral sensor sketch (must output the JSON format above).
3. Open the app in Chrome/Edge, click **Connect Arduino**, select the port, done.

---

## Extending the App

| Goal | Where to change |
|------|----------------|
| Add a new sensor channel | Add entry to `bandColors.js` and update Arduino sketch |
| Change baud rate | Edit `baudRate` in `useArduino.js` `connect()` |
| Save readings to CSV | Add export logic in `useArduino.js` after `setChartData` |
| Show a line chart history | Replace `SpectrumChart` with a `LineChart` and keep a rolling buffer in the hook |
| Style the UI differently | Edit inline styles in `ConnectionControls.jsx` and `SpectrumChart.jsx` |