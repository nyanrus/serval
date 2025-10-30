/**
 * Serval Configuration
 * 
 * This file configures how Serval connects to the Servo backend.
 */

export interface ServalConfig {
  // Backend mode: 'servo', 'iframe', or 'auto'
  // - 'servo': Always use Servo backend (will show error if not available)
  // - 'iframe': Always use iframe fallback
  // - 'auto': Use Servo if available, fallback to iframe otherwise
  mode: 'servo' | 'iframe' | 'auto';

  // Servo backend configuration
  servo?: {
    // Connection type
    connectionType: 'websocket' | 'electron' | 'mock';
    
    // WebSocket URL (for WebSocket connection type)
    websocketUrl?: string;
    
    // Enable debug logging
    debug?: boolean;
    
    // Custom user agent
    userAgent?: string;
  };

  // Development options
  development?: {
    // Enable hot reload
    hotReload?: boolean;
    
    // Show debug overlay
    debugOverlay?: boolean;
  };
}

// Default configuration
export const defaultConfig: ServalConfig = {
  mode: 'auto',
  servo: {
    connectionType: 'mock',
    websocketUrl: 'ws://localhost:8080',
    debug: true,
  },
  development: {
    hotReload: true,
    debugOverlay: false,
  },
};

// Get configuration from environment or use defaults
export function getConfig(): ServalConfig {
  const envMode = import.meta.env?.VITE_SERVO_MODE as ServalConfig['mode'] | undefined;
  const envWebSocketUrl = import.meta.env?.VITE_SERVO_WEBSOCKET_URL as string | undefined;
  const envDebug = import.meta.env?.VITE_SERVO_DEBUG === 'true';

  return {
    mode: envMode || defaultConfig.mode,
    servo: {
      connectionType: defaultConfig.servo?.connectionType || 'mock',
      websocketUrl: envWebSocketUrl || defaultConfig.servo?.websocketUrl,
      debug: envDebug || defaultConfig.servo?.debug,
      userAgent: defaultConfig.servo?.userAgent,
    },
    development: defaultConfig.development,
  };
}
