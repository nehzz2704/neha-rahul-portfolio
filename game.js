
/* ============================================
   NEHA & RAHUL — SIMPLE PORTFOLIO INTERACTIONS
   Hover to highlight. Click to open. Close to return.
============================================ */

document.addEventListener("DOMContentLoaded", () => {

  const isNeha = document.body.classList.contains("enchanted-game");
  const isRahul = document.body.classList.contains("psychedelic-game");

  if (!isNeha && !isRahul) return;

  const objects = document.querySelectorAll(
    isNeha ? "[data-book]" : "[data-machine]"
  );

  const contentIds = isNeha ? {
    about: "book-about-content",
    creations: "book-creations-content",
    status: "book-status-content",
    skills: "book-skills-content",
    contact: "book-contact-content"
  } : {
    profile: "machine-profile-content",
    creations: "machine-creations-content",
    status: "machine-status-content",
    skills: "machine-skills-content",
    data: "machine-data-content"
  };

  // Remove old movement controls and prompts
  document.querySelectorAll(
    ".corridor-controls, .arcade-controls, " +
    ".game-interface, .game-help-panel, " +
    ".game-nearby-prompt"
  ).forEach(element => element.remove());

  // Create information overlay
  const overlay = document.createElement("div");
  overlay.className = "game-overlay";

  overlay.innerHTML = `
    <div class="game-overlay-panel" role="dialog" aria-modal="true">
      <button class="game-close" type="button" aria-label="Close">✕</button>
      <div class="game-overlay-content"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector(".game-overlay-content");
  const closeButton = overlay.querySelector(".game-close");

  let activeObject = null;

  // Open a book or arcade machine
  function openObject(object) {
    const key = isNeha
      ? object.dataset.book
      : object.dataset.machine;

    const template = document.getElementById(contentIds[key]);

    if (!template) return;

    activeObject = object;

    panel.replaceChildren(template.content.cloneNode(true));

    overlay.classList.add("active");
    object.classList.add("object-open");
  }

  // Close the information panel
  function closeObject() {
    if (activeObject) {
      activeObject.classList.remove("object-open");
      activeObject = null;
    }

    overlay.classList.remove("active");
  }

  // Click interactions
  objects.forEach(object => {
    object.addEventListener("click", () => {
      if (!activeObject) {
        openObject(object);
      }
    });
  });

  closeButton.addEventListener("click", closeObject);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeObject();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeObject();
    }
  });

});
