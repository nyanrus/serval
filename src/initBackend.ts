/**
 * Initialize Servo Backend Bridge
 * 
 * This file initializes the appropriate backend bridge based on the environment.
 * It should be imported early in the application lifecycle.
 */

import { getConfig } from './config';

// Type definitions for bridge implementations
interface ServoMessage {
  type: string;
  tabId?: string;
  url?: string;
  title?: string;
  data?: unknown;
}

/**
 * Mock Bridge for Development
 * Simulates Servo responses without requiring actual Servo installation
 */
class MockServoBridge {
  private tabs: Map<string, { url: string; title: string }> = new Map();

  constructor() {
    this.setupMockBackend();
    console.log('[Serval] Mock Servo backend initialized (development mode)');
  }

  private setupMockBackend(): void {
    window.__SERVO_BACKEND__ = {
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
          // Simulate navigation delay
          setTimeout(() => {
            this.sendEvent({ type: 'loadStart', tabId, url });
            
            setTimeout(() => {
              const title = this.extractTitleFromUrl(url);
              this.tabs.set(tabId, { url, title });
              
              this.sendEvent({ type: 'titleChange', tabId, title });
              this.sendEvent({ type: 'loadComplete', tabId, url });
            }, 300);
          }, 50);
        }
        break;

      case 'back':
      case 'forward':
      case 'refresh':
        console.log(`[Mock Servo] ${type} for tab ${tabId}`);
        if (tabId) {
          const tab = this.tabs.get(tabId);
          if (tab) {
            setTimeout(() => {
              this.sendEvent({ type: 'loadStart', tabId, url: tab.url });
              setTimeout(() => {
                this.sendEvent({ type: 'loadComplete', tabId, url: tab.url });
              }, 200);
            }, 50);
          }
        }
        break;

      case 'close':
        if (tabId) {
          this.tabs.delete(tabId);
          console.log(`[Mock Servo] Closed tab ${tabId}`);
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

/**
 * Initialize the appropriate backend bridge
 */
export function initializeBackend(): void {
  const config = getConfig();
  
  // Check if backend is already initialized
  if (typeof window !== 'undefined' && window.__SERVO_BACKEND__) {
    console.log('[Serval] Backend already initialized');
    return;
  }

  // In development mode with auto or mock, use MockServoBridge
  const isDevelopment = import.meta.env?.DEV;
  
  if (isDevelopment && (config.mode === 'auto' || config.servo?.connectionType === 'mock')) {
    new MockServoBridge();
  } else if (config.mode === 'iframe') {
    // Don't initialize any bridge - will use iframe fallback
    console.log('[Serval] Using iframe fallback mode');
  } else {
    // Production mode - backend bridge should be provided by the platform
    console.log('[Serval] Waiting for platform-provided Servo backend');
  }
}
