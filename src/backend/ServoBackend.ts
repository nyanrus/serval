/**
 * Servo Backend Integration
 * 
 * This module provides the interface to communicate with the Servo browser engine.
 * Servo runs as a separate process and communicates with the React frontend through IPC.
 */

// Extend Window interface for Servo backend
declare global {
  interface Window {
    __SERVO_BACKEND__?: {
      postMessage: (message: ServoMessage) => void;
    };
  }
}

export interface ServoBackendConfig {
  // Path to Servo executable
  servoPath?: string;
  // Enable debug mode
  debug?: boolean;
  // Custom user agent
  userAgent?: string;
}

export interface NavigationRequest {
  url: string;
  tabId: string;
}

export interface NavigationResponse {
  success: boolean;
  url: string;
  title?: string;
  error?: string;
}

export interface ServoMessage {
  type: 'navigate' | 'back' | 'forward' | 'refresh' | 'close' | 'ready' | 'titleChange' | 'urlChange' | 'loadStart' | 'loadComplete';
  tabId?: string;
  url?: string;
  title?: string;
  data?: unknown;
}

/**
 * ServoBackend class manages communication with the Servo browser engine.
 * It provides methods to control navigation, manage tabs, and receive updates.
 */
export class ServoBackend {
  private config: ServoBackendConfig; // Will be used for future configuration options
  private messageHandlers: Map<string, (message: ServoMessage) => void>;
  private connected: boolean = false;

  constructor(config: ServoBackendConfig = {}) {
    this.config = config;
    this.messageHandlers = new Map();
    this.initialize();
  }

  /**
   * Initialize the connection to Servo backend
   */
  private async initialize(): Promise<void> {
    // In a real implementation, this would:
    // 1. Spawn Servo process if not running (using config.servoPath)
    // 2. Establish IPC connection (WebSocket, stdio, etc.)
    // 3. Set up message handlers
    // 4. Configure Servo with userAgent and debug settings from config
    
    if (this.isServoAvailable()) {
      this.setupMessageHandlers();
      this.connected = true;
      this.sendMessage({ type: 'ready' });
    } else {
      if (this.config.debug) {
        console.warn('Servo backend not available. Falling back to iframe mode.');
      }
    }
  }

  /**
   * Check if Servo is available and can be used as backend
   */
  private isServoAvailable(): boolean {
    // Check if running in Electron/Tauri environment with Servo
    // Or if there's a WebSocket connection to Servo backend
    return typeof window !== 'undefined' && 
           window.__SERVO_BACKEND__ !== undefined;
  }

  /**
   * Set up handlers for messages from Servo
   */
  private setupMessageHandlers(): void {
    if (typeof window === 'undefined') return;

    // Listen for messages from Servo backend
    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'servo-backend') {
        this.handleMessage(event.data.message);
      }
    });
  }

  /**
   * Handle incoming messages from Servo
   */
  private handleMessage(message: ServoMessage): void {
    // Validate message type before processing
    const validTypes = ['navigate', 'back', 'forward', 'refresh', 'close', 'ready', 'titleChange', 'urlChange', 'loadStart', 'loadComplete'];
    if (!validTypes.includes(message.type)) {
      console.warn('Invalid message type received:', message.type);
      return;
    }

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  /**
   * Send a message to Servo backend
   */
  private sendMessage(message: ServoMessage): void {
    if (!this.connected) {
      console.warn('Servo backend not connected');
      return;
    }

    if (typeof window !== 'undefined' && window.__SERVO_BACKEND__) {
      window.__SERVO_BACKEND__.postMessage(message);
    }
  }

  /**
   * Navigate to a URL in a specific tab
   */
  navigate(tabId: string, url: string): Promise<NavigationResponse> {
    return new Promise((resolve) => {
      this.sendMessage({
        type: 'navigate',
        tabId,
        url,
      });

      // In a real implementation, wait for response from Servo
      setTimeout(() => {
        resolve({ success: true, url });
      }, 0);
    });
  }

  /**
   * Go back in history for a tab
   */
  goBack(tabId: string): void {
    this.sendMessage({
      type: 'back',
      tabId,
    });
  }

  /**
   * Go forward in history for a tab
   */
  goForward(tabId: string): void {
    this.sendMessage({
      type: 'forward',
      tabId,
    });
  }

  /**
   * Refresh the current page in a tab
   */
  refresh(tabId: string): void {
    this.sendMessage({
      type: 'refresh',
      tabId,
    });
  }

  /**
   * Close a tab
   */
  closeTab(tabId: string): void {
    this.sendMessage({
      type: 'close',
      tabId,
    });
  }

  /**
   * Register a handler for a specific message type
   */
  on(type: string, handler: (message: ServoMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove a message handler
   */
  off(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Check if connected to Servo backend
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.messageHandlers.clear();
    this.connected = false;
  }
}

// Singleton instance
let backendInstance: ServoBackend | null = null;

/**
 * Get or create the Servo backend instance
 */
export function getServoBackend(config?: ServoBackendConfig): ServoBackend {
  if (!backendInstance) {
    backendInstance = new ServoBackend(config);
  }
  return backendInstance;
}
