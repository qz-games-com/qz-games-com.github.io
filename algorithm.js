let gamesData = {};

class GameRecommendationEngine {
    constructor(gamesData) {
        this.games = gamesData;
        this.gameKeys = Object.keys(gamesData);
    }

    // Main recommendation function
    getRecommendations(userActivity, count = 6) {
        if (!userActivity || userActivity.length === 0) {
            return this.getPopularGames(count);
        }

        const playedGameKeys = userActivity.map(activity => activity.gameKey);
        const availableGames = this.gameKeys.filter(key => !playedGameKeys.includes(key));
        
        if (availableGames.length === 0) {
            return this.getPopularGames(count);
        }

        const categoryPrefs = this.getUserCategoryPreferences(userActivity);
        
        const scoredGames = availableGames.map(gameKey => {
            const game = this.games[gameKey];
            const score = this.calculateGameScore(game, gameKey, categoryPrefs, userActivity);
            
            return {
                gameKey,
                game,
                score: Math.round(score * 100) / 100
            };
        });

        // Sort with some randomization for similar scores
        const sortedGames = scoredGames.sort((a, b) => {
            const scoreDiff = b.score - a.score;
            if (Math.abs(scoreDiff) <= 5) {
                return Math.random() - 0.5;
            }
            return scoreDiff;
        });

        return sortedGames
            .slice(0, count)
            .map(item => ({
                key: item.gameKey,
                ...item.game,
                recommendationScore: Math.min(100, Math.max(0, Math.round(item.score)))
            }));
    }

    calculateGameScore(game, gameKey, categoryPrefs, userActivity) {
        let score = 0;

        // Base score with randomization
        score += Math.random() * 20 + 20;

        // Category matching score
        const categoryScore = this.getCategoryScore(categoryPrefs, game);
        score += Math.min(categoryScore * 10, 40);

        // Series bonus
        const seriesScore = this.getSeriesScore(userActivity, gameKey, game);
        score += seriesScore * 15;

        // Gradient/visual preference score
        const gradientScore = this.getGradientScore(userActivity, game);
        score += gradientScore * 2;

        // Popularity bonus
        const popularityBonus = Math.random() * 10;
        score += popularityBonus;

        return Math.max(0, Math.min(100, score));
    }

    getCategoryScore(categoryPrefs, targetGame) {
        const targetCategories = this.parseCategories(targetGame.catagory);
        
        let matchScore = 0;
        targetCategories.forEach(category => {
            if (categoryPrefs[category]) {
                matchScore += categoryPrefs[category];
            }
        });

        return matchScore;
    }

    getUserCategoryPreferences(userActivity) {
        const preferences = {};
        
        userActivity.forEach(activity => {
            const game = this.games[activity.gameKey];
            if (game) {
                const categories = this.parseCategories(game.catagory);
                
                // Use multiple weight factors for more accurate preferences
                let weight = 1;
                
                // Time-based weight (prioritize both systems)
                if (activity.playTimeHours !== undefined && activity.playTimeMinutes !== undefined) {
                    weight = this.getTotalPlayTimeInMinutes(activity);
                } else if (activity.playTime) {
                    weight = activity.playTime;
                }
                
                // Rating-based weight
                if (activity.rating) {
                    weight *= activity.rating;
                }
                
                categories.forEach(category => {
                    preferences[category] = (preferences[category] || 0) + weight;
                });
            }
        });

        // Normalize preferences
        const maxWeight = Math.max(...Object.values(preferences));
        if (maxWeight > 0) {
            Object.keys(preferences).forEach(cat => {
                preferences[cat] = preferences[cat] / maxWeight;
            });
        }

        return preferences;
    }

    getTotalPlayTimeInMinutes(activity) {
        const hours = activity.playTimeHours || 0;
        const minutes = activity.playTimeMinutes || 0;
        return (hours * 60) + minutes;
    }

    parseCategories(categoryString) {
        if (!categoryString) return [];
        return categoryString.toLowerCase().split(' ').filter(cat => cat.length > 0);
    }

    getSeriesScore(userActivity, targetGameKey, targetGame) {
        try {
            const targetSeries = this.getGameSeries(targetGameKey, targetGame);
            if (!targetSeries) return 0;

            const hasPlayedInSeries = userActivity.some(activity => {
                const game = this.games[activity.gameKey];
                if (!game) return false;
                const series = this.getGameSeries(activity.gameKey, game);
                return series === targetSeries;
            });

            return hasPlayedInSeries ? 1 : 0;
        } catch (error) {
            console.warn('Error calculating series score:', error);
            return 0;
        }
    }

