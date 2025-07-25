chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url === 'about:blank') {
    setTimeout(() => {
      chrome.tabs.get(tabId, (currentTab) => {
        if (currentTab && currentTab.url === 'about:blank') {
          chrome.tabs.remove(tabId);
        }
      });
    }, 1500); // 1.5 seconds
  }
});
