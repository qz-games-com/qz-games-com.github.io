const DEBUG_MODE = false;
const COOKIE_NAME = 'usractivity';
const COOKIE_EXPIRY_DAYS = 3000;

// Store active game sessions for time tracking
const activeSessions = new Map();

/**
 * Set a cookie with name, value, and expiration
 */
function setCookieActivity(name, value, days = COOKIE_EXPIRY_DAYS) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
}

/**
 * Get a cookie value by name
 */
function getCookieActivity(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    return null;
}

/**
 * Get all activity data from cookie
 */
function getActivityData() {
    const activity = getCookieActivity(COOKIE_NAME);
    try {
        return activity ? JSON.parse(activity) : [];
    } catch (error) {
        console.error('Error parsing activity data:', error);
        return [];
    }
}

/**
 * Save activity data to cookie
 */
function saveActivityData(activityData) {
    try {
        setCookieActivity(COOKIE_NAME, JSON.stringify(activityData));
        return true;
    } catch (error) {
        console.error('Error saving activity to cookie:', error);
        return false;
    }
}

/**
 * Start tracking play time for a game
 */
function startPlaySession(gameKey) {
    if (!gameKey) return;

    // Store start time for this session
    activeSessions.set(gameKey, {
        startTime: Date.now(),
        lastUpdate: Date.now()
    });

    if (DEBUG_MODE) {
        console.log(`Started play session for ${gameKey}`);
    }
}

/**
 * Stop tracking play time and save duration
 */
function stopPlaySession(gameKey) {
    if (!gameKey || !activeSessions.has(gameKey)) return 0;

    const session = activeSessions.get(gameKey);
    const duration = Date.now() - session.startTime;
    activeSessions.delete(gameKey);

    // Update total play time
    updatePlayTime(gameKey, duration);

    if (DEBUG_MODE) {
        console.log(`Stopped play session for ${gameKey}, duration: ${formatDuration(duration)}`);
    }

    return duration;
}

/**
 * Update play time for a game
 */
function updatePlayTime(gameKey, durationMs, incrementPlayCount = false) {
    const activityData = getActivityData();
    let gameData = activityData.find(game => game.gameKey === gameKey);

    if (!gameData) {
        gameData = {
            gameKey: gameKey,
            totalPlayTimeMs: 0,
            playCount: 0,
            firstPlayed: new Date().toISOString(),
            lastPlayed: new Date().toISOString()
        };
        activityData.push(gameData);
    }

    // Update play time and metadata
    gameData.totalPlayTimeMs = (gameData.totalPlayTimeMs || 0) + durationMs;

    // Only increment play count if explicitly told (on new session start)
    if (incrementPlayCount) {
        gameData.playCount = (gameData.playCount || 0) + 1;
    }

    gameData.lastPlayed = new Date().toISOString();

    saveActivityData(activityData);
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Format game data for display
 */
function formatGameData(gameData) {
    return {
        gameKey: gameData.gameKey,
        totalPlayTime: formatDuration(gameData.totalPlayTimeMs || 0),
        playCount: gameData.playCount || 0,
        lastPlayed: gameData.lastPlayed
    };
}

/**
 * Track activity when element is clicked
 */
function trackActivity(event) {
    const elementId = event.currentTarget.id;

    if (DEBUG_MODE) {
        alert(`Element ID: ${elementId}`);
    }

    if (elementId) {
        startPlaySession(elementId);
    }
}

/**
 * View current activity data (formatted)
 */
function viewActivityData() {
    const activityData = getActivityData();

    if (activityData.length === 0) {
        console.log('No activity data found');
        return [];
    }

    const formatted = activityData.map(formatGameData);
    console.table(formatted);
    return activityData;
}

/**
 * Get play time for a specific game
 */
function getGamePlayTime(gameKey) {
    const activityData = getActivityData();
    const gameData = activityData.find(game => game.gameKey === gameKey);

    if (gameData) {
        return formatGameData(gameData);
    }
    return null;
}

/**
 * Clear all activity data (for testing)
 */
function clearActivityData() {
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    activeSessions.clear();
    console.log('Activity data cleared');
}

// Auto-save active sessions before page unload
window.addEventListener('beforeunload', () => {
    for (const [gameKey, session] of activeSessions.entries()) {
        const duration = Date.now() - session.startTime;
        updatePlayTime(gameKey, duration, false); // Don't increment play count on close
    }
    activeSessions.clear();
});

// Auto-start tracking on game page
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arguments.callee);
        return;
    }

    // Check if on game page (use ?name= parameter)
    const params = new URLSearchParams(window.location.search);
    let gameKey = params.get('name');

    // If name not found, fallback to extracting from ?game= path
    if (!gameKey) {
        const gamePath = params.get('game');
        if (gamePath) {
            // Extract just the game name from path like "../Games01/crazyc"
            gameKey = gamePath.split('/').pop();
        }
    }

    if (gameKey) {
        startPlaySession(gameKey);

        // Increment play count on first session start only
        updatePlayTime(gameKey, 0, true);

        // Auto-save every 2 seconds
        setInterval(() => {
            const session = activeSessions.get(gameKey);
            if (session) {
                const duration = Date.now() - session.startTime;
                updatePlayTime(gameKey, duration, false); // Don't increment play count
                session.startTime = Date.now();
            }
        }, 2000);

        // Pause when tab hidden
        document.addEventListener('visibilitychange', () => {
            const session = activeSessions.get(gameKey);
            if (!session) return;

            if (document.hidden) {
                const duration = Date.now() - session.startTime;
                updatePlayTime(gameKey, duration, false); // Don't increment play count
                session.pausedAt = Date.now();
            } else if (session.pausedAt) {
                session.startTime = Date.now();
                delete session.pausedAt;
            }
        });
    }
})();