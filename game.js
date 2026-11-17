
/* ==========================================
   NEHA & RAHUL — EXPLORATION GAME ENGINE
   Keyboard + touch movement, camera motion,
   nearby-object detection, and information panels.
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const isNeha = document.body.classList.contains("enchanted-game");
  const isRahul = document.body.classList.contains("psychedelic-game");
  if (!isNeha && !isRahul) return;

  const viewport = document.querySelector(
    isNeha ? ".corridor-viewport" : ".arcade-viewport"
  );
  const scene = document.querySelector(
    isNeha ? "#corridorScene" : "#arcadeScene"
  );

  if (!viewport || !scene) {
    console.warn("Game viewport or scene was not found.");
    return;
  }

  const objectSelector = isNeha ? "[data-book]" : "[data-machine]";
  const objects = [...scene.querySelectorAll(objectSelector)];

  if (!objects.length) {
    console.warn("No books or arcade machines were found.");
    return;
  }

  const contentIds = isNeha
    ? {
        about: "book-about-content",
        creations: "book-creations-content",
        status: "book-status-content",
        skills: "book-skills-content",
        contact: "book-contact-content"
      }
    : {
        profile: "machine-profile-content",
        creations: "machine-creations-content",
        status: "machine-status-content",
        skills: "machine-skills-content",
        data: "machine-data-content"
      };

  const directions = new Set();

  let cameraX = 0;
  let cameraY = 0;
  let nearbyObject = null;
  let openedObject = null;
  let helpOpen = false;
  let animationFrame = null;
  let lastTime = 0;

  const speed = 230;

  /* CAMERA INITIALIZATION */

  scene.style.willChange = "translate";
  scene.style.scale = "1.12";
  scene.style.translate = "0px 0px";

  /* GAME CONTROLS */

  const interfaceArea = document.createElement("div");
  interfaceArea.className = "game-interface";

  interfaceArea.innerHTML = `
    <button class="game-help-button" type="button">
      ${isNeha ? "🦋" : "◈"} <span>CONTROLS</span>
    </button>

    <div class="game-direction-pad" aria-label="Movement controls">

      <button type="button" data-direction="forward"
        aria-label="Move forward">▲</button>

      <div class="game-direction-middle">
        <button type="button" data-direction="left"
          aria-label="Move left">◀</button>

        <button type="button" data-direction="right"
          aria-label="Move right">▶</button>
      </div>

      <button type="button" data-direction="backward"
        aria-label="Move backward">▼</button>

    </div>
  `;

  viewport.appendChild(interfaceArea);

  /* HELP PANEL */

  const helpPanel = document.createElement("div");
  helpPanel.className = "game-help-panel";

  helpPanel.innerHTML = `
    <div class="game-help-content">

      <button class="game-help-close" type="button"
        aria-label="Close controls">✕</button>

      <h2>${isNeha ? "A LITTLE GUIDE ✧" : "PLAYER GUIDE ◈"}</h2>

      <p>EXPLORE YOUR WAY AROUND THE WORLD</p>

      <div class="game-help-section">

        <h3>KEYBOARD</h3>

        <div class="game-help-row">
          <span>W / ↑</span><span>Move forward</span>
        </div>

        <div class="game-help-row">
          <span>S / ↓</span><span>Move backward</span>
        </div>

        <div class="game-help-row">
          <span>A / ←</span><span>Move left</span>
        </div>

        <div class="game-help-row">
          <span>D / →</span><span>Move right</span>
        </div>

        <div class="game-help-row">
          <span>E</span><span>Open nearby object</span>
        </div>

        <div class="game-help-row">
          <span>ESC</span><span>Close / return to world</span>
        </div>

      </div>

      <div class="game-help-section">
        <h3>TOUCH / MOUSE</h3>

        <p>
          Hold a direction button to move.
          Release it to stop.
          You can also tap a book or arcade machine to open it.
        </p>
      </div>

      <p class="game-help-footer">
        ${isNeha ? "HAVE A MAGICAL ADVENTURE 🦋" : "ENJOY THE DIMENSION ◈"}
      </p>

    </div>
  `;

  document.body.appendChild(helpPanel);

  const helpButton = interfaceArea.querySelector(".game-help-button");
  const helpClose = helpPanel.querySelector(".game-help-close");

  function closeHelp() {
    helpPanel.classList.remove("active");
    helpOpen = false;
  }

  helpButton.addEventListener("click", () => {
    helpOpen = true;
    stopMoving();
    helpPanel.classList.add("active");
  });

  helpClose.addEventListener("click", closeHelp);

  helpPanel.addEventListener("click", event => {
    if (event.target === helpPanel) closeHelp();
  });

  /* INTERACTION PROMPT */

  const prompt = document.createElement("div");
  prompt.className = "game-nearby-prompt";
  prompt.textContent = "Press E or tap to explore";

  Object.assign(prompt.style, {
    position: "absolute",
    left: "50%",
    bottom: "22%",
    transform: "translateX(-50%)",
    zIndex: "30",
    padding: "10px 16px",
    borderRadius: "999px",
    background: isNeha
      ? "rgba(255,239,250,.96)"
      : "rgba(15,8,35,.92)",
    color: isNeha ? "#874c83" : "#f5d8ff",
    border: isNeha
      ? "1px solid #fff"
      : "1px solid #d45cff",
    boxShadow: isNeha
      ? "0 0 22px #fff"
      : "0 0 22px #a52cff",
    font: "600 12px/1.3 Arial, sans-serif",
    letterSpacing: ".04em",
    display: "none",
    pointerEvents: "none",
    whiteSpace: "nowrap"
  });

  if (getComputedStyle(viewport).position === "static") {
    viewport.style.position = "relative";
  }

  viewport.appendChild(prompt);

  /* INFORMATION OVERLAY */

  const overlay = document.createElement("div");
  overlay.className = "game-overlay";

  overlay.innerHTML = `
    <div class="game-overlay-panel" role="dialog" aria-modal="true">

      <button class="game-close" type="button"
        aria-label="Close">✕</button>

      <div class="game-overlay-content"></div>

    </div>
  `;

  document.body.appendChild(overlay);

  const overlayContent = overlay.querySelector(".game-overlay-content");
  const closeButton = overlay.querySelector(".game-close");

  function openObject(object) {
    if (!object || openedObject) return;

    const key = isNeha
      ? object.dataset.book
      : object.dataset.machine;

    const templateId = contentIds[key];
    const template = templateId &&
      document.getElementById(templateId);

    if (!template || !("content" in template)) {
      console.warn("Information template not found:", templateId);
      return;
    }

    stopMoving();

    openedObject = object;
    nearbyObject = object;

    overlayContent.replaceChildren(
      template.content.cloneNode(true)
    );

    overlay.classList.add("active");
    object.classList.add("object-open");
    prompt.style.display = "none";
  }

  function closeObject() {
    if (!openedObject) {
      overlay.classList.remove("active");
      return;
    }

    openedObject.classList.remove("object-open");
    openedObject = null;

    overlay.classList.remove("active");

    updateNearbyObject();
  }

  closeButton.addEventListener("click", closeObject);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeObject();
  });

  /* OBJECT CLICK INTERACTION */

  objects.forEach(object => {
    object.addEventListener("click", () => {
      openObject(object);
    });
  });

  /* FIND NEAREST OBJECT */

  function updateNearbyObject() {
    if (openedObject || helpOpen) {
      prompt.style.display = "none";
      return;
    }

    const viewRect = viewport.getBoundingClientRect();

    const centreX = viewRect.left + viewRect.width / 2;
    const centreY = viewRect.top + viewRect.height / 2;

    let nearest = null;
    let nearestDistance = Infinity;

    objects.forEach(object => {
      const rect = object.getBoundingClientRect();

      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const distance = Math.hypot(
        x - centreX,
        (y - centreY) * 1.15
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = object;
      }
    });

    const interactionRange = Math.min(
      190,
      viewRect.width * 0.22
    );

    nearbyObject =
      nearestDistance <= interactionRange ? nearest : null;

    objects.forEach(object => {
      object.classList.toggle(
        "object-nearby",
        object === nearbyObject
      );
    });

    prompt.style.display = nearbyObject ? "block" : "none";

    if (nearbyObject) {
      prompt.textContent = isNeha
        ? "Press E or tap the book to open ✧"
        : "Press E or tap the machine to play ◈";
    }
  }

  /* CAMERA MOVEMENT */

  function clampCamera() {
    const maxX = Math.max(80, viewport.clientWidth * 0.42);
    const maxY = Math.max(45, viewport.clientHeight * 0.22);

    cameraX = Math.max(-maxX, Math.min(maxX, cameraX));
    cameraY = Math.max(-maxY, Math.min(maxY, cameraY));
  }

  function renderCamera() {
    scene.style.translate = `${-cameraX}px ${-cameraY}px`;
    updateNearbyObject();
  }

  function stopMoving() {
    directions.clear();

    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    lastTime = 0;
  }

  function movementLoop(timestamp) {
    if (openedObject || helpOpen || directions.size === 0) {
      animationFrame = null;
      lastTime = 0;
      return;
    }

    if (!lastTime) lastTime = timestamp;

    const delta = Math.min(
      (timestamp - lastTime) / 1000,
      0.04
    );

    lastTime = timestamp;

    let dx = 0;
    let dy = 0;

    if (directions.has("left")) dx -= 1;
    if (directions.has("right")) dx += 1;
    if (directions.has("forward")) dy -= 1;
    if (directions.has("backward")) dy += 1;

    const length = Math.hypot(dx, dy) || 1;

    cameraX += (dx / length) * speed * delta;
    cameraY += (dy / length) * speed * delta;

    clampCamera();
    renderCamera();

    animationFrame = requestAnimationFrame(movementLoop);
  }

  function startMoving(direction) {
    if (openedObject || helpOpen) return;

    directions.add(direction);

    if (animationFrame === null) {
      animationFrame = requestAnimationFrame(movementLoop);
    }
  }

  /* CLICKABLE DIRECTIONAL BUTTONS */

  interfaceArea.querySelectorAll("[data-direction]").forEach(button => {
    const direction = button.dataset.direction;

    button.addEventListener("pointerdown", event => {
      event.preventDefault();

      button.setPointerCapture?.(event.pointerId);

      startMoving(direction);
    });

    button.addEventListener("pointerup", () => {
      directions.delete(direction);
    });

    button.addEventListener("pointercancel", () => {
      directions.delete(direction);
    });

    button.addEventListener("lostpointercapture", () => {
      directions.delete(direction);
    });

    button.addEventListener("pointerleave", event => {
      if (event.buttons === 0) {
        directions.delete(direction);
      }
    });
  });

  /* KEYBOARD CONTROLS */

  const keyMap = {
    w: "forward",
    arrowup: "forward",

    s: "backward",
    arrowdown: "backward",

    a: "left",
    arrowleft: "left",

    d: "right",
    arrowright: "right"
  };

  document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (key === "escape") {
      closeObject();
      closeHelp();
      return;
    }

    if (
      (key === "e" || key === "enter") &&
      nearbyObject &&
      !openedObject
    ) {
      event.preventDefault();
      openObject(nearbyObject);
      return;
    }

    if (keyMap[key] && !openedObject && !helpOpen) {
      event.preventDefault();
      startMoving(keyMap[key]);
    }
  });

  document.addEventListener("keyup", event => {
    const direction = keyMap[event.key.toLowerCase()];

    if (direction) {
      directions.delete(direction);
    }
  });

  /* STOP WHEN WINDOW LOSES FOCUS */

  window.addEventListener("blur", stopMoving);

  window.addEventListener("resize", () => {
    clampCamera();
    renderCamera();
  });

  /* INITIALIZE */

  objects.forEach(object => {
    object.classList.remove("object-nearby", "object-open");
  });

  renderCamera();

});
