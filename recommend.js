/*
var useractivity = getCookie('usractivity0')
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
        
        const scoredGames = availableGames.map(gameKey => {
            const game = this.games[gameKey];
            let score = 0;

            // Category matching (main scoring factor)
            const categoryScore = this.getCategoryScore(userActivity, game);
            score += categoryScore * 10;

            // Series bonus (if user played one game in a series, recommend others)
            const seriesScore = this.getSeriesScore(userActivity, gameKey, game);
            score += seriesScore * 15;

            // Gradient/theme similarity
            const gradientScore = this.getGradientScore(userActivity, game);
            score += gradientScore * 2;

            // Add some randomness to avoid always showing the same recommendations
            score += Math.random() * 5;

            return {
                gameKey,
                game,
                score: Math.round(score * 100) / 100
            };
        });

        return scoredGames
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => ({
                key: item.gameKey,
                ...item.game,
                recommendationScore: item.score
            }));
    }

    // Calculate category preference score
    getCategoryScore(userActivity, targetGame) {
        const userCategoryPrefs = this.getUserCategoryPreferences(userActivity);
        const targetCategories = this.parseCategories(targetGame.catagory);
        
        let matchScore = 0;
        targetCategories.forEach(category => {
            if (userCategoryPrefs[category]) {
                matchScore += userCategoryPrefs[category];
            }
        });

        return matchScore;
    }

    // Get user's category preferences based on play history
    getUserCategoryPreferences(userActivity) {
        const preferences = {};
        
        userActivity.forEach(activity => {
            const game = this.games[activity.gameKey];
            if (game) {
                const categories = this.parseCategories(game.catagory);
                const weight = activity.playTime || activity.rating || 1;
                
                categories.forEach(category => {
                    preferences[category] = (preferences[category] || 0) + weight;
                });
            }
        });

        return preferences;
    }

    // Parse category string into array
    parseCategories(categoryString) {
        return categoryString.toLowerCase().split(' ').filter(cat => cat.length > 0);
    }

    // Bonus for game series (FNAF, MotoX3M, etc.)
    getSeriesScore(userActivity, targetGameKey, targetGame) {
        const targetSeries = this.getGameSeries(targetGameKey, targetGame);
        if (!targetSeries) return 0;

        const hasPlayedInSeries = userActivity.some(activity => {
            const game = this.games[activity.gameKey];
            const series = this.getGameSeries(activity.gameKey, game);
            return series === targetSeries;
        });

        return hasPlayedInSeries ? 1 : 0;
    }

    // Identify game series
    getGameSeries(gameKey, game) {
        const name = game.name.toLowerCase();
        const key = gameKey.toLowerCase();
        
        if (name.includes('fnaf') || key.includes('five nights')) return 'fnaf';
        if (name.includes('motox3m') || key.includes('moto x3m')) return 'motox3m';
        if (name.includes('madalin')) return 'madalin';
        if (name.includes('basket')) return 'basketball';
        
        return null;
    }

    // Color/gradient similarity (users might prefer certain visual themes)
    getGradientScore(userActivity, targetGame) {
        const userGradients = {};
        
        userActivity.forEach(activity => {
            const game = this.games[activity.gameKey];
            if (game) {
                const gradient = game.gradient;
                userGradients[gradient] = (userGradients[gradient] || 0) + 1;
            }
        });

        return userGradients[targetGame.gradient] || 0;
    }

    // Fallback for new users - return popular/diverse games
    getPopularGames(count = 6) {
        const popularGames = [
            'slope', 'geometry dash', 'minecraft', 'superhot', 
            'tunnel rush', 'cookie clicker', 'bitlife', 'fnaf'
        ];
        
        return popularGames.slice(0, count).map(key => ({
            key,
            ...this.games[key],
            recommendationScore: 'Popular'
        }));
    }

    // Get games by specific category
    getGamesByCategory(category, count = 10) {
        return this.gameKeys
            .filter(key => {
                const game = this.games[key];
                return this.parseCategories(game.catagory).includes(category.toLowerCase());
            })
            .slice(0, count)
            .map(key => ({ key, ...this.games[key] }));
    }

    // Get similar games to a specific game
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

// Usage example:
// const recommender = new GameRecommendationEngine(gamesData);

// Example user activity structure:
// const userActivity = [
//     { gameKey: 'slope', playTime: 15, rating: 5 },
//     { gameKey: 'fnaf', playTime: 30, rating: 4 },
//     { gameKey: 'geometry dash', playTime: 45, rating: 5 }
// ];

// Get recommendations:
// const recommendations = recommender.getRecommendations(userActivity, 6);
// console.log(recommendations);

// Get games by category:
// const horrorGames = recommender.getGamesByCategory('horror', 5);

// Get similar games:
// const similarToSlope = recommender.getSimilarGames('slope', 4);
*/
var useractivity = getCookie('usractivity0')
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
        
        const scoredGames = availableGames.map(gameKey => {
            const game = this.games[gameKey];
            let score = 0;

            const categoryScore = this.getCategoryScore(userActivity, game);
            score += categoryScore * 10;

            const seriesScore = this.getSeriesScore(userActivity, gameKey, game);
            score += seriesScore * 15;

            const gradientScore = this.getGradientScore(userActivity, game);
            score += gradientScore * 2;

            score += Math.random() * 5;

            return {
                gameKey,
                game,
                score: Math.round(score * 100) / 100
            };
        });

        return scoredGames
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => ({
                key: item.gameKey,
                ...item.game,
                recommendationScore: item.score
            }));
    }

    getCategoryScore(userActivity, targetGame) {
        const userCategoryPrefs = this.getUserCategoryPreferences(userActivity);
        const targetCategories = this.parseCategories(targetGame.catagory);
        
        let matchScore = 0;
        targetCategories.forEach(category => {
            if (userCategoryPrefs[category]) {
                matchScore += userCategoryPrefs[category];
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
                const weight = this.getTotalPlayTimeInMinutes(activity);
                
                categories.forEach(category => {
                    preferences[category] = (preferences[category] || 0) + weight;
                });
            }
        });

        return preferences;
    }

    getTotalPlayTimeInMinutes(activity) {
        const hours = activity.playTimeHours || 0;
        const minutes = activity.playTimeMinutes || 0;
        return (hours * 60) + minutes;
    }

    parseCategories(categoryString) {
        return categoryString.toLowerCase().split(' ').filter(cat => cat.length > 0);
    }

    getSeriesScore(userActivity, targetGameKey, targetGame) {
        const targetSeries = this.getGameSeries(targetGameKey, targetGame);
        if (!targetSeries) return 0;

        const hasPlayedInSeries = userActivity.some(activity => {
            const game = this.games[activity.gameKey];
            const series = this.getGameSeries(activity.gameKey, game);
            return series === targetSeries;
        });

        return hasPlayedInSeries ? 1 : 0;
    }

    getGameSeries(gameKey, game) {
        const name = game.name.toLowerCase();
        const key = gameKey.toLowerCase();
        
        if (name.includes('fnaf') || key.includes('five nights')) return 'fnaf';
        if (name.includes('motox3m') || key.includes('moto x3m')) return 'motox3m';
        if (name.includes('madalin')) return 'madalin';
        if (name.includes('basket')) return 'basketball';
        
        return null;
    }

    getGradientScore(userActivity, targetGame) {
        const userGradients = {};
        
        userActivity.forEach(activity => {
            const game = this.games[activity.gameKey];
            if (game) {
                const gradient = game.gradient;
                const playTime = this.getTotalPlayTimeInMinutes(activity);
                userGradients[gradient] = (userGradients[gradient] || 0) + playTime;
            }
        });

        return userGradients[targetGame.gradient] || 0;
    }

    getPopularGames(count = 6) {
        const popularGames = [
            'slope', 'geometry dash', 'minecraft', 'superhot', 
            'tunnel rush', 'cookie clicker', 'bitlife', 'fnaf'
        ];
        
        return popularGames.slice(0, count).map(key => ({
            key,
            ...this.games[key],
            recommendationScore: 'Popular'
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

//THIS IS NOT USED AND IS ONLY A PARTIALLY COMPLETE VERSION
// Usage example:
// const recommender = new GameRecommendationEngine(gamesData);

// Example user activity structure:
// const userActivity = [
//     { gameKey: 'slope', playTimeHours: 1, playTimeMinutes: 15 },
//     { gameKey: 'fnaf', playTimeHours: 0, playTimeMinutes: 30 },
//     { gameKey: 'geometry dash', playTimeHours: 2, playTimeMinutes: 45 }
// ];

// Get recommendations:
// const recommendations = recommender.getRecommendations(userActivity, 6);
// console.log(recommendations);

// Get games by category:
// const horrorGames = recommender.getGamesByCategory('horror', 5);

// Get similar games:
// const similarToSlope = recommender.getSimilarGames('slope', 4);