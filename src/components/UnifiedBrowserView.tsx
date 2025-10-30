import React from 'react';
import BrowserView from './BrowserView';
import ServoView from './ServoView';
import { getServoBackend } from '../backend/ServoBackend';

interface UnifiedBrowserViewProps {
  tabId: string;
  url: string;
  onTitleChange: (title: string) => void;
  onUrlChange: (url: string) => void;
  forceIframe?: boolean; // Force iframe mode even if Servo is available
}

/**
 * UnifiedBrowserView component that automatically selects between
 * Servo backend rendering and iframe fallback mode.
 */
const UnifiedBrowserView: React.FC<UnifiedBrowserViewProps> = ({
  tabId,
  url,
  onTitleChange,
  onUrlChange,
  forceIframe = false,
}) => {
  const servoBackend = getServoBackend();
  const useServo = !forceIframe && servoBackend.isConnected();

  if (useServo) {
    return (
      <ServoView
        tabId={tabId}
        url={url}
        onTitleChange={onTitleChange}
        onUrlChange={onUrlChange}
      />
    );
  }

  return (
    <BrowserView
      url={url}
      onTitleChange={onTitleChange}
      onUrlChange={onUrlChange}
    />
  );
};

export default UnifiedBrowserView;
