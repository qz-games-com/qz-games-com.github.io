function Backhome() {
    //var toolbar = document.getElementById('optiongamemain')
    //toolbar.style.transition = '0.5s'
    //toolbar.style.transform = 'translateX(-250%)'

    //var gameANIMATE = document.getElementById('gameiframe')
    //gameANIMATE.style.transition = '0.5s'
    //gameANIMATE.style.transform = 'scale(2)'
    //gameANIMATE.style.opacity = 0

    window.location = '../index.html'
}

const params = new URLSearchParams(window.location.search);

const game = params.get('game');

if (game) {
    console.log(`Loaded game: ${game}`);

    initGame(game);
  } else {
    console.warn('no param found');

    initGame('error.html');
}

function initGame(name) {
    document.getElementById('gameiframe').src = name
}