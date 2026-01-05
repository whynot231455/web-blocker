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

        // Dual View Structure: Expanded (Split Digits) & Minimized (Simple Digits)
        // Defaulting to EXPANDED view as per user 'when expanded' image request interaction flow
        timerContainer.innerHTML = `
            <!-- EXPANDED VIEW -->
            <div id="view-expanded">
                <div class="timer-header">timer</div>
                <div class="timer-content-expanded">
                    <div class="time-group">
                        <span class="label">hour(s)</span>
                        <div class="digits-row">
                            <div class="digit-box" id="h1">0</div>
                            <div class="digit-box" id="h2">0</div>
                        </div>
                    </div>
                    <div class="separator">:</div>
                    <div class="time-group">
                        <span class="label">minute(s)</span>
                        <div class="digits-row">
                            <div class="digit-box" id="m1">0</div>
                            <div class="digit-box" id="m2">0</div>
                        </div>
                    </div>
                    <div class="separator">:</div>
                    <div class="time-group">
                        <span class="label">second(s)</span>
                        <div class="digits-row">
                            <div class="digit-box" id="s1">0</div>
                            <div class="digit-box" id="s2">0</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MINIMIZED VIEW -->
            <div id="view-minimized" style="display: none;">
                <div class="timer-header">time left</div>
                <div class="timer-content-minimized">
                    <div class="digits-simple" id="timer-digits-simple">00 : 00 : 00</div>
                </div>
            </div>

            <div id="timer-toggle" class="timer-toggle">^</div>
        `;

        if (document.body) {
            document.body.appendChild(timerContainer);
        } else {
            document.documentElement.appendChild(timerContainer);
        }

        // Toggle functionality
        const toggleBtn = timerContainer.querySelector('#timer-toggle');
        const viewExpanded = timerContainer.querySelector('#view-expanded');
        const viewMinimized = timerContainer.querySelector('#view-minimized');
        let isMinimized = false;

        toggleBtn.addEventListener('click', () => {
            isMinimized = !isMinimized;

            if (isMinimized) {
                viewExpanded.style.display = 'none';
                viewMinimized.style.display = 'block';
                toggleBtn.textContent = 'v'; // Point down to expand
                // timerContainer.style.padding = '10px 20px'; // REMOVED dynamic padding for consistency
            } else {
                viewExpanded.style.display = 'block';
                viewMinimized.style.display = 'none';
                toggleBtn.textContent = '^'; // Point up to minimize
                // timerContainer.style.padding = '15px 20px'; // REMOVED dynamic padding for consistency
            }
        });

        // Update timer loop
        const timerInterval = setInterval(() => {
            const now = Date.now();
            const timeLeft = expiryTimestamp - now;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                removeRetroTimer();
                chrome.storage.local.get({ allowedSites: {} }, function (result) {
                    const sites = result.allowedSites;
                    delete sites[normalizedCurrentHostname];
                    chrome.storage.local.set({ allowedSites: sites }, function () {
                        // Listener triggers block
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
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');

        // Update Expanded View Digits
        const setDigit = (id, char) => {
            const el = document.getElementById(id);
            if (el) el.textContent = char;
        };
        setDigit('h1', hStr[0]); setDigit('h2', hStr[1]);
        setDigit('m1', mStr[0]); setDigit('m2', mStr[1]);
        setDigit('s1', sStr[0]); setDigit('s2', sStr[1]);

        // Update Minimized View Digits
        const simpleDigits = document.getElementById('timer-digits-simple');
        if (simpleDigits) {
            simpleDigits.textContent = `${hStr} : ${mStr} : ${sStr}`;
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
            
            /* DUAL VIEW TIMER STYLES */
            .ctrl-blck-timer-container {
                position: fixed !important;
                top: 0px !important; /* Attached to toolbar */
                right: 20px !important;
                background: white !important;
                color: black !important;
                z-index: 2147483647 !important;
                font-family: 'Press Start 2P', monospace, sans-serif !important;
                border: 3px solid black !important;
                border-top: none !important; /* Visual attachment */
                border-radius: 0 0 12px 12px !important; 
                padding: 15px 20px !important;
                width: auto !important;
                min-width: 250px !important; /* Force uniform width prevents jump */
                box-shadow: 0px 4px 0px black !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }
            
            .timer-header {
                font-size: 20px !important;
                margin-bottom: 10px !important;
                text-transform: lowercase !important;
                font-weight: bold !important;
                letter-spacing: 1px !important;
                text-align: center !important;
            }
            
            .timer-toggle {
                cursor: pointer !important;
                margin-top: 8px !important;
                font-size: 16px !important; /* Bigger Toggle */
                color: black !important;
                text-align: center !important;
                width: 100% !important;
                font-weight: bold !important;
            }

            /* Expanded Styles */
            .timer-content-expanded {
                display: flex !important;
                align-items: flex-end !important;
                gap: 8px !important;
            }
            .time-group {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            .time-group .label {
                font-size: 10px !important;
                margin-bottom: 6px !important;
                color: black !important;
                text-transform: lowercase !important;
                font-weight: bold !important;
            }
            .digits-row {
                display: flex !important;
                gap: 4px !important;
            }
            .digit-box {
                background: #222 !important;
                color: white !important;
                width: 30px !important;
                height: 45px !important;
                font-size: 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border: none !important;
                border-radius: 0px !important;
            }
            .separator {
                font-size: 24px !important;
                padding-bottom: 10px !important;
                color: black !important;
                animation: blink 1s infinite !important;
                font-weight: bold !important;
            }

            /* Minimized Styles */
            .timer-content-minimized {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                min-height: 45px !important; /* Match expanded height to avoid jump */
            }
            .digits-simple {
                font-size: 24px !important; /* Larger font to match presence of boxes */
                color: black !important;
                letter-spacing: 2px !important;
                text-align: center !important;
            }
            
            @keyframes blink {
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();
