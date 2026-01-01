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
let paused = false;

function step(now) {
const dt = (now - last) / 1000;
last = now;

if (!paused) {
    x -= speedPxPerSec * dt;

    // halfWidth = width of original slides (since we duplicated )
    const halfWidth = track.scrollWidth / 2;

    // when we've moved past the first set, wrap seamlessly
    if (-x >= halfWidth) x += halfWidth;

    track.style.transform = `translateX(${x}px)`;
}

requestAnimationFrame(step);
}

// Pause on hover 
/*carousel.addEventListener("mouseenter", () => paused = true);*/
carousel.addEventListener("mouseleave", () => paused = false);

// pause when tab is hidden 
document.addEventListener("visibilitychange", () => {
paused = document.hidden;
last = performance.now(); // avoid jump after returning
});

requestAnimationFrame(step);

