// ===================================
// Error Reporter with Optimized Compression
// ===================================
// Press '\' key to generate error report and copy to clipboard

class ErrorReporter {
    constructor() {
        this.consoleLogs = [];
        this.maxLogs = 100;
        this.lastError = null;

        // Optimized settings (configured as requested)
        this.screenshotEnabled = true;
        this.screenshotQuality = 0.3;  // 30% quality
        this.screenshotScale = 0.3;    // 30% scale
        this.maxConsoleLogsInReport = 25;  // 25 logs
        this.maxLogLength = 200;  // Truncate logs to 200 chars

        this.captureConsoleLogs();
        this.setupErrorHandler();
    }

    // Intercept console methods
    captureConsoleLogs() {
        const self = this;
        ['log', 'error', 'warn', 'info'].forEach(method => {
            const original = console[method];
            console[method] = function(...args) {
                self.addLog(method, args);
                original.apply(console, args);
            };
        });
    }

    setupErrorHandler() {
        const self = this;
        window.addEventListener('error', (event) => {
            self.lastError = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack || 'No stack trace available'
            };
            console.error('Error caught:', event.message);
        });

        // Also capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            self.lastError = {
                message: 'Unhandled Promise Rejection: ' + event.reason,
                type: 'promise',
                stack: event.reason?.stack || 'No stack trace available'
            };
            console.error('Unhandled promise rejection:', event.reason);
        });
    }

    addLog(type, args) {
        let message = args.map(a => {
            if (typeof a === 'object') {
                try {
                    return JSON.stringify(a, null, 2);
                } catch (e) {
                    return String(a);
                }
            }
            return String(a);
        }).join(' ');

        // Truncate message if too long (for storage efficiency)
        if (message.length > this.maxLogLength) {
            message = message.substring(0, this.maxLogLength) + '...';
        }

        this.consoleLogs.push({
            type,
            message,
            timestamp: Date.now()
        });

        // Keep only last maxLogs entries
        if (this.consoleLogs.length > this.maxLogs) {
            this.consoleLogs.shift();
        }
    }

    async generateReport(errorInfo = null) {
        console.log('Generating error report...');

        const report = {
            error: errorInfo || this.lastError || { message: 'Manual report - no error' },
            console: this.consoleLogs.slice(-this.maxConsoleLogsInReport), // Last 25 logs
            screenshot: this.screenshotEnabled ? await this.captureScreenshot() : null,
            device: this.getDeviceInfo(),
            timestamp: new Date().toISOString(),
            url: window.location.href,
            settings: this.getUserSettings(),
            performance: this.getPerformanceMetrics()
        };

        console.log('Report data collected, compressing...');
        return this.compressReport(report);
    }

    async captureScreenshot() {
        try {
            console.log('Capturing screenshot...');

            // Check if html2canvas is loaded
            if (typeof html2canvas === 'undefined') {
                console.warn('html2canvas not loaded, skipping screenshot');
                return null;
            }

            const canvas = await html2canvas(document.body, {
                scale: this.screenshotScale, // 30% scale
                logging: false,
                width: Math.min(window.innerWidth, 1200), // Max 1200px width
                height: Math.min(window.innerHeight, 900) // Max 900px height
            });
            return canvas.toDataURL('image/jpeg', this.screenshotQuality); // 30% quality
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            return null;
        }
    }

    getDeviceInfo() {
        // Shorten user agent to save space
        const ua = navigator.userAgent;
        const shortUA = ua.length > 100 ? ua.substring(0, 100) + '...' : ua;

        return {
            userAgent: shortUA,
            platform: navigator.platform,
            screenSize: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            memory: navigator.deviceMemory || 'N/A',
            cores: navigator.hardwareConcurrency || 'N/A',
            online: navigator.onLine
        };
    }

    getUserSettings() {
        const cookies = document.cookie.split(';');
        const settings = {};
        cookies.forEach(cookie => {
            const [key, value] = cookie.split('=').map(s => s.trim());
            if (key) settings[key] = value;
        });
        return settings;
    }

    getPerformanceMetrics() {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
            loadTime: perf ? Math.round(perf.loadEventEnd - perf.fetchStart) : 'unknown',
            domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd - perf.fetchStart) : 'unknown',
            memoryUsed: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 'unknown'
        };
    }

    compressReport(report) {
        const json = JSON.stringify(report);
        const originalSize = json.length;
        console.log(`Original JSON size: ${originalSize} bytes`);

        // Check if LZString is loaded
        if (typeof LZString === 'undefined') {
            console.error('LZString not loaded! Cannot compress report.');
            return {
                code: 'ERROR: LZString library not loaded',
                stats: { originalSize, compressedSize: 0, ratio: 0 }
            };
        }

        // OPTIMIZED: Use compressToEncodedURIComponent for better compression
        const compressed = LZString.compressToEncodedURIComponent(json);
        const compressedSize = compressed.length;
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        console.log(`Compressed size: ${compressedSize} bytes`);
        console.log(`Compression ratio: ${ratio}% reduction`);

        // Calculate final code size with prefix
        const finalCode = `ERR-${compressed}`;
        const finalSize = finalCode.length;

        return {
            code: finalCode,
            stats: {
                originalSize,
                compressedSize,
                finalSize,
                ratio,
                timestamp: report.timestamp,
                screenshotIncluded: report.screenshot !== null
            }
        };
    }

    decompressReport(errorCode) {
        try {
            const compressed = errorCode.replace('ERR-', '');

            // Try new encoding first (EncodedURIComponent)
            let json = LZString.decompressFromEncodedURIComponent(compressed);

            // Fallback to old Base64 encoding if that fails
            if (!json) {
                console.log('Trying Base64 fallback...');
                json = LZString.decompressFromBase64(compressed);
            }

            if (!json) throw new Error('Decompression failed');
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to decompress report:', error);
            return null;
        }
    }

    clearLogs() {
        this.consoleLogs = [];
        console.log('Console logs cleared');
    }

    async generateAndCopyReport() {
        try {
            // Generate the report
            const result = await this.generateReport();

            // Copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(result.code);
                alert('Error report saved to your clipboard - paste into the bug report form');
                console.log('Report copied to clipboard successfully');
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = result.code;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Error report saved to your clipboard - paste into the bug report form');
                console.log('Report copied to clipboard (fallback method)');
            }

            // Log stats
            console.log('Report stats:', {
                originalSize: `${(result.stats.originalSize / 1024).toFixed(1)}KB`,
                finalSize: `${(result.stats.finalSize / 1024).toFixed(1)}KB`,
                reduction: `${result.stats.ratio}%`,
                screenshot: result.stats.screenshotIncluded ? 'Yes' : 'No'
            });

            return result;
        } catch (error) {
            console.error('Failed to generate or copy report:', error);
            alert('Failed to generate error report. Check console for details.');
            return null;
        }
    }
}

// Initialize error reporter
let errorReporter = null;

function initErrorReporter() {
    if (errorReporter) return; // Already initialized

    errorReporter = new ErrorReporter();
    console.log('Error Reporter initialized! Press \\ key to generate report.');

    // Add keyboard listener for backslash key
    document.addEventListener('keydown', (event) => {
        // Check if backslash key is pressed
        if (event.key === '\\' || event.keyCode === 220) {
            // Don't trigger if user is typing in an input field
            if (event.target.tagName === 'INPUT' ||
                event.target.tagName === 'TEXTAREA' ||
                event.target.isContentEditable) {
                return;
            }

            console.log('Backslash key pressed - generating error report...');
            event.preventDefault();
            errorReporter.generateAndCopyReport();
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorReporter);
} else {
    initErrorReporter();
}

// Export for manual use
window.ErrorReporter = ErrorReporter;
window.errorReporter = errorReporter;
