/*
const DEADZONE = 0.2;
  const KEYMAP = {
    // Standard mapping: 0=A/✕, 1=B/○, 2=X/□, 3=Y/△, 9=Start/Options
    buttons: { 0: 'Space', 9: 'Escape' },
    // Axes: 0 = left stick X, 1 = left stick Y
    axes: {
      0: { neg: 'ArrowLeft', pos: 'ArrowRight' },
      1: { neg: 'ArrowUp',   pos: 'ArrowDown'  }
    }
  };

  const downKeys = new Set();
  const targetDoc = document;        // Or a same-origin iframe's document
  const targetEl  = document.getElementById('game');

  function fireKey(type, key) {
    const ev = new KeyboardEvent(type, { key, code: key, bubbles: true, cancelable: true });
    targetDoc.dispatchEvent(ev);
  }
  function press(key)  { if (!downKeys.has(key)) { downKeys.add(key); fireKey('keydown', key); } }
  function release(key){ if (downKeys.delete(key)) { fireKey('keyup',   key); } }

  function handleAxes(axes) {
    for (const [axisIndex, map] of Object.entries(KEYMAP.axes)) {
      const v = axes[axisIndex] ?? 0;
      const negKey = map.neg, posKey = map.pos;
      if (v < -DEADZONE) { press(negKey); release(posKey); }
      else if (v >  DEADZONE) { press(posKey); release(negKey); }
      else { release(negKey); release(posKey); }
    }
  }

  function handleButtons(buttons) {
    for (const [iStr, key] of Object.entries(KEYMAP.buttons)) {
      const i = +iStr;
      const pressed = !!(buttons[i] && buttons[i].pressed);
      if (pressed) press(key); else release(key);
    }
  }

  let running = false;
  function loop() {
    const pads = navigator.getGamepads?.() || [];
    const gp = pads.find(p => p && p.connected);
    if (gp) {
      handleAxes(gp.axes || []);
      handleButtons(gp.buttons || []);
    } else {
      // If disconnected, release any stuck keys
      for (const k of Array.from(downKeys)) release(k);
    }
    if (running) requestAnimationFrame(loop);
  }

  window.addEventListener('gamepadconnected', () => { running = true; requestAnimationFrame(loop); });
  window.addEventListener('gamepaddisconnected', () => { running = false; for (const k of Array.from(downKeys)) release(k); });

  // Kick things off if the browser doesn’t fire 'gamepadconnected' until input
  window.addEventListener('click', () => {
    if (!running) { running = true; requestAnimationFrame(loop); }
    targetEl.focus(); // ensure your canvas gets key events if you also listen to real keys
  });
  */

  /*
  // ==== CONFIG ====
  const DEADZONE = 0.18;           // ignore micro drift
  const SENS_PX_PER_S = 1400;      // cursor speed; increase for faster aim
  const SENS_LOOK = 1.4;           // scale for look-mode deltas
  const RIGHT_STICK = { x: 2, y: 3 }; // standard mapping
  const BUTTON = { A: 0, B: 1, X: 2, Y: 3, L3: 10, R3: 11 };

  // ==== TARGET ====
  const targetEl = document.getElementById('gameiframe');
  const vc = document.getElementById('virtual-cursor');
  const targetDoc = document; // or same-origin iframe doc

  // ==== STATE ====
  let running = false;
  let lookMode = false;         // false = cursor mode, true = look mode
  let lastT = 0;
  let vx = 0, vy = 0;           // virtual cursor (relative to target)
  let lastClientX = 0, lastClientY = 0;
  const mouseDown = new Set();  // tracks which mouse buttons we’re holding (0/1/2)
  const btnLatch = new Map();   // latch to detect button edges
  const downKeys = new Set();   // from your existing key mapping (optional reuse)

  // Helpers
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const curve = v => {
    // radial deadzone + gentle curve for finer aim
    const s = Math.sign(v), a = Math.abs(v);
    if (a < DEADZONE) return 0;
    const n = (a - DEADZONE) / (1 - DEADZONE);
    return s * (n * n); // quadratic
  };

  function rectInfo() {
    const r = targetEl.getBoundingClientRect();
    return { r, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  // Dispatchers (note: synthetic events are "untrusted")
  function mouseMove(clientX, clientY) {
    const ev = new MouseEvent('mousemove', {
      bubbles: true, cancelable: true, clientX, clientY
    });
    targetDoc.dispatchEvent(ev);
    // Also emit deltas for code that relies on movementX/Y
    const dx = clientX - lastClientX, dy = clientY - lastClientY;
    lastClientX = clientX; lastClientY = clientY;
    targetEl.dispatchEvent(new CustomEvent('virtual-mousemove', { detail: { x: clientX, y: clientY, dx, dy } }));
  }
  function mouseDownUp(type, button, clientX, clientY) {
    const ev = new MouseEvent(type, {
      bubbles: true, cancelable: true, clientX, clientY, button, buttons: button === 0 ? 1 : (button === 1 ? 4 : 2)
    });
    targetDoc.dispatchEvent(ev);
    if (type === 'mousedown') mouseDown.add(button); else mouseDown.delete(button);
  }
  function contextMenu(clientX, clientY) {
    const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX, clientY });
    targetDoc.dispatchEvent(ev);
  }

  // Toggle modes
  function setLookMode(on) {
    lookMode = on;
    const { r, cx, cy } = rectInfo();
    if (on) {
      vc.style.display = 'none';
      targetEl.classList.add('hide-native-cursor');
      // center baseline for deltas
      lastClientX = cx; lastClientY = cy;
    } else {
      targetEl.classList.remove('hide-native-cursor');
      vc.style.display = 'block';
      // initialize cursor to center of target
      vx = r.width / 2; vy = r.height / 2;
      vc.style.left = (r.left + vx) + 'px';
      vc.style.top  = (r.top  + vy) + 'px';
      lastClientX = r.left + vx; lastClientY = r.top + vy;
    }
  }

  // Buttons edge detection
  function edge(id, pressed) {
    const prev = btnLatch.get(id) || false;
    btnLatch.set(id, pressed);
    return { down: pressed && !prev, up: !pressed && prev };
  }

  // Main loop
  function loop(t) {
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000); // clamp dt in case of tab stutter
    lastT = t;

    const pads = navigator.getGamepads?.() || [];
    const gp = pads.find(p => p && p.connected);
    if (gp) {
      const ax = curve(gp.axes[RIGHT_STICK.x] || 0);
      const ay = curve(gp.axes[RIGHT_STICK.y] || 0);

      const { r, cx, cy } = rectInfo();

      if (lookMode) {
        // Keep clientX/Y at center; emit deltas via custom event
        const dx = ax * SENS_PX_PER_S * dt * SENS_LOOK;
        const dy = ay * SENS_PX_PER_S * dt * SENS_LOOK;
        // Mousemove at center for libs that also watch clientX/Y
        mouseMove(cx, cy);
        // Dedicated deltas for your look code:
        targetEl.dispatchEvent(new CustomEvent('virtual-look', { detail: { dx, dy, dt } }));
      } else {
        // Cursor mode: move virtual cursor
        vx = clamp(vx + ax * SENS_PX_PER_S * dt, 0, r.width);
        vy = clamp(vy + ay * SENS_PX_PER_S * dt, 0, r.height);
        const clientX = r.left + vx, clientY = r.top + vy;
        vc.style.left = clientX + 'px';
        vc.style.top = clientY + 'px';
        vc.style.display = 'block';
        mouseMove(clientX, clientY);
      }

      // Clicks: A = left, B = right
      const A = edge(BUTTON.A, !!gp.buttons[BUTTON.A]?.pressed);
      const B = edge(BUTTON.B, !!gp.buttons[BUTTON.B]?.pressed);
      const R3= edge(BUTTON.R3,!!gp.buttons[BUTTON.R3]?.pressed);

      const px = lookMode ? rectInfo().cx : rectInfo().r.left + vx;
      const py = lookMode ? rectInfo().cy : rectInfo().r.top  + vy;

      if (A.down) mouseDownUp('mousedown', 0, px, py);
      if (A.up)   mouseDownUp('mouseup',   0, px, py);

      if (B.down) { // right click fires contextmenu after mousedown in many apps
        mouseDownUp('mousedown', 2, px, py);
        contextMenu(px, py);
      }
      if (B.up)   mouseDownUp('mouseup',   2, px, py);

      // Toggle mode with R3
      if (R3.down) setLookMode(!lookMode);
    } else {
      // release any held mouse buttons if pad disconnects
      for (const b of Array.from(mouseDown)) mouseDownUp('mouseup', b, lastClientX, lastClientY);
    }

    if (running) requestAnimationFrame(loop);
  }

  // Start/stop
  window.addEventListener('gamepadconnected', () => { running = true; requestAnimationFrame(loop); });
  window.addEventListener('gamepaddisconnected', () => { running = false; });

  // Kick off on first user gesture (needed by some browsers)
  window.addEventListener('click', () => {
    if (!running) { running = true; setLookMode(false); requestAnimationFrame(loop); }
    targetEl.focus();
  });

  // Example: use look deltas for your camera
  // targetEl.addEventListener('virtual-look', e => {
  //   const { dx, dy } = e.detail; camera.rotate(dx * 0.002, dy * 0.002);
  // });

  // Example: fall back if your code expects pointer lock deltas
  // targetEl.addEventListener('virtual-mousemove', e => {
  //   // e.detail.dx / e.detail.dy available here
  // });
*/
// ===== PARENT PAGE (same-origin) =====
const FRAME_ID = 'gameiframe'; // <iframe id="gameframe" src="/your-unity-page.html">
const frame = document.getElementById(FRAME_ID);

