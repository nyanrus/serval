/**
 * Example Backend Bridge Implementation
 * 
 * This is a simple example showing how to create a backend bridge
 * that connects Serval's React frontend to the Servo browser engine.
 * 
 * This example uses WebSocket for communication, but you could also use:
 * - Electron IPC
 * - Tauri commands
 * - stdio pipes
 * - HTTP REST API
 */

// Type definitions matching ServoBackend.ts
interface ServoMessage {
  type: 'navigate' | 'back' | 'forward' | 'refresh' | 'close' | 'ready' | 'titleChange' | 'urlChange' | 'loadStart' | 'loadComplete';
  tabId?: string;
  url?: string;
  title?: string;
  data?: unknown;
}

/**
 * WebSocket Bridge Implementation
 * 
 * This bridge connects to a WebSocket server that controls Servo.
 * The WebSocket server would spawn Servo processes and relay messages.
 */
class WebSocketServoBridge {
  private ws: WebSocket | null = null;
  private serverUrl: string;

  constructor(serverUrl: string = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
    this.connect();
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to Servo backend');
        this.setupBackendInterface();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServoMessage = JSON.parse(event.data);
          this.handleMessageFromServo(message);
        } catch (e) {
          console.error('Failed to parse message from Servo:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Servo backend');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };
    } catch (e) {
      console.error('Failed to connect to Servo backend:', e);
    }
  }

  private setupBackendInterface(): void {
    // Expose interface to the window object
    (window as any).__SERVO_BACKEND__ = {
      postMessage: (message: ServoMessage) => {
        this.sendMessageToServo(message);
      }
    };
  }

  private sendMessageToServo(message: ServoMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  private handleMessageFromServo(message: ServoMessage): void {
    // Forward message to the React frontend
    window.postMessage({
      source: 'servo-backend',
      message: message
    }, '*');
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Electron IPC Bridge Example
 * 
 * This shows how you would integrate with Electron.
 * In your Electron main process, you would spawn Servo and handle IPC.
 */
class ElectronServoBridge {
  constructor() {
    // Check if running in Electron
    if (typeof window !== 'undefined' && (window as any).electron) {
      this.setupElectronBridge();
    }
  }

  private setupElectronBridge(): void {
    const { ipcRenderer } = (window as any).electron;

    // Set up the interface
    (window as any).__SERVO_BACKEND__ = {
      postMessage: (message: ServoMessage) => {
        ipcRenderer.send('servo-command', message);
      }
    };

    // Listen for messages from Servo (via Electron main process)
    ipcRenderer.on('servo-event', (_event: any, message: ServoMessage) => {
      window.postMessage({
        source: 'servo-backend',
        message: message
      }, '*');
    });
  }
}

/**
 * Mock Bridge for Development/Testing
 * 
 * This simulates Servo responses without actually running Servo.
 * Useful for development and testing the UI.
 */
class MockServoBridge {
  private tabs: Map<string, { url: string; title: string; history: string[] }> = new Map();

  constructor() {
    this.setupMockBackend();
  }

  private setupMockBackend(): void {
    (window as any).__SERVO_BACKEND__ = {
      postMessage: (message: ServoMessage) => {
        this.handleCommand(message);
      }
    };
  }

  private handleCommand(message: ServoMessage): void {
    const { type, tabId, url } = message;

    switch (type) {
      case 'navigate':
        if (tabId && url) {
          // Simulate navigation
          setTimeout(() => {
            // Send load start event
            this.sendEvent({
              type: 'loadStart',
              tabId,
              url
            });

            // Simulate loading delay
            setTimeout(() => {
              // Update tab info
              const title = this.extractTitleFromUrl(url);
              this.tabs.set(tabId, {
                url,
                title,
                history: [...(this.tabs.get(tabId)?.history || []), url]
              });

              // Send title change
              this.sendEvent({
                type: 'titleChange',
                tabId,
                title
              });

              // Send load complete
              this.sendEvent({
                type: 'loadComplete',
                tabId,
                url
              });
            }, 500);
          }, 100);
        }
        break;

      case 'back':
      case 'forward':
      case 'refresh':
        // Simulate navigation history
        console.log(`Mock: ${type} for tab ${tabId}`);
        break;

      case 'close':
        if (tabId) {
          this.tabs.delete(tabId);
        }
        break;
    }
  }

  private sendEvent(message: ServoMessage): void {
    window.postMessage({
      source: 'servo-backend',
      message
    }, '*');
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'New Tab';
    }
  }
}

// Export for use in different environments
export { WebSocketServoBridge, ElectronServoBridge, MockServoBridge };

// Auto-initialize based on environment
if (typeof window !== 'undefined') {
  // Try to detect the environment and initialize appropriate bridge
  
  // Check for development mode environment variable
  const isDevelopment = import.meta.env?.DEV;
  
  if (isDevelopment) {
    // Use mock bridge in development
    console.log('Initializing Mock Servo Bridge for development');
    new MockServoBridge();
  } else if ((window as any).electron) {
    // Use Electron bridge in Electron environment
    console.log('Initializing Electron Servo Bridge');
    new ElectronServoBridge();
  } else {
    // Try WebSocket bridge in other environments
    console.log('Initializing WebSocket Servo Bridge');
    new WebSocketServoBridge();
  }
}
