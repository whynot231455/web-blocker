(function () {
    // Prevent multiple executions
    if (window.ctrlBlckContentScript) {
        return;
    }
    window.ctrlBlckContentScript = true;

    // Get current hostname
    const currentHostname = window.location.hostname.toLowerCase();

    // Normalize hostname (remove www)
    function normalizeHostname(hostname) {
        if (hostname.startsWith('www.')) {
            return hostname.substring(4);
        }
        return hostname;
    }

    const normalizedCurrentHostname = normalizeHostname(currentHostname);

    // Initial Check
    chrome.storage.local.get({
        urls: [],
        hiddenUrls: [],
        allowedSites: {}, // Structure: { "hostname": { expiry: timestamp } }
        countdownDuration: 5,
        tempAccessDuration: 10 // Minutes
    }, function (data) {
        checkBlocking(data);
    });

    // Listen for storage changes to update timer or blocking status dynamically
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'local') {
            chrome.storage.local.get({
                urls: [],
                hiddenUrls: [],
                allowedSites: {},
                countdownDuration: 5,
                tempAccessDuration: 10
            }, function (data) {
                // Re-evaluate blocking on storage change
                checkBlocking(data);
            });
        }
    });

    function checkBlocking(data) {
        const blockedUrls = data.urls || [];
        const hiddenUrls = data.hiddenUrls || [];
        const allowedSites = data.allowedSites || {};
        const countdownDuration = data.countdownDuration || 5;
        const tempAccessDuration = data.tempAccessDuration || 10;

        const allBlockedUrls = [...blockedUrls, ...hiddenUrls];

        // Check if current site matches any blocked URL
        const isBlocked = allBlockedUrls.some(url => {
            try {
                let blockedHostname;
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    blockedHostname = new URL(url).hostname;
                } else {
                    blockedHostname = url.split('/')[0];
                }
                const normalizedBlockedHostname = normalizeHostname(blockedHostname.toLowerCase());
                return normalizedBlockedHostname === normalizedCurrentHostname;
            } catch (e) {
                return false;
            }
        });

        if (isBlocked) {
            // Check for valid temporary access
            const allowedSite = allowedSites[normalizedCurrentHostname];
            const now = Date.now();

            if (allowedSite && allowedSite.expiry > now) {
                // Site is blocked but has temporary access -> Show Timer
                removeBlockingOverlay(); // If exists
                showRetroTimer(allowedSite.expiry);
            } else {
                // Site is blocked and NO access -> Show Block Screen
                removeRetroTimer(); // If exists
                blockSite(countdownDuration, tempAccessDuration);
            }
        } else {
            // Not blocked, ensure no overlays
            removeBlockingOverlay();
            removeRetroTimer();
        }
    }

    // --- Retro Timer Implementation ---
    function showRetroTimer(expiryTimestamp) {
        if (document.getElementById('ctrl-blck-timer')) return; // Already showing

        const localFontUrl = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
        initStyles(localFontUrl);

        const timerContainer = document.createElement('div');
        timerContainer.id = 'ctrl-blck-timer';
        timerContainer.className = 'ctrl-blck-timer-container';

        // Timer structure logic
        timerContainer.innerHTML = `
            <div class="timer-header">
                <span>TIMER</span>
                <span id="timer-toggle" class="timer-toggle">▼</span>
            </div>
            <div id="timer-content" class="timer-content">
                <div class="time-group">
                    <span class="label">hour(s)</span>
                    <div class="digits" id="timer-hours">00</div>
                </div>
                <div class="separator">:</div>
                <div class="time-group">
                    <span class="label">minute(s)</span>
                    <div class="digits" id="timer-minutes">00</div>
                </div>
                <div class="separator">:</div>
                <div class="time-group">
                    <span class="label">second(s)</span>
                    <div class="digits" id="timer-seconds">00</div>
                </div>
            </div>
        `;

        document.body.appendChild(timerContainer);

        // Toggle functionality
        const toggleBtn = timerContainer.querySelector('#timer-toggle');
        const content = timerContainer.querySelector('#timer-content');
        let isMinimized = false;

        toggleBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;
            content.style.display = isMinimized ? 'none' : 'flex';
            toggleBtn.textContent = isMinimized ? '▲' : '▼';
        });

        // Update timer loop
        const timerInterval = setInterval(() => {
            const now = Date.now();
            const timeLeft = expiryTimestamp - now;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                removeRetroTimer();
                // Trigger re-check will happen naturally via storage listener if we clear it, 
                // but local check is faster to block immediately.
                // We should also clear the allowedSite from storage to be clean.
                chrome.storage.local.get({ allowedSites: {} }, function (result) {
                    const sites = result.allowedSites;
                    delete sites[normalizedCurrentHostname];
                    chrome.storage.local.set({ allowedSites: sites }, function () {
                        // This will trigger the storage listener -> checkBlocking -> blockSite
                    });
                });
                return;
            }

            updateTimerDisplay(timeLeft);
        }, 1000);

        updateTimerDisplay(expiryTimestamp - Date.now()); // Initial call
        timerContainer.dataset.intervalId = timerInterval;
    }

    function updateTimerDisplay(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hEl = document.getElementById('timer-hours');
        const mEl = document.getElementById('timer-minutes');
        const sEl = document.getElementById('timer-seconds');

        if (hEl && mEl && sEl) {
            hEl.textContent = String(hours).padStart(2, '0');
            mEl.textContent = String(minutes).padStart(2, '0');
            sEl.textContent = String(seconds).padStart(2, '0');
        }
    }

    function removeRetroTimer() {
        const timer = document.getElementById('ctrl-blck-timer');
        if (timer) {
            const intervalId = timer.dataset.intervalId;
            if (intervalId) clearInterval(intervalId);
            timer.remove();
        }
    }

    // --- Blocking Implementation ---
    function blockSite(countdownDuration, tempAccessDuration) {
        // Prevent infinite loops if block overlay is already there
        if (document.getElementById('ctrl-blck-overlay')) return;

        // Stop loading
        try { window.stop(); } catch (e) { }

        // Remove existing content
        document.documentElement.innerHTML = '';

        // Rebuild basic structure
        document.head.innerHTML = '';
        document.body = document.createElement('body');

        const localFontUrl = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
        initStyles(localFontUrl);

        const overlay = document.createElement('div');
        overlay.id = 'ctrl-blck-overlay';
        overlay.className = 'ctrl-blck-blocked';

        const durationText = countdownDuration === 1 ? 'second' : 'seconds';

        overlay.innerHTML = `
            <div style="margin-bottom: 30px; font-size: 20px;">🚫 SITE BLOCKED</div>
            
            <div id="countdown-text" style="margin-bottom: 20px; font-size: 14px; line-height: 1.8;">
                You have ${countdownDuration} ${durationText} to go back or this tab will close.
            </div>
            
            <div class="button-group">
                <button id="goBackBtn" class="ctrl-blck-button">GO BACK</button>
                <button id="unlockBtn" class="ctrl-blck-button" style="margin-top: 20px;">
                    UNLOCK FOR ${tempAccessDuration} MIN
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Countdown Logic
        let secondsLeft = countdownDuration;
        const countText = document.getElementById('countdown-text');

        const blockTimer = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                const t = secondsLeft === 1 ? 'second' : 'seconds';
                countText.textContent = `You have ${secondsLeft} ${t} to go back or this tab will close.`;
            } else {
                clearInterval(blockTimer);
                countText.textContent = 'Closing tab...';
                chrome.runtime.sendMessage({ action: 'closeTab' }).catch(() => window.close());
            }
        }, 1000);

        // Event Listeners
        document.getElementById('goBackBtn').addEventListener('click', () => {
            clearInterval(blockTimer);
            if (window.history.length > 1) window.history.back();
            else window.close();
        });

        document.getElementById('unlockBtn').addEventListener('click', () => {
            clearInterval(blockTimer);
            // Grant access
            grantTemporaryAccess(tempAccessDuration);
        });
    }

    function grantTemporaryAccess(minutes) {
        const expiryTime = Date.now() + (minutes * 60 * 1000);

        chrome.storage.local.get({ allowedSites: {} }, function (data) {
            const sites = data.allowedSites;
            sites[normalizedCurrentHostname] = { expiry: expiryTime };

            chrome.storage.local.set({ allowedSites: sites }, function () {
                // Reload to restore original content (and content script will run again to show timer)
                location.reload();
            });
        });
    }

    function removeBlockingOverlay() {
        const overlay = document.getElementById('ctrl-blck-overlay');
        if (overlay) overlay.remove();
    }

    function initStyles(fontUrl) {
        if (document.getElementById('ctrl-blck-styles')) return;

        const style = document.createElement('style');
        style.id = 'ctrl-blck-styles';
        style.textContent = `
            @font-face {
                font-family: 'Press Start 2P';
                src: url('${fontUrl}') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
            .ctrl-blck-blocked {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background-color: #ff4141 !important;
                color: white !important;
                z-index: 2147483647 !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
                font-family: 'Press Start 2P', monospace, sans-serif !important;
                text-align: center !important;
                font-size: 16px !important;
            }
            .ctrl-blck-button {
                background: white !important;
                color: black !important;
                border: 4px solid black !important;
                padding: 15px 20px !important;
                font-family: 'Press Start 2P', monospace, sans-serif !important;
                cursor: pointer !important;
                margin: 10px !important;
                box-shadow: 4px 4px 0px 0px black !important;
            }
            .ctrl-blck-button:hover {
                transform: translate(2px, 2px) !important;
                box-shadow: 2px 2px 0px 0px black !important;
            }
            
            /* Timer Styles */
            .ctrl-blck-timer-container {
                position: fixed !important;
                top: 10px !important;
                right: 10px !important;
                background: black !important;
                color: white !important;
                z-index: 2147483647 !important;
                font-family: 'Press Start 2P', monospace, sans-serif !important;
                border: 2px solid white !important;
                padding: 10px !important;
                border-radius: 4px !important;
                width: auto !important;
            }
            
            .timer-header {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                margin-bottom: 5px !important;
                font-size: 12px !important;
                letter-spacing: 2px !important;
                text-transform: uppercase !important;
            }
            
            .timer-toggle {
                cursor: pointer !important;
                margin-left: 10px !important;
                font-size: 10px !important;
            }
            
            .timer-content {
                display: flex !important;
                align-items: flex-end !important;
                gap: 5px !important;
            }
            
            .time-group {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }
            
            .time-group .label {
                font-size: 8px !important;
                margin-bottom: 5px !important;
                color: #ccc !important;
            }
            
            .digits {
                background: #222 !important;
                padding: 5px !important;
                font-size: 20px !important;
                border: 1px solid #444 !important;
                min-width: 40px !important;
                text-align: center !important;
            }
            
            .separator {
                font-size: 20px !important;
                padding-bottom: 5px !important;
                animation: blink 1s infinite !important;
            }
            
            @keyframes blink {
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();