    getGameSeries(gameKey, game) {
        if (!game || !game.name || typeof game.name !== 'string') return null;
        if (!gameKey || typeof gameKey !== 'string') return null;
        
        const name = game.name.toLowerCase();
        const key = gameKey.toLowerCase();
        
        // Extended series detection
        if (name.includes('fnaf') || key.includes('five nights') || name.includes('five nights')) return 'fnaf';
        if (name.includes('motox3m') || key.includes('moto x3m') || name.includes('moto x3m')) return 'motox3m';
        if (name.includes('madalin') || key.includes('madalin')) return 'madalin';
        if (name.includes('basket') || key.includes('basket')) return 'basketball';
        if (name.includes('subway') || key.includes('subway')) return 'subway';
        if (name.includes('temple') || key.includes('temple')) return 'temple';
        
        return null;
    }

    getGradientScore(userActivity, targetGame) {
        if (!targetGame.gradient) return 0;
        
        const userGradients = {};
        
        userActivity.forEach(activity => {
            const game = this.games[activity.gameKey];
            if (game && game.gradient) {
                const playTime = activity.playTimeHours !== undefined ? 
                    this.getTotalPlayTimeInMinutes(activity) : 
                    (activity.playTime || 1);
                userGradients[game.gradient] = (userGradients[game.gradient] || 0) + playTime;
            }
        });

        return userGradients[targetGame.gradient] || 0;
    }

    getPopularGames(count = 6) {
        const popularGames = [
            'slope', 'geometry dash', 'minecraft', 'superhot', 
            'tunnel rush', 'cookie clicker', 'bitlife', 'fnaf'
        ];
        
        // Mix of predetermined popular games and random selection
        const availablePopular = popularGames.filter(key => this.games[key]);
        const shuffledAll = [...this.gameKeys].sort(() => Math.random() - 0.5);
        
        const finalList = [...availablePopular, ...shuffledAll]
            .filter((key, index, arr) => arr.indexOf(key) === index) // Remove duplicates
            .slice(0, count);
        
        return finalList.map(key => ({
            key,
            ...this.games[key],
            recommendationScore: Math.floor(Math.random() * 30) + 70
        }));
    }

    getGamesByCategory(category, count = 10) {
        return this.gameKeys
            .filter(key => {
                const game = this.games[key];
                return this.parseCategories(game.catagory).includes(category.toLowerCase());
            })
            .slice(0, count)
            .map(key => ({ key, ...this.games[key] }));
    }

    getSimilarGames(gameKey, count = 5) {
        const targetGame = this.games[gameKey];
        if (!targetGame) return [];

        const targetCategories = this.parseCategories(targetGame.catagory);
        const otherGames = this.gameKeys.filter(key => key !== gameKey);

        const similarGames = otherGames.map(key => {
            const game = this.games[key];
            const categories = this.parseCategories(game.catagory);
            
            // Count category overlaps
            const overlap = categories.filter(cat => targetCategories.includes(cat)).length;
            const seriesBonus = this.getGameSeries(key, game) === this.getGameSeries(gameKey, targetGame) ? 2 : 0;
            
            return {
                key,
                game,
                similarity: overlap + seriesBonus
            };
        });

        return similarGames
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, count)
            .map(item => ({ key: item.key, ...item.game }));
    }
}

// Main application logic
let recommender;
let currentRecommendations = [];
let loadedCount = 0;
const batchSize = 6;
let userActivity = [];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function getUserActivityFromCookie() {
    try {
        // Check both possible cookie names
        let cookieValue = getCookie('usractivity');
        
        if (!cookieValue) {
            return null;
        }
        
        const parsedActivity = JSON.parse(decodeURIComponent(cookieValue));
        return Array.isArray(parsedActivity) ? parsedActivity : null;
    } catch (error) {
        console.error('Error parsing user activity cookie:', error);
        return null;
    }
}

async function initializePage() {
    try {
        const response = await fetch('games.json');
        if (!response.ok) {
            throw new Error('Failed to fetch games data');
        }
        gamesData = await response.json();
        
        userActivity = getUserActivityFromCookie();
        
        recommender = new GameRecommendationEngine(gamesData);
        
        setTimeout(() => {
            generateRecommendations();
            hideLoadingScreen();
            setupScrollListener();
        }, 2000);
    } catch (error) {
        console.error('Error loading games data:', error);
        
        gamesData = {};
        userActivity = getUserActivityFromCookie();
        recommender = new GameRecommendationEngine(gamesData);
        
        setTimeout(() => {
            if (Object.keys(gamesData).length === 0) {
                showNoGamesMessage();
            } else {
                generateRecommendations();
            }
            hideLoadingScreen();
            setupScrollListener();
        }, 2000);
    }
}

