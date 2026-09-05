// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

const RADIUS = 400;      // preferred circle radius (px) — actual radius is fit
const TILT_X_DEG = -30;  // tilt around X axis (negative = front down, back up)
const TILT_Z_DEG = 0;    // tilt around Z axis (diagonal lean) — disabled
const OFFSET_X = 0;      // manual horizontal nudge on top of auto-center
const OFFSET_Y = 0;      // manual vertical nudge on top of auto-center
const JITTER_Y = 2000;   // preferred max Y offset per card (px) — also fit-scaled
const MIN_SCALE = 0.28;  // scale of back-most card
const MAX_SCALE = 0.75;  // scale of front-most card (1.0 = full size)
const MAX_OVERLAY = 0.2; // white veil opacity on the back-most card (0 at front)
const FOCUS_FADE = 0.55; // veil opacity on the non-selected cards when one is picked
const LABEL_STACK_GAP = 8; // px gap between filter pills in the row
const SCENE_W = 100;     // scene width as % of the stage container (>100 = bleed past edges)
const SCENE_H = 100;     // scene height as % of the stage container
const PERSPECTIVE = 1600;// must match `perspective` in stage CSS (px)
const SCROLL_FACTOR = 0.1; // degrees of rotation per pixel of wheel/touch delta
const AUTO_ROTATE_SPEED = 0.05; // deg per frame when idle (positive = leftward drift)
const IDLE_BEFORE_AUTO_MS = 800;// ms of inactivity before auto-rotation resumes
const EASE = 0.08;       // smoothing factor (lower = smoother)

// mobile & desktop anpassung
const isMobile = () => window.innerWidth <= 900;
const getScrollFactor = () => (isMobile() ? 0.25 : 0.1); 
const getAutoRotateSpeed = () => (isMobile() ? 0.12 : 0.05);

const TILT_X = (TILT_X_DEG * Math.PI) / 180;
const TILT_Z = (TILT_Z_DEG * Math.PI) / 180;
const cosX = Math.cos(TILT_X);
const sinX = Math.sin(TILT_X);
const cosZ = Math.cos(TILT_Z);
const sinZ = Math.sin(TILT_Z);

const SVG_NS = "http://www.w3.org/2000/svg";
const stage = document.querySelector(".aktuelles__stage");
const ring = document.querySelector(".aktuelles__ring");
const svg = document.querySelector(".aktuelles__connectors");
const dot = document.querySelector(".aktuelles__dot");
const centerLabel = document.querySelector(".aktuelles__label");

const cardEls = Array.from(ring.querySelectorAll(".aktuelles__card"));
const CARDS = cardEls.length;

const CARD_W = ring.offsetWidth || 140;
const CARD_H = ring.offsetHeight || 180;

const CENTER_Z = Math.round(((MAX_SCALE + MIN_SCALE) / 2) * 1000);
dot.style.zIndex = CENTER_Z;
centerLabel.style.zIndex = CENTER_Z + 1;
svg.style.zIndex = 0;

const slot = 2 / CARDS;
const bits = Math.round(Math.log2(CARDS));
function bandIndex(i) {
    let r = 0;
    for (let b = 0; b < bits; b++) r = (r << 1) | ((i >> b) & 1);
    return r % CARDS;
}
const jitterNorm = Array.from({ length: CARDS }, (_, i) => {
    const center = -1 + (bandIndex(i) + 0.5) * slot;
    return center + (Math.random() - 0.5) * slot * 0.6;
});

const cardColors = cardEls.map((el) => el.dataset.color || "#612c00");

const cards = cardEls;
const overlays = cardEls.map((el) =>
    el.querySelector(".aktuelles__card-overlay")
);
const lines = [];
const prevZ = new Array(CARDS).fill(-1);
const prevOverlay = new Array(CARDS).fill(-1);
const hoverBlend = new Array(CARDS).fill(0);
const cardHeights = new Array(CARDS).fill(0);
for (let i = 0; i < CARDS; i++) {
    const line = document.createElementNS(SVG_NS, "line");
    svg.appendChild(line);
    lines.push(line);
}

