// burgermenu
function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// CAROUSEL!!!

const track = document.getElementById("track");
const carousel = document.querySelector(".carousel-viewport");

const speedPxPerSec = 40;

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

// MOBILE!!: drag/swipe support 
let dragPaused = false;
let dragging = false;
let startX = 0;
let startTranslateX = 0;

function isPaused() {
    // replace your hover check: hover only matters on devices that support hover
    const canHover = window.matchMedia("(hover: hover)").matches;
    const hovered = canHover ? carousel.matches(":hover") : false;

    return hovered || tabPaused || wheelPaused || dragPaused;
}

// allow horizontal gestures. do not let browser treat it as page scroll
carousel.style.touchAction = "pan-y"; // allow vertical page scroll

carousel.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragPaused = true;
    carousel.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startTranslateX = x; // x is current translate value
});

carousel.addEventListener("pointermove", (e) => {
    if (!dragging) return;

        const dx = e.clientX - startX;

        // drag moves opposite direction 
        x = startTranslateX + dx;

        wrap();
        track.style.transform = `translateX(${x}px)`;
});

function endDrag(e) {
    if (!dragging) return;
    dragging = false;

    // small delay before auto resumes (feels nicer)
    setTimeout(() => {
        dragPaused = false;
        last = performance.now(); // avoid jump
    }, 200);
}

carousel.addEventListener("pointerup", endDrag);
carousel.addEventListener("pointercancel", endDrag);
carousel.addEventListener("lostpointercapture", endDrag);


requestAnimationFrame(step);

// TYPEWRITER ANIMATION THINGY
document.querySelectorAll(".typewriter").forEach(el => {
    const full = el.dataset.text ?? el.textContent;
    el.textContent = ""; // start empty

    const delayMs = 1400;     // start delay
    const msPerChar = 70;    // typing speed

    let i = 0;

    setTimeout(() => {
        const timer = setInterval(() => {
        el.textContent = full.slice(0, i + 1);
        i++;
        if (i >= full.length) clearInterval(timer);
        }, msPerChar);
    }, delayMs);
});

const slides = document.querySelectorAll(".slide");
const title = document.getElementById("info-title");
const desc = document.getElementById("info-desc");

function clearInfo() {
    title.textContent = "";
    desc.textContent = "";
}

// for mouse blur carousel effect
slides.forEach(slide => {
    slide.addEventListener("mouseenter", () => {
        title.textContent = slide.dataset.title || "";
        desc.textContent = slide.dataset.desc || "";
    });

    slide.addEventListener("mouseleave", clearInfo);
});

const carousel1 = document.querySelector(".carousel");

slides.forEach(slide => {
    slide.addEventListener("mouseenter", () => {
        carousel1.classList.add("hovering");
    });

    slide.addEventListener("mouseleave", () => {
        carousel1.classList.remove("hovering");
    });
});
