/**
 * Main Process - Browser Chrome
 * 
 * This is the main browser process that handles:
 * - Browser UI (tabs, address bar, navigation controls)
 * - Tab management
 * - IPC with content processes
 * - Process lifecycle management
 * 
 * Similar to Firefox's main process that renders the browser chrome.
 */

import type { ContentProcessMessage, MainProcessMessage } from './ProcessMessages';

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  contentProcessId?: string;
}

export interface ProcessInfo {
  id: string;
  status: 'initializing' | 'ready' | 'crashed' | 'terminated';
  tabId?: string;
  worker?: Worker;
}

/**
 * MainProcess manages the browser chrome UI and coordinates content processes
 */
export class MainProcess {
  private tabs: Map<string, TabInfo> = new Map();
  private processes: Map<string, ProcessInfo> = new Map();
  private messageHandlers: Map<string, (message: ContentProcessMessage) => void> = new Map();
  private static instance: MainProcess | null = null;

  private constructor() {
    console.log('[MainProcess] Initializing browser chrome process');
  }

  /**
   * Get singleton instance of main process
   */
  static getInstance(): MainProcess {
    if (!MainProcess.instance) {
      MainProcess.instance = new MainProcess();
    }
    return MainProcess.instance;
  }

  /**
   * Create a new tab with associated content process
   */
  createTab(tabId: string, url: string = ''): TabInfo {
    const tab: TabInfo = {
      id: tabId,
      title: 'New Tab',
      url: url,
    };

    this.tabs.set(tabId, tab);
    
    // Create a content process for this tab
    const processId = this.createContentProcess(tabId);
    tab.contentProcessId = processId;

    console.log(`[MainProcess] Created tab ${tabId} with content process ${processId}`);
    return tab;
  }

  /**
   * Create a content process (worker) to handle web content rendering
   */
  private createContentProcess(tabId: string): string {
    const processId = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const processInfo: ProcessInfo = {
      id: processId,
      status: 'initializing',
      tabId: tabId,
    };

    // In a real implementation with Servo, this would spawn a separate process
    // For web environment, we use Web Workers as process isolation
    try {
      const worker = new Worker(
        new URL('./ContentProcess.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (event) => {
        this.handleContentProcessMessage(processId, event.data);
      };

      worker.onerror = (error) => {
        console.error(`[MainProcess] Content process ${processId} error:`, error);
        this.handleProcessCrash(processId);
      };

      processInfo.worker = worker;
      processInfo.status = 'ready';
      
      // Send initialization message to content process
      this.sendToContentProcess(processId, {
        type: 'initialize',
        tabId: tabId,
      });
    } catch (error) {
      console.error('[MainProcess] Failed to create content process:', error);
      processInfo.status = 'crashed';
    }

    this.processes.set(processId, processInfo);
    return processId;
  }

  /**
   * Navigate a tab to a URL
   */
  navigateTab(tabId: string, url: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      console.warn(`[MainProcess] Tab ${tabId} not found`);
      return;
    }

    tab.url = url;
    this.tabs.set(tabId, tab);

    // Send navigate command to content process
    if (tab.contentProcessId) {
      this.sendToContentProcess(tab.contentProcessId, {
        type: 'navigate',
        url: url,
        tabId: tabId,
      });
    }
  }

  /**
   * Close a tab and terminate its content process
   */
  closeTab(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) {
      return;
    }

    // Terminate the content process
    if (tab.contentProcessId) {
      this.terminateContentProcess(tab.contentProcessId);
    }

    this.tabs.delete(tabId);
    console.log(`[MainProcess] Closed tab ${tabId}`);
  }

  /**
   * Terminate a content process
   */
  private terminateContentProcess(processId: string): void {
    const process = this.processes.get(processId);
    if (!process) {
      return;
    }

    if (process.worker) {
      process.worker.terminate();
    }

    process.status = 'terminated';
    this.processes.delete(processId);
    console.log(`[MainProcess] Terminated content process ${processId}`);
  }

  /**
   * Handle crash of a content process
   */
  private handleProcessCrash(processId: string): void {
    const process = this.processes.get(processId);
    if (!process) {
      return;
    }

    console.error(`[MainProcess] Content process ${processId} crashed`);
    process.status = 'crashed';

    // Notify UI about crash
    const handler = this.messageHandlers.get('processCrash');
    if (handler && process.tabId) {
      handler({
        type: 'processCrash',
        tabId: process.tabId,
        processId: processId,
      });
    }

    // Could implement auto-restart logic here
  }

  /**
   * Send message to a content process
   */
  private sendToContentProcess(processId: string, message: MainProcessMessage): void {
    const process = this.processes.get(processId);
    if (!process || !process.worker) {
      console.warn(`[MainProcess] Cannot send to process ${processId}: not available`);
      return;
    }

    try {
      process.worker.postMessage(message);
    } catch (error) {
      console.error(`[MainProcess] Failed to send message to process ${processId}:`, error);
    }
  }

  /**
   * Handle messages from content processes
   */
  private handleContentProcessMessage(processId: string, message: ContentProcessMessage): void {
    const process = this.processes.get(processId);
    if (!process || !process.tabId) {
      return;
    }

    console.log(`[MainProcess] Received from content process ${processId}:`, message.type);

    // Update tab information based on content process events
    const tab = this.tabs.get(process.tabId);
    if (!tab) {
      return;
    }

    switch (message.type) {
      case 'ready':
        console.log(`[MainProcess] Content process ${processId} is ready`);
        break;

      case 'titleChange':
        if (message.title) {
          tab.title = message.title;
          this.tabs.set(process.tabId, tab);
        }
        break;

      case 'urlChange':
        if (message.url) {
          tab.url = message.url;
          this.tabs.set(process.tabId, tab);
        }
        break;

      case 'loadComplete':
        console.log(`[MainProcess] Tab ${process.tabId} finished loading`);
        break;
    }

    // Forward message to registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  /**
   * Register handler for content process messages
   */
  onContentProcessMessage(type: string, handler: (message: ContentProcessMessage) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Remove message handler
   */
  offContentProcessMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  /**
   * Get tab information
   */
  getTab(tabId: string): TabInfo | undefined {
    return this.tabs.get(tabId);
  }

  /**
   * Get all tabs
   */
  getAllTabs(): TabInfo[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Send navigation command to content process
   */
  sendNavigationCommand(tabId: string, command: 'back' | 'forward' | 'refresh'): void {
    const tab = this.tabs.get(tabId);
    if (!tab || !tab.contentProcessId) {
      return;
    }

    this.sendToContentProcess(tab.contentProcessId, {
      type: command,
      tabId: tabId,
    });
  }

  /**
   * Get process information
   */
  getProcessInfo(processId: string): ProcessInfo | undefined {
    return this.processes.get(processId);
  }

  /**
   * Clean up all processes
   */
  shutdown(): void {
    console.log('[MainProcess] Shutting down');
    
    // Terminate all content processes
    for (const processId of this.processes.keys()) {
      this.terminateContentProcess(processId);
    }

    this.tabs.clear();
    this.processes.clear();
    this.messageHandlers.clear();
  }
}

/**
 * Get the main process instance
 */
export function getMainProcess(): MainProcess {
  return MainProcess.getInstance();
}
