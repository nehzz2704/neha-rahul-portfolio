
/* =========================================================
   NEHA & RAHUL — FIRST-PERSON 2.5D EXPLORATION ENGINE
   Keyboard + touch controls, depth-based object approach,
   proximity interaction, help panel and information overlay.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const isNeha = document.body.classList.contains('enchanted-game');
  const isRahul = document.body.classList.contains('psychedelic-game');
  if (!isNeha && !isRahul) return;

  const viewport = document.querySelector(isNeha ? '#corridorViewport' : '#arcadeViewport');
  const scene = document.querySelector(isNeha ? '#corridorScene' : '#arcadeScene');
  if (!viewport || !scene) return;

  const selector = isNeha ? '[data-book]' : '[data-machine]';
  const objects = [...scene.querySelectorAll(selector)];
  if (!objects.length) return;

  const contentIds = isNeha ? {
    about: 'book-about-content', creations: 'book-creations-content',
    status: 'book-status-content', skills: 'book-skills-content',
    contact: 'book-contact-content'
  } : {
    profile: 'machine-profile-content', creations: 'machine-creations-content',
    status: 'machine-status-content', skills: 'machine-skills-content',
    data: 'machine-data-content'
  };

  const directions = new Set();
  let progress = 0;
  let lateral = 0;
  let nearby = null;
  let opened = null;
  let helpOpen = false;
  let frame = 0;
  let previousTime = 0;
  const maxProgress = objects.length + 0.35;
  const speed = 0.78;
  const laneOffsets = isNeha ? [-18, 17, 0, -16, 18] : [-25, 22, -5, 25, -23];

  /* TOUCH-FRIENDLY GAME STYLES */

  const injected = document.createElement('style');
  injected.textContent = `
    .game-interface{position:absolute;inset:0;z-index:40;pointer-events:none}
    .game-help-button,.game-direction-pad,.game-direction-pad button{pointer-events:auto}
    .game-help-button{position:absolute;right:16px;top:16px;border:1px solid rgba(255,255,255,.8);border-radius:999px;padding:10px 15px;font-weight:800;letter-spacing:.08em;cursor:pointer;backdrop-filter:blur(8px)}
    .enchanted-game .game-help-button{color:#824b83;background:rgba(255,239,250,.94);box-shadow:0 0 18px #fff}
    .psychedelic-game .game-help-button{color:#aaf7ff;background:rgba(7,12,35,.94);border-color:#42dfff;box-shadow:0 0 18px #168cff88}
    .game-direction-pad{position:absolute;left:18px;bottom:18px;display:flex;flex-direction:column;align-items:center;gap:5px;touch-action:none}
    .game-direction-middle{display:flex;gap:5px}
    .game-direction-pad button{width:48px;height:44px;border-radius:13px;border:1px solid #fff;background:rgba(255,255,255,.82);font-size:19px;font-weight:900;cursor:pointer;touch-action:none;user-select:none}
    .enchanted-game .game-direction-pad button{color:#874c83;background:rgba(255,239,250,.94);border-color:#fff;box-shadow:0 0 14px #f5a9ed88}
    .psychedelic-game .game-direction-pad button{color:#9af6ff;background:rgba(7,12,35,.94);border-color:#42dfff;box-shadow:0 0 15px #168cff88}
    .game-direction-pad button:active{transform:scale(.92)}
    .game-help-panel{position:fixed;inset:0;z-index:1000;display:none;place-items:center;padding:18px;background:rgba(8,5,20,.72);backdrop-filter:blur(8px)}
    .game-help-panel.active{display:grid}
    .game-help-content{position:relative;width:min(440px,94vw);max-height:85vh;overflow:auto;padding:30px 25px;border-radius:22px;background:#fff4fc;color:#68436f;box-shadow:0 0 40px #f3a9e9;text-align:left}
    body.psychedelic-game .game-help-panel .game-help-content{background:#0b102b;color:#d9faff;box-shadow:0 0 40px #168cff}
    .game-help-close{position:absolute;right:14px;top:12px;border:0;background:transparent;font-size:22px;cursor:pointer;color:inherit}
    .game-help-content h2{margin:0 35px 10px 0}.game-help-content h3{margin:20px 0 8px}
    .game-help-row{display:flex;justify-content:space-between;gap:15px;padding:7px 0;border-bottom:1px solid currentColor;font-size:14px}
    .game-help-row span:first-child{font-weight:900}
    .game-help-footer{margin-top:22px;font-weight:800;letter-spacing:.08em}
    .game-nearby-prompt{position:absolute;z-index:35;left:50%;bottom:20%;transform:translateX(-50%);padding:10px 16px;border-radius:999px;white-space:nowrap;font:700 12px Arial,sans-serif;pointer-events:none}
    .enchanted-game .game-nearby-prompt{color:#874c83;background:rgba(255,239,250,.96);border:1px solid white;box-shadow:0 0 22px white}
    .psychedelic-game .game-nearby-prompt{color:#f5d8ff;background:rgba(15,8,35,.94);border:1px solid #d45cff;box-shadow:0 0 22px #a52cff}
    .game-overlay{position:fixed;inset:0;z-index:1100;display:none;place-items:center;padding:18px;background:rgba(8,5,20,.78);backdrop-filter:blur(9px)}
    .game-overlay.active{display:grid}
    .game-overlay-panel{position:relative;width:min(900px,96vw);max-height:88vh;overflow:auto;padding:34px 30px;border-radius:22px;background:#fff8fe;color:#56365e;border:2px solid #f5c9ec;box-shadow:0 0 40px #f3a9e9}
    body.psychedelic-game .game-overlay .game-overlay-panel{background:#0b102b;color:#d9faff;border-color:#4ceaff;box-shadow:0 0 40px #168cff}
    .game-close{position:sticky;float:right;top:0;z-index:5;border:0;border-radius:50%;width:38px;height:38px;background:rgba(150,100,160,.15);color:inherit;font-size:22px;cursor:pointer}
    .game-overlay-content{clear:both}
    .game-overlay-content .portfolio-section{padding:18px 0}
    .game-overlay-content .portfolio-section:first-child{padding-top:0}
    .game-overlay-content .portfolio-section h2,.game-overlay-content h2{margin-top:5px}
    .game-overlay-content .project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
    .game-overlay-content .skill-list{display:flex;flex-wrap:wrap;gap:10px}
    .game-overlay-content .skill-list span{padding:9px 13px;border-radius:999px;background:rgba(180,120,190,.15)}
    .game-object-approach{will-change:transform,opacity}
    @media(max-width:650px){.game-direction-pad{left:8px;bottom:8px;transform:scale(.88);transform-origin:bottom left}.game-help-button{right:8px;top:8px;padding:8px 11px;font-size:11px}.game-overlay-panel{padding:25px 18px}.game-nearby-prompt{bottom:23%;font-size:10px}}
  `;
  document.head.appendChild(injected);

  /* ON-SCREEN MOVEMENT CONTROLS */

  const interfaceArea = document.createElement('div');
  interfaceArea.className = 'game-interface';
  interfaceArea.innerHTML = `
    <button class="game-help-button" type="button">${isNeha ? '🦋' : '◈'} CONTROLS</button>
    <div class="game-direction-pad" aria-label="Movement controls">
      <button type="button" data-direction="forward" aria-label="Move forward">▲</button>
      <div class="game-direction-middle">
        <button type="button" data-direction="left" aria-label="Move left">◀</button>
        <button type="button" data-direction="right" aria-label="Move right">▶</button>
      </div>
      <button type="button" data-direction="backward" aria-label="Move backward">▼</button>
    </div>`;
  viewport.appendChild(interfaceArea);

  /* CONTROLS HELP PANEL */

  const helpPanel = document.createElement('div');
  helpPanel.className = 'game-help-panel';
  helpPanel.innerHTML = `
    <div class="game-help-content" role="dialog" aria-modal="true" aria-label="Game controls">
      <button class="game-help-close" type="button" aria-label="Close controls">✕</button>
      <h2>${isNeha ? 'A LITTLE GUIDE ✧' : 'PLAYER GUIDE ◈'}</h2>
      <p>EXPLORE THE WORLD AT YOUR OWN PACE</p>
      <h3>KEYBOARD</h3>
      <div class="game-help-row"><span>W / ↑</span><span>Move forward</span></div>
      <div class="game-help-row"><span>S / ↓</span><span>Move backward</span></div>
      <div class="game-help-row"><span>A / ←</span><span>Move left</span></div>
      <div class="game-help-row"><span>D / →</span><span>Move right</span></div>
      <div class="game-help-row"><span>E / ENTER</span><span>Open nearby ${isNeha ? 'book' : 'machine'}</span></div>
      <div class="game-help-row"><span>ESC</span><span>Close / return</span></div>
      <h3>TOUCH CONTROLS</h3>
      <p>Hold a direction button to move and release it to stop. When an object is close, tap it or press E.</p>
      <p class="game-help-footer">${isNeha ? 'HAVE A MAGICAL ADVENTURE 🦋' : 'ENJOY THE DIMENSION ◈'}</p>
    </div>`;
  document.body.appendChild(helpPanel);

  /* INTERACTION PROMPT */

  const prompt = document.createElement('div');
  prompt.className = 'game-nearby-prompt';
  prompt.textContent = isNeha ? 'Move closer to a book ✧' : 'Explore the arcade ◈';
  prompt.hidden = true;
  viewport.appendChild(prompt);

  /* INFORMATION OVERLAY */

  const overlay = document.createElement('div');
  overlay.className = 'game-overlay';
  overlay.innerHTML = `
    <div class="game-overlay-panel" role="dialog" aria-modal="true">
      <button class="game-close" type="button" aria-label="Close">✕</button>
      <div class="game-overlay-content"></div>
    </div>`;
  document.body.appendChild(overlay);
  const overlayContent = overlay.querySelector('.game-overlay-content');

  /* MOVEMENT HELPERS */

  function stopMoving() {
    directions.clear();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function closeHelp() {
    helpPanel.classList.remove('active');
    helpOpen = false;
  }

  function openHelp() {
    stopMoving();
    helpOpen = true;
    helpPanel.classList.add('active');
  }

  /* OPEN AN OBJECT */

  function openObject(object) {
    if (!object || opened || !object.classList.contains('object-nearby')) return;

    const key = isNeha ? object.dataset.book : object.dataset.machine;
    const template = document.getElementById(contentIds[key]);
    if (!template) return;

    stopMoving();
    opened = object;
    overlayContent.replaceChildren(template.content.cloneNode(true));
    overlay.classList.add('active');
    object.classList.add('object-open');
    prompt.hidden = true;
  }

  function closeObject() {
    if (!opened) {
      overlay.classList.remove('active');
      return;
    }

    opened.classList.remove('object-open');
    opened = null;
    overlay.classList.remove('active');
    updateWorld();
  }

  /* DEPTH AND CAMERA ILLUSION */

  function updateWorld() {
    const currentIndex = Math.min(objects.length - 1, Math.floor(progress));
    nearby = null;

    objects.forEach((object, index) => {
      const parent = isNeha ? object.closest('.corridor-pedestal') : object;
      const distance = index - progress;
      const absDistance = Math.abs(distance);
      const isCurrent = index === currentIndex;
      const lane = laneOffsets[index] + lateral * (isNeha ? 0.34 : 0.42);
      const scale = Math.max(0.42, Math.min(1.48, 1.05 - distance * 0.17));
      const top = 38 + Math.max(-1.2, Math.min(2.8, distance)) * 7.5;
      const opacity = Math.max(0, Math.min(1, 1.15 - Math.max(0, distance - 0.2) * 0.34 - Math.max(0, -distance) * 0.95));

      parent.style.left = `calc(50% + ${lane}%)`;
      parent.style.right = 'auto';
      parent.style.top = `${top}%`;
      parent.style.translate = '-50% 0';
      parent.style.scale = String(scale);
      parent.style.opacity = String(opacity);
      parent.style.pointerEvents = isCurrent && absDistance < 0.58 ? 'auto' : 'none';
      parent.style.zIndex = String(10 + Math.round(scale * 10));
      parent.classList.toggle('station-current', isCurrent);
      object.classList.toggle('object-nearby', isCurrent && absDistance < 0.58);
      object.classList.add('game-object-approach');

      if (isCurrent && absDistance < 0.58) nearby = object;
    });

    /* FLOOR MOTION */

    scene.style.setProperty('--walk-progress', `${progress * 115}px`);
    const floor = scene.querySelector(isNeha ? '.corridor-floor' : '.arcade-floor-grid');
    if (floor) floor.style.backgroundPosition = `center ${progress * 34}px`;

    prompt.hidden = !nearby || helpOpen || !!opened;
    if (nearby) {
      prompt.textContent = isNeha
        ? 'Press E or tap the glowing book ✧'
        : 'Press E or tap the glowing machine ◈';
    }
  }

  /* CONTINUOUS MOVEMENT */

  function movementLoop(time) {
    if (!directions.size || opened || helpOpen) {
      frame = 0;
      previousTime = 0;
      return;
    }

    if (!previousTime) previousTime = time;
    const dt = Math.min((time - previousTime) / 1000, 0.04);
    previousTime = time;

    let forward = 0;
    let side = 0;

    if (directions.has('forward')) forward += 1;
    if (directions.has('backward')) forward -= 1;
    if (directions.has('left')) side -= 1;
    if (directions.has('right')) side += 1;

    const magnitude = Math.hypot(forward, side) || 1;
    progress = Math.max(0, Math.min(maxProgress, progress + (forward / magnitude) * speed * dt));
    lateral = Math.max(-22, Math.min(22, lateral + (side / magnitude) * 34 * dt));

    updateWorld();
    frame = requestAnimationFrame(movementLoop);
  }

  function startMoving(direction) {
    if (opened || helpOpen) return;
    directions.add(direction);
    if (!frame) frame = requestAnimationFrame(movementLoop);
  }

  /* BUTTON EVENTS */

  interfaceArea.querySelector('.game-help-button').addEventListener('click', openHelp);
  helpPanel.querySelector('.game-help-close').addEventListener('click', closeHelp);

  helpPanel.addEventListener('click', event => {
    if (event.target === helpPanel) closeHelp();
  });

  overlay.querySelector('.game-close').addEventListener('click', closeObject);

  overlay.addEventListener('click', event => {
    if (event.target === overlay) closeObject();
  });

  objects.forEach(object => {
    object.addEventListener('click', () => openObject(object));
  });

  /* TOUCH DIRECTION BUTTONS */

  interfaceArea.querySelectorAll('[data-direction]').forEach(button => {
    const direction = button.dataset.direction;

    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      startMoving(direction);
    });

    const release = () => directions.delete(direction);

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  /* KEYBOARD CONTROLS */

  const keyMap = {
    w: 'forward',
    arrowup: 'forward',
    s: 'backward',
    arrowdown: 'backward',
    a: 'left',
    arrowleft: 'left',
    d: 'right',
    arrowright: 'right'
  };

  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if (key === 'escape') {
      closeObject();
      closeHelp();
      return;
    }

    if ((key === 'e' || key === 'enter') && nearby && !opened && !helpOpen) {
      event.preventDefault();
      openObject(nearby);
      return;
    }

    if (keyMap[key] && !opened && !helpOpen) {
      event.preventDefault();
      startMoving(keyMap[key]);
    }
  });

  document.addEventListener('keyup', event => {
    const direction = keyMap[event.key.toLowerCase()];
    if (direction) directions.delete(direction);
  });

  /* STOP WHEN WINDOW LOSES FOCUS */

  window.addEventListener('blur', stopMoving);
  window.addEventListener('resize', updateWorld);

  /* INITIALIZE */

  progress = 0;
  updateWorld();
});
