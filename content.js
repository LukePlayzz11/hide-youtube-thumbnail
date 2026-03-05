// content.js
// Hide YouTube Thumbnails v2
// Edge / Chrome Manifest V3 compatible
// Hides video thumbnails (images + duration badges) but keeps clean layout + main player untouched

console.log('%c[HYT v2] Content script loaded on YouTube', 'color:#ff0000;font-weight:bold');

const HIDE_CLASS = 'hyt-v2-enabled';

// Comprehensive CSS (image-only hide = best UX, no broken grid)
const CSS_RULES = `
    /* === HIDE THUMBNAILS === */
    ytd-thumbnail img,
    yt-image img,
    img.yt-img-shadow,
    img[src*="i.ytimg.com"],
    .ytd-video-preview img,
    #thumbnail img {
        display: none !important;
    }

    /* Hide duration badge */
    .ytd-thumbnail-overlay-time-status-renderer,
    ytd-thumbnail-overlay-hover-text-renderer {
        display: none !important;
    }

    /* Dark placeholder so cards still look good */
    ytd-thumbnail,
    yt-image {
        background: #181818 !important;
        border-radius: 12px !important;
    }

    /* === DO NOT HIDE MAIN VIDEO PLAYER THUMBNAIL === */
    ytd-player #thumbnail img,
    .html5-video-container img,
    ytd-watch-flexy #player ytd-thumbnail img,
    ytd-player .ytp-thumbnail img {
        display: block !important;
    }
`;

// Create & inject style once
let styleElement = null;

function injectStyles() {
    if (styleElement) return;
    
    styleElement = document.createElement('style');
    styleElement.id = 'hyt-v2-style';
    styleElement.textContent = CSS_RULES;
    (document.head || document.documentElement).appendChild(styleElement);
}

// Toggle hiding on/off
let isEnabled = true;

function applyHiding(enabled) {
    isEnabled = enabled;
    
    if (enabled) {
        document.documentElement.classList.add(HIDE_CLASS);
        injectStyles();
    } else {
        document.documentElement.classList.remove(HIDE_CLASS);
    }
}

// Listen for toggle from popup/background (chrome.storage)
chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled !== undefined) {
        applyHiding(changes.enabled.newValue);
    }
});

// Initial load (read saved preference or default = ON)
async function init() {
    try {
        const result = await chrome.storage.local.get(['enabled']);
        const savedEnabled = result.enabled !== false; // default = true
        applyHiding(savedEnabled);
    } catch (e) {
        console.warn('[HYT v2] Storage not ready yet, defaulting to ON');
        applyHiding(true);
    }

    // MutationObserver = handles infinite scroll, recommendations, SPA navigation
    const observer = new MutationObserver(() => {
        if (isEnabled) injectStyles();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Extra safety for YouTube navigation (SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(() => {
                if (isEnabled) injectStyles();
            }, 800);
        }
    }).observe(document, { subtree: true, childList: true });
}

// Start everything
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
