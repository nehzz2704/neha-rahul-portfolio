
/* ==========================================
   NEHA & RAHUL — INTERACTIVE GAME SYSTEM
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const isNeha = document.body.classList.contains("enchanted-game");
    const isRahul = document.body.classList.contains("psychedelic-game");

    if (!isNeha && !isRahul) return;

    const scene = document.querySelector(
        isNeha ? "#corridorScene" : "#arcadeScene"
    );

    const viewport = document.querySelector(
        isNeha ? ".corridor-viewport" : ".arcade-viewport"
    );

    if (!scene || !viewport) return;

    const objects = [
        ...scene.querySelectorAll(
            isNeha ? "[data-book]" : "[data-machine]"
        )
    ];

    const contentIds = {
        about: "book-about-content",
        creations: isNeha
            ? "book-creations-content"
            : "machine-creations-content",
        status: isNeha
            ? "book-status-content"
            : "machine-status-content",
        skills: isNeha
            ? "book-skills-content"
            : "machine-skills-content",
        contact: "book-contact-content",
        profile: "machine-profile-content",
        data: "machine-data-content"
    };

    let activeObject = null;
    let isOpen = false;
    let movementInterval = null;

    const pressedKeys = new Set();

    const player = {
        x: 0,
        z: 0,
        speed: 0.12
    };

    /* =====================================
       CREATE GAME INTERFACE
    ===================================== */

    const interfaceArea = document.createElement("div");
    interfaceArea.className = "game-interface";

    interfaceArea.innerHTML = `
        <button class="game-help-button" type="button">
            ${isNeha ? "🦋" : "◈"}
            <span>CONTROLS</span>
        </button>

        <div class="game-direction-pad">
            <button data-direction="forward" aria-label="Move forward">▲</button>

            <div class="game-direction-middle">
                <button data-direction="left" aria-label="Move left">◀</button>
                <button data-direction="right" aria-label="Move right">▶</button>
            </div>

            <button data-direction="backward" aria-label="Move backward">▼</button>
        </div>
    `;

    viewport.appendChild(interfaceArea);

    /* =====================================
       CONTROLS GUIDE POP-OUT
    ===================================== */

    const helpPanel = document.createElement("div");
    helpPanel.className = "game-help-panel";

    helpPanel.innerHTML = `
        <div class="game-help-content">

            <button class="game-help-close" aria-label="Close controls">
                ✕
            </button>

            <h2>${isNeha ? "A LITTLE GUIDE ✧" : "PLAYER GUIDE ◈"}</h2>

            <p>HOW TO EXPLORE THIS WORLD</p>

            <div class="game-help-section">
                <h3>KEYBOARD CONTROLS</h3>

                <div class="game-help-row">
                    <span>W / ↑</span>
                    <span>Move forward</span>
                </div>

                <div class="game-help-row">
                    <span>S / ↓</span>
                    <span>Move backward</span>
                </div>

                <div class="game-help-row">
                    <span>A / ←</span>
                    <span>Move left</span>
                </div>

                <div class="game-help-row">
                    <span>D / →</span>
                    <span>Move right</span>
                </div>

                <div class="game-help-row">
                    <span>E</span>
                    <span>Open an object</span>
                </div>

                <div class="game-help-row">
                    <span>ESC</span>
                    <span>Close an object</span>
                </div>
            </div>

            <div class="game-help-section">
                <h3>CLICKABLE CONTROLS</h3>
                <p>
                    Hold the directional buttons to move.
                    Release to stop.
                </p>
            </div>

            <p class="game-help-footer">
                ${isNeha
                    ? "HAVE A MAGICAL ADVENTURE 🦋"
                    : "ENJOY THE DIMENSION ◈"}
            </p>

        </div>
    `;

    document.body.appendChild(helpPanel);

    const helpButton = interfaceArea.querySelector(
        ".game-help-button"
    );

    const helpClose = helpPanel.querySelector(
        ".game-help-close"
    );

    helpButton.addEventListener("click", () => {
        helpPanel.classList.add("active");
    });

    helpClose.addEventListener("click", () => {
        helpPanel.classList.remove("active");
    });

    helpPanel.addEventListener("click", event => {
        if (event.target === helpPanel) {
            helpPanel.classList.remove("active");
        }
    });

    /* =====================================
       INFORMATION OVERLAY
    ===================================== */

    const overlay = document.createElement("div");
    overlay.className = "game-overlay";

    overlay.innerHTML = `
        <div class="game-overlay-panel">

            <button class="game-close" aria-label="Close">
                ✕
            </button>

            <div class="game-overlay-content"></div>

        </div>
    `;

    document.body.appendChild(overlay);

    const overlayContent = overlay.querySelector(
        ".game-overlay-content"
    );

    const closeButton = overlay.querySelector(".game-close");

    function openObject(object) {

        if (isOpen || !object) return;

        const key = isNeha
            ? object.dataset.book
            : object.dataset.machine;

        const templateId = contentIds[key];
        const template = document.getElementById(templateId);

        if (!template) {
            console.warn("Content template not found:", templateId);
            return;
        }

        isOpen = true;
        activeObject = object;

        stopMovement();

        overlayContent.replaceChildren(
            template.content.cloneNode(true)
        );

        overlay.classList.add("active");
        object.classList.add("object-open");

    }

    function closeObject() {

        if (!isOpen) return;

        overlay.classList.remove("active");

        if (activeObject) {
            activeObject.classList.remove("object-open");
        }

        activeObject = null;
        isOpen = false;

    }

    closeButton.addEventListener("click", closeObject);

    /* =====================================
       OBJECT CLICK INTERACTION
    ===================================== */

    objects.forEach(object => {

        object.addEventListener("click", () => {
            openObject(object);
        });

    });

    /* =====================================
       MOVEMENT SYSTEM
    ===================================== */

    function move(direction) {

        if (isOpen) return;

        const amount = player.speed;

        if (direction === "forward") player.z += amount;
        if (direction === "backward") player.z -= amount;
        if (direction === "left") player.x -= amount;
        if (direction === "right") player.x += amount;

        player.x = Math.max(-2, Math.min(2, player.x));
        player.z = Math.max(-2, Math.min(2, player.z));

        viewport.style.setProperty("--player-x", player.x);
        viewport.style.setProperty("--player-z", player.z);

    }

    function startMovement(direction) {

        if (isOpen || movementInterval) return;

        move(direction);

        movementInterval = setInterval(() => {
            move(direction);
        }, 40);

    }

    function stopMovement() {

        if (movementInterval) {
            clearInterval(movementInterval);
            movementInterval = null;
        }

    }

    /* =====================================
       CLICKABLE DIRECTIONAL BUTTONS
    ===================================== */

    const directionButtons = interfaceArea.querySelectorAll(
        "[data-direction]"
    );

    directionButtons.forEach(button => {

        const direction = button.dataset.direction;

        button.addEventListener("pointerdown", event => {
            event.preventDefault();
            startMovement(direction);
        });

        button.addEventListener("pointerup", stopMovement);
        button.addEventListener("pointerleave", stopMovement);
        button.addEventListener("pointercancel", stopMovement);

    });

    window.addEventListener("pointerup", stopMovement);

    /* =====================================
       KEYBOARD CONTROLS
    ===================================== */

    const keyDirections = {
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
            helpPanel.classList.remove("active");
            return;
        }

        if (key === "e" && activeObject && !isOpen) {
            openObject(activeObject);
            return;
        }

        if (keyDirections[key] && !isOpen) {
            event.preventDefault();

            if (!pressedKeys.has(key)) {
                pressedKeys.add(key);
                startMovement(keyDirections[key]);
            }
        }

    });

    document.addEventListener("keyup", event => {

        const key = event.key.toLowerCase();

        if (keyDirections[key]) {
            pressedKeys.delete(key);
            stopMovement();
        }

    });

    window.addEventListener("blur", () => {
        pressedKeys.clear();
        stopMovement();
    });

});