let w, d, canvas;

// Resolve child handles when the iframe finishes loading.
frame.addEventListener('load', () => {
  w = frame.contentWindow;
  d = w.document;
  // Typical Unity canvas id is #unity-canvas; fall back to the first <canvas>
  canvas = d.querySelector('#unity-canvas, canvas') || d.body;
  // Give focus so it can receive events
  w.focus();
});

// Pointer Lock usually required by Unity shooters.
// Call this from a real user gesture (click/tap) in the parent.
document.addEventListener('click', () => {
  if (canvas?.requestPointerLock) canvas.requestPointerLock();
}, { once: true });

// ===== CONFIGURATION MANAGEMENT =====
const DEFAULT_CONFIG = {
  deadzone: 0.18,
  sensitivity: 900,
  invertY: false,
  buttonMappings: {
    0: 'fire',      // A button / X (PlayStation)
    1: 'jump',      // B button / Circle
    2: 'reload',    // X button / Square  
    3: 'interact',  // Y button / Triangle
    4: 'prevWeapon', // LB / L1
    5: 'nextWeapon', // RB / R1
    6: 'aim',       // LT / L2 (if digital)
    7: 'fire',      // RT / R2 (if digital)
    8: 'menu',      // Back/Select
    9: 'pause',     // Start
    10: 'leftStickClick',  // Left stick click
    11: 'rightStickClick', // Right stick click
    12: 'up',       // D-pad up
    13: 'down',     // D-pad down
    14: 'left',     // D-pad left
    15: 'right'     // D-pad right
  },
  keyMappings: {
    'jump': ' ',        // Spacebar
    'reload': 'r',      // R key
    'interact': 'e',    // E key
    'menu': 'Escape',   // Escape key
    'pause': 'Escape',  // Escape key
    'up': 'w',          // W key
    'down': 's',        // S key
    'left': 'a',        // A key
    'right': 'd'        // D key
  }
};

