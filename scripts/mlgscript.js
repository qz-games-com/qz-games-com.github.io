 const imageUrl = './scripts/assets/hitmarker.png'; 
 const soundUrl = './scripts/assets/hitmarker.mp3'; 
 const showDuration = 250; 

 // CreateI
 const img = document.createElement('img');
 img.src = imageUrl;
 img.classList.add('click-image');
 document.body.appendChild(img);

 // CreateA
 const audio = document.createElement('audio');
 audio.src = soundUrl;
 audio.classList.add('click-sound');
 audio.preload = 'auto';
 document.body.appendChild(audio);

 document.addEventListener('click', (e) => {
   img.style.left = e.pageX - 20 + 'px';
   img.style.top  = e.pageY - 20 + 'px';
   document.body.style.cursor = 'none'
   img.style.display = 'block';

   audio.currentTime = 0.33;
   audio.play().catch(() => {
     
   });

   setTimeout(() => {
    document.body.style.cursor = 'default'
     img.style.display = 'none';
   }, showDuration);
 });

 document.getElementById('headericon').src = './scripts/assets/mlg.jpg'
 document.getElementById('navicon').src = './scripts/assets/mlg.jpg'
 document.getElementById('naviconside').src = './scripts/assets/mlg.jpg'