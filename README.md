# serval

A simple browser UI built with Vite and React, featuring a Firefox-like interface with tab management and a **two-process architecture** for security and stability.

## Features

- **Two-Process Architecture**: Main process for browser UI, separate content processes for web rendering (like Firefox/Chrome)
- **Tab Management**: Create, switch, and close multiple tabs, each with isolated content process
- **Address Bar**: Navigate to URLs or search with automatic protocol handling
- **Navigation Controls**: Back, forward, and refresh buttons
- **Process Isolation**: Content crashes don't affect browser chrome
- **Fast Development**: Vite's Hot Module Replacement (HMR) for instant updates
- **Firefox-like UI**: Dark theme with modern browser aesthetics

## Architecture

Serval implements a **two-process browser architecture** similar to modern browsers:

1. **Main Process** - Renders browser chrome UI (tabs, address bar, navigation)
2. **Content Processes** - Isolated workers that render web content via Servo (one per tab)

This provides:
- ✅ **Security**: Web content isolated from browser UI
- ✅ **Stability**: Content process crashes don't affect the browser
- ✅ **Performance**: Parallel processing of UI and content

See [TWO_PROCESS_ARCHITECTURE.md](TWO_PROCESS_ARCHITECTURE.md) for detailed documentation.

## Screenshots

