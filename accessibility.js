// ========================================
// Accessibility Enhancements
// Adds keyboard support for ARIA-labeled buttons
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard support for all elements with role="button" and tabindex
    const buttonElements = document.querySelectorAll('[role="button"][tabindex]');

    buttonElements.forEach(element => {
        element.addEventListener('keydown', function(event) {
            // Trigger click on Enter or Space key
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                element.click();
            }
        });

        // Add focus styling for keyboard navigation
        element.addEventListener('focus', function() {
            element.style.outline = '2px solid #4A9EFF';
            element.style.outlineOffset = '2px';
        });

        element.addEventListener('blur', function() {
            element.style.outline = '';
            element.style.outlineOffset = '';
        });
    });

    console.log(`Accessibility: Enhanced ${buttonElements.length} interactive elements with keyboard support`);
});
