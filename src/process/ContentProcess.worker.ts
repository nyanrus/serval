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
 * 
 * NOTE: For real Servo integration, this worker communicates with a Servo
 * backend server via the main process. The actual rendering happens in
 * the Servo process managed by the backend server.
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

    console.log('[ContentProcess] Worker process initialized');
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
   * 
   * In real implementation, this would send navigation command to Servo via
   * the backend bridge, and Servo would handle the actual page loading.
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

    // In real implementation, Servo backend would load the URL and send back events
    // For now, simulate the events
    this.simulatePageLoad(url);
  }

  /**
   * Simulate page load (replace with real Servo events)
   */
  private simulatePageLoad(url: string): void {
    // Simulate async page load
    setTimeout(() => {
      const title = this.extractTitleFromUrl(url);
      
      this.sendToMainProcess({
        type: 'titleChange',
        tabId: this.tabId,
        title: title,
      });

      this.sendToMainProcess({
        type: 'urlChange',
        tabId: this.tabId,
        url: url,
      });

      setTimeout(() => {
        this.sendToMainProcess({
          type: 'loadComplete',
          tabId: this.tabId,
          url: url,
        });
      }, 100);
    }, 300);
  }

  /**
   * Go back in history
   */
  private goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const url = this.history[this.historyIndex];
      this.currentUrl = url;
      
      this.sendToMainProcess({
        type: 'urlChange',
        tabId: this.tabId,
        url: url,
      });

      this.simulatePageLoad(url);
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
      
      this.sendToMainProcess({
        type: 'urlChange',
        tabId: this.tabId,
        url: url,
      });

      this.simulatePageLoad(url);
    }
  }

  /**
   * Refresh current page
   */
  private refresh(): void {
    if (this.currentUrl) {
      console.log(`[ContentProcess] Refreshing ${this.currentUrl}`);
      this.simulatePageLoad(this.currentUrl);
    }
  }

  /**
   * Extract title from URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname || 'New Tab';
    } catch {
      return 'New Tab';
    }
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
    // Worker will be terminated by main process
  }
}

// Start the content process
new ContentProcess();
