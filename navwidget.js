const widget = document.getElementById('gamingWidget');
let isExpanded = false;
var openext = false
widget.addEventListener('click', function(e) {
    if (e.target.classList.contains('left-section') || e.target.classList.contains('right-section')) {
        return; 
    }
    
    isExpanded = !isExpanded;
    
    if (isExpanded) {
        document.getElementById('reccomendationsContainer').classList.add('activebgnavv')
        widget.classList.add('expanded');
        document.getElementById('controller-icon-container').classList.add('expandedmainc')
        if(openext===true) {
            document.getElementById('reciframe').style.visibility = 'visible'
            openext=false
        }
    } else {
        if( document.getElementById('reciframe').style.visibility = 'visible') {
             document.getElementById('reciframe').style.visibility = 'hidden'
             openext=true
        }
        widget.classList.remove('expanded');
        document.getElementById('controller-icon-container').classList.remove('expandedmainc')
        document.getElementById('reccomendationsContainer').style.animation = "hidenav0bg 0.5s"
        setTimeout(() => {
            document.getElementById('reccomendationsContainer').classList.remove('activebgnavv')
            document.getElementById('reccomendationsContainer').style.animation = ""

        }, 500);

    }
});

document.addEventListener('click', function(e) {
    if (!widget.contains(e.target)) {
        isExpanded = false;
        widget.classList.remove('expanded');
    }
});
var activitytoggled = false
function handleActivityClick() {
    if (activitytoggled===false) {
        if(discovertoggled) {
            handleRecommendationsClick()
        }
        document.getElementById('pnavleft').classList.add('activenav')
        document.getElementById('reciframe').style.visibility = 'visible'
        if(document.getElementById('reciframe').getAttribute('src')==='./activity.html') {

        } else {
            document.getElementById('reciframe').setAttribute('src', './activity.html')
        }
        activitytoggled=true
    } else {
        document.getElementById('pnavleft').classList.remove('activenav')
        document.getElementById('reciframe').style.visibility = 'hidden'
        activitytoggled=false
    }
}
var discovertoggled = false
function handleRecommendationsClick() {
    //alert('My Recommendations clicked!');
    if (discovertoggled===false) {
        if(activitytoggled) {
            handleActivityClick()
        }
        document.getElementById('pnavright').classList.add('activenav')
        document.getElementById('reciframe').style.visibility = 'visible'
        if(document.getElementById('reciframe').getAttribute('src')==='./reccomend.html') {

        } else {
            document.getElementById('reciframe').setAttribute('src', './reccomend.html')
        }
        discovertoggled=true
    } else {
        document.getElementById('pnavright').classList.remove('activenav')
        document.getElementById('reciframe').style.visibility = 'hidden'
        discovertoggled=false
    }
}