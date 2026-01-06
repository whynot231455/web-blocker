document.addEventListener("DOMContentLoaded", function () {
    const urlList = document.getElementById("urlList");
    const searchInput = document.getElementById("searchInput");
    const suggestionsDropdown = document.getElementById("suggestions");
    const passwordOverlay = document.getElementById('hiddenPasswordOverlay');
    const passwordInput = document.getElementById('hiddenPasswordInput');
    const passwordSubmit = document.getElementById('hiddenPasswordSubmit');
    const passwordError = document.getElementById('hiddenPasswordError');
    const hiddenList = document.querySelector('.hidden-list');

    let hasHiddenAccess = false;
    const hiddenSection = document.querySelector('.hidden-section');

    const PASSWORD = 'yourPassword';

    let allUrls = []; // Store all URLs for filtering
    let hiddenUrls = []; // Store hidden URLs separately
    let selectedSuggestionIndex = -1;
    let currentSuggestions = [];
    let hiddenSectionVisible = false;
    passwordSubmit.addEventListener('click', function () {
        if (passwordInput.value === PASSWORD) {
            hasHiddenAccess = true;
            passwordOverlay.style.display = 'none';
            hiddenSectionVisible = true;
            hiddenList.style.display = 'block';
            document.querySelector('.toggle-text').textContent = 'Hide Hidden';
            passwordError.style.display = 'none';
            updateHiddenUrlList();
        } else {
            passwordError.textContent = 'Incorrect password. Please try again.';
            passwordError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    });




    // Optionally, allow pressing enter to submit
    passwordInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            passwordSubmit.click();
        }
    });

    // Popular websites for suggestions
    const popularSites = [
        { domain: 'youtube.com', name: 'YouTube' },
        { domain: 'facebook.com', name: 'Facebook' },
        { domain: 'instagram.com', name: 'Instagram' },
        { domain: 'twitter.com', name: 'Twitter/X' },
        { domain: 'tiktok.com', name: 'TikTok' },
        { domain: 'reddit.com', name: 'Reddit' },
        { domain: 'netflix.com', name: 'Netflix' },
        { domain: 'twitch.tv', name: 'Twitch' },
        { domain: 'linkedin.com', name: 'LinkedIn' },
        { domain: 'pinterest.com', name: 'Pinterest' },
        { domain: 'snapchat.com', name: 'Snapchat' },
        { domain: 'discord.com', name: 'Discord' },
        { domain: 'whatsapp.com', name: 'WhatsApp' },
        { domain: 'telegram.org', name: 'Telegram' },
        { domain: 'spotify.com', name: 'Spotify' },
        { domain: 'amazon.com', name: 'Amazon' },
        { domain: 'ebay.com', name: 'eBay' },
        { domain: 'github.com', name: 'GitHub' },
        { domain: 'stackoverflow.com', name: 'Stack Overflow' },
        { domain: 'medium.com', name: 'Medium' },
        { domain: 'quora.com', name: 'Quora' },
        { domain: 'tumblr.com', name: 'Tumblr' },
        { domain: '9gag.com', name: '9GAG' },
        { domain: 'imgur.com', name: 'Imgur' },
        { domain: 'buzzfeed.com', name: 'BuzzFeed' },
        { domain: 'cnn.com', name: 'CNN' },
        { domain: 'bbc.com', name: 'BBC' },
        { domain: 'nytimes.com', name: 'New York Times' },
        { domain: 'hulu.com', name: 'Hulu' },
        { domain: 'disneyplus.com', name: 'Disney+' }
    ];

    // Initialize countdown duration setting
    function initializeCountdownSetting() {
        const durationDropdown = document.getElementById('countdownDuration');

        if (!durationDropdown) return;

        // Load saved duration
        chrome.storage.local.get({ countdownDuration: 5 }, function (data) {
            durationDropdown.value = data.countdownDuration;
        });

        // Save when changed
        durationDropdown.addEventListener('change', function () {
            const duration = parseInt(this.value);
            chrome.storage.local.set({ countdownDuration: duration }, function () {
                console.log('✅ Countdown duration saved:', duration, 'seconds');

                // Visual feedback
                const originalBg = durationDropdown.style.backgroundColor;
                const originalBorder = durationDropdown.style.borderColor;

                durationDropdown.style.backgroundColor = '#d4edda';
                durationDropdown.style.borderColor = '#28a745';

                setTimeout(() => {
                    durationDropdown.style.backgroundColor = originalBg;
                    durationDropdown.style.borderColor = originalBorder || '#ddd';
                }, 1000);
            });
        });
    }

    // Initialize temporary access duration setting
    function initializeTempAccessSetting() {
        const tempAccessInput = document.getElementById('tempAccessDuration');
        if (!tempAccessInput) return;

        // Load saved duration (default 10 minutes)
        chrome.storage.local.get({ tempAccessDuration: 10 }, function (data) {
            tempAccessInput.value = data.tempAccessDuration;
        });

        // Save when changed
        tempAccessInput.addEventListener('change', function () {
            let duration = parseInt(this.value);
            if (duration < 1) duration = 1; // Minimum 1 minute

            chrome.storage.local.set({ tempAccessDuration: duration }, function () {
                console.log('✅ Temporary access duration saved:', duration, 'minutes');

                // Visual feedback
                const originalBorder = tempAccessInput.style.borderColor;
                tempAccessInput.style.borderColor = '#28a745';
                setTimeout(() => {
                    tempAccessInput.style.borderColor = originalBorder || '#ccc';
                }, 1000);
            });
        });
    }

    function initializeHiddenWebsites() {
        const toggleBtn = document.getElementById('toggleHiddenBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function (e) {
                e.preventDefault();
                if (!hiddenSectionVisible) {
                    // User clicked "Show Hidden", so always show password prompt
                    passwordOverlay.style.display = 'block';
                    hiddenList.style.display = 'none';
                    hasHiddenAccess = false;  // Reset access
                    passwordInput.value = ''; // Reset text input every time
                    passwordError.style.display = 'none'; // Hide previous errors
                    passwordInput.focus(); // Focus the input for better UX
                    return;
                }

                // Hiding the section, reset state
                hiddenSectionVisible = false;
                const toggleText = document.querySelector('.toggle-text');
                hiddenList.style.display = 'none';
                toggleText.textContent = 'Show Hidden';
            });
        }
    }

    // Add to hidden list function
    function addToHiddenList(url) {
        const normalizedUrl = extractHostname(url);

        hiddenUrls.push(url);

        // Remove from main list if it exists
        const mainIndex = allUrls.findIndex(u => extractHostname(u) === normalizedUrl);
        if (mainIndex > -1) {
            allUrls.splice(mainIndex, 1);
            renderList(allUrls);
        }

        updateHiddenUrlList();
        saveToStorage();
        console.log('✅ Added to hidden list:', url);
    }

    function updateHiddenUrlList() {
        const hiddenList = document.querySelector('.hidden-list');
        const hiddenLoading = document.getElementById('hiddenLoading');

        if (!hasHiddenAccess) {
            hiddenList.style.display = 'none';
            if (hiddenLoading) hiddenLoading.style.display = 'none';
            return;
        }

        if (hiddenLoading) hiddenLoading.style.display = 'block';
        hiddenList.style.display = 'none';

        setTimeout(() => {
            hiddenList.innerHTML = '';

            if (hiddenUrls.length === 0) {
                hiddenList.style.display = 'none';
                if (hiddenLoading) hiddenLoading.style.display = 'none';
                return;
            }

            const fragment = document.createDocumentFragment();
            hiddenUrls.forEach((url, index) => {
                const listItem = document.createElement('li');
                const hostname = extractHostname(url);

                // Create Icon
                const icon = document.createElement('img');
                icon.src = getFavicon(url);
                icon.className = 'icon';
                icon.alt = '';
                icon.style.width = '20px';
                icon.style.height = '20px';
                icon.style.marginRight = '10px';
                icon.onerror = function () {
                    this.src = '/icons/default-site-icon.svg';
                };

                // Create URL text
                const urlText = document.createElement('span');
                urlText.className = 'url-text';
                urlText.textContent = hostname;

                // Create Actions container
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'url-actions';

                // Create Unhide button
                const unhideBtn = document.createElement('button');
                unhideBtn.className = 'unhide-btn';
                unhideBtn.textContent = 'Unhide';
                unhideBtn.addEventListener('click', () => {
                    unhideWebsite(index);
                });

                // Create Delete icon
                const deleteIcon = document.createElement('img');
                deleteIcon.src = '/icons/delete-icon.svg';
                deleteIcon.className = 'delete-icon';
                deleteIcon.title = 'Delete';
                deleteIcon.style.width = '20px';
                deleteIcon.style.height = '20px';
                deleteIcon.style.cursor = 'pointer';
                deleteIcon.addEventListener('click', () => {
                    deleteHiddenWebsite(index);
                });

                actionsDiv.appendChild(unhideBtn);
                actionsDiv.appendChild(deleteIcon);

                listItem.appendChild(icon);
                listItem.appendChild(urlText);
                listItem.appendChild(actionsDiv);

                fragment.appendChild(listItem);
            });
            hiddenList.appendChild(fragment);

            if (hiddenLoading) hiddenLoading.style.display = 'none';
            hiddenList.style.display = hiddenSectionVisible ? 'block' : 'none';
        }, 50); // makes loading visible for at least 50ms
    }

    window.unhideWebsite = function (index) {
        const url = hiddenUrls[index];
        if (!url) return;
        hiddenUrls.splice(index, 1);

        const normalizedUrl = extractHostname(url);
        if (!allUrls.some(u => extractHostname(u) === normalizedUrl)) {
            allUrls.push(url);
            renderList(allUrls);
        }
        updateHiddenUrlList();
        saveToStorage();
    };


    // Delete hidden website permanently
    window.deleteHiddenWebsite = function (index) {
        if (confirm('Are you sure you want to permanently delete this hidden website?')) {
            const url = hiddenUrls[index];
            hiddenUrls.splice(index, 1);
            updateHiddenUrlList();
            saveToStorage();
            console.log('✅ Deleted hidden website:', url);
        }
    };

    // Hide website (move to hidden list)
    window.hideWebsite = function (index) {
        const url = allUrls[index];
        addToHiddenList(url);
    };

    // Enhanced storage functions to include hidden websites
    function saveToStorage() {
        chrome.storage.local.set({
            urls: allUrls,
            hiddenUrls: hiddenUrls
        }, function () {
            console.log('✅ URLs and hidden URLs saved to storage');
        });
    }

    // Enhanced load function
    function loadURLs() {
        chrome.storage.local.get({ urls: [], hiddenUrls: [] }, function (data) {
            allUrls = data.urls || [];
            hiddenUrls = data.hiddenUrls || [];
            renderList(allUrls);
            updateHiddenUrlList();
        });
    }

    // Fetch URLs from chrome.storage and initialize
    loadURLs();

    // Initialize settings and hidden websites
    initializeCountdownSetting();
    initializeTempAccessSetting();
    initializeHiddenWebsites();

    // ✅ Function to clean up existing duplicates
    function removeDuplicateHostnames() {
        chrome.storage.local.get({ urls: [], hiddenUrls: [] }, function (data) {
            const urls = data.urls || [];
            const hiddenUrls_data = data.hiddenUrls || [];
            const seenHostnames = new Set();
            const cleanedUrls = [];
            const cleanedHiddenUrls = [];

            // Clean main URLs
            urls.forEach(url => {
                const hostname = extractHostname(url);
                if (!seenHostnames.has(hostname)) {
                    seenHostnames.add(hostname);
                    let cleanUrl = url;
                    if (!url.startsWith('http://') && !url.startsWith('https://') && url.toLowerCase().startsWith('www.')) {
                        cleanUrl = url.substring(4);
                    }
                    cleanedUrls.push(cleanUrl);
                }
            });

            // Clean hidden URLs
            hiddenUrls_data.forEach(url => {
                const hostname = extractHostname(url);
                if (!seenHostnames.has(hostname)) {
                    seenHostnames.add(hostname);
                    let cleanUrl = url;
                    if (!url.startsWith('http://') && !url.startsWith('https://') && url.toLowerCase().startsWith('www.')) {
                        cleanUrl = url.substring(4);
                    }
                    cleanedHiddenUrls.push(cleanUrl);
                }
            });

            if (cleanedUrls.length !== urls.length || cleanedHiddenUrls.length !== hiddenUrls_data.length) {
                chrome.storage.local.set({
                    urls: cleanedUrls,
                    hiddenUrls: cleanedHiddenUrls
                }, function () {
                    allUrls = cleanedUrls;
                    hiddenUrls = cleanedHiddenUrls;
                    renderList(allUrls);
                    updateHiddenUrlList();
                    console.log(`Removed duplicates from main and hidden lists`);
                });
            }
        });
    }

    removeDuplicateHostnames();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === 'local') {
            if (changes.urls) {
                allUrls = changes.urls.newValue || [];
                renderList(allUrls);
            }
            if (changes.hiddenUrls) {
                hiddenUrls = changes.hiddenUrls.newValue || [];
                updateHiddenUrlList();
            }
        }
    });

    window.addEventListener("focus", function () {
        loadURLs();
    });

    // ✅ Handle keyboard navigation in suggestions
    searchInput.addEventListener("keydown", function (e) {
        if (currentSuggestions.length === 0) {
            if (e.key === "Enter") {
                addURL();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
                updateSuggestionSelection();
                break;
            case "ArrowUp":
                e.preventDefault();
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                updateSuggestionSelection();
                break;
            case "Enter":
                e.preventDefault();
                if (selectedSuggestionIndex >= 0) {
                    selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
                } else {
                    addURL();
                }
                break;
            case "Escape":
                hideSuggestions();
                break;
        }
    });

    // ✅ Enhanced input handler with suggestions
    searchInput.addEventListener("input", function () {
        const inputValue = searchInput.value.trim();
        const searchContainer = document.querySelector('.search-container');

        // Reset selection
        selectedSuggestionIndex = -1;

        // Reset to default state first
        if (searchContainer) {
            searchContainer.style.borderColor = "#ddd";
            searchContainer.style.boxShadow = "none";
        }

        if (inputValue === "") {
            searchInput.placeholder = "Search / Add Website (Press Enter to add)";
            hideSuggestions();
        } else if (inputValue.length >= 2) {
            // Show suggestions for inputs of 2+ characters
            showSuggestions(inputValue);

            // Real-time validation
            if (!isValidUrl(inputValue)) {
                if (searchContainer) {
                    searchContainer.style.borderColor = "#dc3545";
                    searchContainer.style.boxShadow = "0 0 0 2px rgba(220, 53, 69, 0.2)";
                }
            } else {
                const newHostname = extractHostname(inputValue);
                const existingHostnames = allUrls.map(url => extractHostname(url));
                const hiddenHostnames = hiddenUrls.map(url => extractHostname(url));

                if (existingHostnames.includes(newHostname) || hiddenHostnames.includes(newHostname)) {
                    if (searchContainer) {
                        searchContainer.style.borderColor = "#ffc107";
                        searchContainer.style.boxShadow = "0 0 0 2px rgba(255, 193, 7, 0.2)";
                    }
                } else {
                    if (searchContainer) {
                        searchContainer.style.borderColor = "#28a745";
                        searchContainer.style.boxShadow = "0 0 0 2px rgba(40, 167, 69, 0.2)";
                    }
                }
            }
        } else {
            hideSuggestions();
        }

        // Filter existing URLs
        const filter = inputValue.toLowerCase();
        const filteredURLs = allUrls.filter(url => {
            const hostname = extractHostname(url);
            return hostname.toLowerCase().includes(filter);
        });
        renderList(filteredURLs);
    });

    // ✅ Show suggestions
    function showSuggestions(query) {
        if (!suggestionsDropdown) return;

        const existingHostnames = allUrls.map(url => extractHostname(url));
        const hiddenHostnames = hiddenUrls.map(url => extractHostname(url));
        const allExistingHostnames = [...existingHostnames, ...hiddenHostnames];

        // Filter popular sites that match the query and aren't already blocked or hidden
        const suggestions = popularSites.filter(site => {
            const matches = site.domain.toLowerCase().includes(query.toLowerCase()) ||
                site.name.toLowerCase().includes(query.toLowerCase());
            const notBlocked = !allExistingHostnames.includes(site.domain);
            return matches && notBlocked;
        }).slice(0, 5); // Show max 5 suggestions

        currentSuggestions = suggestions;

        if (suggestions.length > 0) {
            renderSuggestions(suggestions);
            suggestionsDropdown.classList.add('show');
        } else {
            hideSuggestions();
        }
    }

    // ✅ Render suggestions
    // ✅ Render suggestions
    function renderSuggestions(suggestions) {
        if (!suggestionsDropdown) return;

        suggestionsDropdown.innerHTML = '';
        const fragment = document.createDocumentFragment();

        suggestions.forEach((suggestion, index) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.setAttribute('data-index', index);
            div.setAttribute('data-domain', suggestion.domain);

            const img = document.createElement('img');
            img.className = 'favicon';
            img.src = `https://www.google.com/s2/favicons?domain=${suggestion.domain}&sz=32`;
            img.alt = suggestion.name;
            img.onerror = function () {
                this.src = '/icons/default-site-icon.svg';
            };

            const domainSpan = document.createElement('span');
            domainSpan.className = 'domain';
            domainSpan.textContent = suggestion.domain;

            const addIconSpan = document.createElement('span');
            addIconSpan.className = 'add-icon';
            addIconSpan.textContent = '+';

            div.appendChild(img);
            div.appendChild(domainSpan);
            div.appendChild(addIconSpan);

            div.addEventListener('click', () => {
                selectSuggestion(suggestion);
            });

            fragment.appendChild(div);
        });

        suggestionsDropdown.appendChild(fragment);
    }

    // ✅ Update suggestion selection (keyboard navigation)
    function updateSuggestionSelection() {
        if (!suggestionsDropdown) return;

        suggestionsDropdown.querySelectorAll('.suggestion-item').forEach((item, index) => {
            if (index === selectedSuggestionIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function selectSuggestion(suggestion) {
        searchInput.value = suggestion.domain;
        hideSuggestions();
        addURL();
    }

    function hideSuggestions() {
        if (suggestionsDropdown) {
            suggestionsDropdown.classList.remove('show');
        }
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container-wrapper')) {
            hideSuggestions();
        }
    });

    // ✅ COMPLETE AND CORRECTED Add URL function with better UX
    function addURL() {
        const newUrl = searchInput.value.trim();
        const searchContainer = document.querySelector('.search-container');

        if (!newUrl) {
            searchInput.focus();
            searchInput.placeholder = "Type a website to block (e.g. youtube.com)";
            if (searchContainer) {
                searchContainer.style.borderColor = "#007bff";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.25)";
            }

            setTimeout(() => {
                searchInput.placeholder = "Search / Add Website (Press Enter to add)";
                if (searchContainer) {
                    searchContainer.style.borderColor = "#ddd";
                    searchContainer.style.boxShadow = "none";
                }
            }, 3000);
            return;
        }

        if (!isValidUrl(newUrl)) {
            if (searchContainer) {
                searchContainer.style.borderColor = "#dc3545";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(220, 53, 69, 0.4)";
            }
            alert("Please enter a valid URL or domain name\n\nExamples:\n• youtube.com\n• facebook.com\n• https://twitter.com");
            searchInput.focus();
            searchInput.select();

            setTimeout(() => {
                searchInput.dispatchEvent(new Event('input'));
            }, 3000);
            return;
        }

        const newHostname = extractHostname(newUrl);
        const existingHostnames = allUrls.map(url => extractHostname(url));
        const hiddenHostnames = hiddenUrls.map(url => extractHostname(url));

        if (existingHostnames.includes(newHostname)) {
            if (searchContainer) {
                searchContainer.style.borderColor = "#ffc107";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.4)";
            }
            alert("This website is already in your blocked list");
            searchInput.focus();
            searchInput.select();
            return;
        }

        if (hiddenHostnames.includes(newHostname)) {
            if (searchContainer) {
                searchContainer.style.borderColor = "#ffc107";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.4)";
            }
            alert("This website is already in your hidden list");
            searchInput.focus();
            searchInput.select();
            return;
        }

        let urlToStore = newUrl;
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            if (newUrl.toLowerCase().startsWith('www.')) {
                urlToStore = newUrl.substring(4);
            }
        }

        allUrls.push(urlToStore);
        saveToStorage();
        renderList(allUrls);

        // Success feedback
        searchInput.value = "";
        searchInput.placeholder = "✓ Website added successfully!";
        if (searchContainer) {
            searchContainer.style.borderColor = "#28a745";
            searchContainer.style.boxShadow = "0 0 0 3px rgba(40, 167, 69, 0.4)";
        }

        // Hide suggestions
        hideSuggestions();

        setTimeout(() => {
            searchInput.placeholder = "Search / Add Website (Press Enter to add)";
            if (searchContainer) {
                searchContainer.style.borderColor = "#ddd";
                searchContainer.style.boxShadow = "none";
            }
        }, 2000);
    }

    // ✅ Extract hostname from URL and normalize it
    function extractHostname(url) {
        try {
            let hostname;

            if (url.startsWith('http://') || url.startsWith('https://')) {
                hostname = new URL(url).hostname;
            } else {
                hostname = url.split('/')[0];
            }

            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }

            return hostname.toLowerCase();
        } catch (e) {
            let cleanUrl = url.toLowerCase();
            if (cleanUrl.startsWith('www.')) {
                cleanUrl = cleanUrl.substring(4);
            }
            return cleanUrl.split('/')[0];
        }
    }

    // ✅ Enhanced render list with hide buttons
    function renderList(urls) {
        if (!urlList) return;

        urlList.innerHTML = "";

        if (urls.length === 0) {
            const li = document.createElement("li");
            li.className = "empty-state";
            li.innerHTML = `
                <div class="empty-icon">🚫</div>
                <div class="empty-text">No websites blocked yet</div>
                <div class="empty-subtext">Start typing to see suggestions or add a website</div>
            `;
            urlList.appendChild(li);
            return;
        }

        urls.forEach((url, index) => {
            const li = document.createElement("li");
            li.className = "url-item";

            const hostname = extractHostname(url);

            const icon = document.createElement("img");
            icon.src = getFavicon(url);
            icon.className = "icon";
            icon.onerror = function () {
                this.src = "/icons/default-site-icon.svg";
            };

            const span = document.createElement("span");
            span.textContent = hostname;
            span.className = "url-text";
            span.title = url;

            const buttonsContainer = document.createElement("div");
            buttonsContainer.className = "buttons-container";

            // Hide button
            const hideBtn = document.createElement("button");
            hideBtn.textContent = "Hide";
            hideBtn.className = "hide-btn";
            hideBtn.title = "Hide this website";
            hideBtn.addEventListener("click", () => {
                hideWebsite(index);
            });

            const deleteBtn = document.createElement("img");
            deleteBtn.src = "/icons/delete-icon.svg";
            deleteBtn.className = "delete-icon";
            deleteBtn.title = "Delete URL";
            deleteBtn.style.width = "20px";
            deleteBtn.style.height = "20px";
            deleteBtn.style.cursor = "pointer";
            deleteBtn.style.opacity = "1";
            deleteBtn.addEventListener("click", () => {
                if (confirm(`Are you sure you want to remove "${hostname}" from your blocked list?`)) {
                    deleteURL(url);
                }
            });

            buttonsContainer.appendChild(hideBtn);
            buttonsContainer.appendChild(deleteBtn);

            li.appendChild(icon);
            li.appendChild(span);
            li.appendChild(buttonsContainer);
            urlList.appendChild(li);
        });
    }

    // Delete URL function
    function deleteURL(url) {
        const index = allUrls.indexOf(url);
        if (index > -1) {
            allUrls.splice(index, 1);
            saveToStorage();
            renderList(allUrls);
        }
    }

    // Get favicon for website
    function getFavicon(url) {
        try {
            let domain;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                domain = new URL(url).hostname;
            } else {
                domain = url.split('/')[0];
            }
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch (e) {
            return "/icons/default-site-icon.svg";
        }
    }

    // URL validation function
    function isValidUrl(string) {
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
        const urlRegex = /^https?:\/\/.+/;
        const cleanUrl = string.replace(/^https?:\/\//, '').split('/')[0];
        return urlRegex.test(string) || domainRegex.test(cleanUrl);
    }

    // Handle Enter key press for adding URLs
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && currentSuggestions.length === 0) {
            addURL();
        }
    });

    // ✅ View Navigation Logic
    function initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const viewSections = document.querySelectorAll('.view-section');

        // Sidebar Elements
        const sidebar = document.querySelector('.sidebar');
        const openMenuBtn = document.getElementById('openMenuBtn');
        const closeMenuBtn = document.getElementById('closeMenuBtn');

        // Toggle Sidebar Function
        function toggleSidebar() {
            sidebar.classList.toggle('expanded');

            const isExpanded = sidebar.classList.contains('expanded');
            if (isExpanded) {
                openMenuBtn.style.display = 'none';
                closeMenuBtn.style.display = 'flex';
            } else {
                openMenuBtn.style.display = 'flex';
                closeMenuBtn.style.display = 'none';
            }
        }

        // Event Listeners for Menu Toggle
        if (openMenuBtn) openMenuBtn.addEventListener('click', toggleSidebar);
        if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleSidebar);

        // Close sidebar when clicking outside
        document.addEventListener('click', function (event) {
            const isExpanded = sidebar.classList.contains('expanded');
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnOpenBtn = openMenuBtn && openMenuBtn.contains(event.target);

            if (isExpanded && !isClickInsideSidebar && !isClickOnOpenBtn) {
                toggleSidebar();
            }
        });

        function switchView(targetId) {
            // Update Nav Items
            navItems.forEach(item => {
                if (item.dataset.target === targetId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Update View Sections
            viewSections.forEach(section => {
                if (section.id === `view-${targetId}`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Save active view preference
            localStorage.setItem('ctrlBlck_activeView', targetId);
        }

        // Add Click Listeners
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                if (target) {
                    switchView(target);
                }
            });
        });

        // Restore last active view or default to dashboard
        const lastView = localStorage.getItem('ctrlBlck_activeView') || 'dashboard';
        switchView(lastView);
    }

    // Initialize Navigation
    initializeNavigation();
});
