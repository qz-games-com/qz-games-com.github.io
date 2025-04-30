

import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.150.0/examples/jsm/loaders/GLTFLoader.js';

let cameraDistance = parseFloat(2.5);
let cameraRotationX = parseFloat(0);
let cameraRotationY = parseFloat(0);
let rotationSpeed = parseFloat(0.0005);
let topBottomView = 5; 

let earthMaterial;
let atmosphereMaterial;
let timeInterval;
let stars;

const scene = new THREE.Scene();

const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ 
antialias: true, 
alpha: true,
logarithmicDepthBuffer: true 
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.classList.add('bgearththeme')
renderer.domElement.id = 'bgearth'
document.body.appendChild(renderer.domElement);

const createStars = () => {
const starsGeometry = new THREE.BufferGeometry();

const starSizes = [];
const starColors = [];

const starsCount = 3000;
const starsPositions = new Float32Array(starsCount * 3);

const starColorOptions = [
  new THREE.Color(0xffffff), // White
  new THREE.Color(0xffffee), // Warm white
  new THREE.Color(0xeeeeff), // Cool white
  new THREE.Color(0xffeeee), // Reddish
  new THREE.Color(0xeeffff)  // Bluish
];

for (let i = 0; i < starsCount * 3; i += 3) {
  const radius = 80 + Math.random() * 120; 
  const theta = Math.random() * Math.PI * 2; 
  const phi = Math.acos((Math.random() * 2) - 1);
  
  starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
  starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starsPositions[i + 2] = radius * Math.cos(phi);
  
  starSizes.push(0.1 + Math.random() * 0.4);
  
  const colorIndex = Math.floor(Math.random() * starColorOptions.length);
  const starColor = starColorOptions[colorIndex];
  
  const intensity = 0.5 + Math.random() * 0.5;
  starColors.push(starColor.r * intensity, starColor.g * intensity, starColor.b * intensity);
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

const starsMaterial = new THREE.ShaderMaterial({
  uniforms: {
    pointTexture: { value: new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFFmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0MzYwLCAyMDIwLzAyLzEzLTAxOjA3OjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjAtMDctMDZUMTE6MTM6NTcrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIwLTA3LTA2VDExOjMxOjE0KzAyOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIwLTA3LTA2VDExOjMxOjE0KzAyOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjc0Y2M1MDVlLWFiNDEtNGVlMS1hZDEzLTIwZTNmYmJmYTZiYSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo3NGNjNTA1ZS1hYjQxLTRlZTEtYWQxMy0yMGUzZmJiZmE2YmEiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3NGNjNTA1ZS1hYjQxLTRlZTEtYWQxMy0yMGUzZmJiZmE2YmEiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjc0Y2M1MDVlLWFiNDEtNGVlMS1hZDEzLTIwZTNmYmJmYTZiYSIgc3RFdnQ6d2hlbj0iMjAyMC0wNy0wNlQxMToxMzo1NyswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIxLjEgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+GC6QvgAAAPBJREFUWIXtVssOgzAMs1P//5d7GidLU0riVkLaSQcSIk5sx0kL3B6P6QA0AJp6P3YJ/GxDaVL0PwEgHQIgQ8BdyzV9nXmcbRsVEz+UKIQSzC/wttZvZCJF3zRFxzRuxqjvGxpjkuabeRREQPCTB/BDvDUZ8kxshRJvJLrDg6lJ4C3T6ANSB2xHLsnzqUlfDDYpGJLCuQJUY3Pk5IqmXAFxNUWjF2CaSZEpT9xRLaBESfiRb6LcAYtVAQsw7Qhs9QAdNpbJ8sVntMZZ8IfcCO/QhYQlVwC1eeIS4Kfx/xx4F3+kDt7VAizk6wf8APmOdAEmC7WhAAAAAElFTkSuQmCC') 
    }
  },
  vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D pointTexture;
    varying vec3 vColor;
    
    void main() {
      gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
      // Apply distance fade for more realism
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = smoothstep(100.0, 300.0, depth);
      gl_FragColor.a *= 1.0 - fogFactor;
    }
  `,
  transparent: true,
  depthWrite: false
});

stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);
};

createStars();

const updateCameraPosition = () => {
const verticalOffset = topBottomView / 10;

camera.position.x = cameraDistance * Math.sin(cameraRotationY) * Math.cos(cameraRotationX);
camera.position.y = cameraDistance * Math.sin(cameraRotationX) + verticalOffset * cameraDistance;
camera.position.z = cameraDistance * Math.cos(cameraRotationY) * Math.cos(cameraRotationX);

camera.lookAt(0, 0, 0);
};

updateCameraPosition();

const placeholderGeometry = new THREE.SphereGeometry(1, 32, 32);
const placeholderMaterial = new THREE.MeshBasicMaterial({ 
color: 0x1a237e,
wireframe: true
});
const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
scene.add(placeholder);

const earthGroup = new THREE.Group();
scene.add(earthGroup);

const textureLoader = new THREE.TextureLoader();

const earthDayMap = textureLoader.load('./scripts/earth/textures/earth_atmos_2048.jpg');
const earthNightMap = textureLoader.load('./scripts/earth/textures/night.png');
const earthBumpMap = textureLoader.load('./scripts/earth/textures/earth bump.jpg');
const earthSpecMap = textureLoader.load('./scripts/earth/textures/earth land ocean mask.png');
const cloudsMap = textureLoader.load('./scripts/earth/textures/clouds earth.png');

// Load
const loadModel = () => {
try {
  // const gltfLoader = new GLTFLoader();
  // gltfLoader.load('.glb', (gltf) => {
  //   earthGroup.add(gltf.scene);
  //   
  //   gltf.scene.traverse((child) => {
  //     if (child.isMesh) {
  //       child.material = earthMaterial;
  //     }
  //   });
  //
  //   scene.remove(placeholder);
  // });
  
  const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
  
  earthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: earthDayMap },
      nightTexture: { value: earthNightMap },
      bumpTexture: { value: earthBumpMap },
      specTexture: { value: earthSpecMap },
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      bumpScale: { value: 0.05 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D bumpTexture;
      uniform sampler2D specTexture;
      uniform vec3 sunDirection;
      uniform float bumpScale;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        // Get daylight intensity based on normal facing sun
        float intensity = max(0.0, dot(vNormal, sunDirection));
        
        // Sample textures
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        
        // Blend day and night sides with smooth transition
        vec4 color = mix(nightColor, dayColor, smoothstep(0.0, 0.3, intensity));
        
        // Add specular highlight on water
        vec4 specValue = texture2D(specTexture, vUv);
        if (intensity > 0.9 && specValue.r > 0.1) {
          color += vec4(0.5, 0.5, 0.5, 0.0) * specValue.r * (intensity - 0.9) * 10.0;
        }
        
        gl_FragColor = color;
      }
    `
  });
  
  //earth
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earth);

  const innerAtmosphereGeometry = new THREE.SphereGeometry(1.02, 64, 64);
  
  const atmosphereRayleighMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      rayleighColor: { value: new THREE.Color(0x0077ff) },
      intensity: { value: 1.0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform vec3 rayleighColor;
      uniform float intensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Sun position relative to fragment
        float sunDot = max(0.0, dot(vNormal, sunDirection));
        
        // Rayleigh scattering formula (simplified)
        // Stronger at the edge of the sphere, creating limb brightening effect
        float rayleighEffect = 0.25 + (1.0 - sunDot) * 0.75;
        
        // Mix the scattering with the base color
        vec3 atmosphere = rayleighColor * rayleighEffect * intensity;
        
        // Fade based on sun position - brighter on the sun side
        float sunFactor = 0.4 + 0.6 * sunDot;
        
        // Final color
        gl_FragColor = vec4(atmosphere * sunFactor, rayleighEffect * 0.5 * sunFactor);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  
  const innerAtmosphere = new THREE.Mesh(innerAtmosphereGeometry, atmosphereRayleighMaterial);
  innerAtmosphere.scale.set(1.1, 1.1, 1.1);
  //earthGroup.add(innerAtmosphere);

   const outerGlowGeometry = new THREE.SphereGeometry(1.03, 64, 64);
  const outerGlowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x3388ff) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.23);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnel = 1.0 - max(0.0, dot(viewDirection, vNormal));
        fresnel = pow(fresnel, 3.0);
        
        gl_FragColor = vec4(glowColor * fresnel, fresnel * 0.9);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending
  });
  
  const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
  outerGlow.scale.set(1.2, 1.2, 1.2);
  earthGroup.add(outerGlow);
  
  const outerAtmosphereGeometry = new THREE.SphereGeometry(1.04, 64, 64);
  
  const atmosphereMieMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      mieColor: { value: new THREE.Color(0xaaccff) },
      intensity: { value: 0.8 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform vec3 mieColor;
      uniform float intensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Sun position relative to fragment
        float sunDot = max(0.0, dot(vNormal, sunDirection));
        
        // Mie scattering formula (simplified)
        // Much stronger forward scattering (in the direction of the sun)
        float miePhase = pow(max(0.0, dot(normalize(vPosition), sunDirection) * 0.5 + 0.5), 8.0);
        float mieEffect = 0.15 + miePhase * 0.85;
        
        // Mix the scattering with the base color
        vec3 atmosphere = mieColor * mieEffect * intensity;
        
        // Fade based on sun position - brighter on the sun side
        float sunFactor = 0.3 + 0.7 * sunDot;
        
        // Final color
        gl_FragColor = vec4(atmosphere * sunFactor, mieEffect * 0.3 * sunFactor);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });
  
  const outerAtmosphere = new THREE.Mesh(outerAtmosphereGeometry, atmosphereMieMaterial);
  outerAtmosphere.scale.set(1.12, 1.12, 1.12);
  //earthGroup.add(outerAtmosphere);
  
  const glowGeometry = new THREE.SphereGeometry(1.05, 64, 64);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      glowColor: { value: new THREE.Color(0x6699ff) },
      intensity: { value: 0.4 }
    },
    vertexShader: `
      varying vec3 vNormal;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunDirection;
      uniform vec3 glowColor;
      uniform float intensity;
      
      varying vec3 vNormal;
      
      void main() {
        // Fixed rim lighting effect that doesn't depend on view direction
        float rim = 0.25;
        
        // Sun-based variations (subtle)
        float sunFactor = 0.7 + 0.3 * max(0.0, dot(vNormal, sunDirection));
        
        // Final glow
        gl_FragColor = vec4(glowColor * intensity * sunFactor, rim * intensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.scale.set(1.15, 1.15, 1.15);
  //earthGroup.add(glow);
  
  atmosphereMaterial = {
    inner: atmosphereRayleighMaterial,
    outer: atmosphereMieMaterial,
    glow: glowMaterial
  };
  
  // cloud layer
  const cloudsGeometry = new THREE.SphereGeometry(1.02, 64, 64);
  const cloudsMaterial = new THREE.MeshPhongMaterial({
    map: cloudsMap,
    transparent: true,
    opacity: 0.4
  });
  
  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  scene.remove(placeholder);
} catch (error) {
  console.error("Error loading model:", error);
}
};

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
scene.add(sunLight);

const updateSunPosition = () => {
const date = new Date();

const hoursFromMidnight = date.getUTCHours() + date.getUTCMinutes() / 60;
const angleRadians = (hoursFromMidnight / 24) * Math.PI * 2;

sunLight.position.x = Math.cos(angleRadians) * 5;
sunLight.position.z = Math.sin(angleRadians) * 5;
sunLight.position.y = 0;

if (earthMaterial && earthMaterial.uniforms) {
  earthMaterial.uniforms.sunDirection.value.set(
    Math.cos(angleRadians),
    0,
    Math.sin(angleRadians)
  ).normalize();
}

if (atmosphereMaterial) {
  const sunDir = new THREE.Vector3(
    Math.cos(angleRadians),
    0,
    Math.sin(angleRadians)
  ).normalize();
  
  if (atmosphereMaterial.inner && atmosphereMaterial.inner.uniforms) {
    atmosphereMaterial.inner.uniforms.sunDirection.value.copy(sunDir);
  }
  
  if (atmosphereMaterial.outer && atmosphereMaterial.outer.uniforms) {
    atmosphereMaterial.outer.uniforms.sunDirection.value.copy(sunDir);
  }
  
  if (atmosphereMaterial.glow && atmosphereMaterial.glow.uniforms) {
    atmosphereMaterial.glow.uniforms.sunDirection.value.copy(sunDir);
  }
}

};
const animate = () => {
requestAnimationFrame(animate);

earthGroup.rotation.y += rotationSpeed;

if (stars) {
  stars.rotation.y += rotationSpeed * 0.1;
}

renderer.render(scene, camera);
};

loadModel();
updateSunPosition();
animate();


timeInterval = setInterval(updateSunPosition, 60000);

window.addEventListener('resize', () => {
renderer.setSize(window.innerWidth, window.innerHeight);

});

window.addEventListener('beforeunload', () => {
clearInterval(timeInterval);
renderer.dispose();
});


const threshold = 100;

function onScroll() {
  if (window.scrollY > threshold) {
    topBottomView = 0
    cameraDistance = 3.0
    if(document.getElementById('bgearth')) {
        document.getElementById('bgearth').style.animation = "earthin 1.5s"
        document.getElementById('bgearth').classList.add('upclose');
    }
    updateCameraPosition()
  } else if(window.scrollY < threshold) {
    topBottomView = 5
    cameraDistance = 2.3
    updateCameraPosition()
    document.getElementById('bgearth').style.animation = "earthout 1s"

    function onEarthDone(e) {
        if (e.animationName === 'earthout') {
          document.getElementById('bgearth').classList.remove('upclose');
          document.getElementById('bgearth').removeEventListener('animationend', onEarthDone);
        }
      }
    document.getElementById('bgearth').addEventListener('animationend', onEarthDone);
  }
}

// throttle via requestAnimationFrame for performance
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
    ticking = true;
  }
});


