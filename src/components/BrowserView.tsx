import React, { useEffect, useRef } from 'react';
import './BrowserView.css';

interface BrowserViewProps {
  url: string;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
}

const BrowserView: React.FC<BrowserViewProps> = ({ url, onTitleChange, onUrlChange }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && url) {
      try {
        // Update iframe src
        if (iframeRef.current.src !== url) {
          iframeRef.current.src = url;
        }
      } catch (e) {
        console.error('Error loading URL:', e);
      }
    }
  }, [url]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        // Try to get the title from the iframe
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          const title = iframeDocument.title || url;
          onTitleChange(title);
          
          // Update URL if it changed (e.g., redirects)
          const currentUrl = iframeDocument.location.href;
          if (currentUrl && currentUrl !== 'about:blank') {
            onUrlChange(currentUrl);
          }
        }
      } catch {
        // Cross-origin restriction
        onTitleChange(new URL(url).hostname);
      }
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
    };
  }, [url, onTitleChange, onUrlChange]);

  return (
    <div className="browser-view">
      {url ? (
        <iframe
          ref={iframeRef}
          className="browser-iframe"
          title="Browser Content"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <div className="empty-state">
          <h2>Welcome to Serval Browser</h2>
          <p>Enter a URL or search query to get started</p>
        </div>
      )}
    </div>
  );
};

export default BrowserView;
