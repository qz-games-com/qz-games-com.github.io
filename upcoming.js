// Upcoming Games Page - Load and display upcoming games with progress tracking

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        JSON_FILE: './upcoming.json',
        COVERS_PATH: './covers/',
        STEP_NAMES: ['Planned', 'In Progress', 'Ready', 'Added']
    };

    // DOM Elements
    let gamesList = null;

    // Initialize the page
    function init() {
        gamesList = document.querySelector('.games-list');

        if (!gamesList) {
            console.error('Games list container not found');
            return;
        }

        // Load and display games
        loadGames();
    }

    // Load games from JSON
    async function loadGames() {
        showLoading(true);

        try {
            const response = await fetch(CONFIG.JSON_FILE);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const games = await response.json();

            // Hide loading
            showLoading(false);

            // Check if we have any games
            if (Object.keys(games).length === 0) {
                showEmptyState();
                return;
            }

            // Display games
            displayGames(games);

        } catch (error) {
            console.error('Error loading games:', error);
            showLoading(false);
            showError();
        }
    }

    // Display games in the list
    function displayGames(games) {
        // Clear existing content
        gamesList.innerHTML = '';

        // Add delay for staggered animation
        let delay = 0;

        // Create game card for each game
        for (const [gameId, gameData] of Object.entries(games)) {
            const gameCard = createGameCard(gameId, gameData, delay);
            gamesList.appendChild(gameCard);
            delay += 100; // Stagger by 100ms
        }
    }

    // Create a game card element
    function createGameCard(gameId, gameData, delay) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.animationDelay = `${delay}ms`;

        // Game cover
        const cover = document.createElement('img');
        cover.className = 'game-cover';
        cover.src = `${CONFIG.COVERS_PATH}${gameData.cover}`;
        cover.alt = gameData.name;
        cover.onerror = function() {
            // Fallback to placeholder if image doesn't exist
            this.src = './covers/placeholder.png';
        };

        // Game info container
        const info = document.createElement('div');
        info.className = 'game-info';

        // Game name
        const name = document.createElement('h3');
        name.className = 'game-name';
        name.textContent = gameData.name;

        // Progress bar
        const progressContainer = createProgressBar(gameData.step);

        // Assemble the card
        info.appendChild(name);
        info.appendChild(progressContainer);
        card.appendChild(cover);
        card.appendChild(info);

        return card;
    }

    // Create progress bar with 4 steps
    function createProgressBar(currentStep) {
        const container = document.createElement('div');
        container.className = 'progress-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        // Create 4 steps
        for (let i = 1; i <= 4; i++) {
            const step = createProgressStep(i, currentStep);
            progressBar.appendChild(step);
        }

        container.appendChild(progressBar);
        return container;
    }

    // Create individual progress step
    function createProgressStep(stepNumber, currentStep) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'progress-step';

        // Determine step state
        if (stepNumber < currentStep) {
            stepDiv.classList.add('completed');
        } else if (stepNumber === currentStep) {
            stepDiv.classList.add('current');
        }

        // Step circle
        const circle = document.createElement('div');
        circle.className = 'step-circle';

        // Show number only if not completed
        if (stepNumber >= currentStep) {
            const number = document.createElement('span');
            number.className = 'step-number';
            number.textContent = stepNumber;
            circle.appendChild(number);
        }

        // Step label
        const label = document.createElement('div');
        label.className = 'step-label';
        label.textContent = CONFIG.STEP_NAMES[stepNumber - 1];

        stepDiv.appendChild(circle);
        stepDiv.appendChild(label);

        return stepDiv;
    }

    // Show loading state
    function showLoading(show) {
        if (show) {
            gamesList.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>Loading upcoming games...</p>
                </div>
            `;
        }
    }

    // Show empty state
    function showEmptyState() {
        gamesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎮</div>
                <p class="empty-state-text">No upcoming games at the moment. Check back soon!</p>
            </div>
        `;
    }

    // Show error state
    function showError() {
        gamesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p class="empty-state-text">Failed to load upcoming games. Please try again later.</p>
            </div>
        `;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
