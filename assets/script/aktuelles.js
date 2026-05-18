// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

const RADIUS = 400;      // preferred circle radius (px) — actual radius is fit
const TILT_X_DEG = -30;  // tilt around X axis (negative = front down, back up)
const TILT_Z_DEG = 0;    // tilt around Z axis (diagonal lean) — disabled
const OFFSET_X = 0;      // manual horizontal nudge on top of auto-center
const OFFSET_Y = 0;      // manual vertical nudge on top of auto-center
const JITTER_Y = 2000;   // preferred max Y offset per card (px) — also fit-scaled
const MIN_SCALE = 0.4;   // scale of back-most card (front-most stays at 1.0)
const MAX_OVERLAY = 0.2; // white veil opacity on the back-most card (0 at front)
const LABEL_STACK_GAP = 8; // px gap between filter pills in the row
const SCENE_W = 100;     // scene width as % of the stage container (>100 = bleed past edges)
const SCENE_H = 100;     // scene height as % of the stage container
const PERSPECTIVE = 1600;// must match `perspective` in stage CSS (px)
const SCROLL_FACTOR = 0.1; // degrees of rotation per pixel of wheel/touch delta
const AUTO_ROTATE_SPEED = 0.05; // deg per frame when idle (positive = leftward drift)
const IDLE_BEFORE_AUTO_MS = 800;// ms of inactivity before auto-rotation resumes
const EASE = 0.08;       // smoothing factor (lower = smoother)

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

// Cards are server-rendered from the `aktuelles` content (see
// aktuelles-card snippet). The carousel count is whatever the CMS has.
const cardEls = Array.from(ring.querySelectorAll(".aktuelles__card"));
const CARDS = cardEls.length;

const CARD_W = ring.offsetWidth || 140;
const CARD_H = ring.offsetHeight || 180;

// The centre hub sits at the orbit's mid-depth so front cards (larger
// renderScale) paint over it and back cards behind it. Same ×1000 metric
// as the per-card z-index in tick(): a card crossing the centre plane
// (z ≈ 0, persp ≈ 1, tNorm ≈ 0.5) has renderScale ≈ (1 + MIN_SCALE) / 2.
const CENTER_Z = Math.round(((1 + MIN_SCALE) / 2) * 1000);
dot.style.zIndex = CENTER_Z;
centerLabel.style.zIndex = CENTER_Z + 1; // label just above its own dot
svg.style.zIndex = 0; // lines always behind every card

// Stratified Y offsets in [-1, 1] — scaled by `fitJitter` at render time.
// The vertical range is split into CARDS equal bands. Each card's ORBITAL
// index i is mapped to a band via a bit-reversal permutation, so cards that
// are angularly adjacent (consecutive i, horizontally close on screen) land
// in vertically far-apart bands: card i high, i+1 low, i+2 in between, …
// This minimises overlap. Assumes CARDS is a power of two (16) → the
// permutation is a bijection, keeping the vertical coverage perfectly even.
// A small in-band wiggle keeps it from looking like a rigid grid.
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

// Per-card category color comes from the server-rendered markup
// (data-color, derived from the entry's blueprint type). It no longer
// tints the card (cards are uniform green); it only tells the corner
// filter which connector lines belong to which card.
const cardColors = cardEls.map((el) => el.dataset.color || "#612c00");

const cards = cardEls;
const overlays = cardEls.map((el) =>
	el.querySelector(".aktuelles__card-overlay")
);
const lines = [];
// Last-applied z-index per card (paint order = on-screen size) — only
// written when the integer value changes.
const prevZ = new Array(CARDS).fill(-1);
// Last-applied veil opacity (×100, integer) — only write style when it changes.
const prevOverlay = new Array(CARDS).fill(-1);
for (let i = 0; i < CARDS; i++) {
	const line = document.createElementNS(SVG_NS, "line");
	svg.appendChild(line);
	lines.push(line);
}

// Five filter pills/dots — laid out in a horizontal row by recomputeFit()
// in this array order. Each connects ONLY to cards of one specific color.
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
const cornerLabels = Array.from({ length: CORNERS }, (_, c) => {
	const label = document.createElement("div");
	label.className = "aktuelles__label aktuelles__label--filter";
	label.textContent = CORNER_LABELS[c];
	ring.appendChild(label);
	return label;
});
// Filter pills are interactive controls — always above every card.
for (let c = 0; c < CORNERS; c++) {
	cornerLabels[c].style.zIndex = 100001;
}

