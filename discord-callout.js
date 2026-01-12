// ========================================
// Discord Callout - Auto-show on first load
// ========================================

// Check if user has seen the Discord callout before
function shouldShowDiscordCallout() {
    const hasSeenCallout = getCookie('discordCalloutSeen');
    return !hasSeenCallout || hasSeenCallout === 'false';
}

// Show Discord callout on first load
function showDiscordCalloutOnLoad() {
    const callout = document.getElementById('discordCallout');

    if (callout && shouldShowDiscordCallout()) {
        // Wait a moment for page to load, then show with animation
        setTimeout(() => {
            callout.classList.add('show');
        }, 1500); // Show after 1.5 seconds
    }
}

// Close Discord callout
function closeDiscordCallout() {
    const callout = document.getElementById('discordCallout');

    if (callout) {
        // Remove the show class
        callout.classList.remove('show');

        // Set cookie so it doesn't auto-show again
        setCookie('discordCalloutSeen', 'true', 30); // Remember for 30 days

        console.log('Discord callout closed - will not auto-show for 30 days');
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showDiscordCalloutOnLoad);
} else {
    showDiscordCalloutOnLoad();
}

// Add keyboard support for close button
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('discordCalloutClose');

    if (closeBtn) {
        closeBtn.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                closeDiscordCallout();
            }
        });
    }
});
