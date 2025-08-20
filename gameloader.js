/* let gamesData = null;

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
*/
let gamesData = null;

const AD_CONFIG = {
  frequency: 9, 
  client: 'ca-pub-1654900800235927', 
  slot: '8647420788', 
  format: 'auto',
  responsive: true,
};

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
function createAdElement(adIndex) {
  const gameItem = document.createElement('div');
  gameItem.classList.add('gameitem');
  gameItem.classList.add('ad-item');
  gameItem.classList.add('hide');
  
  // Create the container with proper constraints
  const adContainer = document.createElement('div');
  adContainer.style.cssText = `
    position: relative; 
    width: 185px; 
    height: 185px; 
    max-width: 185px; 
    max-height: 185px; 
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  `;
  
  const adElement = document.createElement('ins');
  adElement.className = 'adsbygoogle ad-lazy';
  adElement.style.cssText = `
    display: block; 
    width: 185px; 
    height: 185px;
    max-width: 185px !important;
    max-height: 185px !important;
  `;
  adElement.setAttribute('data-ad-client', AD_CONFIG.client);
  adElement.setAttribute('data-ad-slot', AD_CONFIG.slot);
  adElement.setAttribute('data-ad-format', 'fixed');
  adElement.setAttribute('data-full-width-responsive', 'false');
  
  adContainer.appendChild(adElement);
  gameItem.appendChild(adContainer);

  return gameItem;
}

function renderGames(data) {
  const container = document.getElementById('games');
  container.innerHTML = '';

  const gameKeys = Object.keys(data);
  let gameCount = 0;

  gameKeys.forEach((key, index) => {
    const game = data[key];
    const coverLink = `./covers/${game.cover}`;
    let gameLink = game.link;

    if (game.type === 'html') {
      gameLink = `./Games/game.html?game=${game.link}`;
    } else if (game.type === 'unity') {
      gameLink = `./Games/unity.html?game=${game.link}`;
    } else if (game.type === 'flash') {
      gameLink = `./Games/game.html?game=${game.link}`;
    }

    const gameItem = document.createElement('div');
    gameItem.classList.add('gameitem');
    gameItem.id = game.name
    gameItem.addEventListener('click', trackActivity)
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
    gameCount++;

    if (gameCount % AD_CONFIG.frequency === 0 && index < gameKeys.length - 1) {
      const adElement = createAdElement(Math.floor(gameCount / AD_CONFIG.frequency));
      container.appendChild(adElement);
    }
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      
      // Handle game images
      if (entry.target.classList.contains('gamecover')) {
        const img = entry.target;
        img.parentElement.parentElement.classList.remove('hide');
        img.parentElement.parentElement.style.animation = 'showGame 0.5s';
        img.addEventListener('load', () => img.classList.remove('loading'), { once: true });
        img.src = img.getAttribute('data-src');
        obs.unobserve(img);
      }
      
      // Handle ads
      if (entry.target.classList.contains('ad-lazy')) {
        const adElement = entry.target;
        const gameItem = adElement.closest('.gameitem');
        
        gameItem.classList.remove('hide');
        gameItem.style.animation = 'showGame 0.5s';
        
        setTimeout(() => {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            console.log('load')
          } catch (error) {
            console.error('AdSense error:', error);
          }
        }, 100);
        
        obs.unobserve(adElement);
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.gamecover').forEach(img => {
    observer.observe(img);
  });
  
  document.querySelectorAll('.ad-lazy').forEach(ad => {
    observer.observe(ad);
  });
}

function loadAdSenseScript() {
  if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1654900800235927`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

loadAdSenseScript();
fetchGames();