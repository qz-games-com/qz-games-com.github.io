function Backhome() {
    var toolbar = document.getElementById('optiongamemain')
    toolbar.style.transition = '0.5s'
    toolbar.style.transform = 'translateX(-250%)'

    var gameANIMATE = document.getElementById('gameiframe')
    gameANIMATE.style.transition = '0.5s'
    gameANIMATE.style.transform = 'scale(2)'
    gameANIMATE.style.opacity = 0

    window.location = '../index.html'
}