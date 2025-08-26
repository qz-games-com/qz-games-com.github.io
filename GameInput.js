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

// --- Mouse emulation into the child (movementX/Y based) ---
function childMouseMove(dx, dy) {
  if (!w || !canvas) return;
  // Create events with the CHILD'S constructors so they originate in that realm.
  const ev = new w.MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
  try {
    // Unity’s WebGL glue reads movementX/Y under pointer lock.
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

// --- Map your right stick -> aim deltas (drop into your gamepad loop) ---
const DEADZONE = 0.18;
const curve = v => { const s=Math.sign(v), a=Math.abs(v); if (a<DEADZONE) return 0;
                     const n=(a-DEADZONE)/(1-DEADZONE); return s*n*n; };
const SENS = 900; // tune to taste

function onRightStick(ax, ay, dt) {
  // ax, ay in [-1..1], dt in seconds since last frame
  const dx = curve(ax) * SENS * dt;
  const dy = curve(ay) * SENS * dt;
  childMouseMove(dx, dy);
}

// Example fire/aim buttons:
function onFire(down) { childMouseButton(down, 0); } // left mouse
function onAim(down)  { childMouseButton(down, 2); } // right mouse