### Two-Process Architecture
![Two-Process Architecture](https://github.com/user-attachments/assets/8d69b46c-e668-4d5e-a47e-281aac21eb17)

### Content Rendering in Isolated Process
![Browser with Content](https://github.com/user-attachments/assets/872eb956-6a4c-43f1-85d7-bf47ed710322)

### Multiple Tabs with Separate Processes
![Browser Multiple Tabs](https://github.com/user-attachments/assets/aa217cb6-a5a4-4ed4-a35f-d1bf458a89a0)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- **Rust and Cargo** (for Servo backend server)
- Servo dependencies (see [SERVO_INTEGRATION_REAL.md](SERVO_INTEGRATION_REAL.md))

### Setup

**Important**: Serval requires a running Servo backend server. There is no mock mode.

```bash
# 1. Install frontend dependencies
npm install

# 2. Build Servo backend server
cd servo-backend
cargo build --release

# 3. Start the backend server (required!)
cargo run --release
# Server will listen on ws://localhost:8080
```

In a new terminal:

```bash
# 4. Start frontend
npm run dev
```

The browser will be available at `http://localhost:5173/` and will connect to the Servo backend at `ws://localhost:8080`.

### Configuration

Configure the WebSocket URL in `.env` (optional, defaults to `ws://localhost:8080`):

```bash
VITE_SERVO_WEBSOCKET_URL=ws://localhost:8080
VITE_SERVO_DEBUG=true
```

See [SERVO_INTEGRATION_REAL.md](SERVO_INTEGRATION_REAL.md) for integrating with actual Servo browser engine.

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server with HMR
npm run dev
```

The browser will be available at `http://localhost:5173/`. Changes to the code will automatically update in the browser thanks to Vite's HMR.

### Build

```bash
# Build for production
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
serval/
├── src/
│   ├── process/
│   │   ├── MainProcess.ts           # Main process - browser chrome
│   │   ├── ContentProcess.worker.ts # Content process - web rendering
│   │   └── ProcessMessages.ts       # IPC message types
│   ├── components/
│   │   ├── TabBar.tsx               # Tab management component
│   │   ├── TabBar.css
│   │   ├── AddressBar.tsx           # URL/search input component
│   │   ├── AddressBar.css
│   │   ├── ContentView.tsx          # Content display from processes
│   │   ├── ContentView.css
│   │   ├── ServoView.tsx            # Legacy Servo view (deprecated)
│   │   └── ServoView.css
│   ├── backend/
│   │   └── ServoBackend.ts          # Servo backend communication (legacy)
│   ├── Browser.tsx                  # Main browser component
│   ├── Browser.css
│   ├── App.tsx                      # Application entry point
│   ├── main.tsx                     # React root
│   ├── config.ts                    # Servo configuration
│   ├── initBackend.ts               # Backend initialization
│   └── index.css                    # Global styles
├── public/                           # Static assets
├── index.html                        # HTML template
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
├── TWO_PROCESS_ARCHITECTURE.md      # Architecture documentation
└── SERVO_INTEGRATION.md             # Servo integration guide
```

## Component Overview

### MainProcess
The main process that manages browser chrome:
- Creates and manages tabs
- Spawns content processes (Web Workers)
- Routes IPC messages between UI and content
- Handles process lifecycle and crashes

### ContentProcess (Worker)
Isolated content processes for web rendering:
- One worker per tab for isolation
- Handles web content rendering via Servo
- Manages navigation history
- Sends events to main process (title, URL changes)

### Browser
The main React component that orchestrates the browser UI:
- Renders tabs, address bar, and content view
- Connects UI to MainProcess
- Updates based on content process events

### TabBar
Manages multiple tabs with:
- Tab creation (+ button) - spawns new content process
- Tab switching (click on tab)
- Tab closing (× button) - terminates content process
- Active tab highlighting

### AddressBar
Provides navigation functionality:
- URL input with auto-complete
- Search query support (redirects to Google)
- Navigation controls (back, forward, refresh)
- Automatic protocol handling (adds https:// if missing)

### ContentView
Displays web content from isolated content processes:
- Shows architecture diagram when empty
- Displays simulated web content when URL is loaded
- In production, would show actual Servo-rendered content
- Indicates content is rendered in separate process

## Browser Features

### Two-Process Architecture
- **Process Isolation**: Each tab runs in its own Web Worker (content process)
- **IPC Communication**: Typed message passing between main and content processes
- **Crash Recovery**: Content crashes don't affect browser chrome
- **Security**: Web content isolated from browser internals

### URL Handling
- **Direct URLs**: Enter `example.com` → navigates to `https://example.com`
- **Full URLs**: Enter `https://github.com` → navigates directly
- **Search**: Enter `how to use React` → searches on Google

### Tab Management
- Create unlimited tabs with the + button
- Click on any tab to switch to it
- Close tabs with the × button (minimum 1 tab always remains)
- Tab titles automatically update based on page content

## Technology Stack

- **React 19**: Latest React with modern hooks
- **TypeScript**: Type-safe development
- **Vite 7**: Lightning-fast build tool with HMR
- **CSS**: Component-scoped styling
- **ESLint**: Code quality and consistency

## About Servo Integration

Serval is designed as a frontend UI for the [Servo browser engine](https://github.com/servo/servo), similar to how Firefox's UI sits on top of Gecko.

### How It Works

The integration consists of three layers:

1. **Frontend Layer** (React/TypeScript): The UI components you see (TabBar, AddressBar, etc.)
2. **Backend Bridge**: A native bridge that communicates between the React frontend and Servo
3. **Servo Engine**: The actual browser engine written in Rust that renders web content

### Key Components

- **ServoBackend** (`src/backend/ServoBackend.ts`): Manages communication with Servo through message passing
- **ServoView** (`src/components/ServoView.tsx`): React component that displays Servo-rendered content

### Getting Started with Servo

For detailed information about setting up and using Servo as the backend, see [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md).

**Quick Start (Development Mode)**:
```bash
npm install
npm run dev  # Runs with mock Servo backend for development
```

**Production Mode (with Servo)**:
Requires building Servo and setting up a backend bridge. See [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md) for complete instructions.

## Development Tips

### Hot Module Replacement (HMR)
Vite's HMR allows you to see changes instantly:
1. Start the dev server: `npm run dev`
2. Edit any `.tsx` or `.css` file
3. Save the file
4. The browser updates automatically without full reload

### Adding New Features
- New UI components go in `src/components/`
- Browser-level state is managed in `src/Browser.tsx`
- Styling follows component-scoped CSS pattern

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