const CORNERS = 5;
const CORNER_COLORS = [
    "#005436", // Veranstaltungen
    "#4965e6", // Notizen
    "#fcbacd", // Beiträge
    "#f3511c", // Call for Papers
    "#8a4fff", // Publikationen
];
const CORNER_LABELS = [
    "Veranstaltungen",
    "Notizen",
    "Beiträge",
    "Call for Papers",
    "Publikationen",
];
const CORNER_KEYS = [
    "veranstaltung",
    "notiz",
    "beitrag",
    "call-for-papers",
    "publikation"
];

const cornerLabels = Array.from({ length: CORNERS }, (_, c) => {
    const label = document.createElement("div");
    label.className = "aktuelles__label aktuelles__label--filter";
    label.textContent = CORNER_LABELS[c];
    ring.appendChild(label);
    return label;
});

for (let c = 0; c < CORNERS; c++) {
    cornerLabels[c].style.zIndex = 100001;
}

const activeCorners = new Set();
function applyFilter(fromSync = false) {
    clearFocus();
    locked = false;

    const noFilter = activeCorners.size === 0;
    const activeColors = new Set();
    for (const c of activeCorners) activeColors.add(CORNER_COLORS[c]);

    for (let i = 0; i < CARDS; i++) {
        const matches = noFilter || activeColors.has(cardColors[i]);
        const op = matches ? "1" : "0";
        cards[i].style.opacity = op;
        lines[i].style.opacity = op;
    }
    cornerLines.forEach((cornerSet, c) => {
        const visible = noFilter || activeCorners.has(c);
        const op = visible ? "1" : "0";
        for (const { line } of cornerSet) {
            line.style.opacity = op;
        }
    });
    cornerLabels.forEach((label, c) => {
        label.classList.toggle("aktuelles__label--active", activeCorners.has(c));
    });

    requestAnimationFrame(() => {
        layoutFilters();
    });

    if (!fromSync) {
        const activeIdx = activeCorners.size > 0 ? Array.from(activeCorners)[0] : null;
        const activeKey = activeIdx !== null ? CORNER_KEYS[activeIdx] : null;
        window.dispatchEvent(new CustomEvent("aktuelles:filter-from-js", { detail: { key: activeKey } }));
    }
}

window.addEventListener("aktuelles:filter-from-alpine", (e) => {
    const key = e.detail ? e.detail.key : null;
    const idx = CORNER_KEYS.indexOf(key);
    activeCorners.clear();
    if (idx !== -1) {
        activeCorners.add(idx);
    }
    applyFilter(true);
});

cornerLabels.forEach((label, c) => {
    label.addEventListener("click", () => {
        const wasActive = activeCorners.has(c);
        activeCorners.clear();
        if (!wasActive) activeCorners.add(c);
        applyFilter();
    });
});

const cornerLines = Array.from({ length: CORNERS }, (_, c) => {
    const match = CORNER_COLORS[c];
    const arr = [];
    for (let i = 0; i < CARDS; i++) {
        if (cardColors[i] === match) {
            const line = document.createElementNS(SVG_NS, "line");
            svg.appendChild(line);
            arr.push({ line, cardIndex: i });
        }
    }
    return arr;
});

function computeBounds(Rx, Rz, jitter) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    const samples = 96;
    const jitterExtremes = [-jitter, 0, jitter];

    for (let s = 0; s < samples; s++) {
        const t = (s / samples) * Math.PI * 2;
        for (const jy of jitterExtremes) {
            let x = Rx * Math.cos(t);
            let y = jy;
            let z = Rz * Math.sin(t);

            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            y = y1; z = z1;

            const x2 = x * cosZ - y * sinZ;
            const y2 = x * sinZ + y * cosZ;
            x = x2; y = y2;

            const persp = PERSPECTIVE / (PERSPECTIVE - z);
            const px = x * persp;
            const py = y * persp;
            const halfW = (CARD_W / 2) * persp;
            const halfH = (CARD_H / 2) * persp;

            if (px - halfW < minX) minX = px - halfW;
            if (px + halfW > maxX) maxX = px + halfW;
            if (py - halfH < minY) minY = py - halfH;
            if (py + halfH > maxY) maxY = py + halfH;
        }
    }
    return {
        width: maxX - minX,
        height: maxY - minY,
        centerX: (maxX + minX) / 2,
        centerY: (maxY + minY) / 2,
    };
}

