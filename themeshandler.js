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
        //loadScript('./scripts/blackhole.js')
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
        console.log('loadlol');
        document.head.appendChild(mapScript); 
        loadScript('./scripts/earth.js', 'module')
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

/**
 * Load selected background (independent from theme)
 * Backgrounds are now separate from themes - user selects them independently
 */
function loadSelectedBackground() {
    // Check if background system is available
    if (typeof backgroundHandler === 'undefined' || !backgroundHandler) {
        console.log('Background handler not initialized');
        return;
    }

    // Check if custom backgrounds are enabled
    const customBackgroundsEnabled = getCookie('customBackgrounds') !== 'false';
    if (!customBackgroundsEnabled) {
        console.log('Custom backgrounds disabled in settings');
        backgroundHandler.setEnabled(false);
        backgroundHandler.clear();
        return;
    }

    // Enable background handler
    backgroundHandler.setEnabled(true);

    // Get selected background (independent from theme)
    const selectedBackground = getCookie('selectedBackground') || 'none';

    if (selectedBackground === 'none') {
        console.log('No background selected');
        backgroundHandler.clear();
        return;
    }

    // Map background names to their JSON files
    const backgroundMap = {
        'mountain': './background-custom/backgrounds/mountain.json',
        'space': './background-custom/backgrounds/space.json',
        'forest': './background-custom/backgrounds/forest.json',
        'ocean': './background-custom/backgrounds/ocean.json',
        'desert': './background-custom/backgrounds/desert.json',
        'city': './background-custom/backgrounds/city.json',
        'abstract': './background-custom/backgrounds/abstract.json'
    };

    const bgPath = backgroundMap[selectedBackground];

    if (bgPath) {
        loadBackgroundFromJSON(bgPath)
            .then(() => {
                console.log(`Background loaded: ${selectedBackground}`);
            })
            .catch(err => {
                console.log(`Failed to load background: ${selectedBackground}`, err);
                // Clear any existing background on error
                if (backgroundHandler) {
                    backgroundHandler.clear();
                }
            });
    } else {
        console.log('Background not found:', selectedBackground);
        backgroundHandler.clear();
    }
}