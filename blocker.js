// Create blocker overlay
const blocker = document.createElement('div');
blocker.style.position = 'fixed';
blocker.style.top = 0;
blocker.style.left = 0;
blocker.style.width = '100vw';
blocker.style.height = '100vh';
blocker.style.backgroundColor = 'rgba(255, 65, 65, 1)';
blocker.style.color = 'white';
blocker.style.zIndex = 999999;
blocker.style.display = 'flex';
blocker.style.flexDirection = 'column';
blocker.style.justifyContent = 'center';
blocker.style.alignItems = 'center';
blocker.style.fontFamily = '"Press Start 2P", sans-serif';
blocker.style.textAlign = 'center';

const fontLink = document.createElement('link');
fontLink.href = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Create inner content
blocker.innerHTML = `
  <h1 style="margin-bottom: 10px;">
    Blocked Site
  </h1>
  <p id="countdown-text">You have 5 seconds to go back or this tab will close.</p>
  <button id="goBackBtn" style="
    padding: 8px 16px;
    background: #fff;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
  ">Go Back</button>
`;

document.body.innerHTML = '';
document.body.appendChild(blocker);

let secondsLeft = 5;
const countdownText = document.getElementById('countdown-text');
const timer = setInterval(() => {
  secondsLeft--;
  if (secondsLeft > 0) {
    countdownText.textContent = `You have ${secondsLeft} seconds to go back or this tab will close.`;
  } else {
    clearInterval(timer);
    chrome.runtime.sendMessage({ action: 'closeTab' });
  }
}, 1000);

document.getElementById('goBackBtn').addEventListener('click', () => {
  clearInterval(timer);
  history.back();
});
