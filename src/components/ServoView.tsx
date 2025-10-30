import React, { useEffect, useRef } from 'react';
import { getServoBackend } from '../backend/ServoBackend';
import type { ServoMessage } from '../backend/ServoBackend';
import './ServoView.css';

interface ServoViewProps {
  tabId: string;
  url: string;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
}

/**
 * ServoView component integrates with the Servo browser engine.
 * It renders web content using Servo instead of an iframe.
 */
const ServoView: React.FC<ServoViewProps> = ({ tabId, url, onTitleChange, onUrlChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const servoBackend = getServoBackend();

  useEffect(() => {
    // Set up listeners for Servo backend events
    const handleTitleChange = (message: ServoMessage) => {
      if (message.tabId === tabId && message.title) {
        onTitleChange(message.title);
      }
    };

    const handleUrlChange = (message: ServoMessage) => {
      if (message.tabId === tabId && message.url) {
        onUrlChange(message.url);
      }
    };

    servoBackend.on('titleChange', handleTitleChange);
    servoBackend.on('urlChange', handleUrlChange);

    return () => {
      servoBackend.off('titleChange');
      servoBackend.off('urlChange');
    };
  }, [tabId, servoBackend, onTitleChange, onUrlChange]);

  useEffect(() => {
    // Navigate when URL changes
    if (url && servoBackend.isConnected()) {
      servoBackend.navigate(tabId, url).then((response) => {
        if (response.success) {
          console.log('Navigation successful:', response.url);
        } else {
          console.error('Navigation failed:', response.error);
        }
      });
    }
  }, [url, tabId, servoBackend]);

  return (
    <div className="servo-view" ref={containerRef}>
      {!servoBackend.isConnected() && (
        <div className="servo-unavailable">
          <h2>Servo Backend Not Available</h2>
          <p>
            The Servo browser engine is not currently running or accessible.
            Please ensure Servo is properly configured and running.
          </p>
          <p className="servo-info">
            To use Servo as the backend:
            <ul>
              <li>Build or install Servo from <a href="https://github.com/servo/servo" target="_blank" rel="noopener noreferrer">github.com/servo/servo</a></li>
              <li>Configure the Servo backend bridge</li>
              <li>Start the Serval application with Servo integration enabled</li>
            </ul>
          </p>
        </div>
      )}
      {servoBackend.isConnected() && !url && (
        <div className="empty-state">
          <h2>Welcome to Serval Browser</h2>
          <p>Powered by Servo</p>
          <p>Enter a URL or search query to get started</p>
        </div>
      )}
      {/* The actual rendering is handled by Servo through the backend */}
      <div id={`servo-content-${tabId}`} className="servo-content" />
    </div>
  );
};

export default ServoView;