let config = DEFAULT_CONFIG;

// Cookie utility functions
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Load configuration from cookie
function loadConfig() {
  try {
    const cookieValue = getCookie('user_game_controller_config');
    if (cookieValue) {
      const savedConfig = JSON.parse(decodeURIComponent(cookieValue));
      // Merge saved config with defaults to handle missing properties
      config = {
        ...DEFAULT_CONFIG,
        ...savedConfig,
        buttonMappings: { ...DEFAULT_CONFIG.buttonMappings, ...savedConfig.buttonMappings },
        keyMappings: { ...DEFAULT_CONFIG.keyMappings, ...savedConfig.keyMappings }
      };
      console.log('Loaded controller config from cookie:', config);
    } else {
      console.log('No controller config found, using defaults');
    }
  } catch (error) {
    console.warn('Failed to load controller config from cookie, using defaults:', error);
    config = DEFAULT_CONFIG;
  }
}

// Save configuration to cookie
function saveConfig() {
  try {
    const configJson = JSON.stringify(config);
    setCookie('user_game_controller_config', encodeURIComponent(configJson));
    console.log('Saved controller config to cookie');
  } catch (error) {
    console.error('Failed to save controller config:', error);
  }
}

// API to update config from external sources
window.updateControllerConfig = function(newConfig) {
  config = {
    ...DEFAULT_CONFIG,
    ...newConfig,
    buttonMappings: { ...DEFAULT_CONFIG.buttonMappings, ...newConfig.buttonMappings },
    keyMappings: { ...DEFAULT_CONFIG.keyMappings, ...newConfig.keyMappings }
  };
  saveConfig();
  console.log('Controller config updated:', config);
};

