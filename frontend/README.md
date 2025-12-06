# DeckBot Frontend

React/Vite frontend for DeckBot.

> **Note**: Most users don't need to touch this directory. Just run `deckbot` and it serves the built frontend automatically. This README is for **frontend developers** who want to modify the UI with hot-reload.

## Frontend Development

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm or yarn

### Setup

```bash
npm install
```

### Development with Hot-Reload

When developing the frontend, you can run the Vite dev server for instant hot-reload:

1. **Terminal 1** - Start Flask backend:
   ```bash
   deckbot --port 5555
   ```

2. **Terminal 2** - Start Vite dev server with hot-reload:
   ```bash
   cd frontend
   DECKBOT_API_URL=http://localhost:5555 npm run dev
   ```

3. Access the app at `http://localhost:5173` (Vite dev server with hot-reload)

The Vite dev server proxies API calls to the Flask backend running on port 5555.

## Building for Production

```bash
npm run build
```

This builds the frontend and outputs to `../src/deckbot/static/dist/`, which Flask will serve in production.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   ├── chat/      # Chat-related components
│   │   ├── presentation/ # Presentation views
│   │   └── ...
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities
│   ├── services/      # API service layer
│   ├── store/         # Zustand stores
│   ├── types/         # TypeScript types
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── package.json
├── vite.config.ts     # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```

## Technology Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Monaco Editor** - Code editor
- **Marked** - Markdown parsing

## API Integration

All API calls are typed and centralized in `src/services/api.ts`. The Flask backend provides REST endpoints and Server-Sent Events (SSE) for real-time updates.

## State Management

Zustand stores manage application state:
- `useAppStore` - Global app state (theme, current presentation, preferences)
- `useChatStore` - Chat messages and thinking state
- `usePresentationStore` - Presentations and templates
- `useEditorStore` - File tree and editor state

## Theme System

The app supports multiple themes:
- Light/Dark/System mode
- Color themes: Miami, Midwest, California

Theme preferences are persisted to localStorage and synced with the backend.
