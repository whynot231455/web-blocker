chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'closeTab' && sender.tab) {
    chrome.tabs.remove(sender.tab.id).catch(error => {
      // Ignore errors if tab is already closed
      console.warn('Could not close tab:', error);
    });
  }
});

console.log('🚀 CTRL+BLCK Background Service Worker Started');