let gamesData = null;

function fetchGames() {
  if (gamesData) {
    renderGames(gamesData);
  } else {
    fetch('games.json')
      .then(response => response.json())
      .then(data => {
        gamesData = data;
        renderGames(gamesData);
      })
      .catch(error => console.error('Error fetching games:', error));
  }
}

function renderGames(data) {
  const container = document.getElementById('games');
  container.innerHTML = '';

  Object.keys(data).forEach(key => {
    const game = data[key];
    const coverLink = `./covers/${game.cover}`;
    let gameLink = game.link;

    if (game.type === 'html') {
      gameLink = `./Games/game.html?game=${game.link}`;
    } else if (game.type === 'unity') {
      gameLink = `./Games/unity.html?game=${game.link}`;
    } else if (game.type === 'flash') {
      gameLink = `./Games/Flash.html?game=${game.link}`;
    }

    const gameItem = document.createElement('div');
    gameItem.classList.add('gameitem');
    gameItem.classList.add('hide');
    gameItem.innerHTML = `
      <a href="${gameLink}">
        <div class="gametextover">${game.name}</div>
        <!-- no src yet, only data-src, and add "loading" class -->
        <img 
          class="gamecover loading" 
          data-src="${coverLink}" 
          alt="${game.name} Cover"
        >
      </a>
    `;
    container.appendChild(gameItem);
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.parentElement.parentElement.classList.remove('hide')
      img.parentElement.parentElement.style.animation = 'showGame 0.5s'
      img.addEventListener('load', () => img.classList.remove('loading'), { once: true });
      img.src = img.getAttribute('data-src');
      obs.unobserve(img);
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.gamecover').forEach(img => {
    observer.observe(img);
  });
}

fetchGames();
