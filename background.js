// Helper: Get stored URLs
async function getBlockedURLs() {
  const result = await chrome.storage.local.get('urls');
  return Array.isArray(result.urls) ? result.urls : [];
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
      const blockedURLs = await getBlockedURLs();
      const currentHostname = new URL(tab.url).hostname.toLowerCase();

      const blockedHostnames = blockedURLs.map(url => new URL(url).hostname.toLowerCase());
      
      if (blockedHostnames.includes(currentHostname)) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['blocker.js']
        });
      }
    }
  } catch (err) {
    console.error('Error in tab update listener:', err);
  }
});

// Listen for messages (e.g. from blocker.js)
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'closeTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id);
  }
});



