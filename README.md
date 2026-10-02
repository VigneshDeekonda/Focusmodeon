# FocusMode

A cinematic, full-screen focus environment for deep work. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies, no noise.

---

## Overview

FocusMode is a premium Pomodoro-based productivity application designed to feel less like a dashboard and more like an environment. The background dominates the screen, the timer is the primary visual element, and everything else stays out of the way until you need it.

---

## Features

**Timer**
- Large circular countdown timer with a thin animated SVG progress ring
- Accurate timestamp-based engine — no drift when the tab is backgrounded
- Focus and Break modes with smart break duration suggestions
- Add 5 or 10 minutes mid-session
- Auto-start support for seamless Focus → Break → Focus flow

**Focus Session**
- Named focus sessions — set your topic before you begin
- Session counter tracked across the session
- Completion notification with confetti animation
- Web Audio API sound effects on completion — no audio files required

**Ambient Sound**
- Local MP3 playback (Interstellar — Hans Zimmer)
- Play, pause, mute, and volume control
- Syncs automatically with focus mode start and stop

**Tasks**
- Today's task list — add, complete, and delete tasks
- Persisted to localStorage — survives page refresh
- Scoped to the current day

**Settings**
- Configurable focus, break, and long break durations
- Custom duration input for any value not in the preset list
- Auto-start toggles for both focus and break
- Hide seconds mode
- Browser notification support with permission handling
- Volume and ambient sound preferences

**Design**
- Full-screen background cycling through 4 environment images
- No consecutive repeat — last background stored in localStorage
- Glassmorphism panels with backdrop blur
- Motivational quote system — 15 quotes, no consecutive repeats, fade transition
- Fully responsive — desktop, tablet, and mobile

---

## Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — custom properties, clamp(), backdrop-filter, SVG |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | localStorage |
| Audio | HTML5 Audio + Web Audio API |
| Fonts | DM Sans, Inter (Google Fonts) |

No build step. No npm. No frameworks.

---

## Project Structure

```
Focusmodeon/
├── index.html       — Application shell and component markup
├── style.css        — All styling, layout, animations, responsive rules
├── app.js           — Timer engine, state management, all UI logic
├── focusmode.svg    — App icon / favicon
├── image 1.jpg      — Background environment image
├── image 2.jpg      — Background environment image
├── image 3.jpg      — Background environment image
├── image 4.jpg      — Background environment image
└── Interstellar - Hans Zimmer (Soft Version) Sleep, Study, Relax - 1 Hour.mp3
```

---

## Running Locally

Because the browser blocks local audio playback over the `file://` protocol, serve the project through a local HTTP server.

**Using Node.js**

```bash
npx serve .
```

**Using Python**

```bash
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Pause |
| F | Toggle fullscreen |
| Escape | Close menus / exit focus mode |

---

## Deployment

Static files — deploy anywhere.

- **Netlify** — drag and drop the folder or connect this repo
- **Vercel** — import from GitHub, zero configuration
- **GitHub Pages** — enable in repository settings under Pages

> Note: The MP3 file is 85 MB. GitHub warns at 50 MB but allows up to 100 MB. For repeated deployments, consider Git LFS or hosting the audio separately.

---

## Timer Accuracy

The countdown uses `Date.now()` timestamps rather than simple interval decrements. When the timer starts, an end timestamp is stored. On each tick, remaining time is calculated as `endTime - Date.now()`. This means the timer stays accurate even when the tab is hidden, the device sleeps, or the interval fires late.

---

## localStorage Keys

All preferences are stored under a single key: `focusmode_v2`

Persisted values include focus duration, break duration, long break duration, session count, focus topic, tasks, volume, ambient enabled state, auto-start preferences, hide seconds, notification permission, and last background index.

---

## License

MIT
