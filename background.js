let startTime = null;
let currentUrl = null;
let timeData = {};

// Load timeData from storage on start
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['timeData'], (result) => {
    timeData = result.timeData || {};
  });
});

// Track when tab is activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) handleTabChange(tab.url);
  });
});

// Track when tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleTabChange(changeInfo.url);
  }
});

// Track when tab is closed
chrome.tabs.onRemoved.addListener(() => {
  handleTabChange(null);
});

// Handle tab switch or close
function handleTabChange(newUrl) {
  if (currentUrl && startTime) {
    try {
      const domain = new URL(currentUrl).hostname;
      const timeSpent = Date.now() - startTime;
      timeData[domain] = (timeData[domain] || 0) + timeSpent;
      chrome.storage.local.set({ timeData });
    } catch (e) {
      console.error('Error tracking time for previous tab:', e);
    }
  }

  if (newUrl) {
    currentUrl = newUrl;
    startTime = Date.now();
  } else {
    currentUrl = null;
    startTime = null;
  }
}

// Respond to popup request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getCurrentTimes') {
    const currentTimes = { ...timeData };
    if (currentUrl && startTime) {
      try {
        const domain = new URL(currentUrl).hostname;
        const currentTime = Date.now() - startTime;
        currentTimes[domain] = (currentTimes[domain] || 0) + currentTime;
      } catch (e) {
        console.error('Error getting current tab domain:', e);
      }
    }
    sendResponse(currentTimes);
    return true; // keep message channel open
  }
});