// Active corner filter — single-select. No active corner = no filter, show
// everything. Clicking a pill makes it the only active one; clicking the
// already-active pill clears the filter (back to showing everything).
const activeCorners = new Set();
function applyFilter() {
	// Changing the filter releases any clicked/centred card and resumes
	// rotation — otherwise the ring stays frozen on a card that the new
	// filter just hid, and the carousel looks empty.
	clearFocus();
	locked = false;

	const noFilter = activeCorners.size === 0;
	const activeColors = new Set();
	for (const c of activeCorners) activeColors.add(CORNER_COLORS[c]);

	for (let i = 0; i < CARDS; i++) {
		const matches = noFilter || activeColors.has(cardColors[i]);
		const op = matches ? "1" : "0";
		cards[i].style.opacity = op;
		lines[i].style.opacity = op; // center line going to this card
	}
	// Corner lines: visible if their corner is active (or no filter at all)
	cornerLines.forEach((cornerSet, c) => {
		const visible = noFilter || activeCorners.has(c);
		const op = visible ? "1" : "0";
		for (const { line } of cornerSet) {
			line.style.opacity = op;
		}
	});
	// Toggle active visual state on the corner pills themselves
	cornerLabels.forEach((label, c) => {
		label.classList.toggle("aktuelles__label--active", activeCorners.has(c));
	});
	// Active pill changed width (the ✕ circle) — re-flow the row so the
	// other pills slide over (CSS transitions the transform).
	layoutFilters();
}
cornerLabels.forEach((label, c) => {
	label.addEventListener("click", () => {
		const wasActive = activeCorners.has(c);
		activeCorners.clear(); // single-select: drop any previous selection
		if (!wasActive) activeCorners.add(c); // re-clicking active = clear
		applyFilter();
	});
});
// For each corner, only create lines to cards whose color matches.
// Each entry: { line, cardIndex } so we know which card to point at.
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

// -----------------------------------------------------------------------------
// Fit: scale RADIUS and JITTER_Y so the projected bounding box (including card
// dimensions and perspective scaling) fits within SCENE_W × SCENE_H. Iterates
// because perspective is non-linear in radius.
// -----------------------------------------------------------------------------

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
// Cached world-space positions of the 4 corner dots (updated by recomputeFit)
const cornerDotPositions = Array.from({ length: CORNERS }, () => ({ x: 0, y: 0 }));

// Lay the filter pills in a horizontal row pinned to the very top-left of
// the container, 1rem from the top and left edges. Label boxes are anchored
// at the stage centre, so offset by 1rem − half the stage size. Re-run on
// resize AND whenever a pill's active state changes its width, so the
// other pills slide over (CSS transitions the transform).
function layoutFilters() {
	const rect = stage.getBoundingClientRect();
	const rem =
		parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
	const inset = rem * 1.5; // horizontal: match the header's 1.5rem edge gap
	const insetY = rem * 0.75; // vertical: tighter gap below the header
	const rowY = insetY - rect.height / 2;

	// READ pass: measure every pill first (one layout flush). Mixing reads
	// and writes per-iteration forces a reflow each loop and, racing the
	// rAF render, makes the carousel flash on every filter toggle.
	const sizes = cornerLabels.map((label) => ({
		w: label.offsetWidth,
		h: label.offsetHeight,
	}));

	// WRITE pass: position the row (no reads in between → no thrash).
	let stackX = inset - rect.width / 2;
	cornerLabels.forEach((label, c) => {
		label.style.transform =
			`translate(0, 0) translate3d(${stackX}px, ${rowY}px, 1px)`;

		// Connector lines anchor at the bottom-centre of this pill, nudged
		// a few px up so the join sits just inside the pill shape.
		cornerDotPositions[c].x = stackX + sizes[c].w / 2;
		cornerDotPositions[c].y = rowY + sizes[c].h - 6;

		stackX += sizes[c].w + LABEL_STACK_GAP;
	});
}

