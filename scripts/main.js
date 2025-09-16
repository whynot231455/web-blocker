document.addEventListener("DOMContentLoaded", function () {
    const urlList = document.getElementById("urlList");
    const searchInput = document.getElementById("searchInput");
    const addBtn = document.getElementById("addBtn");
    
    let allUrls = []; // Store all URLs for filtering

    // Fetch URLs from chrome.storage and initialize
    loadURLs();

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

    // Add URL functionality
    addBtn.addEventListener("click", function() {
        addURL();
    });

    // Allow adding URL by pressing Enter
    searchInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            addURL();
        }
    });

    // Search filter - now searches by hostname
    searchInput.addEventListener("input", function () {
        const filter = searchInput.value.toLowerCase();
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

    // Add new URL
    function addURL() {
        const newUrl = searchInput.value.trim();
        if (!newUrl) return;

        // Basic URL validation
        if (!isValidUrl(newUrl)) {
            alert("Please enter a valid URL or domain name");
            return;
        }

        chrome.storage.local.get({ urls: [] }, function (data) {
            const urls = data.urls;
            
            // Check if URL already exists (compare by hostname)
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url));
            
            if (existingHostnames.includes(newHostname)) {
                alert("This website is already in your blocked list");
                return;
            }

            // Add new URL
            urls.push(newUrl);
            chrome.storage.local.set({ urls: urls }, function() {
                allUrls = urls;
                renderList(allUrls);
                searchInput.value = ""; // Clear input
            });
        });
    }

    // Extract hostname from URL
    function extractHostname(url) {
        try {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return new URL(url).hostname;
            } else {
                // Handle domain-only entries
                return url.split('/')[0];
            }
        } catch (e) {
            return url; // Return original if parsing fails
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

            const editBtn = document.createElement("i");
            editBtn.className = "fas fa-pen edit";
            editBtn.title = "Edit URL";
            editBtn.addEventListener("click", () => {
                editURL(url);
            });

            const deleteBtn = document.createElement("i");
            deleteBtn.className = "fas fa-trash delete";
            deleteBtn.title = "Delete URL";
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

    // Edit URL
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
            
            // Check if new URL already exists (compare by hostname)
            const newHostname = extractHostname(newUrl);
            const existingHostnames = urls.map(url => extractHostname(url)).filter(h => h !== extractHostname(oldUrl));
            
            if (existingHostnames.includes(newHostname)) {
                alert("This website is already in your blocked list");
                return;
            }

            // Update URL
            urls = urls.map(u => (u === oldUrl ? newUrl : u));
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


// Improved Add URL functionality with better UX
function addURL() {
    const newUrl = searchInput.value.trim();
    
    if (!newUrl) {
        // Focus on search input and show helpful guidance
        searchInput.focus();
        searchInput.placeholder = "Type a website to block (e.g. youtube.com)";
        searchInput.style.borderColor = "#007bff";
        searchInput.style.boxShadow = "0 0 0 3px rgba(0, 123, 255, 0.25)";
        
        // Reset styling after 3 seconds
        setTimeout(() => {
            searchInput.placeholder = "Search Website";
            searchInput.style.borderColor = "#ddd";
            searchInput.style.boxShadow = "none";
        }, 3000);
        return;
    }

    // Basic URL validation
    if (!isValidUrl(newUrl)) {
        searchInput.style.borderColor = "#dc3545";
        searchInput.style.boxShadow = "0 0 0 3px rgba(220, 53, 69, 0.25)";
        alert("Please enter a valid URL or domain name\n\nExamples:\n• youtube.com\n• facebook.com\n• https://twitter.com");
        searchInput.focus();
        searchInput.select(); // Select all text for easy editing
        
        // Reset error styling after 3 seconds
        setTimeout(() => {
            searchInput.style.borderColor = "#ddd";
            searchInput.style.boxShadow = "none";
        }, 3000);
        return;
    }

    chrome.storage.local.get({ urls: [] }, function (data) {
        const urls = data.urls;
        
        // Check if URL already exists (compare by hostname)
        const newHostname = extractHostname(newUrl);
        const existingHostnames = urls.map(url => extractHostname(url));
        
        if (existingHostnames.includes(newHostname)) {
            searchInput.style.borderColor = "#ffc107";
            searchInput.style.boxShadow = "0 0 0 3px rgba(255, 193, 7, 0.25)";
            alert("This website is already in your blocked list");
            searchInput.focus();
            searchInput.select();
            
            // Reset warning styling
            setTimeout(() => {
                searchInput.style.borderColor = "#ddd";
                searchInput.style.boxShadow = "none";
            }, 3000);
            return;
        }

        // Add new URL with success feedback
        urls.push(newUrl);
        chrome.storage.local.set({ urls: urls }, function() {
            allUrls = urls;
            renderList(allUrls);
            
            // Success feedback
            searchInput.value = ""; // Clear input
            searchInput.placeholder = "✓ Website added successfully!";
            searchInput.style.borderColor = "#28a745";
            searchInput.style.boxShadow = "0 0 0 3px rgba(40, 167, 69, 0.25)";
            
            // Reset to normal after 2 seconds
            setTimeout(() => {
                searchInput.placeholder = "Search Website";
                searchInput.style.borderColor = "#ddd";
                searchInput.style.boxShadow = "none";
            }, 2000);
        });
    });
}