// API to get current config
window.getControllerConfig = function() {
  return { ...config };
};

// API to reset to defaults
window.resetControllerConfig = function() {
  config = { ...DEFAULT_CONFIG };
  saveConfig();
  console.log('Controller config reset to defaults');
};

// --- Mouse emulation into the child (movementX/Y based) ---
function childMouseMove(dx, dy) {
  if (!w || !canvas) return;
  // Create events with the CHILD'S constructors so they originate in that realm.
  const ev = new w.MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
  try {
    // Unity's WebGL glue reads movementX/Y under pointer lock.
    Object.defineProperty(ev, 'movementX', { value: dx, configurable: true });
    Object.defineProperty(ev, 'movementY', { value: dy, configurable: true });
  } catch {}
  canvas.dispatchEvent(ev);
}

function childMouseButton(down, button = 0) {
  if (!w || !canvas) return;
  const type = down ? 'mousedown' : 'mouseup';
  const ev = new w.MouseEvent(type, {
    bubbles: true, cancelable: true, button,
    buttons: down ? (button === 2 ? 2 : 1) : 0,
    clientX: 0, clientY: 0
  });
  canvas.dispatchEvent(ev);
}

// --- Map your right stick -> aim deltas (using config values) ---
function applyCurve(v, deadzone) {
  const s = Math.sign(v), a = Math.abs(v);
  if (a < deadzone) return 0;
  const n = (a - deadzone) / (1 - deadzone);
  return s * n * n;
}

function onRightStick(ax, ay, dt) {
  // ax, ay in [-1..1], dt in seconds since last frame
  const dx = applyCurve(ax, config.deadzone) * config.sensitivity * dt;
  const dy = applyCurve(ay, config.deadzone) * config.sensitivity * dt * (config.invertY ? -1 : 1);
  childMouseMove(dx, dy);
}

// Example fire/aim buttons:
function onFire(down) { childMouseButton(down, 0); } // left mouse
function onAim(down)  { childMouseButton(down, 2); } // right mouse

// ===== GAMEPAD INPUT HANDLING =====
let lastTime = performance.now();
let prevButtonStates = new Map();

function getGamepads() {
  return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(gp => gp) : [];
}

