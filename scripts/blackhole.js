
   const scriptt = document.createElement('script');
   scriptt.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
   scriptt.onload = () => startblackhole();
   document.head.appendChild(scriptt);

   function startblackhole() {
   const scene = new THREE.Scene();
   const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
   const renderer = new THREE.WebGLRenderer({ antialias: true });
   renderer.setSize(window.innerWidth, window.innerHeight);
   renderer.domElement.classList.add('bgblackholetheme')
   document.body.appendChild(renderer.domElement);

   // Set camera to top-down view, looking slightly down at the accretion disk
   camera.position.set(0, -22, 4);
   camera.lookAt(0, 0, 0);

   // Simple manual camera controls
   let isDragging = false;
   let prevMouseX = 0;
   let prevMouseY = 0;
   let rotationSpeed = 0.01;
   let cameraDistance = Math.sqrt(
       camera.position.x * camera.position.x + 
       camera.position.y * camera.position.y + 
       camera.position.z * camera.position.z
   );
/*
   document.addEventListener('mousedown', (e) => {
       isDragging = true;
       prevMouseX = e.clientX;
       prevMouseY = e.clientY;
   });

   document.addEventListener('mousemove', (e) => {
       if (isDragging) {
           const deltaX = e.clientX - prevMouseX;
           const deltaY = e.clientY - prevMouseY;
           
           camera.position.x += deltaX * rotationSpeed;
           camera.position.y -= deltaY * rotationSpeed;
           
           const length = Math.sqrt(
               camera.position.x * camera.position.x + 
               camera.position.y * camera.position.y + 
               camera.position.z * camera.position.z
           );
           
           camera.position.x *= cameraDistance / length;
           camera.position.y *= cameraDistance / length;
           camera.position.z *= cameraDistance / length;
           
           camera.lookAt(0, 0, 0);
           prevMouseX = e.clientX;
           prevMouseY = e.clientY;
       }
   });

   document.addEventListener('mouseup', () => {
       isDragging = false;
   });

   document.addEventListener('wheel', (e) => {
       const zoomSpeed = 0.1;
       if (e.deltaY > 0) {
           cameraDistance *= (1 + zoomSpeed);
       } else {
           cameraDistance *= (1 - zoomSpeed);
       }
       
       // Clamp zoom distance
       cameraDistance = Math.max(5, Math.min(25, cameraDistance));
       
       const direction = new THREE.Vector3(
           camera.position.x,
           camera.position.y,
           camera.position.z
       ).normalize();
       
       camera.position.x = direction.x * cameraDistance;
       camera.position.y = direction.y * cameraDistance;
       camera.position.z = direction.z * cameraDistance;
       
       camera.lookAt(0, 0, 0);
   });
   */

   // Add stars background
   const starsGeometry = new THREE.BufferGeometry();
   const starsCount = 5000;
   const starsPositions = new Float32Array(starsCount * 3);
   
   for (let i = 0; i < starsCount; i++) {
       const i3 = i * 3;
       // Create a sphere distribution for stars
       const radius = 1000;
       const theta = 2 * Math.PI * Math.random();
       const phi = Math.acos(2 * Math.random() - 1);
       
       starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
       starsPositions[i3+1] = radius * Math.sin(phi) * Math.sin(theta);
       starsPositions[i3+2] = radius * Math.cos(phi);
   }
   
   starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
   
   const starsMaterial = new THREE.PointsMaterial({ 
       color: 0xffffff, 
       size: 1.5,
       sizeAttenuation: true
   });
   
   const stars = new THREE.Points(starsGeometry, starsMaterial);
   scene.add(stars);

   // Add shooting stars system with increased frequency
   const maxShootingStars = 20;
   const shootingStarPool = [];
   
   class ShootingStar {
       constructor() {
           // Create geometry
           this.geometry = new THREE.BufferGeometry();
           
           // Create trail with multiple points
           const trailLength = 20;
           const positions = new Float32Array(trailLength * 3);
           const sizes = new Float32Array(trailLength);
           const opacities = new Float32Array(trailLength);
           
           for (let i = 0; i < trailLength; i++) {
               // All points start at the same position (will be updated in animation)
               positions[i * 3] = 0;
               positions[i * 3 + 1] = 0;
               positions[i * 3 + 2] = 0;
               
               // Sizes decrease along the trail
               sizes[i] = 3.0 * (1 - i / trailLength);
               
               // Opacity decreases along the trail
               opacities[i] = 1.0 - (i / trailLength);
           }
           
           this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
           this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
           this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
           
           // Create material
           this.material = new THREE.ShaderMaterial({
               uniforms: {},
               vertexShader: `
                   attribute float size;
                   attribute float opacity;
                   varying float vOpacity;
                   
                   void main() {
                       vOpacity = opacity;
                       vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                       gl_PointSize = size * (300.0 / -mvPosition.z);
                       gl_Position = projectionMatrix * mvPosition;
                   }
               `,
               fragmentShader: `
                   varying float vOpacity;
                   
                   void main() {
                       // Create a soft elongated point
                       float r = distance(gl_PointCoord, vec2(0.5));
                       if (r > 0.5) discard;
                       
                       // Blue-white colors
                       vec3 color = mix(vec3(0.7, 0.9, 1.0), vec3(1.0), vOpacity);
                       
                       gl_FragColor = vec4(color, vOpacity * (1.0 - r * 2.0));
                   }
               `,
               transparent: true,
               blending: THREE.AdditiveBlending,
               depthWrite: false
           });
           
           // Create points object
           this.points = new THREE.Points(this.geometry, this.material);
           this.points.visible = false;
           scene.add(this.points);
           
           // Shooting star properties
           this.active = false;
           this.position = new THREE.Vector3();
           this.direction = new THREE.Vector3();
           this.speed = 0;
           this.lifeTime = 0;
           this.currentTime = 0;
           this.trailPositions = [];
           
           // Initialize trail positions array
           for (let i = 0; i < this.geometry.attributes.position.count; i++) {
               this.trailPositions.push(new THREE.Vector3());
           }
       }
       
       activate() {
           // Pick random location on the celestial sphere
           const startRadius = 500; // Just inside the star field
           const theta = Math.random() * Math.PI * 2;
           const phi = Math.random() * Math.PI;
           
           this.position.set(
               startRadius * Math.sin(phi) * Math.cos(theta),
               startRadius * Math.sin(phi) * Math.sin(theta),
               startRadius * Math.cos(phi)
           );
           
           // Set random direction (slightly inward)
           this.direction.set(
               -this.position.x + (Math.random() - 0.5) * 200,
               -this.position.y + (Math.random() - 0.5) * 200,
               -this.position.z + (Math.random() - 0.5) * 200
           ).normalize();
           
           // Set random speed and lifetime
           this.speed = 50 + Math.random() * 150;
           this.lifeTime = 2 + Math.random() * 3;
           this.currentTime = 0;
           
           // Initialize all trail positions
           for (let i = 0; i < this.trailPositions.length; i++) {
               this.trailPositions[i].copy(this.position);
           }
           
           // Make visible
           this.points.visible = true;
           this.active = true;
       }
       
       update(deltaTime) {
           if (!this.active) return;
           
           // Update position
           this.position.addScaledVector(this.direction, this.speed * deltaTime);
           
           // Update current time
           this.currentTime += deltaTime;
           
           // Check if lifetime is over or if meteor has gone too far
           if (this.currentTime >= this.lifeTime || this.position.length() < 100) {
               this.active = false;
               this.points.visible = false;
               return;
           }
           
           // Update trail positions
           // First position is the current position
           this.trailPositions[0].copy(this.position);
           
           // Calculate trail based on direction and speed
           const positionAttr = this.geometry.attributes.position;
           const trailSpacing = 0.5; // Distance between trail points
           
           for (let i = 0; i < this.trailPositions.length; i++) {
               if (i > 0) {
                   // Each subsequent position is slightly behind the previous one
                   this.trailPositions[i].copy(this.trailPositions[i-1])
                       .sub(this.direction.clone().multiplyScalar(trailSpacing));
               }
               
               // Update the position attribute
               positionAttr.array[i * 3] = this.trailPositions[i].x;
               positionAttr.array[i * 3 + 1] = this.trailPositions[i].y;
               positionAttr.array[i * 3 + 2] = this.trailPositions[i].z;
           }
           
           positionAttr.needsUpdate = true;
       }
   }
   
   // Create shooting star pool
   for (let i = 0; i < maxShootingStars; i++) {
       shootingStarPool.push(new ShootingStar());
   }
   
   // Function to spawn a shooting star if available
   function spawnShootingStar() {
       // Find an inactive shooting star
       for (const star of shootingStarPool) {
           if (!star.active) {
               star.activate();
               break;
           }
       }
   }

   // Create the black hole event horizon (black sphere)
   const blackHoleRadius = 1.5;
   const blackHoleGeometry = new THREE.SphereGeometry(blackHoleRadius, 64, 64);
   const blackHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
   const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
   scene.add(blackHole);

   // Create the accretion disk with concentric rings pattern
   const diskInnerRadius = blackHoleRadius * 1.2;
   const diskOuterRadius = blackHoleRadius * 8; // Larger disk to match image
   const diskSegments = 120; // More segments for better ring definition
   const accretionDiskGeometry = new THREE.RingGeometry(
       diskInnerRadius, 
       diskOuterRadius, 
       diskSegments, 
       diskSegments * 2
   );
   
   // Accretion disk vertex shader - modified for rings appearance
   const diskVertexShader = `
       varying vec2 vUv;
       varying float vDistance;
       
       void main() {
           vUv = uv;
           vec3 pos = position;
           
           // Get distance from center
           vDistance = length(pos.xy);
           
           // Add very subtle vertical displacement for minimal thickness
           // Mostly flat to match top-down view
           float thickness = 0.15 * smoothstep(${diskInnerRadius.toFixed(1)}, ${diskOuterRadius.toFixed(1)}, vDistance);
           float wave = sin(vDistance * 20.0 - uv.x * 10.0) * 0.9;
           pos.z += wave * thickness;
           
           gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
       }
   `;
   
   // Accretion disk fragment shader - modified for concentric rings
   const diskFragmentShader = `
        uniform float time;
        varying vec2 vUv;
        varying float vDistance;

        const float PI = 3.14159265359;

        void main() {
            // Calculate polar coordinates
            float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
            float dist = vDistance;
            
            // Normalize distance from inner to outer radius
            float innerRadius = 1.8;
            float outerRadius = 12.0;
            float normalizedDist = (dist - innerRadius) / (outerRadius - innerRadius);
            
            // Create a swirl pattern by mixing angle and distance
            float swirl = sin((angle + time * 0.5) * -1.0 + normalizedDist * 100.0);
            
            // Color based on distance and swirl
            vec3 innerColor = vec3(1.0, 0.9, 0.6); // Hot white
            vec3 midColor = vec3(1.0, 0.5, 0.1);   // Orange
            vec3 outerColor = vec3(0.7, 0.2, 0.0); // Deep red
            
            vec3 color;
            
            if (normalizedDist < 0.4) {
                color = mix(innerColor, midColor, normalizedDist / 0.4);
            } else {
                color = mix(midColor, outerColor, (normalizedDist - 0.4) / 0.6);
            }
            
            // Modulate color with swirl
            color *= 0.8 + 0.2 * swirl;
            
            // Apply brightness fade toward edges
            float brightness = smoothstep(1.0, 0.0, normalizedDist);
            float alpha = brightness * (1.0 - smoothstep(0.95, 1.0, normalizedDist));
            
            gl_FragColor = vec4(color, alpha);
        }

   `;
   
   const diskMaterial = new THREE.ShaderMaterial({
       uniforms: {
           time: { value: 0 }
       },
       vertexShader: diskVertexShader,
       fragmentShader: diskFragmentShader,
       transparent: true,
       side: THREE.DoubleSide,
       blending: THREE.AdditiveBlending,
       depthWrite: false
   });
   
   const accretionDisk = new THREE.Mesh(accretionDiskGeometry, diskMaterial);
   scene.add(accretionDisk);

   // Create gravitational lensing effect
   const lensRadius = blackHoleRadius * 1.2; // Tighter focus on just the rim
   const lensGeometry = new THREE.TorusGeometry(blackHoleRadius, 0.15, 30, 100);
   
   // Lens shader for blue ring
   const lensVertexShader = `
       varying vec3 vPosition;
       
       void main() {
           vPosition = position;
           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
       }
   `;
   
   // Lens fragment shader
   const lensFragmentShader = `
       uniform float time;
       varying vec3 vPosition;
       
       void main() {
           // Subtle pulsing effect
           float pulse = 0.9 + 0.1 * sin(time * 2.0);
           
           // Blue glow as seen in the image
           vec3 blueColor = vec3(0.3, 0.6, 1.0) * pulse;
           
           gl_FragColor = vec4(blueColor, 0.8);
       }
   `;
   
   const lensMaterial = new THREE.ShaderMaterial({
       uniforms: {
           time: { value: 0 }
       },
       vertexShader: lensVertexShader,
       fragmentShader: lensFragmentShader,
       transparent: true,
       blending: THREE.AdditiveBlending,
       depthWrite: false
   });
   
   const lensEffect = new THREE.Mesh(lensGeometry, lensMaterial);
   scene.add(lensEffect);

   // Handle window resize
   window.addEventListener('resize', () => {
       camera.aspect = window.innerWidth / window.innerHeight;
       camera.updateProjectionMatrix();
       renderer.setSize(window.innerWidth, window.innerHeight);
   });
   
   // Shooting star timer variables with increased frequency
   let shootingStarTimer = 0;
   const shootingStarInterval = 0.9; // More frequent shooting stars
   
   // Define animation loop
   const clock = new THREE.Clock();
   let previousTime = 0;
   
   function animate() {
       requestAnimationFrame(animate);
       
       const elapsedTime = clock.getElapsedTime();
       const deltaTime = elapsedTime - previousTime;
       previousTime = elapsedTime;
       
       // Update all time uniforms
       diskMaterial.uniforms.time.value = elapsedTime;
       lensMaterial.uniforms.time.value = elapsedTime;
       
       // Update shooting star timer with higher frequency
       shootingStarTimer += deltaTime;
       if (shootingStarTimer > shootingStarInterval + Math.random() * 0.5) {
           spawnShootingStar();
           shootingStarTimer = 0;
       }
       
       // Update all shooting stars
       for (const star of shootingStarPool) {
           if (star.active) {
               star.update(deltaTime);
           }
       }
       
       // Rotate accretion disk very slowly
       const baseSpeed = 1.5; // Base rotation speed
        const speedVariation = Math.sin(elapsedTime * 0.5) * 0.2; // Smooth oscillation
        accretionDisk.rotation.z += (baseSpeed + speedVariation) * deltaTime;
       
       // Rotate lensing effect for subtle animation
       lensEffect.rotation.z = -elapsedTime * 0.02;
       
       // Very subtle star rotation
       stars.rotation.y = elapsedTime * 0.001;
       
       renderer.render(scene, camera);
   }

   // Start animation
   animate();
}