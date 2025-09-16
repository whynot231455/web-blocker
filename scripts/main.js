document.addEventListener("DOMContentLoaded", function () {
    const urlList = document.getElementById("urlList");
    const searchInput = document.getElementById("searchInput");
   
    let allUrls = []; // Store all URLs for filtering

    // Fetch URLs from chrome.storage and initialize
    loadURLs();

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
                    // Store normalized URL (remove www from domain-only entries)
                    let cleanUrl = url;
                    if (!url.startsWith('http://') && !url.startsWith('https://') && url.toLowerCase().startsWith('www.')) {
                        cleanUrl = url.substring(4);
                    }
                    cleanedUrls.push(cleanUrl);
                }
            });
            
            // Only update if we found duplicates
            if (cleanedUrls.length !== urls.length) {
                chrome.storage.local.set({ urls: cleanedUrls }, function() {
                    allUrls = cleanedUrls;
                    renderList(allUrls);
                    console.log(`Removed ${urls.length - cleanedUrls.length} duplicate hostnames`);
                });
            }
        });
    }

    // ✅ Call cleanup function on load
    removeDuplicateHostnames();

    // Listen for storage changes from other parts of the extension
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && changes.urls) {
            // Update the local array and re-render the list
            allUrls = changes.urls.newValue || [];
            
            // Apply current filter if search input has text
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

    // Refresh when window gains focus (optional - for better sync)
    window.addEventListener("focus", function() {
        loadURLs();
    });

    // ✅ ONLY Enter key adds URL now
    searchInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            addURL();
        }
    });

    // ✅ REAL-TIME validation and color changes as user types
    searchInput.addEventListener("input", function () {
        const inputValue = searchInput.value.trim();
        const searchContainer = document.querySelector('.search-container');
        
        // Reset to default state first
        searchContainer.style.borderColor = "#ddd";
        searchContainer.style.boxShadow = "none";
        
        if (inputValue === "") {
            // Empty input - default state
            searchInput.placeholder = "Search / Add Website (Press Enter to add)";
        } else if (!isValidUrl(inputValue)) {
            // Invalid URL - red state
            searchContainer.style.borderColor = "#dc3545";
            searchContainer.style.boxShadow = "0 0 0 2px rgba(220, 53, 69, 0.2)";
        } else {
            // Check for duplicates in real-time
            const newHostname = extractHostname(inputValue);
            const existingHostnames = allUrls.map(url => extractHostname(url));
            
            if (existingHostnames.includes(newHostname)) {
                // Duplicate - yellow state
                searchContainer.style.borderColor = "#ffc107";
                searchContainer.style.boxShadow = "0 0 0 2px rgba(255, 193, 7, 0.2)";
            } else {
                // Valid and unique - green state
                searchContainer.style.borderColor = "#28a745";
                searchContainer.style.boxShadow = "0 0 0 2px rgba(40, 167, 69, 0.2)";
            }
        }
        
        // Filter the list based on input (existing search functionality)
        const filter = inputValue.toLowerCase();
        const filteredURLs = allUrls.filter(url => {
            const hostname = extractHostname(url);
            return hostname.toLowerCase().includes(filter);
        });
        renderList(filteredURLs);
    });

    // Load URLs from storage
    function loadURLs() {
        chrome.storage.local.get({ urls: [] }, function (data) {
            allUrls = data.urls;
            renderList(allUrls);
        });
    }

    // ✅ SIMPLIFIED Add URL function (validation already done in real-time)
    function addURL() {
        const newUrl = searchInput.value.trim();
        const searchContainer = document.querySelector('.search-container');
        
        if (!newUrl) {
            // Focus on search input and show helpful guidance
            searchInput.focus();
            searchInput.placeholder = "Type a website to block (e.g. youtube.com)";
            
            // ✅ Apply blue styling to search container
            searchContainer.style.borderColor = "#007bff";
            searchContainer.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.25)";
            
            // Reset styling after 3 seconds
            setTimeout(() => {
                searchInput.placeholder = "Add Website (Press Enter to add)";
                searchContainer.style.borderColor = "#ddd";
                searchContainer.style.boxShadow = "none";
            }, 3000);
            return;
        }

        // Basic URL validation
        if (!isValidUrl(newUrl)) {
            // ✅ Apply red styling to search container with stronger effect
            searchContainer.style.borderColor = "#dc3545";
            searchContainer.style.boxShadow = "0 0 0 3px rgba(220, 53, 69, 0.4)";
            
            alert("Please enter a valid URL or domain name\n\nExamples:\n• youtube.com\n• facebook.com\n• https://twitter.com");
            searchInput.focus();
            searchInput.select();
            
            // Reset after 3 seconds
            setTimeout(() => {
                // Trigger input event to restore real-time validation
                searchInput.dispatchEvent(new Event('input'));
            }, 3000);
            return;
        }

        chrome.storage.local.get({ urls: [] }, function (data) {
            const urls = data.urls;
            
            // ✅ Check if hostname already exists
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url));
            
            if (existingHostnames.includes(newHostname)) {
                // ✅ Apply yellow styling with stronger effect
                searchContainer.style.borderColor = "#ffc107";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.4)";
                
                alert("This website is already in your blocked list");
                searchInput.focus();
                searchInput.select();
                
                // Reset after 3 seconds
                setTimeout(() => {
                    // Trigger input event to restore real-time validation
                    searchInput.dispatchEvent(new Event('input'));
                }, 3000);
                return;
            }

            // ✅ NORMALIZE: Store the URL without www if it's a domain-only entry
            let urlToStore = newUrl;
            if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                if (newUrl.toLowerCase().startsWith('www.')) {
                    urlToStore = newUrl.substring(4);
                }
            }

            // Add new URL with success feedback
            urls.push(urlToStore);
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
                
                // Success feedback
                searchInput.value = ""; // Clear input
                searchInput.placeholder = "✓ Website added successfully!";
                
                // ✅ Apply strong green styling for success
                searchContainer.style.borderColor = "#28a745";
                searchContainer.style.boxShadow = "0 0 0 3px rgba(40, 167, 69, 0.4)";
                
                // Reset to normal after 2 seconds
                setTimeout(() => {
                    searchInput.placeholder = "Add Website (Press Enter to add)";
                    searchContainer.style.borderColor = "#ddd";
                    searchContainer.style.boxShadow = "none";
                }, 2000);
            });
        });
    }

    // Rest of your functions remain the same...
    // ✅ Extract hostname from URL and normalize it
    function extractHostname(url) {
        try {
            let hostname;
            
            if (url.startsWith('http://') || url.startsWith('https://')) {
                hostname = new URL(url).hostname;
            } else {
                // Handle domain-only entries
                hostname = url.split('/')[0];
            }
            
            // ✅ NORMALIZE: Remove 'www.' prefix to avoid duplicates
            if (hostname.startsWith('www.')) {
                hostname = hostname.substring(4);
            }
            
            return hostname.toLowerCase();
        } catch (e) {
            // If parsing fails, try to clean up manually
            let cleanUrl = url.toLowerCase();
            if (cleanUrl.startsWith('www.')) {
                cleanUrl = cleanUrl.substring(4);
            }
            return cleanUrl.split('/')[0];
        }
    }

    // Render list items
    function renderList(urls) {
        urlList.innerHTML = "";
        
        if (urls.length === 0) {
            const li = document.createElement("li");
            li.className = "empty-state";
            li.textContent = "No URLs found. Add some websites to block!";
            urlList.appendChild(li);
            return;
        }

        urls.forEach(url => {
            const li = document.createElement("li");
            li.className = "url-item";

            const hostname = extractHostname(url); // Extract hostname for display

            const icon = document.createElement("img");
            icon.src = getFavicon(url);
            icon.className = "icon";
            icon.onerror = function() {
                this.src = "/icons/default-site-icon.svg"; // Fallback icon
            };

            const span = document.createElement("span");
            span.textContent = hostname; // Show hostname only
            span.className = "url-text";
            span.title = url; // Show full URL on hover

            const buttonsContainer = document.createElement("div");
            buttonsContainer.className = "buttons-container";

            // ✅ Create EDIT button as image
            const editBtn = document.createElement("img");
            editBtn.src = "/icons/edit-icon.svg"; // Use edit icon image
            editBtn.className = "edit-icon";
            editBtn.title = "Edit URL";
            editBtn.style.width = "20px";
            editBtn.style.height = "20px";
            editBtn.style.cursor = "pointer";
            editBtn.style.opacity = "1";
            editBtn.addEventListener("click", () => {
                editURL(url);
            });

            // ✅ Create DELETE button as image
            const deleteBtn = document.createElement("img");
            deleteBtn.src = "/icons/delete-icon.svg"; // Use trash icon image
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

    // ✅ UPDATED Edit URL with duplicate prevention
    function editURL(oldUrl) {
        const newUrl = prompt("Edit URL:", oldUrl);
        if (!newUrl || newUrl === oldUrl) return;

        // Validate new URL
        if (!isValidUrl(newUrl)) {
            alert("Please enter a valid URL or domain name");
            return;
        }

        chrome.storage.local.get({ urls: [] }, function (data) {
            let urls = data.urls;
            
            // ✅ IMPROVED: Check if new hostname already exists (exclude current URL)
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url)).filter(h => h !== extractHostname(oldUrl));
            
            if (existingHostnames.includes(newHostname)) {
                alert("This website is already in your blocked list");
                return;
            }

            // ✅ NORMALIZE: Clean the URL before storing
            let urlToStore = newUrl;
            if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
                if (newUrl.toLowerCase().startsWith('www.')) {
                    urlToStore = newUrl.substring(4);
                }
            }

            // Update URL
            urls = urls.map(u => (u === oldUrl ? urlToStore : u));
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
            });
        });
    }

    // Delete URL from chrome.storage
    function deleteURL(url) {
        chrome.storage.local.get({ urls: [] }, function (data) {
            let urls = data.urls.filter(u => u !== url);
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
            });
        });
    }

    // Get favicon for URL
    function getFavicon(url) {
        try {
            let domain;
            if (url.startsWith('http://') || url.startsWith('https://')) {
                domain = new URL(url).hostname;
            } else {
                domain = url.split('/')[0]; // Get domain part
            }
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        } catch (e) {
            return "/icons/default-site-icon.svg"; // Fallback icon
        }
    }

    // Basic URL validation
    function isValidUrl(string) {
        // Allow domain names and full URLs
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
        const urlRegex = /^https?:\/\/.+/;
        
        // Remove protocol if present for domain validation
        const cleanUrl = string.replace(/^https?:\/\//, '').split('/')[0];
        
        return urlRegex.test(string) || domainRegex.test(cleanUrl);
    }
});
