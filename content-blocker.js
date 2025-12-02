(function() {
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

    // Check if current site should be blocked
    // FIXED: Now checking both 'urls' and 'hiddenWebsites' arrays
    chrome.storage.local.get({ 
        urls: [], 
        hiddenUrls: [],  // Add hidden websites
        countdownDuration: 5 
    }, function(data) {
        const blockedUrls = data.urls || [];
        const hiddenUrls = data.hiddenUrls || [];  // Get hidden websites
        const countdownDuration = data.countdownDuration || 5;
        
        // Combine both arrays for blocking check
        const allBlockedUrls = [...blockedUrls, ...hiddenUrls];
        
        console.log('🔍 Content Script - Current hostname:', normalizedCurrentHostname);
        console.log('🔍 Content Script - Regular blocked URLs:', blockedUrls);
        console.log('🔍 Content Script - Hidden blocked URLs:', hiddenUrls);
        console.log('🔍 Content Script - All blocked URLs:', allBlockedUrls);
        console.log('⏱️ Content Script - Countdown duration:', countdownDuration, 'seconds');

        // Check if any blocked URL matches current hostname
        const isBlocked = allBlockedUrls.some(url => {  // Use combined array
            try {
                let blockedHostname;
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    blockedHostname = new URL(url).hostname;
                } else {
                    blockedHostname = url.split('/')[0];
                }

                // Normalize blocked hostname
                const normalizedBlockedHostname = normalizeHostname(blockedHostname.toLowerCase());
                const matches = normalizedBlockedHostname === normalizedCurrentHostname;
                console.log('🔍 Content Script - Comparing:', normalizedCurrentHostname, '===', normalizedBlockedHostname, '=>', matches);
                return matches;
            } catch (e) {
                console.warn('Error parsing blocked URL:', url, e);
                return false;
            }
        });

        console.log('🚨 Content Script - Should block?', isBlocked);

        if (isBlocked) {
            console.log('🔥 Content Script - BLOCKING SITE!');
            blockSite(countdownDuration);
        }
    });

    function blockSite(countdownDuration) {
        // Stop all page loading
        if (document.readyState === 'loading') {
            window.stop();
        }

        // Remove all existing content
        document.documentElement.innerHTML = '';

        // Get the local font URL from the extension
        const localFontUrl = chrome.runtime.getURL('fonts/PressStart2P-Regular.ttf');

        // Create and inject font CSS
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Press Start 2P';
                src: url('${localFontUrl}') format('truetype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
            
            .ctrl-blck-blocked {
                font-family: 'Press Start 2P', monospace, sans-serif !important;
            }
            
.ctrl-blck-button {
    background-color: white !important;
    color: black !important;
    border: 4px solid black !important;
    border-radius: 15px !important;
    padding: 20px 30px !important;
    font-size: 15px !important;
    font-family: 'Press Start 2P', monospace, sans-serif !important;
    letter-spacing: 1px !important;
    cursor: pointer !important;
    transition: transform 0.1s ease, background-color 0.1s ease, color 0.1s ease, box-shadow 0.1s ease !important;
    margin-top: 24px !important; 
    margin-bottom: 24px !important; 
}

.ctrl-blck-button:hover {
    background-color: white !important;
    color: black !important;
    border: 4px solid black !important;
    transform: translateY(-6px) !important;
    box-shadow: 0 6px 0 rgba(0, 0, 0, 1) !important;
}

.ctrl-blck-button:active {
    transform: translateY(-2px) !important;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.3) !important;
}
        `;

        // Rebuild document structure
        document.body = document.createElement('body');
        document.head = document.createElement('head');

        // Add styles to head
        document.head.appendChild(style);

        // Create blocking overlay
        const blockingOverlay = document.createElement('div');
        blockingOverlay.className = 'ctrl-blck-blocked';
        blockingOverlay.style.cssText = `
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
            line-height: 2 !important;
            box-sizing: border-box !important;
            padding: 20px !important;
        `;

        // Dynamic duration text
        const durationText = countdownDuration === 1 ? 'second' : 'seconds';
        const initialMessage = `You have ${countdownDuration} ${durationText} to go back or this tab will close.`;

        // Set the HTML content with proper button class
        blockingOverlay.innerHTML = `
            <div style="margin-bottom: 30px; font-size: 20px;">🚫 SITE BLOCKED</div>
            
            <div id="countdown-text" style="margin-bottom: 20px; font-size: 14px; line-height: 1.8;">
                ${initialMessage}
            </div>
            
            <button id="goBackBtn" class="ctrl-blck-button">GO BACK</button>
        `;

        // Add to body
        document.body.appendChild(blockingOverlay);

        // Initialize blocking functionality after a short delay to ensure font loads
        setTimeout(() => {
            initializeBlockingInterface(countdownDuration);
        }, 150);

        function initializeBlockingInterface(duration) {
            // Countdown functionality with dynamic duration
            let secondsLeft = duration;
            const countdownText = document.getElementById('countdown-text');
            
            const timer = setInterval(() => {
                secondsLeft--;
                if (secondsLeft > 0) {
                    const timeText = secondsLeft === 1 ? 'second' : 'seconds';
                    countdownText.textContent = `You have ${secondsLeft} ${timeText} to go back or this tab will close.`;
                } else {
                    clearInterval(timer);
                    countdownText.textContent = 'Closing tab...';
                    
                    // Send message to background script to close tab
                    chrome.runtime.sendMessage({ action: 'closeTab' }).catch(e => {
                        console.warn('Could not send close message:', e);
                        window.close();
                    });
                }
            }, 1000);

            // Go back button functionality
            const goBackBtn = document.getElementById('goBackBtn');
            if (goBackBtn) {
                goBackBtn.addEventListener('click', () => {
                    clearInterval(timer);
                    
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        chrome.runtime.sendMessage({ action: 'closeTab' }).catch(e => {
                            console.warn('Could not send close message:', e);
                            window.close();
                        });
                    }
                });
            }

            console.log(`✅ Content Script - Site blocked successfully with ${duration} second countdown!`);
        }
    }
})();
