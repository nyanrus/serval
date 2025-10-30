# Real Servo Integration Guide

This guide explains how to use Serval with a real Servo browser engine instead of the mock implementation.

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Serval Frontend (React/TS)       │
│   - Browser Chrome UI               │
│   - Main Process                    │
│   - Content Process Workers         │
└──────────────┬──────────────────────┘
               │ WebSocket
               │
┌──────────────▼──────────────────────┐
│   Servo Backend Server (Rust)      │
│   - WebSocket Server                │
│   - Process Manager                 │
│   - Servo Instance Controller       │
└──────────────┬──────────────────────┘
               │ Native IPC
               │
┌──────────────▼──────────────────────┐
│   Servo Browser Engine (Rust)      │
│   - HTML/CSS/JS Rendering           │
│   - Layout Engine                   │
│   - WebGL, WebGPU, etc.            │
└─────────────────────────────────────┘
```

## Prerequisites

1. **Rust** (1.70 or later)
2. **Node.js** (v18 or later)
3. **Servo dependencies** - See [Servo build instructions](https://github.com/servo/servo#setting-up-your-environment)

## Step 1: Build Servo

Clone and build Servo:

```bash
# Clone Servo repository
git clone https://github.com/servo/servo
cd servo

# Install dependencies (varies by platform)
# See https://github.com/servo/servo#setting-up-your-environment

# Build Servo
./mach build --release
```

The Servo binary will be at: `servo/target/release/servo`

## Step 2: Build Servo Backend Server

The Servo backend server is included in the `servo-backend/` directory:

```bash
cd servo-backend

# Build the backend server
cargo build --release

# The binary will be at: target/release/servo-backend-server
```

### Integrate with Real Servo

To use the actual Servo engine instead of the placeholder, update `servo-backend/src/servo_integration.rs`:

```rust
use servo::{Servo, ServoUrl};
use servo::compositing::windowing::{WindowEvent, WindowMethods};

pub struct ServoInstance {
    servo: Servo,
    // ... other fields
}

impl ServoInstance {
    pub fn new() -> Self {
        // Initialize Servo with proper configuration
        let mut opts = opts::default_opts();
        opts.url = Some("about:blank".to_string());
        
        let servo = Servo::new(/* ... */);
        
        Self { servo }
    }

    pub fn navigate(&mut self, url: &str) {
        let servo_url = ServoUrl::parse(url).unwrap();
        self.servo.handle_events(vec![WindowEvent::LoadUrl(servo_url)]);
    }
    
    // Implement other methods...
}
```

## Step 3: Configure Serval Frontend

Update `.env` file (or create one based on `.env.example`):

```bash
# Use WebSocket connection to real Servo backend
VITE_SERVO_MODE=websocket

# WebSocket URL for Servo backend server
VITE_SERVO_WEBSOCKET_URL=ws://localhost:8080

# Enable debug logging
VITE_SERVO_DEBUG=true
```

Update `src/config.ts` to use WebSocket mode:

```typescript
export const defaultConfig: ServalConfig = {
  servo: {
    connectionType: 'websocket',  // Changed from 'mock'
    websocketUrl: 'ws://localhost:8080',
    debug: true,
  },
  // ...
};
```

## Step 4: Run the System

### Terminal 1: Start Servo Backend Server

```bash
cd servo-backend
cargo run --release

# Output:
# [ServoBackend] WebSocket server listening on ws://127.0.0.1:8080
# [ServoBackend] Waiting for connections from Serval frontend...
```

### Terminal 2: Start Serval Frontend

```bash
cd .. # Back to root directory
npm install
npm run dev

# Output:
# VITE v7.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

### Terminal 3: (Optional) Monitor with WebSocket Client

```bash
# Install wscat for testing
npm install -g wscat

# Connect to backend server
wscat -c ws://localhost:8080

# Send test message
> {"type":"navigate","tabId":"test","url":"https://example.com"}

# Receive response
< {"type":"loadStart","tabId":"test","url":"https://example.com"}
< {"type":"titleChange","tabId":"test","title":"example.com"}
< {"type":"loadComplete","tabId":"test","url":"https://example.com"}
```

## Step 5: Verify Integration

1. Open browser at http://localhost:5173
2. Check browser console for connection messages:
   ```
   [Serval] Connecting to real Servo backend at ws://localhost:8080
   [ServoWebSocket] Connected to Servo backend
   [MainProcess] Initializing browser chrome process
   ```