function recomputeFit() {
	const rect = stage.getBoundingClientRect();
	const sceneW = (rect.width * SCENE_W) / 100;
	const sceneH = (rect.height * SCENE_H) / 100;
	let Rx = RADIUS;
	let Rz = RADIUS;
	let j = JITTER_Y;
	// Independent X/Z fit — cluster stretches to scene aspect ratio
	for (let i = 0; i < 12; i++) {
		const b = computeBounds(Rx, Rz, j);
		const fx = sceneW / b.width;
		const fy = sceneH / b.height;
		Rx *= fx;
		Rz *= fy;
		j *= fy;
		if (Math.abs(fx - 1) < 0.003 && Math.abs(fy - 1) < 0.003) break;
	}
	fitRx = Rx;
	fitRz = Rz;
	fitJitter = j;

	// Auto-center: shift world coords so projected bbox center sits at origin
	const final = computeBounds(fitRx, fitRz, fitJitter);
	autoOffsetX = -final.centerX;
	autoOffsetY = -final.centerY;

	// Move the center dot to match (in CSS world space)
	const dx = autoOffsetX + OFFSET_X;
	const dy = autoOffsetY + OFFSET_Y;
	dot.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0)`;

	// Place the "Aktuelles" label at the center, sitting on top of the dot
	// (z=1 so it's always in front of the dot regardless of card depth ordering)
	centerLabel.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 1px)`;

	layoutFilters();
}

let target = 0;
let current = 0;

// Clicking a card locks the ring: auto-rotation stops and we animate the
// clicked card to the front-centre of the orbit. Any wheel/touch input
// releases the lock and hands control back to the user.
let locked = false;
let focusedIndex = null;
// Frozen by the play/pause control: tick() keeps looping but skips all
// motion/DOM updates, so the scene holds exactly where it was.
let paused = false;
// Index of the card currently hovered (null = none). Used to lift a
// hovered card to the front — but only while it's on the front half of
// the orbit (see tick()).
let hoveredIndex = null;
// 0 → card sits at its orbital spot; 1 → pulled to the stage centre
// (= .aktuelles centre) at FOCUS_SCALE. Eased each frame in tick().
let focusBlend = 0;
const FOCUS_SCALE = 1;

function setOpen(i, open) {
	if (i === null || !cards[i]) return;
	cards[i].classList.toggle("is-open", open);
	const desc = cards[i].querySelector(".aktuelles__card-desc");
	if (desc) desc.setAttribute("aria-hidden", open ? "false" : "true");
}

// Collapse the currently focused card and forget it (used when the user
// takes over, or before focusing a different card).
function clearFocus() {
	setOpen(focusedIndex, false);
	focusedIndex = null;
}

function focusCard(i) {
	clearFocus(); // collapse any open card before rotating to the new one
	focusedIndex = i;
	// A card is front-centre when its orbital angle t = π/2, i.e.
	// step*i + baseRot = π/2  →  current(deg) = 90 - (360 / CARDS) * i.
	const base = 90 - (360 / CARDS) * i;
	// Pick the equivalent angle nearest the current rotation (shortest path).
	target = base + 360 * Math.round((current - base) / 360);
	locked = true;
}

// The carousel only responds to wheel/drag while the page is locked at it
// (snapped to the header bottom). script.js broadcasts this state.
let interactive = false;
window.addEventListener("aktuelles:interactive", (e) => {
	interactive = !!(e.detail && e.detail.active);
});

// Infinite "scroll": wheel + touch events accumulate the rotation target
// directly, so the rotation never hits a maximum. Auto-rotation runs by default
// and pauses for IDLE_BEFORE_AUTO_MS after any user input.
let lastUserInput = -Infinity;
function markInteraction() {
	lastUserInput = performance.now();
}

function onWheel(e) {
	if (!interactive) return; // let the wheel scroll the page instead
	locked = false; // user takes over → release card focus
	clearFocus();
	target += e.deltaY * SCROLL_FACTOR;
	markInteraction();
}

let lastTouchY = null;
function onTouchStart(e) {
	if (!interactive) return;
	locked = false; // user takes over → release card focus
	clearFocus();
	lastTouchY = e.touches[0].clientY;
	markInteraction();
}
function onTouchMove(e) {
	if (!interactive || lastTouchY === null) return;
	const dy = lastTouchY - e.touches[0].clientY;
	target += dy * SCROLL_FACTOR;
	lastTouchY = e.touches[0].clientY;
	markInteraction();
}
function onTouchEnd() {
	lastTouchY = null;
}

