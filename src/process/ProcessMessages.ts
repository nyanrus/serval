/**
 * Inter-Process Communication Messages
 * 
 * Defines the message protocol between Main Process and Content Processes
 */

/**
 * Messages sent from Main Process to Content Process
 */
export type MainProcessMessage = 
  | { type: 'initialize'; tabId: string }
  | { type: 'navigate'; url: string; tabId: string }
  | { type: 'back'; tabId: string }
  | { type: 'forward'; tabId: string }
  | { type: 'refresh'; tabId: string }
  | { type: 'shutdown'; tabId: string };

/**
 * Messages sent from Content Process to Main Process
 */
export type ContentProcessMessage = 
  | { type: 'ready'; tabId: string; processId?: string }
  | { type: 'titleChange'; tabId: string; title: string }
  | { type: 'urlChange'; tabId: string; url: string }
  | { type: 'loadStart'; tabId: string; url: string }
  | { type: 'loadComplete'; tabId: string; url: string }
  | { type: 'processCrash'; tabId: string; processId: string };