3. Enter a URL in the address bar
4. Verify in backend server terminal:
   ```
   [ServoBackend] New WebSocket connection
   [ServoBackend] Navigating tab X to https://example.com
   ```

## Message Flow

### Navigation Example

```
User enters URL
    ↓
Browser.tsx calls handleNavigate()
    ↓
MainProcess.navigateTab(tabId, url)
    ↓
Worker.postMessage({ type: 'navigate', tabId, url })
    ↓
ContentProcess receives message
    ↓
Simulates page load (or delegates to Servo)
    ↓
Worker.postMessage({ type: 'loadStart', ... })
    ↓
MainProcess receives message
    ↓
Updates React state
    ↓
UI re-renders with new URL/title
```

### With Real Servo Backend

```
Frontend → WebSocket → Backend Server → Servo Process
    ↓                          ↓                ↓
Navigate               Create/Get        Load URL
Command                Servo Instance    Render Page
    ↑                          ↑                ↑
titleChange  ← WebSocket ←  Listen Events ←  Servo Events
loadComplete                                 (title, load, etc.)
```

## Using Actual Servo Rendering

To display actual Servo-rendered content:

### Option 1: SharedArrayBuffer (Advanced)

Use SharedArrayBuffer to share rendered pixels between Servo and the frontend:

```rust
// In servo-backend
fn capture_frame(servo: &Servo) -> Vec<u8> {
    // Get rendered frame from Servo
    servo.get_frame_data()
}

// Send frame data over WebSocket as binary
websocket.send(Message::Binary(frame_data)).await;
```

```typescript
// In ContentView.tsx
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
const imageData = new ImageData(
    new Uint8ClampedArray(frameData),
    width,
    height
);
ctx.putImageData(imageData, 0, 0);
```

### Option 2: Electron/Tauri Integration

For desktop applications, use Electron or Tauri to embed Servo directly:

```rust
// In Tauri app
use servo::Servo;

#[tauri::command]
fn create_servo_view() -> WebViewId {
    let servo = Servo::new(/* ... */);
    // Return view ID
}

#[tauri::command]
fn navigate_servo(view_id: WebViewId, url: String) {
    // Navigate Servo instance
}
```

## Troubleshooting

### Connection Refused

```
Error: WebSocket connection failed
```

**Solution**: Make sure Servo backend server is running:
```bash
cd servo-backend
cargo run --release
```

### Servo Build Errors

See [Servo build troubleshooting](https://github.com/servo/servo#troubleshooting)

### CORS Issues

If using file:// URLs, you may encounter CORS errors. Use http://localhost:5173 instead.

## Production Deployment

### Option 1: Package as Desktop App

Use Electron or Tauri to package both frontend and backend:

```bash
# With Tauri
npm install -g @tauri-apps/cli
tauri init
tauri build
```

### Option 2: Separate Backend Service

Deploy Servo backend as a system service:

```bash
# Create systemd service
sudo nano /etc/systemd/system/servo-backend.service

[Unit]
Description=Serval Servo Backend
After=network.target

[Service]
Type=simple
User=servo
WorkingDirectory=/opt/serval/servo-backend
ExecStart=/opt/serval/servo-backend/target/release/servo-backend-server
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable servo-backend
sudo systemctl start servo-backend
```

## Performance Considerations

1. **Process Limit**: Limit number of concurrent Servo instances
2. **Memory Management**: Monitor and cap memory per Servo process
3. **Connection Pooling**: Reuse Servo instances when possible
4. **GPU Acceleration**: Enable WebGL/WebGPU for better performance

## Security Considerations

1. **Sandboxing**: Servo processes should run in sandboxed environment
2. **Input Validation**: Validate all URLs and commands from frontend
3. **Rate Limiting**: Limit navigation requests per tab
4. **CSP**: Implement Content Security Policy

## Next Steps

- [ ] Implement frame sharing for actual rendering display
- [ ] Add GPU process for WebGL/WebGPU
- [ ] Implement process pooling
- [ ] Add crash recovery and auto-restart
- [ ] Implement resource limits per process
- [ ] Add performance monitoring

## Resources

- [Servo GitHub](https://github.com/servo/servo)
- [Servo Embedding Guide](https://github.com/servo/servo/wiki/Embedding)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
