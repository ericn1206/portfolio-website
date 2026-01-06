// burgermenu
function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// CAROUSEL!!!

let targetX = 0;
let rafPending = false;

function render() {
  rafPending = false;
  wrap();
  track.style.transform = `translate3d(${x}px, 0, 0)`; // GPU accel
}


const track = document.getElementById("track");
const carousel = document.querySelector(".carousel-viewport");

//pause carousel permanently for now...
let speedPxPerSec = 0;

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

    // auto-scroll
    if (!isPaused()) {
        x -= speedPxPerSec * dt;
    }

    // wheel inertia (runs at rAF smoothness)
    if (Math.abs(wheelVelocity) > 0.01) {
        // wheelVelocity is "px per second" style, so apply with dt (?)
        x -= wheelVelocity * dt;

        // friction (tune)
        const friction = 8; // higher means stops sooner
        wheelVelocity *= Math.exp(-friction * dt);

        if (Math.abs(wheelVelocity) < 0.01) wheelVelocity = 0;
    }

    wrap();
    track.style.transform = `translate3d(${x}px, 0, 0)`;

    requestAnimationFrame(step);
}

// hover pause (lwk optional since isPaused uses matches(":hover"))
carousel.addEventListener("mouseenter", () => (hoverPaused = true));
carousel.addEventListener("mouseleave", () => (hoverPaused = false));

// stop carousel once user starts interacting (remove?)
carousel.addEventListener("mouseleave", () => (speedPxPerSec = 0));

// tab hidden pause
document.addEventListener("visibilitychange", () => {
    tabPaused = document.hidden;
    last = performance.now(); // avoid jump
});

// smooth wheel state
let wheelVelocity = 0;      // px/sec-ish ?
let wheelActive = false;    // used for pausing auto-scroll briefly

// wheel interaction
carousel.addEventListener(
    "wheel",
    (e) => {
        e.preventDefault();

        // pick the dominant axis so vertical wheel still moves carousel
        const dx = e.deltaX;
        const dy = e.deltaY;
        const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;

        // normalize: trackpads often use deltaMode=0 (pixels), mouse wheel can be 1 (lines)
        const LINE_HEIGHT = 16;
        const delta = e.deltaMode === 1 ? dominant * LINE_HEIGHT : dominant;

        // convert delta into velocity (tune multiplier)
        const wheelBoost = 14; // bigger is more responsive
        wheelVelocity += delta * wheelBoost;

        wheelActive = true;
        wheelPaused = true;

        clearTimeout(carousel._wheelTimeout);
        carousel._wheelTimeout = setTimeout(() => {
        wheelActive = false;
        wheelPaused = false;
        last = performance.now(); // avoid jump
        }, 120); // short pause; inertia still runs
    },
    { passive: false }
);

// MOBILE!!: drag/swipe support 
let dragPaused = false;
let dragging = false;
let pointerDown = false;

let startX = 0;
let startTranslateX = 0;
let activePointerId = null;

const DRAG_THRESHOLD = 8; // pixels


function isInteractive(el) {
  return el.closest("a, button, input, textarea, select, label");
}

function isPaused() {
    // replace your hover check: hover only matters on devices that support hover
    const canHover = window.matchMedia("(hover: hover)").matches;
    const hovered = canHover ? carousel.matches(":hover") : false;

    return hovered || tabPaused || wheelPaused || dragPaused;
}

// allow horizontal gestures. do not let browser treat it as page scroll
carousel.style.touchAction = "pan-y"; // allow vertical page scroll


carousel.addEventListener("pointerdown", (e) => {
  pointerDown = true;
  dragging = false;
  dragPaused = true;
  startTranslateX = x;
    targetX = x;


  activePointerId = e.pointerId;
  startX = e.clientX;
  startTranslateX = x;

  // capture immediately so we keep getting moves on mobile Safari
  carousel.setPointerCapture(e.pointerId);
});

// prevent accidental click after drag
carousel.addEventListener("click", (e) => {
  if (dragging) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);


track.style.willChange = "transform";

carousel.addEventListener("pointermove", (e) => {
  if (!pointerDown || e.pointerId !== activePointerId) return;

  const dx = e.clientX - startX;

  if (!dragging) {
    if (Math.abs(dx) < DRAG_THRESHOLD) return;
    dragging = true;
  }

  // prevent page scroll while dragging
  e.preventDefault();

  targetX = startTranslateX + dx;
  x = targetX;

  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(render);
  }
}, { passive: false });


function endDrag(e) {
    if (e.pointerId !== activePointerId) return;

    pointerDown = false;

    if (dragging) {
        dragging = false;
        // small delay before auto resumes
        setTimeout(() => {
        dragPaused = false;
        last = performance.now();
        }, 200);
    } else {
        // it was a tap (so therefore not a drag), resume immediately
        dragPaused = false;
        last = performance.now();
    }

    activePointerId = null;
}

carousel.addEventListener("pointerup", endDrag);
carousel.addEventListener("pointercancel", endDrag);
carousel.addEventListener("lostpointercapture", endDrag);


requestAnimationFrame(step);

// TYPEWRITER ANIMATION THINGY
document.querySelectorAll(".typewriter").forEach(el => {
    const full = el.dataset.text ?? el.textContent;
    el.textContent = ""; // start empty

    const delayMs = 2600;     // start delay
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

/* invis char:ㅤ*/

// Source - https://stackoverflow.com/a (mobileAndTabletCheck)
// Posted by Michael Zaporozhets, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-03, License - CC BY-SA 4.0
window.mobileAndTabletCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function clearInfo() {
    title.textContent = "scroll/swipe to interact";
    desc.textContent = "hover to view descriptions";
    if (mobileAndTabletCheck()) {
        desc.textContent = "tap to view descriptions";
    }
    
}
clearInfo();
const carousel1 = document.querySelector(".carousel");

/* show / hide info when entering or leaving the CAROUSEL */
carousel1.addEventListener("mouseenter", () => {
    // show info area
    document.getElementById("carousel-info").classList.add("active");

});

carousel1.addEventListener("mouseleave", () => {
    // hide info area
    document.getElementById("carousel-info").classList.remove("active");


    // clear text
    clearInfo();
});

/* slides only update text */
slides.forEach(slide => {
    slide.addEventListener("mouseenter", () => {
        title.textContent = slide.dataset.title || "";
        desc.textContent = slide.dataset.desc || "";
    });
});


// for mouse blur carousel effect

slides.forEach(slide => {
    slide.addEventListener("mouseenter", () => {
        carousel1.classList.add("hovering");
    });

    slide.addEventListener("mouseleave", () => {
        carousel1.classList.remove("hovering");
    });
});