function generateRecommendations() {
    if (Object.keys(gamesData).length === 0) {
        showNoGamesMessage();
        return;
    }
    
    if (!userActivity || userActivity.length === 0) {
        showNoActivityMessage();
        return;
    }
    
    currentRecommendations = recommender.getRecommendations(userActivity, 24);
    loadInitialGames();
}

function loadInitialGames() {
    const initialGames = currentRecommendations.slice(0, batchSize);
    loadedCount = batchSize;
    displayGames(initialGames);
}

function displayGames(games) {
    const gamesGrid = document.getElementById('gamesGrid');
    
    games.forEach(game => {
        const gameCard = createGameCard(game);
        gamesGrid.appendChild(gameCard);
    });
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    card.setAttribute('data-game-link', game.link || '');
    card.setAttribute('data-game-type', game.type || 'html');
    
    card.onclick = () => playGame(game);

    const thumb = document.createElement('div');
    thumb.className = 'game-thumb';
    thumb.style.backgroundImage = `url('/covers/${game.cover}')`;
    card.appendChild(thumb);

    const body = document.createElement('div');
    body.className = 'game-body';

    const title = document.createElement('h3');
    title.className = 'game-title';
    title.textContent = game.name;
    body.appendChild(title);

    const cats = document.createElement('div');
    cats.className = 'game-categories';
    if (game.catagory) {
        game.catagory.split(' ').forEach(cat => {
            const span = document.createElement('span');
            span.className = 'game-category';
            span.textContent = cat;
            cats.appendChild(span);
        });
    }
    body.appendChild(cats);

    const score = document.createElement('div');
    score.className = 'game-score';
    score.textContent = `Match: ${game.recommendationScore}%`;
    body.appendChild(score);

    const playButton = document.createElement('div');
    playButton.className = 'game-play-button';
    playButton.textContent = '▶ Play';
    body.appendChild(playButton);

    card.appendChild(body);
    return card;
}

function showNoGamesMessage() {
    const gamesGrid = document.getElementById('gamesGrid');
    const message = document.createElement('div');
    message.style.textAlign = 'center';
    message.style.gridColumn = '1 / -1';
    message.style.padding = '2rem';
    message.innerHTML = '<h3>No games data loaded</h3><p>Please ensure games.json is available and properly formatted.</p>';
    gamesGrid.appendChild(message);
}

function showNoActivityMessage() {
    const gamesGrid = document.getElementById('gamesGrid');
    const message = document.createElement('div');
    message.style.textAlign = 'center';
    message.style.gridColumn = '1 / -1';
    message.style.padding = '2rem';
    message.innerHTML = '<h3>You haven\'t played any games yet</h3><p>Start playing some games to get personalized recommendations!</p>';
    gamesGrid.appendChild(message);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        mainContent.classList.add('visible');
    }, 500);
}

function setupScrollListener() {
    window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        
        if (scrollPercent > 60) {
            showSeeMoreButton();
        }
    });
}

function showSeeMoreButton() {
    const seeMoreContainer = document.getElementById('seeMoreContainer');
    if (loadedCount < currentRecommendations.length) {
        seeMoreContainer.classList.add('visible');
    }
}

function loadMoreRecommendations() {
    const seeMoreBtn = document.getElementById('seeMoreBtn');
    seeMoreBtn.disabled = true;
    seeMoreBtn.textContent = 'Loading...';
    
    setTimeout(() => {
        const nextBatch = currentRecommendations.slice(loadedCount, loadedCount + batchSize);
        displayGames(nextBatch);
        loadedCount += batchSize;
        
        seeMoreBtn.disabled = false;
        
        if (loadedCount >= currentRecommendations.length) {
            seeMoreBtn.textContent = 'No More Games!';
            seeMoreBtn.disabled = true;
        } else {
            seeMoreBtn.textContent = '🚀 See More Recommendations';
        }
    }, 1000);
}

function playGame(game) {
    if (game.link) {
        window.location.href = game.link;
    } else {
        alert(`No link available for ${game.name}`);
    }
}

// Initialize the page
initializePage();