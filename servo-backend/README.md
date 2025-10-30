# Serval Servo Backend Server

WebSocket server that bridges Serval frontend with Servo browser engine.

## Overview

This Rust server:
- Accepts WebSocket connections from Serval frontend
- Manages Servo browser instances (one per tab)
- Handles navigation commands and forwards page events
- Provides real browser functionality instead of mocks

## Quick Start

### Build

```bash
cargo build --release
```

### Run

```bash
cargo run --release
```

Server will listen on `ws://127.0.0.1:8080`

## Integration with Real Servo

### Step 1: Add Servo Dependency

Update `Cargo.toml`:

```toml
[dependencies]
# Add real Servo dependencies
servo = { path = "../../servo/components/servo" }
# Or from git:
# servo = { git = "https://github.com/servo/servo" }
```

### Step 2: Implement Servo Integration

Replace placeholder code in `src/servo_integration.rs` with real Servo API calls.

See `../SERVO_INTEGRATION_REAL.md` for complete integration guide.

## Architecture

```
WebSocket Client (Serval Frontend)
         ↓
   WebSocket Server
         ↓
  ServoProcessManager
         ↓
   Servo Instances
```

## Message Protocol

### Commands (Frontend → Backend)

- `initialize` - Create tab
- `navigate` - Load URL
- `back` - Go back in history
- `forward` - Go forward
- `refresh` - Reload page
- `shutdown` - Close tab

### Events (Backend → Frontend)

- `ready` - Server ready
- `titleChange` - Page title changed
- `urlChange` - URL changed (redirects)
- `loadStart` - Page started loading
- `loadComplete` - Page finished loading
- `processCrash` - Servo process crashed

## Example Usage

### Test with wscat

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:8080

# Send commands
> {"type":"navigate","tabId":"1","url":"https://example.com"}

# Receive events
< {"type":"loadStart","tabId":"1","url":"https://example.com"}
< {"type":"titleChange","tabId":"1","title":"Example Domain"}
< {"type":"loadComplete","tabId":"1","url":"https://example.com"}
```

### Test with Frontend

```bash
# Terminal 1: Start backend
cd servo-backend
cargo run --release

# Terminal 2: Start frontend
cd ..
npm run dev

# Open http://localhost:5173
# Configure .env to use websocket mode
```

## Configuration

### Environment Variables

- `RUST_LOG=debug` - Enable debug logging
- `SERVO_BACKEND_PORT=8080` - WebSocket port (default: 8080)
- `SERVO_BACKEND_HOST=127.0.0.1` - Listen address

### Example

```bash
RUST_LOG=debug cargo run --release
```

## Development

### Add Logging

```bash
RUST_LOG=servo_backend=debug cargo run
```

### Watch for Changes

```bash
cargo install cargo-watch
cargo watch -x run
```

## Production

### Build Optimized Binary

```bash
cargo build --release --target x86_64-unknown-linux-gnu
strip target/release/servo-backend-server
```

### Run as System Service

See `../SERVO_INTEGRATION_REAL.md` for systemd service configuration.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>
```

### Servo Build Errors

See [Servo build guide](https://github.com/servo/servo#setting-up-your-environment)

## License

MIT License - Same as Serval project
