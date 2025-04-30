function loadScript(url, type) {
    const script = document.createElement('script');
    script.src = url;
    if(type) {
        script.type = type
    }
    script.onerror = () => issuenote('Failed', 'Theme scripts have failed to load.', true, 'note');
    document.head.appendChild(script);
}
  
function loadThemeCSS() {
    const theme = getCookie('theme');  
    let cssFile;
    loadingcssfile();

    function loadcssfile() {
        
        setTimeout(() => {
            console.log(`Loaded stylesheet: ${cssFile}`)
            closeNote()    
        }, 1000);
        
        
    }

    function loadingcssfile() {
        console.log(`Loading stylesheet: ${cssFile}`)
        issuenote('Loading Theme...', 'This may take a second', false, 'note')
    }
  
    switch (theme) {
      case 'space':
        cssFile = './styles/space.css';
        break;
      case 'spaceearth':
        cssFile = './styles/spaceearth.css';
        break;
      case 'mc':
        cssFile = './styles/minecraft.css';
        break;
      case 'midnight-purple':
        cssFile = './styles/midnight-purple.css';
        break;
      case 'mlg':
        cssFile = './styles/mlg.css';
        break;
      case 'light':
        cssFile = './styles/white.css';
        break;
      default:
        cssFile = './styles/default.css';
    }
  
    const link = document.getElementById('themecss');
    link.setAttribute('href', cssFile);
    if(cssFile==='./styles/space.css') {
        loadScript('./scripts/blackhole.js')
    } else if(cssFile==='./styles/mlg.css') {
        loadScript('./scripts/mlgscript.js')
    } else if(cssFile==='./styles/minecraft.css') {
        loadScript('./scripts/minecraft.js')
    } else if(cssFile==='./styles/spaceearth.css') {
        const importMap = {
            imports: {
              "three": "https://unpkg.com/three@0.150.0/build/three.module.js"
            }
        };
        const mapScript = document.createElement("script");
        mapScript.type = "importmap";
        mapScript.textContent = JSON.stringify(importMap);
        mapScript.addEventListener('onload', loadScript('./scripts/earth.js', 'module'))
        console.log('loadlol');
        document.head.appendChild(mapScript);
    }
    console.log ('crazy')
    link.addEventListener('load',  loadcssfile());
    link.onerror = () => issuenote('Failed', 'Theme file failed to load.', true, 'note');
    

}
  
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadThemeCSS);
} else {
    loadThemeCSS();
}