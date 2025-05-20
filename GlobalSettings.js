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