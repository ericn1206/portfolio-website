// BLOB CURSOR — persistent across all SPA navigations
const blob = document.createElement('div');
blob.id = 'cursor-blob';
blob.style.display = 'none';
document.body.appendChild(blob);

let mouseX = 0, mouseY = 0, isMorphing = false, morphTarget = null;

document.addEventListener('mousemove', (e) => {
    blob.style.display = '';
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!isMorphing) {
        blob.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    }
});

function morphLoop() {
    if (!isMorphing || !morphTarget) return;
    const r  = morphTarget.getBoundingClientRect();
    const br = getComputedStyle(morphTarget).borderRadius;
    blob.style.transform    = `translate(${r.left}px, ${r.top}px)`;
    blob.style.width        = r.width  + 'px';
    blob.style.height       = r.height + 'px';
    blob.style.borderRadius = br;
    requestAnimationFrame(morphLoop);
}

document.addEventListener('mouseover', (e) => {
    // Slide hover: turn red but don't morph
    const slide = e.target.closest('.slide');
    if (slide) {
        blob.style.background = 'rgba(255, 20, 20, 0.22)';
        blob.style.border     = '2.5px solid rgba(220, 50, 50, 0.65)';
    } else if (!isMorphing) {
        blob.style.background = '';
        blob.style.border     = '';
    }

    const target = e.target.closest('a, button');
    if (target && !target.closest('.carousel')) {
        if (!isMorphing) {
            const r  = target.getBoundingClientRect();
            const br = getComputedStyle(target).borderRadius;
            blob.style.transition   = 'transform 0.22s ease, width 0.22s ease, height 0.22s ease, border-radius 0.22s ease, background 0.22s ease';
            blob.style.transform    = `translate(${r.left}px, ${r.top}px)`;
            blob.style.width        = r.width  + 'px';
            blob.style.height       = r.height + 'px';
            blob.style.borderRadius = br;
            blob.style.background   = 'rgba(255, 20, 20, 0.22)';
            blob.style.border       = '2.5px solid rgba(220, 50, 50, 0.65)';
            setTimeout(() => {
                if (!isMorphing) return;
                blob.style.transition = 'none';
                morphLoop();
            }, 230);
        }
        isMorphing  = true;
        morphTarget = target;
    } else if (isMorphing) {
        isMorphing  = false;
        morphTarget = null;
        blob.style.transition   = 'none';
        blob.style.transform    = `translate(${mouseX - 10}px, ${mouseY - 10}px)`;
        blob.style.width        = '';
        blob.style.height       = '';
        blob.style.borderRadius = '';
        blob.style.background   = '';
        blob.style.border       = '';
        requestAnimationFrame(() => { blob.style.transition = ''; });
    }
});

document.addEventListener('mouseleave', () => { blob.style.display = 'none'; });
document.addEventListener('mouseenter', () => { blob.style.display = '';     });
document.addEventListener('mousedown',  (e) => { if (e.button === 0 && !isMorphing) blob.style.background = 'rgba(220, 50, 50, 0.65)'; });
document.addEventListener('mouseup',    (e) => { if (e.button === 0 && !isMorphing) blob.style.background = ''; });

// HAMBURGER MENU — global so inline onclick= attributes work after DOM swaps
function toggleMenu() {
    const menu = document.querySelector('.menu-links');
    const icon = document.querySelector('.hamburger-icon');
    menu.classList.toggle('open');
    icon.classList.toggle('open');
}

// SPA ROUTER
function resetBlob() {
    isMorphing  = false;
    morphTarget = null;
    blob.style.transition   = 'none';
    blob.style.width        = '';
    blob.style.height       = '';
    blob.style.borderRadius = '';
    blob.style.background   = '';
    blob.style.border       = '';
    blob.style.display      = 'none';
    requestAnimationFrame(() => { blob.style.transition = ''; });
}

function updateStyles(newDoc) {
    const abs = (href) => new URL(href, location.href).pathname;
    const current = new Map(
        Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => [abs(l.href), l])
    );
    const next = Array.from(newDoc.querySelectorAll('link[rel="stylesheet"]'))
        .map(l => ({ raw: l.getAttribute('href'), path: abs(l.getAttribute('href')) }));
    const nextPaths = new Set(next.map(l => l.path));

    current.forEach((el, path) => { if (!nextPaths.has(path)) el.remove(); });
    next.forEach(({ raw, path }) => {
        if (!current.has(path)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = raw;
            document.head.appendChild(link);
        }
    });
}

function runPageScripts(newDoc) {
    Array.from(newDoc.querySelectorAll('script[src]'))
        .map(s => s.getAttribute('src'))
        .filter(src => !src.endsWith('router.js'))
        .forEach(src => {
            // Remove any prior instance of this script so it re-executes
            document.querySelectorAll('script[src]').forEach(s => {
                if (s.getAttribute('src') && s.getAttribute('src').split('?')[0] === src) s.remove();
            });
            const script = document.createElement('script');
            script.src = src + '?t=' + Date.now();
            document.body.appendChild(script);
        });
}

async function spaNavigate(url) {
    resetBlob();
    // Close hamburger if open
    document.querySelector('.menu-links')?.classList.remove('open');
    document.querySelector('.hamburger-icon')?.classList.remove('open');

    try {
        const res = await fetch(url);
        if (!res.ok) { location.href = url; return; }
        const html = await res.text();
        const newDoc = new DOMParser().parseFromString(html, 'text/html');

        updateStyles(newDoc);

        const newMain = newDoc.querySelector('main.page');
        const curMain = document.querySelector('main.page');
        if (newMain && curMain) curMain.innerHTML = newMain.innerHTML;

        document.title = newDoc.title;
        history.pushState({ url }, '', url);

        const parsedUrl = new URL(url, location.href);
        if (parsedUrl.hash) {
            const anchor = document.querySelector(parsedUrl.hash);
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo(0, 0);
        }

        runPageScripts(newDoc);

    } catch (e) {
        location.href = url;
    }
}

document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('mailto') || link.target === '_blank') return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;

    e.preventDefault();
    spaNavigate(url.href);
});

window.addEventListener('popstate', () => {
    spaNavigate(location.href);
});
