(function () {
    // Prevent multiple executions
    if (/** @type {any} */ (window).ctrlBlckContentScript) {
        return;
    }
    /** @type {any} */ (window).ctrlBlckContentScript = true;

    // Get syncConfig from global
    const syncConfig = globalThis.CTRL_BLCK_SYNC;
    // Define storage key based on config (with fallback for backwards compatibility)
    const blockedSitesKey = syncConfig && syncConfig.storageKeys ? (syncConfig.storageKeys.blockedSites || 'urls') : 'urls';

    // Get current hostname
    const currentHostname = window.location.hostname.toLowerCase();

    // Use centralized normalization logic
    /** @param {string} url */
    function normalize(url) {
        return syncConfig.normalizeHostname(url);
    }

    const normalizedCurrentHostname = normalize(currentHostname);

    // Initial Check
    chrome.storage.local.get({
        [blockedSitesKey]: [],
        hiddenUrls: [],
        allowedSites: {},
        activeSession: null,
        countdownDuration: 5,
        tempAccessDuration: 10
    }, function (data) {
        const activeSession = /** @type {FocusSession | null} */ (data.activeSession);
        checkBlocking({ ...data, activeSession });
    });

    // Listen for storage changes to update timer or blocking status dynamically
    chrome.storage.onChanged.addListener(function (_changes, namespace) {
        if (namespace === 'local') {
            chrome.storage.local.get({
                [blockedSitesKey]: [],
                hiddenUrls: [],
                allowedSites: {},
                activeSession: null,
                countdownDuration: 5,
                tempAccessDuration: 10
            }, function (data) {
                const activeSession = /** @type {FocusSession | null} */ (data.activeSession);
                // Re-evaluate blocking on storage change
                checkBlocking({ ...data, activeSession });
            });
        }
    });

    /**
     * @typedef {Object} FocusSession
     * @property {string} url
     * @property {string} start_time
     * @property {number} target_duration
     * @property {string} status
     */

    /** @param {any} data */
    function checkBlocking(data) {
        const blockedUrls = data[blockedSitesKey] || [];
        const hiddenUrls = data.hiddenUrls || [];
        const allowedSites = data.allowedSites || {};
        const activeSession = /** @type {FocusSession | null} */ (data.activeSession);
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
                const normalizedBlockedHostname = normalize(blockedHostname.toLowerCase());
                return normalizedBlockedHostname === normalizedCurrentHostname;
            } catch (e) {
                return false;
            }
        });

        // Check for active session allowance
        let sessionExpiry = 0;
        let hasActiveSession = false;

        if (activeSession && activeSession.status === 'active') {
            const normalizedSessionUrl = normalize(activeSession.url.toLowerCase());
            if (normalizedSessionUrl === normalizedCurrentHostname) {
                const startTime = new Date(activeSession.start_time).getTime();
                const durationMs = (activeSession.target_duration || 0) * 60 * 1000;
                sessionExpiry = startTime + durationMs;
                
                if (sessionExpiry > Date.now()) {
                    hasActiveSession = true;
                }
            }
        }

        if (isBlocked) {
            // Check for valid temporary access OR active session
            const allowedSite = normalizedCurrentHostname ? allowedSites[normalizedCurrentHostname] : null;
            const now = Date.now();

            if (hasActiveSession) {
                // Site is blocked but has an active allowance session -> Show Timer
                removeBlockingOverlay(); // If exists
                showRetroTimer(sessionExpiry);
            } else if (allowedSite && allowedSite.expiry > now) {
                // Site is blocked but has temporary manual access -> Show Timer
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
    /** @param {number} expiryTimestamp */
    function showRetroTimer(expiryTimestamp) {
        const existingTimer = document.getElementById('ctrl-blck-timer');
        
        if (existingTimer) {
            // If timer exists, just update the interval with the new timestamp
            const oldIntervalId = existingTimer.dataset.intervalId;
            if (oldIntervalId) clearInterval(Number(oldIntervalId));
            
            startTimerLoop(existingTimer, expiryTimestamp);
            return;
        }

        const localFontUrl = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
        initStyles(localFontUrl);

        const timerContainer = document.createElement('div');
        timerContainer.id = 'ctrl-blck-timer';
        timerContainer.className = 'ctrl-blck-timer-container';

        const viewExpanded = document.createElement('div');
        viewExpanded.id = 'view-expanded';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'timer-header';
        headerDiv.textContent = 'timer';
        viewExpanded.appendChild(headerDiv);

        const contentExpanded = document.createElement('div');
        contentExpanded.className = 'timer-content-expanded';

        /** 
         * @param {string} label 
         * @param {string} id1
         * @param {string} id2
         */
        const createTimeGroup = (label, id1, id2) => {
            const group = document.createElement('div');
            group.className = 'time-group';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = label;
            group.appendChild(labelSpan);
            const digitsRow = document.createElement('div');
            digitsRow.className = 'digits-row';
            const d1 = document.createElement('div');
            d1.className = 'digit-box';
            d1.id = id1;
            d1.textContent = '0';
            const d2 = document.createElement('div');
            d2.className = 'digit-box';
            d2.id = id2;
            d2.textContent = '0';
            digitsRow.appendChild(d1);
            digitsRow.appendChild(d2);
            group.appendChild(digitsRow);
            return group;
        };

        contentExpanded.appendChild(createTimeGroup('hour(s)', 'h1', 'h2'));
        
        const sep1 = document.createElement('div');
        sep1.className = 'separator';
        sep1.textContent = ':';
        contentExpanded.appendChild(sep1);

        contentExpanded.appendChild(createTimeGroup('minute(s)', 'm1', 'm2'));

        const sep2 = document.createElement('div');
        sep2.className = 'separator';
        sep2.textContent = ':';
        contentExpanded.appendChild(sep2);

        contentExpanded.appendChild(createTimeGroup('second(s)', 's1', 's2'));
        
        viewExpanded.appendChild(contentExpanded);
        timerContainer.appendChild(viewExpanded);

        const viewMinimized = document.createElement('div');
        viewMinimized.id = 'view-minimized';
        viewMinimized.style.display = 'none';
        const contentMinimized = document.createElement('div');
        contentMinimized.className = 'timer-content-minimized';
        const digitsSimple = document.createElement('div');
        digitsSimple.className = 'digits-simple';
        digitsSimple.id = 'timer-digits-simple';
        digitsSimple.textContent = '00 : 00 : 00';
        contentMinimized.appendChild(digitsSimple);
        viewMinimized.appendChild(contentMinimized);
        timerContainer.appendChild(viewMinimized);

        const timerToggle = document.createElement('div');
        timerToggle.id = 'timer-toggle';
        timerToggle.className = 'timer-toggle';
        timerToggle.textContent = '^';
        timerContainer.appendChild(timerToggle);

        if (document.body) {
            document.body.appendChild(timerContainer);
        } else {
            document.documentElement.appendChild(timerContainer);
        }

        // Toggle functionality
        const toggleBtn = timerToggle;
        let isMinimized = false;

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                isMinimized = !isMinimized;

                if (isMinimized) {
                    if (viewExpanded) viewExpanded.style.display = 'none';
                    if (viewMinimized) viewMinimized.style.display = 'block';
                    toggleBtn.textContent = 'v';
                } else {
                    if (viewExpanded) viewExpanded.style.display = 'block';
                    if (viewMinimized) viewMinimized.style.display = 'none';
                    toggleBtn.textContent = '^';
                }
            });
        }

        startTimerLoop(timerContainer, expiryTimestamp);
    }

    /**
     * @param {HTMLElement} timerContainer 
     * @param {number} expiryTimestamp 
     */
    function startTimerLoop(timerContainer, expiryTimestamp) {
        // Update timer loop
        const timerInterval = setInterval(() => {
            const now = Date.now();
            const timeLeft = expiryTimestamp - now;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                removeRetroTimer();
                
                // Re-evaluate blocking state immediately when time is up
                chrome.storage.local.get({ 
                    [blockedSitesKey]: [],
                    hiddenUrls: [],
                    allowedSites: {},
                    activeSession: null,
                    countdownDuration: 5,
                    tempAccessDuration: 10
                }, function (data) {
                    /** @type {any} */
                    const sites = data.allowedSites;
                    if (sites && normalizedCurrentHostname && sites[normalizedCurrentHostname]) {
                        delete sites[normalizedCurrentHostname];
                        chrome.storage.local.set({ allowedSites: sites }, function () {
                            checkBlocking(data);
                        });
                    } else {
                        checkBlocking(data);
                    }
                });
                return;
            }

            updateTimerDisplay(timeLeft);
        }, 1000);

        updateTimerDisplay(expiryTimestamp - Date.now()); // Initial call
        timerContainer.dataset.intervalId = String(timerInterval);
    }

    /** @param {number} ms */
    function updateTimerDisplay(ms) {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');

        // Update Expanded View Digits
        /**
         * @param {string} id
         * @param {string} char
         */
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
            simpleDigits.textContent = hStr + ' : ' + mStr + ' : ' + sStr;
        }
    }

    function removeRetroTimer() {
        const timer = document.getElementById('ctrl-blck-timer');
        if (timer) {
            const intervalId = timer.dataset.intervalId;
            if (intervalId) clearInterval(Number(intervalId));
            timer.remove();
        }
    }

    // --- Blocking Implementation ---
    /**
     * @param {number} countdownDuration
     * @param {number} tempAccessDuration
     */
    function blockSite(countdownDuration, tempAccessDuration) {
        if (document.getElementById('ctrl-blck-overlay')) return;

        try { window.stop(); } catch (e) { }

        document.documentElement.innerHTML = '';

        document.head.innerHTML = '';
        document.body = document.createElement('body');

        const localFontUrl = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');
        initStyles(localFontUrl);

        const overlay = document.createElement('div');
        overlay.id = 'ctrl-blck-overlay';
        overlay.className = 'ctrl-blck-blocked';

        const header = document.createElement('div');
        header.style.marginBottom = '30px';
        header.style.fontSize = '20px';
        header.textContent = 'SITE BLOCKED';
        overlay.appendChild(header);

        const countdownText = document.createElement('div');
        countdownText.id = 'countdown-text';
        countdownText.style.marginBottom = '20px';
        countdownText.style.fontSize = '14px';
        countdownText.style.lineHeight = '1.8';
        const durationText = countdownDuration === 1 ? 'second' : 'seconds';
        countdownText.textContent = `You have ${countdownDuration} ${durationText} to go back or this tab will close.`;
        overlay.appendChild(countdownText);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const goBackBtn = document.createElement('button');
        goBackBtn.id = 'goBackBtn';
        goBackBtn.className = 'ctrl-blck-button';
        goBackBtn.textContent = 'GO BACK';
        buttonGroup.appendChild(goBackBtn);

        const unlockBtn = document.createElement('button');
        unlockBtn.id = 'unlockBtn';
        unlockBtn.className = 'ctrl-blck-button';
        unlockBtn.style.marginTop = '20px';
        unlockBtn.textContent = `UNLOCK FOR ${tempAccessDuration} MIN`;
        buttonGroup.appendChild(unlockBtn);

        overlay.appendChild(buttonGroup);
        document.body.appendChild(overlay);

        // Countdown Logic
        let secondsLeft = countdownDuration;
        const countText = document.getElementById('countdown-text');

        const blockTimer = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                const t = secondsLeft === 1 ? 'second' : 'seconds';
                if (countText) countText.textContent = 'You have ' + secondsLeft + ' ' + t + ' to go back or this tab will close.';
            } else {
                clearInterval(blockTimer);
                if (countText) countText.textContent = 'Closing tab...';
                chrome.runtime.sendMessage({ action: 'closeTab' }).catch(() => window.close());
            }
        }, 1000);

        // Event Listeners
        goBackBtn.addEventListener('click', () => {
            clearInterval(blockTimer);
            if (window.history.length > 1) window.history.back();
            else window.close();
        });

        unlockBtn.addEventListener('click', () => {
            clearInterval(blockTimer);
            grantTemporaryAccess(tempAccessDuration);
        });
    }

    /** @param {number} minutes */
    function grantTemporaryAccess(minutes) {
        const expiryTime = Date.now() + (minutes * 60 * 1000);

        chrome.storage.local.get({ allowedSites: {} }, function (data) {
            /** @type {any} */
            const sites = data.allowedSites;
            if (normalizedCurrentHostname) {
                sites[normalizedCurrentHostname] = { expiry: expiryTime };
            }

            chrome.storage.local.set({ allowedSites: sites }, function () {
                location.reload();
            });
        });
    }

    function removeBlockingOverlay() {
        const overlay = document.getElementById('ctrl-blck-overlay');
        if (overlay) overlay.remove();
    }

    /** @param {string} fontUrl */
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
            .ctrl-blck-timer-container {
                position: fixed !important;
                top: 0px !important;
                right: 20px !important;
                background: white !important;
                color: black !important;
                z-index: 2147483647 !important;
                font-family: 'Press Start 2P', monospace, sans-serif !important;
                border: 2px solid black !important;
                border-top: none !important;
                border-radius: 0 0 8px 8px !important;
                padding: 4px 8px !important;
                width: auto !important;
                min-width: 100px !important;
                box-shadow: 0px 2px 0px black !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }
            .timer-header {
                font-size: 10px !important;
                margin-bottom: 4px !important;
                text-transform: lowercase !important;
                font-weight: bold !important;
                letter-spacing: 1px !important;
                text-align: center !important;
            }
            .timer-toggle {
                cursor: pointer !important;
                margin-top: 2px !important;
                font-size: 8px !important;
                color: #666 !important;
                text-align: center !important;
                width: 100% !important;
                font-weight: bold !important;
            }
            .timer-content-expanded {
                display: flex !important;
                align-items: flex-end !important;
                gap: 4px !important;
            }
            .time-group {
                display: flex !important;
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            .time-group .label {
                font-size: 6px !important;
                margin-bottom: 3px !important;
                color: black !important;
                text-transform: lowercase !important;
                font-weight: bold !important;
            }
            .digits-row {
                display: flex !important;
                gap: 2px !important;
            }
            .digit-box {
                background: #222 !important;
                color: white !important;
                width: 18px !important;
                height: 28px !important;
                font-size: 12px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border: none !important;
                border-radius: 0px !important;
            }
            .separator {
                font-size: 14px !important;
                padding-bottom: 4px !important;
                color: black !important;
                animation: blink 1s infinite !important;
                font-weight: bold !important;
            }
            .timer-content-minimized {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                min-height: 20px !important;
            }
            .digits-simple {
                font-size: 10px !important;
                color: black !important;
                letter-spacing: 1px !important;
                text-align: center !important;
            }
            @keyframes blink {
                50% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
})();
