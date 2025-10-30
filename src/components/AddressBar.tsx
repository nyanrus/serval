import React, { useState } from 'react';
import type { KeyboardEvent } from 'react';
import './AddressBar.css';

interface AddressBarProps {
  url: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const AddressBar: React.FC<AddressBarProps> = ({
  url,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  canGoBack,
  canGoForward,
}) => {
  const [inputValue, setInputValue] = useState(url);

  React.useEffect(() => {
    setInputValue(url);
  }, [url]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let targetUrl = inputValue.trim();
      
      // Add protocol if missing
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        // Check if it looks like a domain
        if (targetUrl.includes('.') || targetUrl === 'localhost') {
          targetUrl = 'https://' + targetUrl;
        } else {
          // Treat as a search query
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
        }
      }
      
      onNavigate(targetUrl);
    }
  };

  return (
    <div className="address-bar">
      <div className="navigation-buttons">
        <button
          className="nav-button"
          onClick={onBack}
          disabled={!canGoBack}
          title="Back"
        >
          ←
        </button>
        <button
          className="nav-button"
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward"
        >
          →
        </button>
        <button className="nav-button" onClick={onRefresh} title="Refresh">
          ⟳
        </button>
      </div>
      <div className="url-container">
        <input
          type="text"
          className="url-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or enter address"
        />
      </div>
    </div>
  );
};

export default AddressBar;
