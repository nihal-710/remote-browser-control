# Remote Browser Control

A full-stack remote browser control system — stream and interact with a headless Chromium browser running in Docker, directly from your web browser.

> Built as an SDE internship assignment for BLD. Completed across 11 development phases in under 24 hours.

---

## Demo

| Start Browser | Live Stream | Click & Type |
|---|---|---|
| Click Start → Docker launches Chromium | Google streams to dashboard in real-time | Click any element, type, scroll |

---

## Features

- **Live Browser Streaming** — Chromium screen streamed via Socket.io at 2fps (JPEG)
- **Mouse Control** — Click any element with coordinate-mapped precision
- **Keyboard Input** — Type text, use special keys (Enter, Backspace, Tab, Arrows)
- **Scroll Support** — Mouse wheel scrolls the remote page
- **URL Navigation** — Navigate to any URL
- **Browser History** — Back, Forward, Refresh
- **Page Info** — Live URL and page title tracking
- **Docker Integration** — Chromium runs in an isolated container
- **Professional UI** — Dark SaaS-style dashboard

---

## Architecture
┌─────────────────────────────────────────┐
│           Browser (localhost:3000)       │
│         Next.js 15 Dashboard            │
│  Controls │ Viewer │ Session Info        │
└──────────────────┬──────────────────────┘
│ Socket.io
│ (WebSocket)
┌──────────────────▼──────────────────────┐
│         Backend (localhost:3001)         │
│      Node.js + Express + Socket.io       │
│  BrowserManager │ socketHandler          │
└──────────────────┬──────────────────────┘
│ Playwright CDP
│ (connectOverCDP)
┌──────────────────▼──────────────────────┐
│      Docker Container (port 9222)        │
│         Chromium Headless                │
│    --remote-debugging-port=9222          │
└─────────────────────────────────────────┘

**Data flow for streaming:**
Playwright → page.screenshot() → Base64 JPEG → Socket.io → img tag (React state)

**Data flow for clicks:**
Mouse event → coordinate scaling → Socket.io → page.mouse.click(x, y)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, Zustand |
| Real-time | Socket.io (WebSocket) |
| Backend | Node.js, Express, TypeScript |
| Browser Automation | Playwright |
| Container | Docker, Chromium |

---

## Folder Structure
remote-browser-control/
├── frontend/                  # Next.js 15 app
│   ├── app/                   # App router pages
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── BrowserControls.tsx
│   │   │   ├── BrowserViewer.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── SessionInfo.tsx
│   │   ├── hooks/
│   │   │   └── useSocket.ts   # Socket.io hook
│   │   ├── lib/
│   │   │   └── socket.ts      # Socket singleton
│   │   ├── store/
│   │   │   └── browserStore.ts # Zustand state
│   │   └── types/
│   │       └── browser.ts
├── backend/                   # Node.js server
│   ├── src/
│   │   ├── server.ts          # Express + Socket.io
│   │   ├── config/
│   │   │   └── constants.ts
│   │   ├── services/
│   │   │   └── BrowserManager.ts  # Playwright singleton
│   │   ├── socket/
│   │   │   └── socketHandler.ts   # Event handlers
│   │   ├── types/
│   │   │   └── browser.types.ts
│   │   └── utils/
│   │       └── logger.ts
│   └── .env
├── docker/
│   ├── Dockerfile             # Chromium container
│   └── docker-compose.yml
├── scripts/
│   ├── start-docker.sh
│   └── stop-docker.sh
└── README.md

---

## Installation

### Prerequisites

- Node.js 18+
- Docker Desktop (or Docker Engine)
- Git

### Clone

```bash
git clone https://github.com/nihal-710/remote-browser-control.git
cd remote-browser-control
```

### Install dependencies

```bash
# Install all
cd frontend && npm install && cd ../backend && npm install
```

---

## Running Locally

### Option A: Local Chromium (no Docker)

Make sure `USE_DOCKER=false` in `backend/.env`, then:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

### Option B: Docker (Chromium in container)

