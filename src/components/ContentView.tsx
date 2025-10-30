/**
 * ContentView Component
 * 
 * Displays web content rendered by the content process.
 * This component is part of the main process (browser chrome)
 * and shows the output from the separate content process.
 */

import React from 'react';
import './ContentView.css';

interface ContentViewProps {
  tabId: string;
  url: string;
}

/**
 * ContentView displays content from the isolated content process
 */
const ContentView: React.FC<ContentViewProps> = ({ tabId, url }) => {
  return (
    <div className="content-view">
      {!url && (
        <div className="empty-state">
          <h2>Welcome to Serval Browser</h2>
          <p>Two-Process Architecture</p>
          <div className="architecture-info">
            <div className="process-box main-process">
              <h3>Main Process</h3>
              <p>Browser Chrome UI</p>
              <ul>
                <li>Tab management</li>
                <li>Address bar</li>
                <li>Navigation controls</li>
              </ul>
            </div>
            <div className="process-arrow">↔</div>
            <div className="process-box content-process">
              <h3>Content Process</h3>
              <p>Web Rendering (Servo)</p>
              <ul>
                <li>HTML/CSS parsing</li>
                <li>JavaScript execution</li>
                <li>Page rendering</li>
              </ul>
            </div>
          </div>
          <p className="instruction">Enter a URL or search query to get started</p>
        </div>
      )}
      {url && (
        <div className="content-frame">
          <div className="content-info">
            <p>Tab: {tabId}</p>
            <p>Loading: {url}</p>
            <p className="process-label">Content rendered in isolated process</p>
          </div>
          {/* In a real implementation, this would show the actual rendered content from Servo */}
          <div id={`content-${tabId}`} className="rendered-content">
            <div className="mock-page">
              <h1>Simulated Web Page</h1>
              <p>URL: {url}</p>
              <p>This content is rendered in a separate content process (Worker)</p>
              <div className="mock-content">
                <p>In a production implementation, this would display actual web content rendered by Servo.</p>
                <p>The two-process architecture provides:</p>
                <ul>
                  <li><strong>Security:</strong> Isolates web content from browser UI</li>
                  <li><strong>Stability:</strong> Content crashes don't affect browser chrome</li>
                  <li><strong>Performance:</strong> Parallel processing of UI and content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentView;
