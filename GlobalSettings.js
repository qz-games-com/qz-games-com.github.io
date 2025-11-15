let preventp = getCookie('preventPageClose');

if(preventp === 'true') {
    // flag this true whenever you have something to protect (e.g. unsaved form data)
    let shouldConfirm = true;

    window.addEventListener('beforeunload', function(e) {
        if (!shouldConfirm) return;
        // Some browsers require you call preventDefault()
        e.preventDefault();
        // Chrome (and most modern browsers) will show a generic prompt if you set returnValue:
        e.returnValue = ''; 
        // Firefox will use the returned string in older versions:
        return '';
    });
}

let disableAN = getCookie('disableAnimations')
if(disableAN === 'true') {
    const style = document.createElement('style');
    style.id = 'disable-animations';
    // Add rules to zero‑out any animation/transition
    style.textContent = `
    *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important; /* disables smooth scrolling */
    }
    `;
    // Inject it into <head>
    document.head.appendChild(style);
}

// Reduce Visual Effects
let reduceEffects = localStorage.getItem('reduceVisualEffects');
if(reduceEffects === 'true') {
    // Apply class to body as soon as possible
    document.documentElement.classList.add('reduce-effects');
    if (document.body) {
        document.body.classList.add('reduce-effects');
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('reduce-effects');
        });
    }
}

// Auto-Translate functionality
// Load Google Translate script if auto-translate is enabled
function loadGoogleTranslateScript() {
    const autoTranslateEnabled = localStorage.getItem('autoTranslateEnabled');

    // Default to true if not set (first time users)
    if (autoTranslateEnabled === null || autoTranslateEnabled === 'true') {
        // Only load if not already loaded
        if (!document.getElementById('translatescript')) {
            const script = document.createElement('script');
            script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.type = 'text/javascript';
            script.id = 'translatescript';
            script.async = true;
            document.head.appendChild(script);
        }
    }
}

// Initialize Google Translate Element if not already defined
if (typeof googleTranslateElementInit === 'undefined') {
    window.googleTranslateElementInit = function() {
        // Create hidden element for Google Translate
        if (!document.getElementById('google_translate_element')) {
            const div = document.createElement('div');
            div.id = 'google_translate_element';
            div.style.display = 'none';
            document.body.appendChild(div);
        }

        new google.translate.TranslateElement({
            pageLanguage: 'en',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
    };
}

// Load translate script on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGoogleTranslateScript);
} else {
    loadGoogleTranslateScript();
}

// Load auto-translate.js script for automatic language detection
(function loadAutoTranslateScript() {
    // Only load on pages that don't already have it
    if (!document.querySelector('script[src*="auto-translate.js"]')) {
        const autoScript = document.createElement('script');
        autoScript.src = './auto-translate.js';
        autoScript.type = 'text/javascript';

        // Handle both root and subdirectory paths
        if (window.location.pathname.includes('/Games/')) {
            autoScript.src = '../auto-translate.js';
        }

        document.head.appendChild(autoScript);
    }
})();

