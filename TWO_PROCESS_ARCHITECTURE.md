# Two-Process Browser Architecture

This document describes the two-process browser architecture implemented in Serval, similar to modern browsers like Firefox and Chrome.

## Overview

Serval now uses a multi-process architecture with:

1. **Main Process (Browser Chrome)** - Renders the browser UI and manages tabs
2. **Content Processes** - Isolated processes that render web content (one per tab)

This architecture provides:
- **Security**: Web content runs isolated from browser UI
- **Stability**: Content process crashes don't affect the browser
- **Performance**: Parallel processing of UI and content

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│                   (Browser Chrome UI)                        │
│                                                              │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  TabBar    │  │ AddressBar  │  │  ContentView        │  │
│  └────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  MainProcess Controller:                                    │
│  - Tab management                                           │
│  - Process lifecycle                                        │
│  - IPC coordination                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ IPC Messages
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Content Process │ │ Content Process │ │ Content Process │
│    (Tab 1)      │ │    (Tab 2)      │ │    (Tab 3)      │
│                 │ │                 │ │                 │
│ - Servo Engine  │ │ - Servo Engine  │ │ - Servo Engine  │
│ - Page Loading  │ │ - Page Loading  │ │ - Page Loading  │
│ - JS Execution  │ │ - JS Execution  │ │ - JS Execution  │
│ - Web Rendering │ │ - Web Rendering │ │ - Web Rendering │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Process Types

### Main Process (`MainProcess.ts`)

The main process is responsible for:

- **Browser Chrome UI**: Renders tabs, address bar, navigation buttons
- **Tab Management**: Creates, switches, and closes tabs
- **Process Lifecycle**: Spawns and manages content processes
- **IPC Coordination**: Routes messages between UI and content processes

**Key Methods**:
- `createTab(tabId, url)` - Creates a new tab with associated content process
- `navigateTab(tabId, url)` - Sends navigation command to content process
- `closeTab(tabId)` - Closes tab and terminates content process
- `sendNavigationCommand(tabId, command)` - Sends back/forward/refresh commands

### Content Process (`ContentProcess.worker.ts`)

Each content process is responsible for:

- **Web Content Rendering**: Uses Servo engine to render web pages
- **Page Navigation**: Handles URL loading and history
- **Event Reporting**: Sends title changes, load events to main process
- **Isolation**: Runs in separate Worker thread for security

**Key Methods**:
- `navigate(url)` - Loads a URL in Servo
- `goBack()` - Navigate backward in history
- `goForward()` - Navigate forward in history
- `refresh()` - Reload current page

## Inter-Process Communication (IPC)

### Message Protocol

Communication between processes uses a typed message protocol defined in `ProcessMessages.ts`.

#### Main Process → Content Process

```typescript
type MainProcessMessage = 
  | { type: 'initialize'; tabId: string }
  | { type: 'navigate'; url: string; tabId: string }
  | { type: 'back'; tabId: string }
  | { type: 'forward'; tabId: string }
  | { type: 'refresh'; tabId: string }
  | { type: 'shutdown'; tabId: string };
```

#### Content Process → Main Process

```typescript
type ContentProcessMessage = 
  | { type: 'ready'; tabId: string; processId?: string }
  | { type: 'titleChange'; tabId: string; title: string }
  | { type: 'urlChange'; tabId: string; url: string }
  | { type: 'loadStart'; tabId: string; url: string }
  | { type: 'loadComplete'; tabId: string; url: string }
  | { type: 'processCrash'; tabId: string; processId: string };
```

### Message Flow Example

1. **User enters URL in address bar**:
   ```
   User → AddressBar → Browser Component
   → MainProcess.navigateTab(tabId, url)
   → Worker.postMessage({ type: 'navigate', url, tabId })
   ```

2. **Content process loads page**:
   ```
   Worker receives message
   → ContentProcess.navigate(url)
   → Servo loads URL
   → Worker.postMessage({ type: 'loadStart', tabId, url })
   → Worker.postMessage({ type: 'titleChange', tabId, title })
   → Worker.postMessage({ type: 'loadComplete', tabId, url })
   ```

