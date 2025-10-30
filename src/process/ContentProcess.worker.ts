/**
 * Content Process - Web Content Rendering
 * 
 * This runs as a separate Worker process and handles:
 * - Web content rendering via Servo
 * - Page loading and navigation
 * - JavaScript execution (isolated from main process)
 * - Sending rendering updates to main process
 * 
 * Similar to Firefox's content process that renders web pages.
 * 
 * This file runs in a Web Worker context, separate from the main thread.
 */

import type { MainProcessMessage, ContentProcessMessage } from './ProcessMessages';

/**
 * ContentProcess handles web content rendering in isolation
 */
class ContentProcess {
  private tabId: string = '';
  private currentUrl: string = '';
  private history: string[] = [];
  private historyIndex: number = -1;
  private servoBackend: ServoBackendInterface | null = null;

  constructor() {
    console.log('[ContentProcess] Worker process starting');
    this.initialize();
  }

  /**
   * Initialize the content process
   */
  private initialize(): void {
    // Set up message listener from main process
    self.addEventListener('message', (event: MessageEvent<MainProcessMessage>) => {
      this.handleMainProcessMessage(event.data);
    });

    // Initialize Servo backend for this content process
    this.initializeServoBackend();

    console.log('[ContentProcess] Worker process initialized');
  }

  /**
   * Initialize Servo backend for content rendering
   */
  private initializeServoBackend(): void {
    // In a real implementation, this would initialize Servo rendering engine
    // For now, we simulate Servo behavior
    this.servoBackend = new MockServoBackend();
    
    // Set up event handlers from Servo
    this.servoBackend.on('titleChange', (title: string) => {
      this.handleTitleChange(title);
    });

    this.servoBackend.on('urlChange', (url: string) => {
      this.handleUrlChange(url);
    });

    this.servoBackend.on('loadComplete', (url: string) => {
      this.handleLoadComplete(url);
    });
  }

  /**
   * Handle messages from main process
   */
  private handleMainProcessMessage(message: MainProcessMessage): void {
    console.log('[ContentProcess] Received from main process:', message.type);

    switch (message.type) {
      case 'initialize':
        this.tabId = message.tabId;
        this.sendToMainProcess({
          type: 'ready',
          tabId: this.tabId,
        });
        break;

      case 'navigate':
        this.navigate(message.url);
        break;

      case 'back':
        this.goBack();
        break;

      case 'forward':
        this.goForward();
        break;

      case 'refresh':
        this.refresh();
        break;

      case 'shutdown':
        this.shutdown();
        break;
    }
  }

  /**
   * Navigate to a URL
   */
  private navigate(url: string): void {
    if (!url) return;

    console.log(`[ContentProcess] Navigating to ${url}`);
    
    // Send load start event
    this.sendToMainProcess({
      type: 'loadStart',
      tabId: this.tabId,
      url: url,
    });

    // Update history
    if (this.historyIndex < this.history.length - 1) {
      // Remove forward history if navigating to new page
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.currentUrl = url;

    // Delegate to Servo backend for actual rendering
    if (this.servoBackend) {
      this.servoBackend.loadUrl(url);
    }
  }

  /**
   * Go back in history
   */
  private goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      this.currentUrl = url;
      
      if (this.servoBackend) {
        this.servoBackend.loadUrl(url);
      }

      this.sendToMainProcess({
        type: 'urlChange',
        tabId: this.tabId,
        url: url,
      });
    }
  }

  /**
   * Go forward in history
   */
  private goForward(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const url = this.history[this.historyIndex];
      this.currentUrl = url;
      
      if (this.servoBackend) {
        this.servoBackend.loadUrl(url);
      }

      this.sendToMainProcess({
        type: 'urlChange',
        tabId: this.tabId,
        url: url,
      });
    }
  }

  /**
   * Refresh current page
   */
  private refresh(): void {
    if (this.currentUrl && this.servoBackend) {
      console.log(`[ContentProcess] Refreshing ${this.currentUrl}`);
      this.servoBackend.loadUrl(this.currentUrl);
    }
  }

  /**
   * Handle title change from Servo
   */
  private handleTitleChange(title: string): void {
    this.sendToMainProcess({
      type: 'titleChange',
      tabId: this.tabId,
      title: title,
    });
  }

  /**
   * Handle URL change from Servo (e.g., redirects)
   */
  private handleUrlChange(url: string): void {
    this.currentUrl = url;
    this.sendToMainProcess({
      type: 'urlChange',
      tabId: this.tabId,
      url: url,
    });
  }

  /**
   * Handle load complete from Servo
   */
  private handleLoadComplete(url: string): void {
    this.sendToMainProcess({
      type: 'loadComplete',
      tabId: this.tabId,
      url: url,
    });
  }

  /**
   * Send message to main process
   */
  private sendToMainProcess(message: ContentProcessMessage): void {
    self.postMessage(message);
  }

  /**
   * Shutdown the content process
   */
  private shutdown(): void {
    console.log('[ContentProcess] Shutting down');
    if (this.servoBackend) {
      this.servoBackend.destroy();
    }
    // Worker will be terminated by main process
  }
}

/**
 * Mock Servo Backend for Content Process
 * In a real implementation, this would communicate with actual Servo
 */
interface ServoBackendInterface {
  loadUrl(url: string): void;
  on(event: string, handler: (data: string) => void): void;
  destroy(): void;
}

class MockServoBackend implements ServoBackendInterface {
  private eventHandlers: Map<string, (data: string) => void> = new Map();

  loadUrl(url: string): void {
    console.log('[MockServo] Loading URL:', url);
    
    // Simulate page load delay
    setTimeout(() => {
      // Extract title from URL
      const title = this.extractTitleFromUrl(url);
      
      // Emit events
      const titleHandler = this.eventHandlers.get('titleChange');
      if (titleHandler) {
        titleHandler(title);
      }

      const urlHandler = this.eventHandlers.get('urlChange');
      if (urlHandler) {
        urlHandler(url);
      }

      setTimeout(() => {
        const loadHandler = this.eventHandlers.get('loadComplete');
        if (loadHandler) {
          loadHandler(url);
        }
      }, 100);
    }, 300);
  }

  on(event: string, handler: (data: string) => void): void {
    this.eventHandlers.set(event, handler);
  }

  destroy(): void {
    this.eventHandlers.clear();
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || 'New Tab';
    } catch {
      return 'New Tab';
    }
  }
}

// Start the content process
new ContentProcess();
