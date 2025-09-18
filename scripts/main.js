document.addEventListener("DOMContentLoaded", function () {
    const urlList = document.getElementById("urlList");
    const searchInput = document.getElementById("searchInput");
    const suggestionsDropdown = document.getElementById("suggestions");
   
    let allUrls = []; // Store all URLs for filtering
    let selectedSuggestionIndex = -1;
    let currentSuggestions = [];

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
        chrome.storage.local.get({ countdownDuration: 5 }, function(data) {
            durationDropdown.value = data.countdownDuration;
        });
        
        // Save when changed
        durationDropdown.addEventListener('change', function() {
            const duration = parseInt(this.value);
            chrome.storage.local.set({ countdownDuration: duration }, function() {
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

    // Fetch URLs from chrome.storage and initialize
    loadURLs();
    
    // Initialize settings
    initializeCountdownSetting();

    // ✅ Function to clean up existing duplicates
    function removeDuplicateHostnames() {
        chrome.storage.local.get({ urls: [] }, function (data) {
            const urls = data.urls;
            const seenHostnames = new Set();
            const cleanedUrls = [];
            
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
            
            if (cleanedUrls.length !== urls.length) {
                chrome.storage.local.set({ urls: cleanedUrls }, function() {
                    allUrls = cleanedUrls;
                    renderList(allUrls);
                    console.log(`Removed ${urls.length - cleanedUrls.length} duplicate hostnames`);
                });
            }
        });
    }

    removeDuplicateHostnames();

    // Listen for storage changes
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && changes.urls) {
            allUrls = changes.urls.newValue || [];
            
            if (searchInput.value.trim()) {
                const filter = searchInput.value.toLowerCase();
                const filteredURLs = allUrls.filter(url => {
                    const hostname = extractHostname(url);
                    return hostname.toLowerCase().includes(filter);
                });
                renderList(filteredURLs);
            } else {
                renderList(allUrls);
            }
        }
    });

    window.addEventListener("focus", function() {
        loadURLs();
    });

    // ✅ NEW: Handle keyboard navigation in suggestions
    searchInput.addEventListener("keydown", function(e) {
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

    // ✅ NEW: Enhanced input handler with suggestions
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
                
                if (existingHostnames.includes(newHostname)) {
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

    // ✅ NEW: Show suggestions
    function showSuggestions(query) {
        if (!suggestionsDropdown) return;
        
        const existingHostnames = allUrls.map(url => extractHostname(url));
        
        // Filter popular sites that match the query and aren't already blocked
        const suggestions = popularSites.filter(site => {
            const matches = site.domain.toLowerCase().includes(query.toLowerCase()) || 
                          site.name.toLowerCase().includes(query.toLowerCase());
            const notBlocked = !existingHostnames.includes(site.domain);
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

    // ✅ NEW: Render suggestions
    function renderSuggestions(suggestions) {
        if (!suggestionsDropdown) return;
        
        suggestionsDropdown.innerHTML = suggestions.map((suggestion, index) => `
            <div class="suggestion-item" data-index="${index}" data-domain="${suggestion.domain}">
                <img class="favicon" src="https://www.google.com/s2/favicons?domain=${suggestion.domain}&sz=32" 
                     onerror="this.src='/icons/default-site-icon.svg'" alt="${suggestion.name}">
                <span class="domain">${suggestion.domain}</span>
                <span class="add-icon">+</span>
            </div>
        `).join('');

        // Add click listeners to suggestions
        suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const domain = item.getAttribute('data-domain');
                const suggestion = suggestions.find(s => s.domain === domain);
                selectSuggestion(suggestion);
            });
        });
    }

    // ✅ NEW: Update suggestion selection (keyboard navigation)
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

    // ✅ NEW: Select a suggestion
    function selectSuggestion(suggestion) {
        searchInput.value = suggestion.domain;
        hideSuggestions();
        addURL(); // Automatically add the selected suggestion
    }

    // ✅ NEW: Hide suggestions
    function hideSuggestions() {
        if (suggestionsDropdown) {
            suggestionsDropdown.classList.remove('show');
        }
        currentSuggestions = [];
        selectedSuggestionIndex = -1;
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container-wrapper')) {
            hideSuggestions();
        }
    });

    // Load URLs from storage
    function loadURLs() {
        chrome.storage.local.get({ urls: [] }, function (data) {
            allUrls = data.urls;
            renderList(allUrls);
        });
    }

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

        chrome.storage.local.get({ urls: [] }, function (data) {
            const urls = data.urls;
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url));
            
            if (existingHostnames.includes(newHostname)) {
                if (searchContainer) {
                    searchContainer.style.borderColor = "#ffc107";
                    searchContainer.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.4)";
                }
                alert("This website is already in your blocked list");
                searchInput.focus();
                searchInput.select();
                
                setTimeout(() => {
                    searchInput.dispatchEvent(new Event('input'));
                }, 3000);
                return;
            }

            let urlToStore = newUrl;
            if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                if (newUrl.toLowerCase().startsWith('www.')) {
                    urlToStore = newUrl.substring(4);
                }
            }

            urls.push(urlToStore);
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
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
            });
        });
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

    // Render list items with enhanced UI
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

        urls.forEach(url => {
            const li = document.createElement("li");
            li.className = "url-item";

            const hostname = extractHostname(url);

            const icon = document.createElement("img");
            icon.src = getFavicon(url);
            icon.className = "icon";
            icon.onerror = function() {
                this.src = "/icons/default-site-icon.svg";
            };

            const span = document.createElement("span");
            span.textContent = hostname;
            span.className = "url-text";
            span.title = url;

            const buttonsContainer = document.createElement("div");
            buttonsContainer.className = "buttons-container";

            const editBtn = document.createElement("img");
            editBtn.src = "/icons/edit-icon.svg";
            editBtn.className = "edit-icon";
            editBtn.title = "Edit URL";
            editBtn.style.width = "20px";
            editBtn.style.height = "20px";
            editBtn.style.cursor = "pointer";
            editBtn.style.opacity = "1";
            editBtn.addEventListener("click", () => {
                editURL(url);
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

            buttonsContainer.appendChild(editBtn);
            buttonsContainer.appendChild(deleteBtn);

            li.appendChild(icon);
            li.appendChild(span);
            li.appendChild(buttonsContainer);
            urlList.appendChild(li);
        });
    }

    // Edit URL function
    function editURL(oldUrl) {
        const newUrl = prompt("Edit URL:", oldUrl);
        if (!newUrl || newUrl === oldUrl) return;

        if (!isValidUrl(newUrl)) {
            alert("Please enter a valid URL or domain name");
            return;
        }

        chrome.storage.local.get({ urls: [] }, function (data) {
            let urls = data.urls;
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url)).filter(h => h !== extractHostname(oldUrl));
            
            if (existingHostnames.includes(newHostname)) {
                alert("This website is already in your blocked list");
                return;
            }

            let urlToStore = newUrl;
            if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                if (newUrl.toLowerCase().startsWith('www.')) {
                    urlToStore = newUrl.substring(4);
                }
            }

            urls = urls.map(u => (u === oldUrl ? urlToStore : u));
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
            });
        });
    }

    // Delete URL function
    function deleteURL(url) {
        chrome.storage.local.get({ urls: [] }, function (data) {
            let urls = data.urls.filter(u => u !== url);
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
            });
        });
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
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && currentSuggestions.length === 0) {
            addURL();
        }
    });
});