3. **Main process updates UI**:
   ```
   MainProcess receives messages
   → Updates tab title and URL
   → Triggers React state updates
   → UI re-renders with new information
   ```

## Implementation Details

### Web Workers as Process Isolation

Since this is a web application, we use Web Workers to simulate separate processes:

- **Main Thread**: Runs the React UI (main process)
- **Worker Threads**: One per tab (content processes)

In a native implementation (Electron/Tauri), these would be actual OS processes.

### Process Creation

When a new tab is created:

1. `Browser.tsx` calls `handleNewTab()`
2. `MainProcess.createTab(tabId, url)` is called
3. A new Worker is spawned from `ContentProcess.worker.ts`
4. Initialize message is sent to worker
5. Worker sends back `ready` message

### Process Termination

When a tab is closed:

1. `Browser.tsx` calls `handleTabClose(tabId)`
2. `MainProcess.closeTab(tabId)` is called
3. Worker is terminated with `worker.terminate()`
4. Process info is cleaned up

### Error Handling

- Worker errors trigger `handleProcessCrash()`
- Crash events are sent to UI
- Future: Could implement automatic process restart

## Components

### Browser.tsx

Updated to use the two-process architecture:

- Uses `MainProcess` instead of direct `ServoBackend`
- Sets up message handlers for content process events
- Updates UI based on events from content processes

### ContentView.tsx

New component that displays content from content processes:

- Shows architecture diagram when no URL is loaded
- Displays simulated web content when URL is loaded
- In production, would show actual Servo-rendered content

## Benefits of Two-Process Architecture

### Security
- **Sandboxing**: Web content runs in isolated worker
- **Reduced Attack Surface**: Browser UI protected from malicious pages
- **Permission Isolation**: Content can't access browser internals

### Stability
- **Crash Isolation**: Content process crash doesn't affect browser
- **Tab Independence**: Each tab runs in separate process
- **Recovery**: Can restart crashed content processes

### Performance
- **Parallel Processing**: UI and content rendering happen concurrently
- **Responsive UI**: Content processing doesn't block browser chrome
- **Resource Management**: Can terminate idle content processes

## Comparison with Other Browsers

### Firefox
- **E10s (Electrolysis)**: Multi-process Firefox
- Similar architecture with main process + content processes
- Uses IPC for communication

### Chrome
- **Multi-process from the start**
- Process-per-tab model (now process-per-site)
- Uses Chromium IPC

### Serval
- **Two-process architecture**
- Web Workers for process isolation (web) or OS processes (native)
- Typed message passing protocol

## Future Enhancements

1. **Process Pooling**: Reuse content processes for multiple tabs
2. **Process Limits**: Cap number of concurrent content processes
3. **Memory Management**: Monitor and limit content process memory
4. **GPU Process**: Separate process for graphics acceleration
5. **Extension Process**: Isolated process for browser extensions
6. **Network Process**: Dedicated process for network requests

## Development

### Running the Browser

```bash
npm run dev
```

The development server will:
- Start the main process in the browser
- Content processes spawn as needed when tabs are created
- Console shows process lifecycle messages

### Debugging

**Main Process**:
- Use browser DevTools console
- Look for `[MainProcess]` log messages

**Content Process**:
- Content process logs appear in main console
- Look for `[ContentProcess]` and `[MockServo]` messages

### Testing

Create tabs and verify:
- Each tab gets its own content process
- Navigation works through IPC
- Tab closing terminates content process
- Process crash doesn't affect browser

## References

- [Firefox Multi-process Architecture](https://wiki.mozilla.org/Electrolysis)
- [Chrome Multi-process Architecture](https://www.chromium.org/developers/design-documents/multi-process-architecture/)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Servo Project](https://github.com/servo/servo)

## License

This implementation is part of the Serval project and follows the MIT License.
