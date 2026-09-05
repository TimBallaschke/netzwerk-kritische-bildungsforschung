// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

function projectCarouselOrbit(angle, radiusX, radiusZ, jitter, projection) {
    const { cosX, sinX, cosZ, sinZ, perspective, minScale, maxScale } = projection;
    const x = radiusX * Math.cos(angle);
    const z = radiusZ * Math.sin(angle);
    const tiltedY = jitter * cosX - z * sinX;
    const tiltedZ = jitter * sinX + z * cosX;
    const depth = perspective / (perspective - tiltedZ);
    const progress = (Math.sin(angle) + 1) / 2;
    return {
        x: (x * cosZ - tiltedY * sinZ) * depth,
        y: (x * sinZ + tiltedY * cosZ) * depth,
        scale: (minScale + progress * (maxScale - minScale)) * depth,
    };
}

function carouselSideGutter(width) {
    // Let the mobile orbit reach closer to the edge while retaining a safe inset.
    if (width <= 900) return Math.min(width / 4, Math.max(4, Math.min(6, width * 0.01)));
    return Math.min(width / 4, Math.max(16, Math.min(28, width * 0.02)));
}

function fitCarouselHorizontalRadius(width, cardWidths, radiusZ, jitters, projection, hoverScale) {
    // Fit a complete revolution using the displayed card widths, including
    // perspective and hover. The horizontal orbit has no Z-axis tilt.
    const halfSpace = width / 2 - carouselSideGutter(width) - 1;
    let radius = width;
    const samples = 256;
    for (let i = 0; i < cardWidths.length; i++) {
        for (let s = 0; s < samples; s++) {
            const point = projectCarouselOrbit(s / samples * Math.PI * 2, 1, radiusZ, jitters[i], projection);
            if (Math.abs(point.x) < 0.000001) continue;
            const halfCard = cardWidths[i] / 2 * (point.scale + hoverScale);
            radius = Math.min(radius, (halfSpace - halfCard) / Math.abs(point.x));
        }
    }
    return Math.max(0, radius);
}

function containCarouselCard(x, scale, cardWidth, stageWidth) {
    const available = Math.max(1, stageWidth - 2 * carouselSideGutter(stageWidth));
    const fittedScale = Math.min(scale, available / Math.max(1, cardWidth));
    const travel = Math.max(0, (available - cardWidth * fittedScale) / 2);
    return { x: Math.max(-travel, Math.min(travel, x)), scale: fittedScale };
}

function selectCarouselCardIndices(categories, activeCategories, mobile) {
    const limit = mobile ? 12 : 15;
    const indices = [];
    for (let i = 0; i < categories.length && indices.length < limit; i++) {
        if (activeCategories.size === 0 || activeCategories.has(categories[i])) indices.push(i);
    }
    return indices;
}