let fitRx = RADIUS;
let fitRz = RADIUS;
let fitJitter = JITTER_Y;
let autoOffsetX = 0;
let autoOffsetY = 0;

const cornerDotPositions = Array.from({ length: CORNERS }, () => ({ x: 0, y: 0 }));

function layoutFilters() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const switchEl = document.querySelector(".aktuelles__switch");
    
    // Nimm die echte Pixelbreite des Switches und übergib sie an CSS:
    if (switchEl) {
        document.documentElement.style.setProperty("--switch-width", `${switchEl.offsetWidth}px`);
    }

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const paddingX = rem * 1.5;
    const paddingY = isMobile() ? rem * 1.5 : rem * 0.75;

    const switchW = switchEl ? switchEl.offsetWidth + rem * 0.8 : 0;

    const maxRow1X = rect.width / 2 - paddingX - switchW;
    const maxFullX = rect.width / 2 - paddingX;

    let isRow1 = true;
    let rowY = paddingY - rect.height / 2;
    let stackX = paddingX - rect.width / 2;

    const sizes = cornerLabels.map((label) => ({
        w: label.offsetWidth,
        h: label.offsetHeight,
    }));

    cornerLabels.forEach((label, c) => {
        const currentMaxX = isRow1 ? maxRow1X : maxFullX;

        if (c > 0 && (stackX + sizes[c].w > currentMaxX)) {
            isRow1 = false;
            stackX = paddingX - rect.width / 2;
            rowY += (sizes[c].h || 32) + 8;
        }

        label.style.transform = `translate3d(${stackX}px, ${rowY}px, 1px)`;

        cornerDotPositions[c].x = stackX + sizes[c].w / 2;
        cornerDotPositions[c].y = rowY + sizes[c].h - 6;

        stackX += sizes[c].w + LABEL_STACK_GAP;
    });
}

function pinHeights() {
    for (let i = 0; i < CARDS; i++) {
        if (!cards[i].classList.contains("is-open")) cards[i].style.height = "";
    }
    for (let i = 0; i < CARDS; i++) {
        if (!cards[i].classList.contains("is-open")) {
            cardHeights[i] = cards[i].offsetHeight;
        }
    }
    for (let i = 0; i < CARDS; i++) {
        if (!cards[i].classList.contains("is-open")) {
            cards[i].style.height = cardHeights[i] + "px";
        }
    }
}

function recomputeFit() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const pillH = cornerLabels[0] ? cornerLabels[0].offsetHeight : 30;
    
    const safeTop = isMobile() ? (pillH + 6) * 2 : pillH * 0.7;
    const safeBottom = safeTop * 0.3;

    const sceneW = (rect.width * SCENE_W) / 100;
    const sceneH = Math.max(((rect.height - safeTop - safeBottom) * SCENE_H) / 100, 160);

    let Rx = RADIUS;
    let Rz = RADIUS;
    let j = JITTER_Y;

    for (let i = 0; i < 12; i++) {
        const b = computeBounds(Rx, Rz, j);
        const fx = sceneW / (b.width || 1);
        const fy = sceneH / (b.height || 1);
        Rx *= fx;
        Rz *= fy;
        j *= fy;
        if (Math.abs(fx - 1) < 0.003 && Math.abs(fy - 1) < 0.003) break;
    }

    fitRx = Math.max(Rx, 130);
    fitRz = Math.max(Rz, 110);
    fitJitter = Math.max(j, 40);

    const final = computeBounds(fitRx, fitRz, fitJitter);
    autoOffsetX = -final.centerX;
    autoOffsetY = -final.centerY + safeTop / 2 - safeBottom / 2;

    const dx = autoOffsetX + OFFSET_X;
    const dy = autoOffsetY + OFFSET_Y;
    dot.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0)`;
    centerLabel.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 1px)`;

    layoutFilters();
    pinHeights();
}

let target = 0;
let current = 0;

let locked = false;
let focusedIndex = null;
let paused = false;
let hoveredIndex = null;
let focusBlend = 0;
const FOCUS_SCALE = 1;
let selectBlend = 0;

