# Backend Bridge Examples

This directory contains example implementations of backend bridges that connect Serval's React frontend with the Servo browser engine.

## Overview

A backend bridge is responsible for:
1. Spawning/managing Servo processes
2. Establishing communication between the React frontend and Servo
3. Translating messages between the two components
4. Handling platform-specific integration

## Available Examples

### 1. WebSocket Bridge (`backend-bridge.ts`)

A WebSocket-based bridge that connects to a WebSocket server running Servo.

**Use Case**: Distributed architecture where Servo runs on a separate server or process.

**Architecture**:
```
React Frontend (Browser)
    ↓ WebSocket
WebSocket Server
    ↓ Process Management
Servo Engine
```

**How to Use**:
```typescript
import { WebSocketServoBridge } from './examples/backend-bridge';

// Connect to WebSocket server at default URL (ws://localhost:8080)
new WebSocketServoBridge();

// Or specify custom URL
new WebSocketServoBridge('ws://localhost:3000');
```

### 2. Electron IPC Bridge (`backend-bridge.ts`)

An Electron-based bridge using IPC for communication.

**Use Case**: Desktop application using Electron with Servo as the rendering engine.

**Architecture**:
```
React Frontend (Renderer Process)
    ↓ IPC
Electron Main Process
    ↓ Child Process
Servo Engine
```

**How to Use**:
```typescript
// In your renderer process preload script
import { ElectronServoBridge } from './examples/backend-bridge';

new ElectronServoBridge();
```

**Electron Main Process Example**:
```javascript
// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');

let servoProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('dist/index.html');
  
  // Start Servo process
  servoProcess = spawn('servo', ['--headless']);
  
  // Handle messages from renderer to Servo
  ipcMain.on('servo-command', (event, message) => {
    // Send command to Servo process
    servoProcess.stdin.write(JSON.stringify(message) + '\n');
  });
  
  // Handle messages from Servo to renderer
  servoProcess.stdout.on('data', (data) => {
    try {
      const message = JSON.parse(data.toString());
      win.webContents.send('servo-event', message);
    } catch (e) {
      console.error('Failed to parse Servo output:', e);
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (servoProcess) {
    servoProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 3. Mock Bridge (`backend-bridge.ts`)

A mock implementation that simulates Servo responses without actually running Servo.

**Use Case**: Development, testing, and UI prototyping without Servo dependency.

**How to Use**:
```typescript
import { MockServoBridge } from './examples/backend-bridge';

// Initialize mock bridge
new MockServoBridge();
```

This is automatically initialized in development mode (`npm run dev`).

## Creating Your Own Bridge

To create a custom bridge implementation:

1. **Expose the Backend Interface**:
   ```typescript
   window.__SERVO_BACKEND__ = {
     postMessage: (message: ServoMessage) => {
       // Send message to Servo
     }
   };
   ```

2. **Handle Messages from Servo**:
   ```typescript
   // When receiving a message from Servo
   window.postMessage({
     source: 'servo-backend',
     message: {
       type: 'titleChange',
       tabId: '123',
       title: 'Example Page'
     }
   }, '*');
   ```

3. **Implement Message Handling**:
   - Navigate: Load URL in Servo
   - Back/Forward: Manage navigation history
   - Refresh: Reload current page
   - Close: Clean up tab resources

## Message Protocol

### Frontend → Servo

```typescript
interface ServoMessage {
  type: 'navigate' | 'back' | 'forward' | 'refresh' | 'close';
  tabId?: string;
  url?: string;
}
```

### Servo → Frontend

```typescript
interface ServoMessage {
  type: 'titleChange' | 'urlChange' | 'loadStart' | 'loadComplete' | 'ready';
  tabId?: string;
  url?: string;
  title?: string;
}
```

## Integration Steps

1. **Choose a Bridge Type**: WebSocket, Electron, Tauri, or custom
2. **Build/Install Servo**: Get Servo from https://github.com/servo/servo
3. **Implement the Bridge**: Use one of the examples as a starting point
4. **Configure Serval**: Include the bridge in your build
5. **Test**: Verify communication between frontend and Servo

## Testing Your Bridge

To test if your bridge is working:

1. Open browser console
2. Check for connection messages
3. Try navigating to a URL
4. Verify that events are being sent/received

```javascript
// Check if backend is available
console.log('Servo Backend:', window.__SERVO_BACKEND__);

// Send a test message
window.__SERVO_BACKEND__?.postMessage({
  type: 'navigate',
  tabId: 'test-tab',
  url: 'https://example.com'
});

// Listen for responses
window.addEventListener('message', (event) => {
  if (event.data.source === 'servo-backend') {
    console.log('Received from Servo:', event.data.message);
  }
});
```

## Platform-Specific Notes

### Windows
- Use named pipes or TCP sockets for IPC
- Consider using Electron for easier packaging

### macOS
- Can use Unix sockets or Mach ports
- XPC framework for advanced IPC

### Linux
- Unix domain sockets work well
- D-Bus for system integration

## Production Deployment

For production use:

1. Bundle Servo with your application
2. Implement proper process management
3. Add error handling and recovery
4. Implement security measures (validate messages, sandbox Servo)
5. Add logging and monitoring

## Resources

- [Servo Project](https://github.com/servo/servo)
- [Servo Embedding API](https://github.com/servo/servo/wiki/Embedding)
- [Electron IPC](https://www.electronjs.org/docs/latest/api/ipc-main)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## Contributing

If you create a new bridge implementation:
1. Add it to this examples directory
2. Update this README
3. Include usage examples and tests
4. Document any platform-specific requirements