function handleGamepadInput() {
  const currentTime = performance.now();
  const dt = (currentTime - lastTime) / 1000; // Convert to seconds
  lastTime = currentTime;
  
  const gamepads = getGamepads();
  
  gamepads.forEach((gamepad, index) => {
    if (!gamepad) return;
    
    // Right stick (axes 2 and 3 on most controllers)
    const rightStickX = gamepad.axes[2] || 0;
    const rightStickY = gamepad.axes[3] || 0;
    
    // Call your right stick function with config values
    onRightStick(rightStickX, rightStickY, dt);
    
    // Handle buttons using config mappings
    const currentButtons = new Map();
    
    gamepad.buttons.forEach((button, buttonIndex) => {
      const isPressed = button.pressed;
      const buttonKey = `${index}-${buttonIndex}`;
      const wasPressed = prevButtonStates.get(buttonKey) || false;
      
      currentButtons.set(buttonKey, isPressed);
      
      // Button state changed
      if (isPressed !== wasPressed) {
        const action = config.buttonMappings[buttonIndex];
        
        if (action) {
          // Handle specific button actions
          switch(action) {
            case 'fire':
              onFire(isPressed);
              break;
            case 'aim':
              onAim(isPressed);
              break;
            default:
              // Handle other actions that map to keyboard keys
              const key = config.keyMappings[action];
              if (key) {
                if (action === 'reload' || action === 'interact' || action === 'menu' || action === 'pause') {
                  // These actions only trigger on press, not release
                  if (isPressed) sendKeyToChild(key, true);
                } else {
                  // Movement keys and others trigger on both press and release
                  sendKeyToChild(key, isPressed);
                }
              }
              break;
          }
        }
      }
    });
    
    // Handle triggers as analog inputs if needed
    // Some controllers have analog triggers on axes 6 and 7
    if (gamepad.axes.length > 6) {
      const leftTrigger = (gamepad.axes[6] + 1) / 2;  // Convert from [-1,1] to [0,1]
      const rightTrigger = (gamepad.axes[7] + 1) / 2;
      
      // Use triggers for aim/fire if you prefer analog
      // You could add trigger sensitivity to config too
      // onAim(leftTrigger > 0.1);
      // onFire(rightTrigger > 0.1);
    }
    
    prevButtonStates = currentButtons;
  });
  
  requestAnimationFrame(handleGamepadInput);
}

// Helper function to send keyboard events to child
function sendKeyToChild(key, pressed) {
  if (!w || !canvas) return;
  
  const type = pressed ? 'keydown' : 'keyup';
  let keyCode, code;
  
  // Handle special keys
  switch(key) {
    case ' ':
      keyCode = 32;
      code = 'Space';
      break;
    case 'Escape':
      keyCode = 27;
      code = 'Escape';
      break;
    default:
      keyCode = key.toUpperCase().charCodeAt(0);
      code = `Key${key.toUpperCase()}`;
      break;
  }
  
  const ev = new w.KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode
  });
  
  canvas.dispatchEvent(ev);
}

// ===== INITIALIZATION =====
// Load config first, then start gamepad handling
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  
  // Wait a bit for the iframe to load
  setTimeout(() => {
    console.log('Starting gamepad input handling with config:', config);
    handleGamepadInput();
  }, 1000);
});

// Optional: Add gamepad connect/disconnect events
window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad connected:', e.gamepad.id);
  document.getElementById('controllerstatus').classList.add('conc')
  document.getElementById('controllerstatus').textContent = e.gamepad.id
  if(e.gamepad.id === 'Xbox 360 Controller (XInput STANDARD GAMEPAD)') {
    document.getElementById('controllerstatus').textContent = "Xbox Controller"
  }

});
window.addEventListener('gamepaddisconnected', (e) => {
  console.log('Gamepad disconnected:', e.gamepad.id);
    document.getElementById('controllerstatus').textContent = 'No Controller Connected'

  document.getElementById('controllerstatus').classList.remove('conc')
});

// Save config when page unloads (in case of runtime changes)
window.addEventListener('beforeunload', () => {
  saveConfig();
});

//Binds
const DEFAULT_CONFIGG = {
    deadzone: 0.18,
    sensitivity: 900,
    invertY: false,
    buttonMappings: {
        0: ' ',         // A button -> Spacebar
        1: 'w',         // B button -> W key
        2: 'r',         // X button -> R key  
        3: 'e',         // Y button -> E key
        4: 'q',         // LB -> Q key
        5: 'f',         // RB -> F key
        6: 'Shift',     // LT -> Shift key
        7: ' ',         // RT -> Spacebar
        8: 'Escape',    // Back/Select -> Escape
        9: 'Escape',    // Start -> Escape
        10: 'c',        // Left stick click -> C
        11: 'v',        // Right stick click -> V
        12: 'w',        // D-pad up -> W
        13: 's',        // D-pad down -> S
        14: 'a',        // D-pad left -> A
        15: 'd'         // D-pad right -> D
    }
};

