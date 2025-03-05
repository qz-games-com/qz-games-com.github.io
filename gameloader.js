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

    var coverlink = './covers/' + game.cover

    const gameItem = document.createElement('div');
    gameItem.classList.add('gameitem');

    gameItem.innerHTML = `
      <a href="${game.link}">
        <div class="gametextover">${game.name}</div>
        <img class="gamecover" data-src="${coverlink}" alt="${game.name} Cover">
      </a>
    `;

    container.appendChild(gameItem);
  });

    const lazyImages = document.querySelectorAll('.gamecover');

    const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute('data-src');
        observer.unobserve(img);
        }
    });
    }, { threshold: 0.1 });

    lazyImages.forEach(image => observer.observe(image));

}
fetchGames()


