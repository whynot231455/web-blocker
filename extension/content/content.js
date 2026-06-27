(function () {
    if (/** @type {any} */ (window).ctrlBlckContentScript) {
        return;
    }
    /** @type {any} */ (window).ctrlBlckContentScript = true;

    const syncConfig = globalThis.CTRL_BLCK_SYNC;
    const scheduleUtils = globalThis.CTRL_BLCK_SCHEDULE_UTILS;
    const blockedSitesKey = syncConfig && syncConfig.storageKeys ? (syncConfig.storageKeys.blockedSites || 'urls') : 'urls';
    const blockedSiteSchedulesKey = syncConfig && syncConfig.storageKeys ? (syncConfig.storageKeys.blockedSiteSchedules || 'blocked_site_schedules') : 'blocked_site_schedules';

    const currentHostname = window.location.hostname.toLowerCase();
    const normalizedCurrentHostname = normalize(currentHostname);

    /** @type {number | null} */
    let recheckTimer = null;
    /** @type {number | null} */
    let transitionTimer = null;

    try {
        chrome.storage.local.get({
            [blockedSitesKey]: [],
            [blockedSiteSchedulesKey]: {},
            hiddenUrls: [],
            countdownDuration: 5
        }, function (data) {
            if (!chrome.runtime?.id) return;
            checkBlocking(data);
        });
    } catch {
        // Extension context was already invalidated.
    }

    chrome.storage.onChanged.addListener(function (_changes, namespace) {
        if (namespace === 'local') {
            scheduleRecheck(100);
        }
    });

    function isExtensionAlive() {
        try {
            return Boolean(chrome.runtime?.id);
        } catch {
            return false;
        }
    }

    function normalize(url) {
        return syncConfig.normalizeHostname(url);
    }

    function scheduleRecheck(delayMs) {
        if (recheckTimer !== null) clearTimeout(recheckTimer);
        recheckTimer = setTimeout(function () {
            recheckTimer = null;
            if (!isExtensionAlive()) return;
            chrome.storage.local.get({
                [blockedSitesKey]: [],
                [blockedSiteSchedulesKey]: {},
                hiddenUrls: [],
                countdownDuration: 5
            }, function (data) {
                if (!chrome.runtime?.id) return;
                checkBlocking(data);
            });
        }, delayMs);
    }

    function clearTransitionTimer() {
        if (transitionTimer !== null) {
            clearTimeout(transitionTimer);
            transitionTimer = null;
        }
    }

    function scheduleTransition(nextTransitionAt) {
        clearTransitionTimer();
        if (typeof nextTransitionAt !== 'number') return;

        const delay = Math.max(1000, nextTransitionAt - Date.now() + 250);
        transitionTimer = setTimeout(function () {
            transitionTimer = null;
            scheduleRecheck(0);
        }, delay);
    }

    /** @param {any} data */
    function checkBlocking(data) {
        const blockedUrls = Array.isArray(data[blockedSitesKey]) ? data[blockedSitesKey] : [];
        const hiddenUrls = Array.isArray(data.hiddenUrls) ? data.hiddenUrls : [];
        const schedules = data[blockedSiteSchedulesKey] && typeof data[blockedSiteSchedulesKey] === 'object'
            ? data[blockedSiteSchedulesKey]
            : {};
        const countdownDuration = data.countdownDuration || 5;
        const allBlockedUrls = [...blockedUrls, ...hiddenUrls];

        const isBlocked = allBlockedUrls.some(url => {
            try {
                let blockedHostname;
                if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
                    blockedHostname = new URL(url).hostname;
                } else {
                    blockedHostname = String(url || '').split('/')[0];
                }
                const normalizedBlockedHostname = normalize(blockedHostname.toLowerCase());
                return normalizedBlockedHostname === normalizedCurrentHostname;
            } catch {
                return false;
            }
        });

        if (!isBlocked) {
            clearTransitionTimer();
            removeBlockingOverlay();
            return;
        }

        const currentSchedule = normalizedCurrentHostname ? schedules[normalizedCurrentHostname] || null : null;
        const scheduleState = scheduleUtils && typeof scheduleUtils.getAccessWindowState === 'function'
            ? scheduleUtils.getAccessWindowState(currentSchedule, new Date())
            : { allowed: false, configured: false, nextTransitionAt: null };

        if (scheduleState.allowed) {
            clearTransitionTimer();
            removeBlockingOverlay();
            scheduleTransition(scheduleState.nextTransitionAt);
            return;
        }

        showBlockedOverlay({
            countdownDuration,
            currentSchedule,
            configured: scheduleState.configured
        });
        scheduleTransition(scheduleState.nextTransitionAt);
    }

    /**
     * @param {{ countdownDuration: number; currentSchedule: { enabled?: boolean; start?: string; end?: string } | null; configured: boolean }} options
     */
    function showBlockedOverlay(options) {
        if (document.getElementById('ctrl-blck-overlay')) return;

        try { window.stop(); } catch (e) { }

        document.documentElement.innerHTML = '';
        document.head.innerHTML = '';
        document.body = document.createElement('body');

        const localFontUrl = chrome.runtime.getURL('assets/fonts/PressStart2P-Regular.ttf');
        initStyles(localFontUrl);

        const overlay = document.createElement('div');
        overlay.id = 'ctrl-blck-overlay';
        overlay.className = 'ctrl-blck-blocked';

        const header = document.createElement('div');
        header.style.marginBottom = '26px';
        header.style.fontSize = '20px';
        header.textContent = 'SITE BLOCKED';
        overlay.appendChild(header);

        const scheduleText = document.createElement('div');
        scheduleText.style.marginBottom = '20px';
        scheduleText.style.fontSize = '12px';
        scheduleText.style.lineHeight = '1.8';
        scheduleText.textContent = formatScheduleText(options.currentSchedule, options.configured);
        overlay.appendChild(scheduleText);

        const countdownText = document.createElement('div');
        countdownText.id = 'countdown-text';
        countdownText.style.marginBottom = '20px';
        countdownText.style.fontSize = '14px';
        countdownText.style.lineHeight = '1.8';
        const durationText = options.countdownDuration === 1 ? 'second' : 'seconds';
        countdownText.textContent = `You have ${options.countdownDuration} ${durationText} to go back or this tab will close.`;
        overlay.appendChild(countdownText);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const goBackBtn = document.createElement('button');
        goBackBtn.id = 'goBackBtn';
        goBackBtn.className = 'ctrl-blck-button';
        goBackBtn.textContent = 'GO BACK';
        buttonGroup.appendChild(goBackBtn);

        overlay.appendChild(buttonGroup);
        document.body.appendChild(overlay);

        let secondsLeft = options.countdownDuration;
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

        goBackBtn.addEventListener('click', () => {
            clearInterval(blockTimer);
            if (window.history.length > 1) window.history.back();
            else window.close();
        });
    }

    function formatScheduleText(schedule, configured) {
        if (!configured || !schedule || !schedule.start || !schedule.end) {
            return 'No valid access window is saved for this site, so it remains blocked.';
        }

        if (schedule.enabled === false) {
            return `Access window ${schedule.start} to ${schedule.end} is disabled, so this site remains blocked.`;
        }

        return `Access window: ${schedule.start} to ${schedule.end} local time.`;
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
                padding: 32px !important;
                box-sizing: border-box !important;
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
            .button-group {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 10px !important;
            }
        `;

        document.head.appendChild(style);
    }
})();