const BUTTON_NAMES = {
    0: 'A Button / X (PS)',
    1: 'B Button / Circle',
    2: 'X Button / Square',
    3: 'Y Button / Triangle',
    4: 'Left Bumper / L1',
    5: 'Right Bumper / R1',
    6: 'Left Trigger / L2',
    7: 'Right Trigger / R2',
    8: 'Back / Select',
    9: 'Start',
    10: 'Left Stick Click',
    11: 'Right Stick Click',
    12: 'D-Pad Up',
    13: 'D-Pad Down',
    14: 'D-Pad Left',
    15: 'D-Pad Right'
};

let currentConfig = { ...DEFAULT_CONFIGG };
let isListening = false;
let listeningElement = null;
let listeningButtonId = null;

// Load saved configuration
function loadConfig() {
    try {
        const saved = getCookie('user_game_controller_config');
        if (saved) {
            // Try to decode if it's URL encoded
            let decodedSaved = saved;
            try {
                decodedSaved = decodeURIComponent(saved);
            } catch (e) {
                // If decoding fails, use original
                decodedSaved = saved;
            }
            
            const parsedConfig = JSON.parse(decodedSaved);
            currentConfig = { ...DEFAULT_CONFIGG, ...parsedConfig };
            console.log('Config loaded successfully:', currentConfig);
        } else {
            console.log('No saved config found, using defaults');
        }
    } catch (error) {
        console.error('Error loading config:', error);
        console.log('Using default configuration');
        currentConfig = { ...DEFAULT_CONFIGG };
        // Clear the corrupted cookie
        setCookie('user_game_controller_config', '', -1);
    }
    updateUI();
}

