const DEBUG_MODE = false;

function setCookieactiv(name, value, days = 3000) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
}

function getCookieactiv(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

function trackActivity(event) {
    const elementId = event.currentTarget.id;
    
    if (DEBUG_MODE) {
        alert(`Element ID: ${elementId}`);
    } else {
        if (elementId) {
            let activity = getCookieactiv('usractivity');
            let activityData;
            
            try {
                if (activity) {
                    activityData = JSON.parse(activity);
                } else {
                    activityData = [];
                }
                
                const existingGame = activityData.find(game => game.gameKey === elementId);
                
                if (!existingGame) {
                    activityData.push({
                        gameKey: elementId,
                        playTimeHours: 0,
                        playTimeMinutes: 0
                    });
                    
                    console.log('Adding new game to array:', elementId);
                    console.log('Updated activity array:', activityData);
                }
                
                setCookieactiv('usractivity', JSON.stringify(activityData));
                
                // Debug: Check if cookie was saved
                const savedCookie = getCookie('usractivity');
                console.log('Saved cookie value:', savedCookie);
                console.log('Parsed saved data:', JSON.parse(savedCookie));
                
            } catch (error) {
                console.error('Error saving activity to cookie:', error);
            }
        }
    }
}

// Helper function to view current activity data
function viewActivityData() {
    const activity = getCookie('usractivity');
    if (activity) {
        console.log('Current activity data:', JSON.parse(activity));
        return JSON.parse(activity);
    } else {
        console.log('No activity data found');
        return [];
    }
}

// Helper function to clear activity data (for testing)
function clearActivityData() {
    document.cookie = "usractivity=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log('Activity data cleared');
}