function setOpen(i, open) {
    if (i === null || !cards[i]) return;
    cards[i].classList.toggle("is-open", open);
    cards[i].style.height = open
        ? "auto"
        : cardHeights[i]
            ? cardHeights[i] + "px"
            : "";
    const desc = cards[i].querySelector(".aktuelles__card-desc");
    if (desc) desc.setAttribute("aria-hidden", open ? "false" : "true");
}

function clearFocus() {
    setOpen(focusedIndex, false);
    focusedIndex = null;
}

function focusCard(i) {
    clearFocus();
    focusedIndex = i;
    const base = 90 - (360 / CARDS) * i;
    target = base + 360 * Math.round((current - base) / 360);
    locked = true;
}

let interactive = true; 
window.addEventListener("aktuelles:interactive", (e) => {
    interactive = !!(e.detail && e.detail.active);
});

let lastUserInput = -Infinity;
function markInteraction() {
    lastUserInput = performance.now();
}

// -----------------------------------------------------------------------------
// WHEEL & TOUCH HANDLER
// -----------------------------------------------------------------------------
let lastTouchX = null;
let lastTouchY = null;

function onWheel(e) {
    if (!interactive) return;
    locked = false;
    clearFocus();

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target += delta * getScrollFactor();

    markInteraction();
}

function onTouchStart(e) {
    if (!interactive) return;
    if (e.target.closest(".aktuelles__card.is-open, .aktuelles__switch, .aktuelles__filter, .aktuelles__playpause")) {
        return;
    }
    locked = false;
    clearFocus();

    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    markInteraction();
}

function onTouchMove(e) {
    if (!interactive || lastTouchY === null || lastTouchX === null) return;
    if (e.target.closest(".aktuelles__card.is-open, .aktuelles__switch, .aktuelles__filter, .aktuelles__playpause")) {
        return;
    }

    const dx = lastTouchX - e.touches[0].clientX;
    const dy = lastTouchY - e.touches[0].clientY;

    const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    target += delta * getScrollFactor();

    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    markInteraction();
}

function onTouchEnd() {
    lastTouchX = null;
    lastTouchY = null;
}

function tick() {
    if (
        !paused &&
        !locked &&
        performance.now() - lastUserInput > IDLE_BEFORE_AUTO_MS
    ) {
        target += getAutoRotateSpeed(); 
    }
    current += (target - current) * EASE;

    const scrolling =
        performance.now() - lastUserInput < IDLE_BEFORE_AUTO_MS;

    const settled =
        locked && focusedIndex !== null && Math.abs(target - current) < 0.4;

    focusBlend += ((settled ? 1 : 0) - focusBlend) * EASE;
    selectBlend += ((focusedIndex !== null ? 1 : 0) - selectBlend) * EASE;

    if (settled && !cards[focusedIndex].classList.contains("is-open")) {
        setOpen(focusedIndex, true);
    }

    const step = (Math.PI * 2) / CARDS;
    const baseRot = (current * Math.PI) / 180;

    const stageRect = stage.getBoundingClientRect();
    const cx = stageRect.width / 2;
    const cy = stageRect.height / 2;

    const offX = autoOffsetX + OFFSET_X;
    const offY = autoOffsetY + OFFSET_Y;
    const dotX = cx + offX;
    const dotY = cy + offY;

    const cornerScreens = cornerDotPositions.map((p) => ({
        x: cx + p.x,
        y: cy + p.y,
    }));

    const cardSX = new Array(CARDS);
    const cardSY = new Array(CARDS);

    for (let i = 0; i < CARDS; i++) {
        const t = step * i + baseRot;

        let x = fitRx * Math.cos(t);
        let y = jitterNorm[i] * fitJitter;
        let z = fitRz * Math.sin(t);

        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;
        y = y1; z = z1;

        const x2 = x * cosZ - y * sinZ;
        const y2 = x * sinZ + y * cosZ;
        x = x2; y = y2;

        const fx = x + offX;
        const fy = y + offY;

        const tNorm = (Math.sin(t) + 1) / 2;
        const cardScale = MIN_SCALE + tNorm * (MAX_SCALE - MIN_SCALE);

        const persp = PERSPECTIVE / (PERSPECTIVE - z);
        let screenX = fx * persp;
        let screenY = fy * persp;
        let renderScale = cardScale * persp;

        if (i === focusedIndex && focusBlend > 0.0001) {
            const b = focusBlend;
            screenX *= 1 - b;
            screenY *= 1 - b;
            renderScale = renderScale * (1 - b) + FOCUS_SCALE * b;
        }

        const hoverTarget =
            i === hoveredIndex && i !== focusedIndex && !scrolling ? 1 : 0;
        hoverBlend[i] += (hoverTarget - hoverBlend[i]) * EASE;
        renderScale += 0.03 * hoverBlend[i];

        cards[i].style.transform =
            `translate3d(${screenX}px, ${screenY}px, 0) scale(${renderScale})`;

        let zi;
        if (i === focusedIndex && focusBlend > 0.01) {
            zi = 1000000;
        } else if (i === hoveredIndex && tNorm > 0.5) {
            zi = 100000;
        } else {
            zi = Math.round(renderScale * 1000);
        }
        if (zi !== prevZ[i]) {
            cards[i].style.zIndex = zi;
            prevZ[i] = zi;
        }

        const depthVeil = (1 - tNorm) * MAX_OVERLAY;
        let v;
        if (i === focusedIndex) {
            v = depthVeil * (1 - selectBlend);
        } else {
            v = depthVeil + (FOCUS_FADE - depthVeil) * selectBlend;
        }
        const veil = Math.round(v * 100);
        if (veil !== prevOverlay[i]) {
            overlays[i].style.opacity = veil / 100;
            prevOverlay[i] = veil;
        }

        cardSX[i] = cx + screenX;
        cardSY[i] = cy + screenY;

        lines[i].setAttribute("x1", dotX);
        lines[i].setAttribute("y1", dotY);
        lines[i].setAttribute("x2", cardSX[i]);
        lines[i].setAttribute("y2", cardSY[i]);
    }

    for (let c = 0; c < CORNERS; c++) {
        const { x: csx, y: csy } = cornerScreens[c];
        for (const { line, cardIndex } of cornerLines[c]) {
            line.setAttribute("x1", csx);
            line.setAttribute("y1", csy);
            line.setAttribute("x2", cardSX[cardIndex]);
            line.setAttribute("y2", cardSY[cardIndex]);
        }
    }

    requestAnimationFrame(tick);
}