function initCarousel() {

const RADIUS = 400;      // preferred circle radius (px) — actual radius is fit
const TILT_X_DEG = -30;  // tilt around X axis (negative = front down, back up)
const TILT_Z_DEG = 0;    // tilt around Z axis (diagonal lean) — disabled
const OFFSET_X = 0;      // manual horizontal nudge on top of auto-center
const OFFSET_Y = 0;      // manual vertical nudge on top of auto-center
const JITTER_Y = 2000;   // preferred max Y offset per card (px) — also fit-scaled
const MIN_SCALE = 0.28;  // scale of back-most card
const MAX_SCALE = 0.75;  // scale of front-most card (1.0 = full size)
const MOBILE_MAX_SCALE = 0.65; // keep foreground cards more compact on mobile
const HOVER_SCALE = 0.03;
const MAX_OVERLAY = 0.2; // white veil opacity on the back-most card (0 at front)
const BLUR_ENTER_DEPTH = 0.28; // 0 = back, 1 = front
const BLUR_EXIT_DEPTH = 0.34;  // keep the class stable near the depth boundary
const LABEL_STACK_GAP = 8; // px gap between filter pills in the row
const SCENE_H = 100;     // scene height as % of the stage container
const PERSPECTIVE = 1600;// must match `perspective` in stage CSS (px)
const SCROLL_FACTOR = 0.1; // degrees of rotation per pixel of wheel/touch delta
const AUTO_ROTATE_SPEED = 0.05; // deg per frame when idle (positive = leftward drift)
const IDLE_BEFORE_AUTO_MS = 800;// ms of inactivity before auto-rotation resumes
const EASE = 0.08;       // smoothing factor (lower = smoother)
const FOCUS_EASE = 0.1;  // slightly quicker rotation and expansion after a card click

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
const projection = {
    cosX, sinX, cosZ, sinZ,
    perspective: PERSPECTIVE,
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
};

const SVG_NS = "http://www.w3.org/2000/svg";
const stage = document.querySelector(".aktuelles__stage");
const ring = document.querySelector(".aktuelles__ring");
const svg = document.querySelector(".aktuelles__connectors");
const dot = document.querySelector(".aktuelles__dot");
const centerLabel = document.querySelector(".aktuelles__label");

// This module is shared by pages that have no carousel.
if (!stage || !ring || !svg || !dot || !centerLabel) return;

const cardEls = Array.from(ring.querySelectorAll(".aktuelles__card"));
const CARDS = cardEls.length;
if (CARDS === 0) return;

svg.style.zIndex = 0;

const jitterSeeds = Array.from({ length: CARDS }, () => Math.random() - 0.5);
const jitterNorm = new Array(CARDS).fill(0);
let visibleIndices = [];
const visibleSlots = new Array(CARDS).fill(-1);

const cardColors = cardEls.map((el) => el.dataset.color || "#612c00");

const cards = cardEls;
const overlays = cardEls.map((el) =>
    el.querySelector(".aktuelles__card-overlay")
);
const descriptions = cardEls.map((el) => el.querySelector(".aktuelles__card-desc"));
const expansionAnimations = Array.from({ length: CARDS }, () => []);
const returnWidthAnimations = new Array(CARDS).fill(null);
const focusBlends = new Array(CARDS).fill(0);
const lines = [];
const prevZ = new Array(CARDS).fill(-1);
const prevOverlay = new Array(CARDS).fill(-1);
const depthBlurred = new Array(CARDS).fill(false);
const hoverBlend = new Array(CARDS).fill(0);
const cardHeights = new Array(CARDS).fill(0);
const cardWidths = new Array(CARDS).fill(0);
for (let i = 0; i < CARDS; i++) {
    const line = document.createElementNS(SVG_NS, "line");
    svg.appendChild(line);
    lines.push(line);
}

const CORNERS = 5;
const CORNER_COLORS = [
    "#6EF3FF", // Veranstaltungen
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

const graphFilters = document.createElement("div");
graphFilters.className = "aktuelles__graph-filters";
graphFilters.setAttribute("role", "group");
graphFilters.setAttribute("aria-label", "Filter");
stage.appendChild(graphFilters);

const cornerLabels = Array.from({ length: CORNERS }, (_, c) => {
    const label = document.createElement("div");
    label.className = "aktuelles__label aktuelles__label--filter";
    label.setAttribute("role", "button");
    label.setAttribute("aria-pressed", "false");
    label.textContent = CORNER_LABELS[c];
    graphFilters.appendChild(label);
    return label;
});

for (let c = 0; c < CORNERS; c++) {
    // Keep the category controls above the shared white focus backdrop.
    cornerLabels[c].style.zIndex = 300000;
}

const activeCorners = new Set();
function applyFilter(fromSync = false) {
    clearFocus();
    locked = false;
    hoveredIndex = null;

    updateVisibleCards();
    cornerLabels.forEach((label, c) => {
        label.classList.toggle("aktuelles__label--active", activeCorners.has(c));
        label.setAttribute("aria-pressed", String(activeCorners.has(c)));
    });

    recomputeFit();

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

function updateVisibleCards() {
    const activeColors = new Set(Array.from(activeCorners, c => CORNER_COLORS[c]));
    const next = selectCarouselCardIndices(cardColors, activeColors, isMobile());
    if (next.length === visibleIndices.length && next.every((index, slot) => index === visibleIndices[slot])) return;

    // Keep a focused card in place when its slot changes at a breakpoint.
    if (focusedIndex !== null && next.includes(focusedIndex)) {
        const shift = 360 * visibleSlots[focusedIndex] / visibleIndices.length
            - 360 * next.indexOf(focusedIndex) / next.length;
        current += shift;
        target += shift;
    }
    visibleIndices = next;
    visibleSlots.fill(-1);
    next.forEach((index, slot) => { visibleSlots[index] = slot; });
    if (focusedIndex !== null && visibleSlots[focusedIndex] === -1) {
        clearFocus();
        locked = false;
    }

    const bandSize = 2 / Math.max(1, next.length);
    const bits = Math.round(Math.log2(Math.max(1, next.length)));
    next.forEach((index, slot) => {
        let band = 0;
        for (let bit = 0; bit < bits; bit++) band = (band << 1) | ((slot >> bit) & 1);
        jitterNorm[index] = -1 + (band % next.length + 0.5) * bandSize
            + jitterSeeds[index] * bandSize * 0.6;
    });

    for (let i = 0; i < CARDS; i++) {
        const visible = visibleSlots[i] !== -1;
        cards[i].hidden = !visible;
        cards[i].inert = !visible;
        lines[i].style.display = visible ? "" : "none";
        if (!visible) {
            returnWidthAnimations[i]?.cancel();
            returnWidthAnimations[i] = null;
            focusBlends[i] = hoverBlend[i] = 0;
            cards[i].classList.remove("is-returning");
        }
    }
    for (const cornerSet of cornerLines) {
        for (const { line, cardIndex } of cornerSet) {
            line.style.display = visibleSlots[cardIndex] !== -1 ? "" : "none";
        }
    }
}

function computeVerticalBounds(Rz, jitter) {
    if (visibleIndices.length === 0) return { height: 0, centerY: 0 };
    let minY = Infinity, maxY = -Infinity;

    const samples = 96;
    for (const i of visibleIndices) {
        for (let s = 0; s < samples; s++) {
            const point = projectCarouselOrbit(s / samples * Math.PI * 2, 0, Rz, jitterNorm[i] * jitter, projection);
            const halfH = cardHeights[i] / 2 * (point.scale + HOVER_SCALE);
            minY = Math.min(minY, point.y - halfH);
            maxY = Math.max(maxY, point.y + halfH);
        }
    }
    return {
        height: maxY - minY,
        centerY: (maxY + minY) / 2,
    };
}

let fitRx = RADIUS;
let fitRz = RADIUS;
let fitJitter = JITTER_Y;
let autoOffsetX = 0;
let autoOffsetY = 0;

const cornerDotPositions = Array.from({ length: CORNERS }, () => ({ x: 0, y: 0 }));
let filterTop = 0;
let filterBottom = 0;

function layoutFilters() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const switchEl = document.querySelector(".aktuelles__switch");
    
    // Nimm die echte Pixelbreite des Switches und übergib sie an CSS:
    if (switchEl) {
        document.documentElement.style.setProperty("--switch-width", `${switchEl.offsetWidth}px`);
    }

    if (isMobile()) {
        // CSS wraps the bottom controls and includes the device's safe area.
        // Keep each connector attached to the visible top of its filter pill.
        const filterRect = graphFilters.getBoundingClientRect();
        filterTop = filterRect.top - rect.top;
        filterBottom = filterRect.bottom - rect.top;
        cornerLabels.forEach((label, c) => {
            const labelRect = label.getBoundingClientRect();
            cornerDotPositions[c].x = labelRect.left + labelRect.width / 2 - rect.left - rect.width / 2;
            cornerDotPositions[c].y = labelRect.top + 6 - rect.top - rect.height / 2;
        });
        return;
    }

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const paddingX = rem * 1.5;
    const paddingY = rem * 0.75;

    const switchW = switchEl ? switchEl.offsetWidth + rem * 0.8 : 0;

    const maxRow1X = rect.width / 2 - paddingX - switchW;
    const maxFullX = rect.width / 2 - paddingX;

    let isRow1 = true;
    let rowY = paddingY - rect.height / 2;
    let stackX = paddingX - rect.width / 2;

    const sizes = cornerLabels.map((label) => {
        const { width, height } = label.getBoundingClientRect();
        return { w: width, h: height };
    });

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
    filterTop = paddingY;
    filterBottom = rowY + sizes[sizes.length - 1].h + rect.height / 2;
}

// Follow the animated pill width so neighbours and connector anchors move
// together. Observe the border box: the text width stays fixed as padding grows.
const filterResizeObserver = new ResizeObserver(() => {
    const previousTop = filterTop;
    const previousBottom = filterBottom;
    layoutFilters();
    if (Math.abs(filterTop - previousTop) > 1 || Math.abs(filterBottom - previousBottom) > 1) recomputeFit();
});
cornerLabels.forEach((label) => filterResizeObserver.observe(label, { box: "border-box" }));
filterResizeObserver.observe(graphFilters);

function measureCardWidths() {
    for (const i of visibleIndices) {
        cardWidths[i] = parseFloat(getComputedStyle(cards[i]).width) || cards[i].offsetWidth;
    }
}

function measureClosedCardSizes() {
    for (const i of visibleIndices) {
        if (!cards[i].classList.contains("is-open")) {
            // The description may still be collapsing. Exclude its current
            // height from the orbit bounds, but let the card itself keep its
            // natural height throughout the transition.
            cardHeights[i] = cards[i].offsetHeight - (descriptions[i]?.offsetHeight || 0);
        }
    }
    measureCardWidths();
}

function recomputeFit() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    projection.maxScale = isMobile() ? MOBILE_MAX_SCALE : MAX_SCALE;
    const centerZ = Math.round(((projection.maxScale + MIN_SCALE) / 2) * 1000);
    dot.style.zIndex = centerZ;
    centerLabel.style.zIndex = centerZ + 1;

    // Card widths and text wrapping change at responsive breakpoints.
    measureClosedCardSizes();
    layoutFilters();
    const switchRect = document.querySelector(".aktuelles__switch")?.getBoundingClientRect();
    const safeTop = isMobile() ? (switchRect ? switchRect.bottom - rect.top : 0) + 16 : filterBottom + 16;
    const safeBottom = isMobile() ? rect.height - filterTop + 16 : 16;

    const sceneH = Math.max(((rect.height - safeTop - safeBottom) * SCENE_H) / 100, 160);

    let Rz = visibleIndices.length ? RADIUS : 0;
    let j = visibleIndices.length ? JITTER_Y : 0;

    for (let i = 0; i < 12 && visibleIndices.length; i++) {
        const b = computeVerticalBounds(Rz, j);
        const fy = sceneH / (b.height || 1);
        Rz *= fy;
        j *= fy;
        if (Math.abs(fy - 1) < 0.003) break;
    }

    fitRz = Math.max(0, Rz);
    fitJitter = Math.max(0, j);
    fitRx = fitCarouselHorizontalRadius(rect.width, visibleIndices.map(i => cardWidths[i]), fitRz,
        visibleIndices.map(i => jitterNorm[i] * fitJitter), projection, HOVER_SCALE);

    const final = computeVerticalBounds(fitRz, fitJitter);
    autoOffsetX = 0;
    // Fit only the cards to the available space. The center badge and its
    // connector origin stay at the stage center regardless of active filters.
    autoOffsetY = -final.centerY + safeTop / 2 - safeBottom / 2;
}

let target = 0;
let current = 0;

let locked = false;
let focusedIndex = null;
let pendingClose = null;
let paused = false;
let hoveredIndex = null;
const FOCUS_SCALE = 1;

function setOpen(i, open) {
    if (i === null || !cards[i]) return;
    expansionAnimations[i] = [];
    cards[i].classList.remove("is-content-visible");
    const wasOpen = cards[i].classList.contains("is-open");
    const previousWidth = parseFloat(getComputedStyle(cards[i]).width);
    returnWidthAnimations[i]?.cancel();
    returnWidthAnimations[i] = null;
    cards[i].classList.toggle("is-open", open);
    const toggle = cards[i].querySelector(".aktuelles__card-info");
    if (toggle) {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Karte schließen" : "Karte öffnen");
    }
    const desc = descriptions[i];
    if (desc) {
        desc.setAttribute("aria-hidden", "true");
        if (open) {
            // Follow the actual expansion so a quick reopen or reduced motion
            // doesn't leave a stale timer waiting to reveal the text.
            expansionAnimations[i] = desc.getAnimations().filter(
                (animation) => animation.transitionProperty === "grid-template-rows"
            );
        }
    }
    // A resize may have fitted the wider mobile focus card. Restore the full
    // orbit using the closed width and current text wrapping when it closes.
    if (wasOpen && !open) {
        recomputeFit();
        const closedWidth = parseFloat(getComputedStyle(cards[i]).width);
        if (Math.abs(previousWidth - closedWidth) > 0.5
            && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // Mobile has different open/closed widths. Fit the final layout
            // first, then ease the visible width back without an abrupt reflow.
            returnWidthAnimations[i] = cards[i].animate(
                [{ width: `${previousWidth}px` }, { width: `${closedWidth}px` }],
                { duration: 400, easing: "ease" }
            );
        }
    }
}

function clearFocus() {
    if (pendingClose) cards[pendingClose.index].classList.remove("is-closing");
    pendingClose = null;
    setOpen(focusedIndex, false);
    focusedIndex = null;
    stage.classList.remove("has-focused-card");
}

function closeFocusedCard() {
    if (focusedIndex === null || pendingClose) return;
    const card = cards[focusedIndex];
    card.classList.add("is-closing");
    card.classList.remove("is-content-visible");
    const desc = descriptions[focusedIndex];
    desc?.setAttribute("aria-hidden", "true");
    // Keep the expanded geometry until the visible text has faded. With no
    // visible text or reduced motion, there is no animation to wait for.
    pendingClose = {
        index: focusedIndex,
        animations: desc ? desc.getAnimations().filter(
            (animation) => animation.transitionProperty === "opacity"
        ) : [],
    };
}

function focusCard(i) {
    if (visibleSlots[i] === -1) return;
    clearFocus();
    focusedIndex = i;
    stage.classList.add("has-focused-card");
    const base = 90 - (360 / visibleIndices.length) * visibleSlots[i];
    target = base + 360 * Math.round((current - base) / 360);
    locked = true;
}

let interactive = false;
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
    // Let a backdrop tap close through its click handler; do not expose a
    // background card between touchstart and the synthesized click.
    if (e.target.closest(".aktuelles__card.is-open, .aktuelles__focus-backdrop, .aktuelles__switch, .aktuelles__filter, .aktuelles__playpause")) {
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
    // Avoid layout work while the carousel is hidden behind a dialog or list.
    if (document.hidden || document.documentElement.classList.contains("modal-is-open") || stage.offsetParent === null) {
        requestAnimationFrame(tick);
        return;
    }
    if (pendingClose && pendingClose.animations.every((animation) =>
        animation.playState === "finished" || animation.playState === "idle"
    )) {
        clearFocus();
        target = current;
        locked = false;
        markInteraction();
    }
    if (
        !paused &&
        !locked &&
        performance.now() - lastUserInput > IDLE_BEFORE_AUTO_MS
    ) {
        target += getAutoRotateSpeed(); 
    }
    const rotationEase = locked && focusedIndex !== null ? FOCUS_EASE : EASE;
    current += (target - current) * rotationEase;

    const scrolling =
        performance.now() - lastUserInput < IDLE_BEFORE_AUTO_MS;

    const settled =
        locked && focusedIndex !== null && Math.abs(target - current) < 0.4;

    if (settled && !pendingClose && !cards[focusedIndex].classList.contains("is-open")) {
        setOpen(focusedIndex, true);
    }

    if (settled && !pendingClose && descriptions[focusedIndex]
        && !cards[focusedIndex].classList.contains("is-content-visible")) {
        // Reveal when the height finishes, without waiting for the scale's long tail.
        const ready = expansionAnimations[focusedIndex].every((animation) =>
            animation.playState === "finished" || animation.playState === "idle"
        );
        if (ready) {
            cards[focusedIndex].classList.add("is-content-visible");
            descriptions[focusedIndex].setAttribute("aria-hidden", "false");
        }
    }

    const step = (Math.PI * 2) / Math.max(1, visibleIndices.length);
    const baseRot = (current * Math.PI) / 180;

    const stageRect = stage.getBoundingClientRect();
    const cx = stageRect.width / 2;
    const cy = stageRect.height / 2;

    const offX = autoOffsetX + OFFSET_X;
    const offY = autoOffsetY + OFFSET_Y;
    const dotX = cx;
    const dotY = cy;

    const cornerScreens = cornerDotPositions.map((p) => ({
        x: cx + p.x,
        y: cy + p.y,
    }));

    const cardSX = new Array(CARDS);
    const cardSY = new Array(CARDS);

    // Read before the transform writes, including the first frame of a resize
    // or focus change, when CSS may already have changed the card widths.
    measureCardWidths();

    for (const i of visibleIndices) {
        // Each card retains its own blend after losing focus, so closing is
        // the reverse of opening instead of a jump to the orbit coordinates.
        const focusTarget = settled && i === focusedIndex ? 1 : 0;
        const focusEase = focusTarget ? FOCUS_EASE : EASE;
        focusBlends[i] += (focusTarget - focusBlends[i]) * focusEase;
        if (Math.abs(focusTarget - focusBlends[i]) < 0.005) focusBlends[i] = focusTarget;
        const focusBlend = focusBlends[i];
        const returning = i !== focusedIndex && focusBlend > 0;
        cards[i].classList.toggle("is-returning", returning);

        const t = step * visibleSlots[i] + baseRot;

        const tNorm = (Math.sin(t) + 1) / 2;
        const point = projectCarouselOrbit(t, fitRx, fitRz, jitterNorm[i] * fitJitter, projection);
        let screenX = point.x + offX;
        let screenY = point.y + offY;
        let renderScale = point.scale;

        if (focusBlend > 0) {
            const b = focusBlend;
            screenX *= 1 - b;
            screenY *= 1 - b;
            renderScale = renderScale * (1 - b) + FOCUS_SCALE * b;
        }

        const hoverTarget =
            i === hoveredIndex && i !== focusedIndex && !returning && !scrolling ? 1 : 0;
        hoverBlend[i] += (hoverTarget - hoverBlend[i]) * EASE;
        renderScale += HOVER_SCALE * hoverBlend[i];

        // Also enforce the inset between sampled angles, during focus/hover,
        // and on the first frame after a viewport or card-width change.
        const contained = containCarouselCard(screenX, renderScale, cardWidths[i], stageRect.width);
        screenX = contained.x;
        renderScale = contained.scale;

        cards[i].style.transform =
            `translate3d(${screenX}px, ${screenY}px, 0) scale(${renderScale})`;

        let zi;
        if (i === focusedIndex) {
            zi = 1000000;
        } else if (returning) {
            zi = 900000;
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
        // Only depth affects individual cards; the shared backdrop handles focus.
        const v = depthVeil * (1 - focusBlend);
        const veil = Math.round(v * 100);
        if (veil !== prevOverlay[i]) {
            overlays[i].style.opacity = veil / 100;
            prevOverlay[i] = veil;
        }

        // CSS transitions one fixed blur radius only when crossing the rear
        // boundary. Selected cards sharpen as they come forward.
        const shouldBlur = i !== focusedIndex && !returning
            && tNorm < (depthBlurred[i] ? BLUR_EXIT_DEPTH : BLUR_ENTER_DEPTH);
        if (shouldBlur !== depthBlurred[i]) {
            cards[i].classList.toggle("is-depth-blurred", shouldBlur);
            depthBlurred[i] = shouldBlur;
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
            if (visibleSlots[cardIndex] === -1) continue;
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

stage.querySelector(".aktuelles__focus-backdrop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeFocusedCard();
});

// Match the site's desktop hover rules and clear any hover after a resize.
const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)");
hoverMedia.addEventListener("change", () => { hoveredIndex = null; });

cards.forEach((card, i) => {
  card.addEventListener("pointerenter", (e) => {
    if (hoverMedia.matches && e.pointerType !== "touch") hoveredIndex = i;
  });
  card.addEventListener("pointerleave", () => {
    if (hoveredIndex === i) hoveredIndex = null;
  });

  card.addEventListener("click", (e) => {
    if (e.target.closest(".aktuelles__card-info")) {
      e.stopPropagation();
      e.preventDefault();
      if (focusedIndex === i) closeFocusedCard();
      else focusCard(i);
      return;
    }

    const arrow = e.target.closest(".aktuelles__card-open");
    if (arrow) {
      e.stopPropagation();
      // External arrows are native links; preserve new-tab and keyboard behavior.
      if (arrow.matches("a[href]")) return;
      e.preventDefault();
      
      const cardId = card.dataset.id || card.getAttribute("data-id");
      
      if (cardId) {
        window.dispatchEvent(
          new CustomEvent("open-modal", { detail: { id: cardId } })
        );
      }
      return;
    }

    // Clicking or selecting content inside the focused card keeps it open.
    if (focusedIndex !== i) focusCard(i);
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

const resizeObserver = new ResizeObserver(() => {
    updateVisibleCards();
    recomputeFit();
});
resizeObserver.observe(stage);

updateVisibleCards();
recomputeFit();
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(recomputeFit);
}
tick();


}

initCarousel();
