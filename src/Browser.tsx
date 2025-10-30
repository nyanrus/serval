import React, { useState, useEffect } from 'react';
import TabBar from './components/TabBar';
import type { Tab } from './components/TabBar';
import AddressBar from './components/AddressBar';
import ContentView from './components/ContentView';
import { getMainProcess } from './process/MainProcess';
import type { ContentProcessMessage } from './process/ProcessMessages';
import './Browser.css';

const Browser: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'New Tab', url: '' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const mainProcess = getMainProcess();

  // Initialize first tab with content process
  useEffect(() => {
    mainProcess.createTab('1', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up listeners for content process events
  useEffect(() => {
    const handleTitleChange = (message: ContentProcessMessage) => {
      if (message.type === 'titleChange') {
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === message.tabId ? { ...tab, title: message.title } : tab
          )
        );
      }
    };

    const handleUrlChange = (message: ContentProcessMessage) => {
      if (message.type === 'urlChange') {
        setTabs((prevTabs) =>
          prevTabs.map((tab) =>
            tab.id === message.tabId ? { ...tab, url: message.url } : tab
          )
        );
      }
    };

    const handleProcessCrash = (message: ContentProcessMessage) => {
      if (message.type === 'processCrash') {
        console.error(`Content process crashed for tab ${message.tabId}`);
        // Could show error UI here
      }
    };

    mainProcess.onContentProcessMessage('titleChange', handleTitleChange);
    mainProcess.onContentProcessMessage('urlChange', handleUrlChange);
    mainProcess.onContentProcessMessage('processCrash', handleProcessCrash);

    return () => {
      mainProcess.offContentProcessMessage('titleChange');
      mainProcess.offContentProcessMessage('urlChange');
      mainProcess.offContentProcessMessage('processCrash');
    };
  }, [mainProcess]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const handleNavigate = (url: string) => {
    // Update local state
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, url } : tab
      )
    );
    
    // Send navigation command to content process via main process
    mainProcess.navigateTab(activeTabId, url);
  };

  const handleNewTab = () => {
    const newId = crypto.randomUUID();
    const newTab: Tab = { id: newId, title: 'New Tab', url: '' };
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTabId(newId);
    
    // Create content process for new tab
    mainProcess.createTab(newId, '');
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
    
    // Close content process for this tab
    mainProcess.closeTab(tabId);
  };

  const handleBack = () => {
    mainProcess.sendNavigationCommand(activeTabId, 'back');
  };

  const handleForward = () => {
    mainProcess.sendNavigationCommand(activeTabId, 'forward');
  };

  const handleRefresh = () => {
    mainProcess.sendNavigationCommand(activeTabId, 'refresh');
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
      <ContentView
        tabId={activeTabId}
        url={activeTab?.url || ''}
      />
    </div>
  );
};

export default Browser;
