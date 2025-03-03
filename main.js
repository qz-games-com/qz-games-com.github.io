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
    if(sidenavstatus===false) {    
        sidenavstatus = true

        sidenavcont.style.visibility = 'visible'

        backdropside.style.visibility = 'visible'

        backdropside.style.opacity = 1

        sidenav.style.animation = 'sidenavin 0.5s'

    } else if (sidenavstatus===true) {
        sidenavstatus = false

        backdropside.style.opacity = 0

        sidenav.style.animation = 'sidenavout 0.5s'

        setTimeout(() => {
            backdropside.style.visibility = 'hidden'
            sidenavcont.style.visibility = 'hidden'

        }, 450);

    }
}


function ToggleTranslate() {
    if(translatemenustatus===false) {    
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

function ToggleFilter() {
    if(filtermenustatus===false) {    
        filtermenustatus = true

        filtermenu.style.visibility = 'visible'

        filtermenu.style.opacity = 1

        filtermenu.style.animation = 'filterwin 0.5s'

    } else if (filtermenustatus===true) {
        filtermenustatus = false

        filtermenu.style.opacity = 0

        filtermenu.style.animation = 'filterwout 0.5s'

        setTimeout(() => {
            filtermenu.style.visibility = 'hidden'
        }, 450);

    }
}