stage.addEventListener("wheel", onWheel, { passive: true });
stage.addEventListener("touchstart", onTouchStart, { passive: true });
stage.addEventListener("touchmove", onTouchMove, { passive: true });
stage.addEventListener("touchend", onTouchEnd, { passive: true });

// Klick auf Card-Aktion/Pfeil öffnet das Fullscreen Overlay Modal
// Klick auf Card-Aktion/Pfeil öffnet das Fullscreen Overlay Modal
cards.forEach((card, i) => {
  card.addEventListener("click", (e) => {
    const openBtn = e.target.closest(".aktuelles__card-open, .aktuelles__card-info");
    
    if (openBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      const cardId = card.dataset.id || card.getAttribute("data-id");
      
      if (cardId) {
        window.dispatchEvent(
          new CustomEvent("open-modal", { detail: { id: cardId } })
        );
      }
      return;
    }

    focusCard(i);
  });
});

// -----------------------------------------------------------------------------
// HELPER: Öffnet das Modal statt der unteren Liste
// -----------------------------------------------------------------------------
window.addEventListener("aktuelles:open-item", (e) => {
    const targetId = e.detail ? e.detail.id : null;
    if (!targetId) return;

    window.dispatchEvent(
        new CustomEvent("open-modal", { detail: { id: targetId } })
    );
});

const playPauseBtn = document.querySelector(".aktuelles__playpause");
if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
        paused = !paused;
        playPauseBtn.classList.toggle("is-paused", paused);
        playPauseBtn.setAttribute("aria-pressed", String(paused));
        playPauseBtn.setAttribute(
            "aria-label",
            paused ? "Animation abspielen" : "Animation pausieren"
        );
    });
}

const resizeObserver = new ResizeObserver(recomputeFit);
resizeObserver.observe(stage);

recomputeFit();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(recomputeFit);
}
tick();


function updateHeaderHeight() {
  const header = document.querySelector('.site-header');
  if (header) {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
  }
}

window.addEventListener('resize', updateHeaderHeight);
window.addEventListener('DOMContentLoaded', updateHeaderHeight);