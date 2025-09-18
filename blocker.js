// Prevent multiple executions
if (window.ctrlBlckBlocked) {
  return;
}
window.ctrlBlckBlocked = true;

// Create blocker overlay
const blockingOverlay = document.createElement('div');
blockingOverlay.style.position = 'fixed';
blockingOverlay.style.top = '0';
blockingOverlay.style.left = '0';
blockingOverlay.style.width = '100vw';
blockingOverlay.style.height = '100vh';
blockingOverlay.style.backgroundColor = 'rgba(255, 65, 65, 1)';
blockingOverlay.style.color = 'white';
blockingOverlay.style.zIndex = '999999';
blockingOverlay.style.display = 'flex';
blockingOverlay.style.flexDirection = 'column';
blockingOverlay.style.justifyContent = 'center';
blockingOverlay.style.alignItems = 'center';
blockingOverlay.style.fontFamily = '"Press Start 2P", monospace, sans-serif';
blockingOverlay.style.textAlign = 'center';

// Add font (if available)
try {
  const fontLink = document.createElement('link');
  fontLink.href = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
  fontLink.rel = 'stylesheet';
  if (document.head) {
    document.head.appendChild(fontLink);
  }
} catch (e) {
  console.warn('Could not load custom font:', e);
}

// Create inner content
blockingOverlay.innerHTML = `
  <h1 style="margin-bottom: 30px; font-size: 24px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
    🚫 SITE BLOCKED
  </h1>
  <p id="countdown-text" style="font-size: 12px; margin-bottom: 20px; line-height: 1.5;">You have 5 seconds to go back or this tab will close.</p>
  <button id="goBackBtn" style="
    padding: 12px 24px;
    background: #fff;
    color: #333;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'Press Start 2P', monospace, sans-serif;
    margin: 10px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  ">GO BACK</button>
`;

// Clear page and show blocker
document.documentElement.innerHTML = `
  <head><title>Site Blocked - CTRL+BLCK</title></head>
  <body></body>
`;
document.body.appendChild(blockingOverlay);

// Countdown functionality
let secondsLeft = 5;
const countdownText = document.getElementById('countdown-text');

const timer = setInterval(() => {
  secondsLeft--;
  if (secondsLeft > 0) {
    countdownText.textContent = `You have ${secondsLeft} seconds to go back or this tab will close.`;
  } else {
    clearInterval(timer);
    // Send message to background script to close tab
    chrome.runtime.sendMessage({ action: 'closeTab' }).catch(e => {
      console.warn('Could not send close message:', e);
      // Fallback: try to close the window
      window.close();
    });
  }
}, 1000);

// Go back button functionality
document.getElementById('goBackBtn').addEventListener('click', () => {
  clearInterval(timer);
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // If no history, close the tab
    chrome.runtime.sendMessage({ action: 'closeTab' }).catch(e => {
      window.close();
    });
  }
});

// Add hover effect to button
const goBackBtn = document.getElementById('goBackBtn');
goBackBtn.addEventListener('mouseenter', () => {
  goBackBtn.style.transform = 'translateY(-2px)';
  goBackBtn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
});

goBackBtn.addEventListener('mouseleave', () => {
  goBackBtn.style.transform = 'translateY(0)';
  goBackBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
});

// Prevent navigation away from blocked page
window.addEventListener('beforeunload', (e) => {
  clearInterval(timer);
});

console.log('CTRL+BLCK: Site blocked successfully');
