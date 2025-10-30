/**
 * Real Servo Backend Bridge - WebSocket Implementation
 * 
 * This implements a real bridge to communicate with Servo via WebSocket.
 * Works with a Servo backend server that exposes WebSocket endpoint.
 * 
 * Architecture:
 * React UI → WebSocket → Servo Backend Server → Servo Process
 */

import type { ServoMessage } from '../backend/ServoBackend';

export interface ServoBackendServerConfig {
  websocketUrl: string;
  reconnectInterval?: number;
  debug?: boolean;
}

/**
 * WebSocket Bridge to Real Servo Backend
 * 
 * Connects to a WebSocket server running Servo and handles communication
 */
export class ServoWebSocketBridge {
  private ws: WebSocket | null = null;
  private config: ServoBackendServerConfig;
  private reconnectTimer: number | null = null;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(config: ServoBackendServerConfig) {
    this.config = {
      reconnectInterval: 3000,
      debug: false,
      ...config
    };
    this.connect();
  }

  /**
   * Connect to Servo backend WebSocket server
   */
  private connect(): void {
    if (this.connectionAttempts >= this.maxReconnectAttempts) {
      console.error('[ServoWebSocket] Max reconnection attempts reached');
      return;
    }

    this.connectionAttempts++;
    
    try {
      if (this.config.debug) {
        console.log(`[ServoWebSocket] Connecting to ${this.config.websocketUrl} (attempt ${this.connectionAttempts})`);
      }

      this.ws = new WebSocket(this.config.websocketUrl);

      this.ws.onopen = () => {
        console.log('[ServoWebSocket] Connected to Servo backend');
        this.connectionAttempts = 0; // Reset on successful connection
        this.setupBackendInterface();
        
        // Send ready message to server
        this.send({ type: 'ready' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServoMessage = JSON.parse(event.data);
          this.handleMessageFromServo(message);
        } catch (e) {
          console.error('[ServoWebSocket] Failed to parse message from Servo:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[ServoWebSocket] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('[ServoWebSocket] Disconnected from Servo backend');
        this.ws = null;
        
        // Attempt to reconnect
        if (this.connectionAttempts < this.maxReconnectAttempts) {
          if (this.config.debug) {
            console.log(`[ServoWebSocket] Reconnecting in ${this.config.reconnectInterval}ms...`);
          }
          this.reconnectTimer = window.setTimeout(() => {
            this.connect();
          }, this.config.reconnectInterval);
        }
      };
    } catch (e) {
      console.error('[ServoWebSocket] Failed to create WebSocket connection:', e);
    }
  }

  /**
   * Set up the backend interface on window object
   */
  private setupBackendInterface(): void {
    window.__SERVO_BACKEND__ = {
      postMessage: (message: ServoMessage) => {
        this.send(message);
      }
    };
  }

  /**
   * Send message to Servo backend server
   */
  private send(message: ServoMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        if (this.config.debug) {
          console.log('[ServoWebSocket] Sent to Servo:', message.type);
        }
      } catch (e) {
        console.error('[ServoWebSocket] Failed to send message:', e);
      }
    } else {
      console.warn('[ServoWebSocket] Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Handle messages received from Servo backend
   */
  private handleMessageFromServo(message: ServoMessage): void {
    if (this.config.debug) {
      console.log('[ServoWebSocket] Received from Servo:', message.type);
    }

    // Forward message to the React frontend via window.postMessage
    window.postMessage({
      source: 'servo-backend',
      message: message
    }, '*');
  }

  /**
   * Disconnect from Servo backend
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionAttempts = 0;
  }

  /**
   * Check if connected to Servo backend
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
