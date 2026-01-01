function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

const track = document.getElementById("track");
const carousel = document.querySelector(".carousel-viewport");

const speedPxPerSec = 70;

let x = 0;
let last = performance.now();

// separate pause reasons so they don't overwrite each other
let hoverPaused = false;
let tabPaused = document.hidden;
let wheelPaused = false;

function isPaused() {
  // if hovered, ALWAYS paused
  const hovered = carousel.matches(":hover");
  return hovered || tabPaused || wheelPaused;
}

function wrap() {
  const halfWidth = track.scrollWidth / 2;
  if (halfWidth <= 0) return;

  // keep x in [-halfWidth, 0]
  while (-x >= halfWidth) x += halfWidth;
  while (x > 0) x -= halfWidth;
}

function step(now) {
  const dt = (now - last) / 1000;
  last = now;

  if (!isPaused()) {
    x -= speedPxPerSec * dt;
    wrap();
    track.style.transform = `translateX(${x}px)`;
  }

  requestAnimationFrame(step);
}

// hover pause (lwk optional since isPaused uses matches(":hover"))
carousel.addEventListener("mouseenter", () => (hoverPaused = true));
carousel.addEventListener("mouseleave", () => (hoverPaused = false));

// tab hidden pause
document.addEventListener("visibilitychange", () => {
  tabPaused = document.hidden;
  last = performance.now(); // avoid jump
});

// wheel interaction
carousel.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    wheelPaused = true;

    const dx = e.deltaX;
    const dy = e.deltaY;
    const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;

    const scrollSpeed = 1; // tune
    x -= dominant * scrollSpeed;

    wrap();
    track.style.transform = `translateX(${x}px)`;

    clearTimeout(carousel._wheelTimeout);
    carousel._wheelTimeout = setTimeout(() => {
      wheelPaused = false;
      // if still hovered, isPaused() keeps it paused anyway
    }, 250);
  },
  { passive: false }
);

requestAnimationFrame(step);
