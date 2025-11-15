var sidenavstatus = false
var translatemenustatus = false
var filtermenustatus = false


//elements

var sidenavcont = document.getElementById('sidenavcont')

var backdropside = document.getElementById('backdropside')

var sidenav = document.getElementById('sidenav')

var filtermenu = document.getElementById('filterM')


var translatemenu = document.getElementById('translateM')

//functions

function ToggleSideNav() {
    if (!sidenavstatus) {
      // OPEN 
      sidenavcont.style.visibility = 'visible';
      backdropside.style.visibility = 'visible';
      backdropside.style.opacity    = '1';
      sidenav.style.animation       = 'sidenavin 0.5s forwards';
      sidenavstatus = true;
    } else {
      // CLOSE 
      sidenavstatus = false;
      backdropside.style.opacity = '0';
  
      function onNavDone(e) {
        if (e.animationName === 'sidenavout') {
          sidenavcont.style.visibility  = 'hidden';
          backdropside.style.visibility = 'hidden';
          sidenav.removeEventListener('animationend', onNavDone);
        }
      }
      sidenav.addEventListener('animationend', onNavDone);

      sidenav.style.animation    = 'sidenavout 0.5s forwards';

    }
  }
  


function ToggleTranslate() {
    if(translatemenustatus===false) {
        loadGoogleTranslate();

        translatemenustatus = true

        translatemenu.style.visibility = 'visible'

        translatemenu.style.opacity = 1

        translatemenu.style.animation = 'translatemenuin 0.5s'

    } else if (translatemenustatus===true) {
        translatemenustatus = false

        translatemenu.style.opacity = 0

        translatemenu.style.animation = 'translatemenuout 0.5s'

        setTimeout(() => {
            translatemenu.style.visibility = 'hidden'
        }, 450);

    }
}

// Load Google Translate script (used by both manual and auto-translate)
function loadGoogleTranslate() {
    if(document.getElementById('translatescript')) {
        return;
    }
    var translatesc = document.createElement('script')
    translatesc.setAttribute('src', 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit')
    translatesc.type = 'text/javascript'
    translatesc.id = "translatescript"
    document.body.appendChild(translatesc)
}

// Auto-load translate script if auto-translate is enabled
if (window.autoTranslate && window.autoTranslate.isAutoTranslateEnabled()) {
    loadGoogleTranslate();
}

function ToggleFilter() {
    if(filtermenustatus===false) {    
        filtermenustatus = true

        filtermenu.style.visibility = 'visible'

        filtermenu.style.opacity = 1

        filtermenu.style.animation = 'filterwin 0.5s'

    } else if (filtermenustatus===true) {
        

        filtermenu.style.opacity = 0

        filtermenu.style.animation = 'filterwout 0.5s'
        filtermenustatus = false
        setTimeout(() => {
            filtermenu.style.visibility = 'hidden'
        }, 450);

    }
}