function tick() {
	// Paused: keep the rAF loop alive (so unpausing resumes seamlessly)
	// but freeze the scene — no rotation, easing or DOM writes.
	if (paused) {
		requestAnimationFrame(tick);
		return;
	}

	// Auto-rotate when user has been idle long enough — unless a clicked
	// card has locked the ring at the front-centre.
	if (!locked && performance.now() - lastUserInput > IDLE_BEFORE_AUTO_MS) {
		target += AUTO_ROTATE_SPEED;
	}
	current += (target - current) * EASE;

	// Rotation settled on the focused card?
	const settled =
		locked && focusedIndex !== null && Math.abs(target - current) < 0.4;

	// Ease the focus blend: once settled, pull the focused card from its
	// orbital spot to the stage centre; release it again when unfocused.
	focusBlend += ((settled ? 1 : 0) - focusBlend) * EASE;

	// Open it (height + description fade) once it has reached the centre.
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

	// Corner dot screen positions — read from cached world coords (z=0, so no
	// perspective scaling needed; positions come from recomputeFit / label sizes)
	const cornerScreens = cornerDotPositions.map((p) => ({
		x: cx + p.x,
		y: cy + p.y,
	}));

	// Card screen positions + depth (cached so corner lines can reference them)
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

		// Orbital position → base size (independent of tilt/jitter).
		// tNorm: 0 (back of orbit) → 1 (front of orbit)
		const tNorm = (Math.sin(t) + 1) / 2;
		const cardScale = MIN_SCALE + tNorm * (1 - MIN_SCALE);

		// Project the 3D point to 2D ourselves (perspective foreshorten),
		// then render flat — no preserve-3d. Paint order is then fully
		// controlled by z-index instead of GPU 3D depth sorting, which
		// disagreed with apparent size (tilt + jitter skew the real z).
		const persp = PERSPECTIVE / (PERSPECTIVE - z);
		let screenX = fx * persp;
		let screenY = fy * persp;
		let renderScale = cardScale * persp; // actual on-screen size factor

		// Focused card: blend its orbital position toward the stage centre
		// (0,0) and FOCUS_SCALE, so it ends up centred in .aktuelles.
		if (i === focusedIndex && focusBlend > 0.0001) {
			const b = focusBlend;
			screenX *= 1 - b;
			screenY *= 1 - b;
			renderScale = renderScale * (1 - b) + FOCUS_SCALE * b;
		}

		cards[i].style.transform =
			`translate3d(${screenX}px, ${screenY}px, 0) scale(${renderScale})`;

		// Paint order strictly follows on-screen size: a larger card can
		// never sit behind a smaller one. Quantized to limit DOM writes.
		// The focused card is forced on top while it's pulled in; a hovered
		// card jumps to the front too, but only while it's on the front
		// half of the orbit (tNorm > 0.5 → sin(t) > 0).
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

		// White veil fades the card toward the back (full at back, none at
		// front). Quantized to 1% steps so we rarely touch the DOM.
		const veil = Math.round((1 - tNorm) * MAX_OVERLAY * 100);
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

	// Corner lines: each corner only connects to its color-matched cards.
	// Each line is depth-sorted to its target card, same as the centre lines.
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

// Click a card → lock the ring and rotate it to the front-centre.
// Hover → remember it so tick() can lift it to the front (front half only).
cards.forEach((card, i) => {
	card.addEventListener("click", () => focusCard(i));
	card.addEventListener("mouseenter", () => {
		hoveredIndex = i;
	});
	card.addEventListener("mouseleave", () => {
		if (hoveredIndex === i) hoveredIndex = null;
	});

	// While this card is the focused/open one, its plus marker acts as a
	// close button: collapse the card and let the ring resume.
	const info = card.querySelector(".aktuelles__card-info");
	if (info) {
		info.addEventListener("click", (e) => {
			if (focusedIndex === i) {
				e.stopPropagation(); // don't let the card re-focus
				clearFocus();
				locked = false;
			}
		});
	}
});

// Play / pause the carousel animation (bottom-left control).
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

// Adapt to the stage container size, not the viewport.
const resizeObserver = new ResizeObserver(recomputeFit);
resizeObserver.observe(stage);

recomputeFit();
// Re-run once custom fonts have loaded — label widths change when HAL Timezone
// replaces the system-ui fallback, which would otherwise leave dots off the edges.
if (document.fonts && document.fonts.ready) {
	document.fonts.ready.then(recomputeFit);
}
tick();
