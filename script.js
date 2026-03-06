// Smooth scrolling for in-page navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    const navList = document.getElementById("nav-menu");
    const toggle = document.querySelector(".nav-toggle");
    if (navList && toggle && navList.classList.contains("is-open")) {
      navList.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});

// Mobile navigation toggle
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navMenu.classList.toggle("is-open");
  });
}

// Stagger delays for grid children
document.querySelectorAll(".stack-grid, .projects-grid").forEach((grid) => {
  grid.querySelectorAll("[data-animate]").forEach((card, i) => {
    card.style.transitionDelay = `${i * 90}ms`;
  });
});

// Fade-in on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0 },
);

document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

// Tetris decoration in About section
(function () {
  const canvas = document.getElementById("tetris-canvas");
  if (!canvas) return;

  const BLOCK = 26;
  const COLS = 10;
  const ROWS = 15;

  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;

  const ctx = canvas.getContext("2d");

  const COLORS = ["#a855f7", "#9333ea", "#7c3aed", "#c084fc", "#6366f1", "#8b5cf6"];

  const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
  ];

  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  let current = null;
  let frame = 0;
  const SPEED = 28;

  function spawn() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = Math.floor(Math.random() * (COLS - shape[0].length + 1));
    return { shape, color, x, y: 0 };
  }

  function fits(piece, dy) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const ny = piece.y + r + dy;
        const nx = piece.x + c;
        if (ny >= ROWS || nx < 0 || nx >= COLS) return false;
        if (ny >= 0 && board[ny][nx]) return false;
      }
    }
    return true;
  }

  function lock(piece) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const ny = piece.y + r;
          const nx = piece.x + c;
          if (ny >= 0) board[ny][nx] = piece.color;
        }
      }
    }
  }

  function clearRows() {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        r++;
      }
    }
  }

  function isFull() {
    for (let c = 0; c < COLS; c++) {
      if (board[1][c]) return true;
    }
    return false;
  }

  function reset() {
    for (let r = 0; r < ROWS; r++) board[r] = Array(COLS).fill(null);
  }

  function drawBlock(x, y, color) {
    const px = x * BLOCK;
    const py = y * BLOCK;
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
    // top-left highlight
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(px + 2, py + 2, BLOCK - 4, 3);
    ctx.fillRect(px + 2, py + 2, 3, BLOCK - 4);
    // bottom-right shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(px + 2, py + BLOCK - 4, BLOCK - 4, 3);
    ctx.fillRect(px + BLOCK - 4, py + 2, 3, BLOCK - 4);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(168,85,247,0.07)";
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(canvas.width, r * BLOCK);
      ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawBlock(c, r, board[r][c]);
      }
    }

    if (current) {
      for (let r = 0; r < current.shape.length; r++) {
        for (let c = 0; c < current.shape[r].length; c++) {
          if (current.shape[r][c]) drawBlock(current.x + c, current.y + r, current.color);
        }
      }
    }
  }

  function loop() {
    frame++;
    if (frame % SPEED === 0) {
      if (current) {
        if (fits(current, 1)) {
          current.y++;
        } else {
          lock(current);
          clearRows();
          if (isFull()) reset();
          current = spawn();
          if (!fits(current, 0)) { reset(); current = spawn(); }
        }
      }
    }
    draw();
    requestAnimationFrame(loop);
  }

  current = spawn();
  loop();
})();

// Set current year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear().toString();
}