**Step 1 — Start Chromium container:**
```bash
./scripts/start-docker.sh
```

**Step 2 — Enable Docker mode in backend/.env:**
USE_DOCKER=true
CDP_URL=http://localhost:9222

**Step 3 — Start backend:**
```bash
cd backend && npm run dev
```

**Step 4 — Start frontend:**
```bash
cd frontend && npm run dev
```

Open **http://localhost:3000**

---

## Docker Setup

### Build and start container

```bash
cd docker
docker compose up -d --build
```

### Verify Chromium is running

```bash
curl http://localhost:9222/json/version
```

### Stop container

```bash
./scripts/stop-docker.sh
```

### View container logs

```bash
docker logs remote-browser-chromium -f
```

---

## Usage Guide

1. **Open** http://localhost:3000
2. **Click Start** — Chromium launches (in Docker or locally)
3. **Watch** the live stream appear in the viewer panel
4. **Click** anywhere on the stream to interact
5. **Type** after clicking an input field — "KB Active" badge confirms keyboard is active
6. **Scroll** using mouse wheel inside the viewer
7. **Navigate** using the URL bar or Back/Forward/Refresh buttons
8. **Click Stop** to end the session

---

## Environment Variables

**backend/.env**

| Variable | Default | Description |
|---|---|---|
| PORT | 3001 | Backend server port |
| FRONTEND_URL | http://localhost:3000 | CORS origin |
| SCREENSHOT_INTERVAL | 500 | ms between frames |
| BROWSER_WIDTH | 1280 | Viewport width |
| BROWSER_HEIGHT | 720 | Viewport height |
| USE_DOCKER | false | Use Docker CDP mode |
| CDP_URL | http://localhost:9222 | Docker Chromium endpoint |
| CHROMIUM_PATH | /usr/bin/chromium-browser | Local Chromium path |

---

## Known Issues

### 1. Stream synchronization lag after rapid navigation

**Description:** After multiple rapid back/forward/refresh actions in quick succession, the browser navigation state updates correctly (URL, title) while the streamed image may briefly lag 1–2 frames behind the actual page state.

**Root cause:** The current streaming implementation uses a fixed-interval `setInterval` for screenshot capture. The interval runs independently of navigation events, so a screenshot taken mid-navigation may show a transitional state.

**Workaround:** The stream catches up within 500–1000ms automatically.

**Future fix:** Replace interval-based polling with an event-driven approach — listen to Playwright's `page.on('load')` and emit a screenshot immediately on page load, eliminating the lag entirely.

### 2. Docker CDP on WSL2

Depending on WSL2 network configuration, `connectOverCDP` to `localhost:9222` may require the container to use `host` network mode. If connection fails, set `network_mode: host` in `docker-compose.yml`.

---

## Future Improvements

- **Higher FPS streaming** — WebRTC or canvas-based streaming for 30fps+
- **Multi-tab support** — manage multiple browser tabs
- **Event-driven screenshots** — fire on page load instead of polling
- **Authentication** — session tokens for multi-user access
- **Mobile gesture support** — pinch-to-zoom, swipe
- **Recording** — record and replay browser sessions
- **Kubernetes deployment** — scale browser containers on demand

---

## Troubleshooting

**Socket shows "Disconnected"**
→ Make sure backend is running on port 3001: `cd backend && npm run dev`

**"Failed to connect to backend"**
→ Check CORS: `FRONTEND_URL` in `backend/.env` must match your frontend URL

**Browser won't start in Docker mode**
→ Run `curl http://localhost:9222/json/version` — if it fails, container isn't ready
→ Check logs: `docker logs remote-browser-chromium`

**Stream appears but clicks don't register**
→ Click directly on the image area (not the sidebar)
→ Check backend terminal for `mouse-click` log entries

**Keyboard not working**
→ Click inside the viewer first — "KB Active" badge must appear before typing

**Scroll not working**
→ Hover mouse over the viewer area and use mouse wheel

---

## License

MIT