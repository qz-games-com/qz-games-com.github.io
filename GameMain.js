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

function ToggleFullscreen() {
    var iframeRef = document.getElementById('gameiframe')

    const iframe =
      typeof iframeRef === 'string'
        ? document.getElementById(iframeRef)
        : iframeRef;

    if (!iframe || iframe.tagName !== 'IFRAME') {
      console.warn('fullscreenIframe: provided reference is not an <iframe>.');
      return;
    }

    if (iframe.requestFullscreen) {
      iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) {
      iframe.webkitRequestFullscreen(); // Safari/older WebKit
    } else if (iframe.mozRequestFullScreen) {
      iframe.mozRequestFullScreen(); // Firefox
    } else if (iframe.msRequestFullscreen) {
      iframe.msRequestFullscreen(); // IE/Edge
    } else {
      console.warn('Fullscreen API is not supported by this browser.');
    }
  }