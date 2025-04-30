var video = document.createElement('video')
video.muted = true
video.controls = false
video.loop = true
video.autoplay = true
video.src = "./scripts/assets/MC.mp4"
video.classList.add('mcvideobg')
document.body.appendChild(video)

document.getElementById('headericon').src = './scripts/assets/logopixel.png'
document.getElementById('navicon').src = './scripts/assets/logopixel.png'
document.getElementById('naviconside').src = './scripts/assets/logopixel.png'

const audio = document.createElement('audio');
audio.src = './scripts/assets/click.mp3';
audio.classList.add('click-sound');
audio.preload = 'auto';
document.body.appendChild(audio);

document.addEventListener('click', (e) => {
  audio.currentTime = 0.2;
  audio.play().catch(() => {
    
  });
});
