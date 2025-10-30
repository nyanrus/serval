/**
 * Initialize Servo Backend Bridge
 * 
 * This file initializes the Servo backend bridge.
 * It should be imported early in the application lifecycle.
 * 
 * Always connects to real Servo backend server via WebSocket.
 */

import { getConfig } from './config';
import { ServoWebSocketBridge } from './process/ServoWebSocketBridge';

/**
 * Initialize the Servo backend bridge
 * Always uses WebSocket connection to real Servo backend
 */
export function initializeBackend(): void {
  const config = getConfig();
  
  // Check if backend is already initialized
  if (typeof window !== 'undefined' && window.__SERVO_BACKEND__) {
    console.log('[Serval] Backend already initialized');
    return;
  }

  // WebSocket connection to real Servo backend server
  if (config.servo.connectionType === 'websocket' && config.servo.websocketUrl) {
    console.log(`[Serval] Connecting to Servo backend at ${config.servo.websocketUrl}`);
    new ServoWebSocketBridge({
      websocketUrl: config.servo.websocketUrl,
      debug: config.servo.debug || false,
    });
    return;
  }

  // Platform-provided backend (Electron/Tauri)
  if (config.servo.connectionType === 'electron') {
    console.log('[Serval] Waiting for Electron-provided Servo backend');
    // Electron preload script should set up window.__SERVO_BACKEND__
    return;
  }

  // No fallback - Servo backend is required
  console.error('[Serval] No Servo backend configured! Please ensure Servo backend server is running.');
  console.error('[Serval] Start backend: cd servo-backend && cargo run --release');
}
