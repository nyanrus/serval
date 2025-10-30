# Servo Integration - Quick Start Guide

This guide helps you get started with Serval's Servo browser engine integration.

## Overview

Serval now includes a complete integration layer for the Servo browser engine. This allows Serval to use Servo for actual web rendering instead of iframes, providing a full-featured browser experience.

## Development Mode (No Servo Required)

The easiest way to get started is in development mode, which uses a mock Servo backend:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser. The application will:
- Automatically initialize a mock Servo backend
- Display "Powered by Servo" in the welcome screen
- Simulate navigation and tab management
- Log backend operations to the console

**You can develop and test the UI without installing Servo!**

## Architecture Overview

```
┌────────────────────────────────┐
│   React Frontend (Serval UI)   │
│  - TabBar, AddressBar, etc.    │
└────────────┬───────────────────┘
             │ Message Passing
┌────────────▼───────────────────┐
│     Backend Bridge Layer       │
│  - WebSocket / Electron / IPC  │
└────────────┬───────────────────┘
             │
┌────────────▼───────────────────┐
│    Servo Browser Engine        │
│  - HTML/CSS/JS rendering       │
│  - Layout & Paint              │
└────────────────────────────────┘
```

## Message Protocol

### Frontend → Servo

- `navigate`: Load a URL
- `back`: Go back in history
- `forward`: Go forward in history
- `refresh`: Reload current page
- `close`: Close a tab

### Servo → Frontend

- `titleChange`: Page title updated
- `urlChange`: URL changed (redirects)
- `loadStart`: Page started loading
- `loadComplete`: Page finished loading

## Configuration

Create a `.env` file (see `.env.example`):

```bash
# Backend mode: 'auto', 'servo', or 'iframe'
VITE_SERVO_MODE=auto

# WebSocket URL for Servo backend
VITE_SERVO_WEBSOCKET_URL=ws://localhost:8080

# Enable debug logging
VITE_SERVO_DEBUG=true
```

## Production Setup

### Option 1: WebSocket Bridge

1. Create a WebSocket server that manages Servo processes
2. Configure `VITE_SERVO_WEBSOCKET_URL` to point to your server
3. The WebSocket server should:
   - Spawn Servo processes for each tab
   - Forward messages between frontend and Servo
   - Handle process lifecycle

See `examples/backend-bridge.ts` for implementation example.

### Option 2: Electron Integration

1. Create an Electron app with Serval as the renderer
2. In the main process, spawn Servo and set up IPC
3. In the preload script, expose the Servo backend interface
4. See `examples/backend-bridge.ts` for Electron example

### Option 3: Tauri Integration

1. Create a Tauri app with Serval as the frontend
2. Use Tauri commands to communicate with Servo
3. Spawn Servo processes from Rust backend
4. Implement the bridge in Rust with Tauri's command system

## File Structure

```
serval/
├── src/
│   ├── backend/
│   │   └── ServoBackend.ts       # Backend communication layer
│   ├── components/
│   │   ├── ServoView.tsx         # Servo rendering component
│   │   ├── UnifiedBrowserView.tsx # Auto-switching view
│   │   └── BrowserView.tsx       # Fallback iframe view
│   ├── config.ts                 # Configuration management
│   └── initBackend.ts            # Backend initialization
├── examples/
│   ├── backend-bridge.ts         # Bridge implementation examples
│   └── README.md                 # Examples documentation
├── SERVO_INTEGRATION.md          # Detailed integration guide
└── .env.example                  # Environment configuration template
```

## Testing Your Integration

1. **Check Console**: Look for "[Serval] Mock Servo backend initialized" message
2. **Navigate**: Enter a URL and verify the tab title updates
3. **Open Tabs**: Create new tabs and switch between them
4. **Check Messages**: Open browser DevTools and watch console for backend messages

## Example: Testing Navigation

```javascript
// Open browser console
console.log('Backend:', window.__SERVO_BACKEND__);

// Send a navigation command
window.__SERVO_BACKEND__?.postMessage({
  type: 'navigate',
  tabId: 'test-tab',
  url: 'https://example.com'
});

// Listen for responses
window.addEventListener('message', (event) => {
  if (event.data.source === 'servo-backend') {
    console.log('Servo event:', event.data.message);
  }
});
```

## Troubleshooting

### Backend not initializing

- Check that `initBackend()` is called in `main.tsx`
- Verify console for initialization messages
- Check `.env` configuration

### Navigation not working

- Ensure mock backend is initialized
- Check browser console for errors
- Verify message format matches protocol

### Iframe showing instead of Servo

- This is expected if Servo backend is not available
- Check `VITE_SERVO_MODE` environment variable
- Verify `window.__SERVO_BACKEND__` is defined

## Next Steps

1. **Learn More**: Read [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md) for detailed information
2. **Try Examples**: Explore `examples/backend-bridge.ts` for implementation patterns
3. **Build with Servo**: Install Servo from https://github.com/servo/servo
4. **Implement Bridge**: Choose a bridge pattern and implement for your platform
5. **Deploy**: Package your app with Servo bundled

## Resources

- [Servo Project](https://github.com/servo/servo)
- [Servo Documentation](https://servo.org/)
- [Integration Guide](SERVO_INTEGRATION.md)
- [Examples Directory](examples/README.md)

## Support

For questions or issues with the integration:
1. Check [SERVO_INTEGRATION.md](SERVO_INTEGRATION.md)
2. Review examples in `examples/` directory
3. Open an issue on GitHub

---

**Happy browsing with Servo! 🚀**
