import React, { useState } from 'react';
import TabBar from './components/TabBar';
import type { Tab } from './components/TabBar';
import AddressBar from './components/AddressBar';
import UnifiedBrowserView from './components/UnifiedBrowserView';
import { getServoBackend } from './backend/ServoBackend';
import './Browser.css';

const Browser: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: '' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const servoBackend = getServoBackend();

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleNavigate = (url: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, url } : tab
      )
    );
  };

  const handleTitleChange = (title: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, title } : tab
      )
    );
  };

  const handleUrlChange = (url: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, url } : tab
      )
    );
  };

  const handleNewTab = () => {
    const newId = crypto.randomUUID();
    const newTab: Tab = { id: newId, title: 'New Tab', url: '' };
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newId);
  };

  const handleTabClose = (tabId: string) => {
    if (tabs.length === 1) {
      // If it's the last tab, create a new empty tab
      handleNewTab();
    }
    
    setTabs((prevTabs) => {
      const newTabs = prevTabs.filter((tab) => tab.id !== tabId);
      
      // If we closed the active tab, activate another one
      if (tabId === activeTabId && newTabs.length > 0) {
        const closedIndex = prevTabs.findIndex((tab) => tab.id === tabId);
        const newActiveIndex = Math.max(0, closedIndex - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      }
      
      return newTabs;
    });
  };

  const handleBack = () => {
    if (servoBackend.isConnected()) {
      servoBackend.goBack(activeTabId);
    } else {
      // In a real implementation, this would use browser history
      console.log('Back navigation not implemented');
    }
  };

  const handleForward = () => {
    if (servoBackend.isConnected()) {
      servoBackend.goForward(activeTabId);
    } else {
      // In a real implementation, this would use browser history
      console.log('Forward navigation not implemented');
    }
  };

  const handleRefresh = () => {
    if (servoBackend.isConnected()) {
      servoBackend.refresh(activeTabId);
    } else {
      // Force iframe reload by adding a timestamp parameter
      if (activeTab?.url) {
        const url = new URL(activeTab.url);
        url.searchParams.set('_refresh', Date.now().toString());
        handleUrlChange(url.toString());
      }
    }
  };

  return (
    <div className="browser">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={setActiveTabId}
        onTabClose={handleTabClose}
        onNewTab={handleNewTab}
      />
      <AddressBar
        url={activeTab?.url || ''}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
        canGoBack={false}
        canGoForward={false}
      />
      <UnifiedBrowserView
        tabId={activeTabId}
        url={activeTab?.url || ''}
        onTitleChange={handleTitleChange}
        onUrlChange={handleUrlChange}
      />
    </div>
  );
};

export default Browser;
