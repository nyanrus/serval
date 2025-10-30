# Servo Backend Integration

This document describes how Serval integrates with the Servo browser engine to provide a complete browser experience.

## Overview

Serval is designed as a frontend UI for the Servo browser engine, similar to how Firefox's UI (built with XUL/HTML) sits on top of Gecko. The integration allows Serval's React-based UI to control and display content rendered by Servo.

## Architecture

```
┌─────────────────────────────────────────────┐
│           Serval Frontend (React)            │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │  TabBar    │  │    AddressBar        │  │
│  └────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │          ServoView                   │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ IPC/Message Passing
                  │
┌─────────────────▼───────────────────────────┐
│         Servo Backend Bridge                │
│  (Native Bridge / Electron / Tauri)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Servo Browser Engine (Rust)           │
│  - Layout Engine                             │
│  - Rendering Engine                          │
│  - JavaScript Engine (SpiderMonkey)         │
│  - WebGL, WebGPU, etc.                      │
└──────────────────────────────────────────────┘
```

## Components

### Frontend Layer (React/TypeScript)

1. **ServoBackend.ts**: 
   - Manages communication with Servo
   - Provides APIs for navigation, tab management
   - Handles message passing between frontend and backend

2. **ServoView.tsx**:
   - React component that renders content from Servo
   - Listens to Servo events (title changes, URL updates)
   - Sends navigation commands to Servo

### Backend Bridge Layer

The backend bridge is a native component that:
- Spawns and manages Servo processes
- Provides IPC mechanism (WebSocket, stdin/stdout, or window messages)
- Exposes Servo APIs to the JavaScript frontend
- Handles platform-specific integration (Windows, macOS, Linux)

**Note**: The backend bridge implementation is platform-specific and needs to be built separately. Common approaches include:
- **Electron**: Using Node.js native modules to spawn Servo
- **Tauri**: Rust-based desktop app framework with Servo integration
- **Custom Native Bridge**: Direct integration with Servo's embedding API

### Servo Engine

Servo is the actual browser engine that:
- Parses HTML, CSS, and JavaScript
- Renders web content
- Handles networking, security, etc.

## Message Protocol

Communication between Serval frontend and Servo backend uses a simple message protocol:

### Frontend → Servo Messages

```typescript
interface ServoMessage {
  type: 'navigate' | 'back' | 'forward' | 'refresh' | 'close';
  tabId?: string;
  url?: string;
  data?: unknown;
}
```

Examples:
- Navigate: `{ type: 'navigate', tabId: '123', url: 'https://example.com' }`
- Go Back: `{ type: 'back', tabId: '123' }`
- Refresh: `{ type: 'refresh', tabId: '123' }`

### Servo → Frontend Messages

```typescript
interface ServoMessage {
  type: 'titleChange' | 'urlChange' | 'loadStart' | 'loadComplete' | 'ready';
  tabId?: string;
  url?: string;
  title?: string;
  data?: unknown;
}
```

Examples:
- Title Change: `{ type: 'titleChange', tabId: '123', title: 'Example Page' }`
- URL Change: `{ type: 'urlChange', tabId: '123', url: 'https://example.com/page' }`

## Setup and Configuration

### Development Mode (Mock Backend)

By default, Serval runs in development mode using a mock Servo backend:

```bash
npm install
npm run dev
```

This allows you to develop and test the UI without needing Servo installed. The mock backend simulates Servo responses for navigation and tab management.

### Production Mode (Servo Backend)

To use Servo as the backend:

1. **Build or Install Servo**:
   ```bash
   # Clone Servo repository
   git clone https://github.com/servo/servo
   cd servo
   
   # Build Servo (requires Rust)
   ./mach build --release
   ```

2. **Set up the Backend Bridge**:
   - For Electron: Configure native module to spawn Servo
   - For Tauri: Configure Tauri to use Servo
   - For Custom: Implement the bridge following the message protocol

3. **Configure Serval**:
   ```bash
   # Set environment variable to point to Servo
   export SERVO_PATH=/path/to/servo/target/release/servo
   
   # Build and run Serval
   npm run build
   ```

4. **Enable Servo Backend**:
   The backend bridge should expose `window.__SERVO_BACKEND__` interface:
   ```javascript
   window.__SERVO_BACKEND__ = {
     postMessage: (message) => {
       // Send message to Servo process
     }
   };
   
   // Dispatch messages from Servo
   window.postMessage({
     source: 'servo-backend',
     message: { type: 'titleChange', tabId: '123', title: 'New Title' }
   }, '*');
   ```

## Integration Options

### Option 1: Electron + Servo

Create an Electron app that spawns Servo as a child process and uses IPC for communication.

**Pros**: 
- Cross-platform
- Easy to package
- Good tooling support

**Cons**: 
- Larger bundle size
- More overhead

### Option 2: Tauri + Servo

Use Tauri framework with Servo as the webview engine instead of WebView2/WebKit.

**Pros**: 
- Smaller bundle size
- Native performance
- Better integration

**Cons**: 
- More complex setup
- Less mature ecosystem

### Option 3: Custom Native Application

Build a custom native application with Servo embedded directly.

**Pros**: 
- Maximum control
- Best performance
- Smallest bundle

**Cons**: 
- Most complex
- Platform-specific code

## API Reference

### ServoBackend Class

```typescript
class ServoBackend {
  // Navigate to URL
  navigate(tabId: string, url: string): Promise<NavigationResponse>
  
  // Go back in history
  goBack(tabId: string): void
  
  // Go forward in history
  goForward(tabId: string): void
  
  // Refresh current page
  refresh(tabId: string): void
  
  // Close a tab
  closeTab(tabId: string): void
  
  // Register event handler
  on(type: string, handler: (message: ServoMessage) => void): void
  
  // Remove event handler
  off(type: string): void
  
  // Check connection status
  isConnected(): boolean
}
```

### Usage Example

```typescript
import { getServoBackend } from './backend/ServoBackend';

const backend = getServoBackend();

// Listen for title changes
backend.on('titleChange', (message) => {
  console.log('Title changed:', message.title);
});

// Navigate to a URL
backend.navigate('tab-1', 'https://example.com');

// Go back
backend.goBack('tab-1');
```

## Development Roadmap

- [x] Create ServoBackend abstraction layer
- [x] Implement ServoView component
- [x] Integrate with Browser component
- [x] Remove iframe fallback for Servo-only architecture
- [ ] Implement Electron/Tauri backend bridge
- [ ] Add proper history management
- [ ] Implement tab isolation
- [ ] Add developer tools integration
- [ ] Support for extensions

## Contributing

When contributing to Servo integration:

1. Ensure mock backend mode still works for development
2. Add tests for Servo integration
3. Document any new message types
4. Follow the existing code style
5. Update this document with any changes

## Resources

- [Servo Project](https://github.com/servo/servo)
- [Servo Embedding API](https://github.com/servo/servo/wiki/Embedding)
- [Electron Documentation](https://www.electronjs.org/)
- [Tauri Documentation](https://tauri.app/)

## License

This integration follows the same license as Serval (MIT License).