// Save configuration to cookie
function setCookie(name, value, days = 30) {
    try {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
        document.cookie = `${name}=${cookieValue};expires=${expires.toUTCString()};path=/`;
        console.log('Cookie saved successfully');
    } catch (error) {
        console.error('Error saving cookie:', error);
        showNotificationn('Error saving settings');
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Update UI with current configuration
function updateUI() {
    document.getElementById('sensitivity').value = currentConfig.sensitivity;
    document.getElementById('sensitivity-value').textContent = currentConfig.sensitivity;
    
    document.getElementById('deadzone').value = currentConfig.deadzone;
    document.getElementById('deadzone-value').textContent = currentConfig.deadzone.toFixed(2);
    
    document.getElementById('invertY').checked = currentConfig.invertY;

    populateBindings();
}

// Populate binding sections
function populateBindings() {
    populateControllerBindings();
}

function populateControllerBindings() {
    const container = document.getElementById('controller-bindings');
    container.innerHTML = '';

    Object.keys(currentConfig.buttonMappings).forEach(buttonId => {
        const keyBinding = currentConfig.buttonMappings[buttonId];
        const buttonName = BUTTON_NAMES[buttonId];
        
        const bindingItem = document.createElement('div');
        bindingItem.className = 'binding-item';
        bindingItem.innerHTML = `
            <div>
                <strong>${buttonName}</strong>
                <div style="color: #999; font-size: 14px;">Currently bound to: ${getKeyDisplayName(keyBinding)}</div>
            </div>
            <button class="bind-button" onclick="startListening('${buttonId}', this)">
                Rebind
            </button>
        `;
        container.appendChild(bindingItem);
    });
}

function getKeyDisplayName(key) {
    const keyNames = {
        ' ': 'Spacebar',
        'Escape': 'Escape',
        'Enter': 'Enter',
        'Shift': 'Shift',
        'Control': 'Ctrl',
        'Alt': 'Alt',
        'Tab': 'Tab',
        'CapsLock': 'Caps Lock',
        'MouseLeft': 'Left Mouse',
        'MouseRight': 'Right Mouse',
        'MouseMiddle': 'Middle Mouse',
        'MouseBack': 'Back Mouse',
        'MouseForward': 'Forward Mouse'
    };
    return keyNames[key] || (key.length === 1 ? key.toUpperCase() : key);
}

// Start listening for input
function startListening(buttonId, button) {
    if (isListening) return;
    
    isListening = true;
    listeningElement = button;
    listeningButtonId = buttonId;
    
    button.textContent = 'Press key or mouse button...';
    button.classList.add('listening');
    
    document.addEventListener('keydown', handleKeyboardInput);
    document.addEventListener('mousedown', handleMouseInput);
    document.addEventListener('contextmenu', preventContextMenu);
}

// Handle keyboard input
function handleKeyboardInput(event) {
    if (!isListening) return;
    
    event.preventDefault();
    const key = event.key;
    
    currentConfig.buttonMappings[listeningButtonId] = key;
    stopListening();
    populateControllerBindings();
    showNotificationn(`${BUTTON_NAMES[listeningButtonId]} bound to ${getKeyDisplayName(key)}`);
}

// Handle mouse input
function handleMouseInput(event) {
    if (!isListening) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    let mouseButton;
    switch(event.button) {
        case 0: mouseButton = 'MouseLeft'; break;
        case 1: mouseButton = 'MouseMiddle'; break;
        case 2: mouseButton = 'MouseRight'; break;
        case 3: mouseButton = 'MouseBack'; break;
        case 4: mouseButton = 'MouseForward'; break;
        default: mouseButton = `Mouse${event.button}`; break;
    }
    
    currentConfig.buttonMappings[listeningButtonId] = mouseButton;
    stopListening();
    populateControllerBindings();
    showNotificationn(`${BUTTON_NAMES[listeningButtonId]} bound to ${getKeyDisplayName(mouseButton)}`);
}

// Prevent context menu during binding
function preventContextMenu(event) {
    if (isListening) {
        event.preventDefault();
    }
}

// Stop listening for input
function stopListening() {
    isListening = false;
    if (listeningElement) {
        listeningElement.textContent = 'Rebind';
        listeningElement.classList.remove('listening');
    }
    listeningElement = null;
    listeningButtonId = null;
    document.removeEventListener('keydown', handleKeyboardInput);
    document.removeEventListener('mousedown', handleMouseInput);
    document.removeEventListener('contextmenu', preventContextMenu);
}

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Settings handlers
document.getElementById('sensitivity').addEventListener('input', (e) => {
    currentConfig.sensitivity = parseInt(e.target.value);
    document.getElementById('sensitivity-value').textContent = e.target.value;
});

document.getElementById('deadzone').addEventListener('input', (e) => {
    currentConfig.deadzone = parseFloat(e.target.value);
    document.getElementById('deadzone-value').textContent = parseFloat(e.target.value).toFixed(2);
});

document.getElementById('invertY').addEventListener('change', (e) => {
    currentConfig.invertY = e.target.checked;
});

// Save settings
function saveSettings() {
    try {
        setCookie('user_game_controller_config', currentConfig);
        
        // Call the window update function if available
        if (typeof window.updateControllerConfig === 'function') {
            window.updateControllerConfig(currentConfig);
        }
        
        showNotificationn('Settings saved successfully!');
        console.log('Settings saved:', currentConfig);
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotificationn('Error saving settings');
    }
}

// Reset to defaults
function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        currentConfig = { ...DEFAULT_CONFIG };
        updateUI();
        
        if (typeof window.resetControllerConfig === 'function') {
            window.resetControllerConfig();
        }
        
        showNotificationn('Settings reset to defaults');
    }
}

// Show notification
function showNotificationn(message) {
    const notification = document.getElementById('notificationn');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Handle clicks outside of listening elements (but not during binding)
document.addEventListener('click', (e) => {
    if (isListening && !e.target.classList.contains('bind-button')) {
        // Don't stop listening on clicks during binding - let mouse handler deal with it
        return;
    }
});

// Add a manual cancel button behavior
document.addEventListener('keydown', (e) => {
    // Only cancel on Escape if we're listening AND it's a double-press or special combo
    if (e.key === 'Escape' && isListening && e.ctrlKey) {
        stopListening();
        showNotificationn('Binding cancelled');
    }
});

// Initialize
loadConfig();