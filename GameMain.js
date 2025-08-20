class NotificationSystem {
  constructor() {
      this.container = document.getElementById('notification-container');
      this.notifications = [];
      this.maxNotifications = 5;
      this.autoCloseDelay = 10000;
      this.init();
  }

  init() {
      window.addEventListener('error', (e) => {
          this.showNotification('error', 'JavaScript Error', `${e.message}\nFile: ${e.filename}\nLine: ${e.lineno}`);
      });
      window.addEventListener('unhandledrejection', (e) => {
          this.showNotification('error', 'Promise Rejection', e.reason ? e.reason.toString() : 'Unknown rejection');
      });
      
      const origWarn = console.warn, origError = console.error;
      console.warn = (...args) => { origWarn.apply(console, args); this.showNotification('warning', 'Warning', args.join(' ')); };
      console.error = (...args) => { origError.apply(console, args); this.showNotification('error', 'Error', args.join(' ')); };
  }

  showNotification(type, title, message) {
      if (this.notifications.length >= this.maxNotifications) this.removeNotification(this.notifications[0]);
      
      const notif = document.createElement('div');
      notif.className = `notification ${type}`;
      notif.innerHTML = `<div class="notification-header"><div class="notification-title">${title}</div><button class="close-btn">×</button></div><div class="notification-message">${message}</div>`;
      notif.querySelector('.close-btn').onclick = () => this.removeNotification(notif);
      
      this.container.appendChild(notif);
      this.notifications.push(notif);
      setTimeout(() => notif.classList.add('show'), 10);
      setTimeout(() => this.removeNotification(notif), this.autoCloseDelay);
      return notif;
  }

  removeNotification(notif) {
      if (!notif || !notif.parentNode) return;
      notif.classList.remove('show');
      setTimeout(() => {
          if (notif.parentNode) notif.parentNode.removeChild(notif);
          const idx = this.notifications.indexOf(notif);
          if (idx > -1) this.notifications.splice(idx, 1);
      }, 300);
  }

  clearAll() { [...this.notifications].forEach(n => this.removeNotification(n)); }
}

const notificationSystem = new NotificationSystem();

function triggerError() { throw new Error("Demo error!"); }
function triggerWarning() { console.warn("Demo warning!"); }
function triggerCustomNotification() { notificationSystem.showNotification('info', 'Custom', 'Custom notification message'); }
function clearAllNotifications() { notificationSystem.clearAll(); }

//setTimeout(() => notificationSystem.showNotification('info', 'Ready', 'Error monitoring active!'), 1000);

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
  console.error('No Paramiter Found! Please try again.');
  initGame('error.html');
}

async function initGame(name) {
  if (name.toLowerCase().includes('.swf')) {
      await loadRuffle(name);
  } else {
      document.getElementById('gameiframe').src = name;
  }
}

async function loadRuffle(swfUrl) {
  try {
      const ruffle = await import('https://unpkg.com/@ruffle-rs/ruffle');
      
      const container = document.getElementById('maingamestuff');
      
      container.innerHTML = '';
      
      const player = ruffle.createPlayer();
      player.id = 'rufflePlayer';
      player.style.width = '100%';
      player.style.height = '100%';
      
      // Append to container
      container.appendChild(player);
      
      await player.load(swfUrl);
      
      console.log(`Ruffle loaded SWF: ${swfUrl}`);
      
  } catch (error) {
      console.error('Failed to load Ruffle:', error);
      document.getElementById('gameiframe').src = swfUrl;
  }
}

function ToggleFullscreen() {
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game');
  
  let targetElement;
  
  if (game && game.toLowerCase().includes('.swf')) {
      targetElement = document.getElementById('rufflePlayer') || document.getElementById('maingamestuff');
  } else {
      targetElement = document.getElementById('gamei2frame');
  }
  
  if (!targetElement) {
      console.error('Fullscreen Function Not Available');
      return;
  }

  if (document.fullscreenElement || document.webkitFullscreenElement || 
      document.mozFullScreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) {
          document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
      }
  } else {
      if (targetElement.requestFullscreen) {
          targetElement.requestFullscreen();
      } else if (targetElement.webkitRequestFullscreen) {
          targetElement.webkitRequestFullscreen();
      } else if (targetElement.mozRequestFullScreen) {
          targetElement.mozRequestFullScreen();
      } else if (targetElement.msRequestFullscreen) {
          targetElement.msRequestFullscreen();
      } else {
          console.warn('Fullscreen API is not supported by this browser.');
      }
  }
}

