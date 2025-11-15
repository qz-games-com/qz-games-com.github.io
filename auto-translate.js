// Auto-translation based on browser language preferences

class AutoTranslate {
    constructor() {
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;
        this.translateElement = null;
        this.initCheckInterval = null;
    }

    // Get user's preferred language from browser
    getUserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        // Extract just the language code (e.g., 'es' from 'es-MX')
        return browserLang.split('-')[0].toLowerCase();
    }

    // Check if auto-translate is enabled in settings
    isAutoTranslateEnabled() {
        const setting = localStorage.getItem('autoTranslateEnabled');
        return setting === null || setting === 'true'; // Default to true
    }

    // Get saved language preference
    getSavedLanguage() {
        return localStorage.getItem('preferredLanguage');
    }

    // Save language preference
    saveLanguagePreference(langCode) {
        localStorage.setItem('preferredLanguage', langCode);
    }

    // Initialize auto-translation
    init() {
        // Wait for Google Translate element to be available
        this.waitForTranslateElement();
    }

    // Wait for Google Translate to load
    waitForTranslateElement() {
        let attempts = 0;
        const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)

        this.initCheckInterval = setInterval(() => {
            attempts++;

            // Check if Google Translate element exists
            const translateElement = document.querySelector('.goog-te-combo') ||
                                   document.querySelector('select.goog-te-combo');

            if (translateElement) {
                clearInterval(this.initCheckInterval);
                this.translateElement = translateElement;
                this.applyAutoTranslation();
            } else if (attempts >= maxAttempts) {
                clearInterval(this.initCheckInterval);
                console.warn('Google Translate element not found after waiting');
            }
        }, 100);
    }

    // Apply automatic translation based on user preferences
    applyAutoTranslation() {
        if (!this.isAutoTranslateEnabled()) {
            return;
        }

        // Check for saved preference first
        let targetLanguage = this.getSavedLanguage();
        let isFirstTimeAuto = false;

        // If no saved preference, use browser language
        if (!targetLanguage) {
            const browserLang = this.getUserLanguage();
            if (browserLang !== this.defaultLanguage) {
                targetLanguage = browserLang;
                isFirstTimeAuto = true;
            }
        }

        // Translate if we have a target language
        if (targetLanguage && targetLanguage !== this.defaultLanguage) {
            this.translateToLanguage(targetLanguage, isFirstTimeAuto);
        }
    }

    // Translate to specific language
    translateToLanguage(langCode, isAutomatic = false) {
        if (!this.translateElement) {
            console.warn('Translate element not available');
            return;
        }

        // Find the option with matching value
        const options = this.translateElement.options;
        let languageFound = false;
        let languageName = '';

        for (let i = 0; i < options.length; i++) {
            if (options[i].value === langCode) {
                this.translateElement.selectedIndex = i;
                languageName = options[i].text;
                languageFound = true;
                break;
            }
        }

        if (languageFound) {
            // Trigger change event to activate translation
            const event = new Event('change', { bubbles: true });
            this.translateElement.dispatchEvent(event);
            this.currentLanguage = langCode;
            this.saveLanguagePreference(langCode);

            // Show notification to user about auto-translation (only for first-time automatic)
            if (isAutomatic) {
                this.showTranslationNotification(languageName, langCode);
            }
        } else {
            console.warn(`Language code '${langCode}' not found in Google Translate options`);
        }
    }

    // Show notification when auto-translation occurs
    showTranslationNotification(languageName, langCode) {
        // Only show notification for automatic translations (not manual ones)
        const notificationShown = sessionStorage.getItem('autoTranslateNotificationShown');

        if (!notificationShown && typeof issuenote === 'function') {
            const title = 'Auto-Translated';
            const desc = `This page has been automatically translated to ${languageName}. You can disable auto-translation or change languages in Settings.`;

            // Show notification with close button
            issuenote(title, desc, true, 'translate');

            // Mark as shown for this session
            sessionStorage.setItem('autoTranslateNotificationShown', 'true');
        }
    }

    // Reset to default language
    resetToDefault() {
        this.translateToLanguage(this.defaultLanguage);
        localStorage.removeItem('preferredLanguage');
    }

    // Toggle auto-translate feature
    setAutoTranslateEnabled(enabled) {
        localStorage.setItem('autoTranslateEnabled', enabled.toString());

        if (enabled) {
            // Re-apply translation
            this.applyAutoTranslation();
        } else {
            // Reset to default
            this.resetToDefault();
        }
    }

    // Get list of available languages from Google Translate
    getAvailableLanguages() {
        if (!this.translateElement) {
            return [];
        }

        const languages = [];
        const options = this.translateElement.options;

        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.value) {
                languages.push({
                    code: option.value,
                    name: option.text
                });
            }
        }

        return languages;
    }
}

// Create global instance
window.autoTranslate = new AutoTranslate();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.autoTranslate.init();
    });
} else {
    window.autoTranslate.init();
}
