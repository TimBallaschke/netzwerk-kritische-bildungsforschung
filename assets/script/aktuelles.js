// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

const CARDS = 16;        // number of cards
const RADIUS = 400;      // preferred circle radius (px) — actual radius is fit
const TILT_X_DEG = -30;  // tilt around X axis (negative = front down, back up)
const TILT_Z_DEG = 0;    // tilt around Z axis (diagonal lean) — disabled
const OFFSET_X = 0;      // manual horizontal nudge on top of auto-center
const OFFSET_Y = 0;      // manual vertical nudge on top of auto-center
const JITTER_Y = 2000;   // preferred max Y offset per card (px) — also fit-scaled
const MIN_SCALE = 0.4;   // scale of back-most card (front-most stays at 1.0)
const LABEL_INSET_Y = 30;// px gap between top of scene and first stacked label
const LABEL_STACK_GAP = 8; // px gap between stacked label pills
const SCENE_W = 94;      // scene width as % of the .stage container
const SCENE_H = 100;     // scene height as % of the .stage container
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
const stage = document.querySelector(".stage");
const ring = document.querySelector(".ring");
const svg = document.querySelector(".connectors");
const dot = document.querySelector(".dot");
const centerLabel = document.querySelector(".center-label");

const CARD_W = ring.offsetWidth || 140;
const CARD_H = ring.offsetHeight || 180;

// Stratified Y offsets in [-1, 1] — scaled by `fitJitter` at render time
const slot = 2 / CARDS;
const jitterNorm = Array.from({ length: CARDS }, (_, i) => {
	const center = -1 + (i + 0.5) * slot;
	return center + (Math.random() - 0.5) * slot * 0.6;
});
for (let i = jitterNorm.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[jitterNorm[i], jitterNorm[j]] = [jitterNorm[j], jitterNorm[i]];
}

// Stratified color distribution: cycle through palette, then shuffle so each
// color appears roughly CARDS/COLORS.length times in a randomized order.
const COLORS = ["#005436", "#4965e6", "#fcbacd", "#f3511c"];
const cardColors = Array.from({ length: CARDS }, (_, i) => COLORS[i % COLORS.length]);
for (let i = cardColors.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[cardColors[i], cardColors[j]] = [cardColors[j], cardColors[i]];
}

// Card titles — short Lorem Ipsum snippets (2–3 words each)
const TITLES = [
	"Lorem ipsum",
	"Dolor sit amet",
	"Consectetur adipiscing",
	"Sed do eiusmod",
	"Tempor incididunt",
	"Labore dolore",
	"Magna aliqua",
	"Ut enim ad",
	"Minim veniam",
	"Quis nostrud",
	"Exercitation ullamco",
	"Laboris nisi",
	"Aliquip ex ea",
	"Commodo consequat",
	"Duis aute irure",
	"In reprehenderit",
];

const cards = [];
const lines = [];
// Last-applied z-index per card. opacity (from the corner filter) flattens
// elements inside a preserve-3d context, so we can't rely on true 3D depth
// sorting — paint order is set explicitly from each card's orbital depth.
const prevZ = new Array(CARDS).fill(-1);
for (let i = 0; i < CARDS; i++) {
	const card = document.createElement("div");
	card.className = "card";

	const title = document.createElement("h3");
	title.className = "card-title";
	title.textContent = TITLES[i];
	card.appendChild(title);

	ring.appendChild(card);
	cards.push(card);

	const line = document.createElementNS(SVG_NS, "line");
	svg.appendChild(line);
	lines.push(line);
}

// Four corner pills/dots — laid out in a horizontal row by recomputeFit().
// Each connects ONLY to cards of one specific color.
const CORNERS = 4;
const CORNER_COLORS = [
	"#fcbacd", // top-left → pink
	"#005436", // top-right → green
	"#4965e6", // bottom-left → blue
	"#f3511c", // bottom-right → orange
];
const CORNER_LABELS = [
	"Blog",              // top-left
	"Veranstaltungen",   // top-right
	"Publications",      // bottom-left
	"Call for Papers",   // bottom-right
];
const cornerDots = Array.from({ length: CORNERS }, () => {
	const d = document.createElement("div");
	d.className = "dot corner-dot";
	ring.appendChild(d);
	return d;
});
const cornerLabels = Array.from({ length: CORNERS }, (_, c) => {
	const label = document.createElement("div");
	label.className = "center-label corner-label";
	label.textContent = CORNER_LABELS[c];
	ring.appendChild(label);
	return label;
});

// Active corner filter: clicking corner pills toggles them into a multi-select.
// Empty set = no filter, show everything. Any active corner = show only cards
// whose color matches one of the active corners.
const activeCorners = new Set();
function applyFilter() {
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
		label.classList.toggle("is-active", activeCorners.has(c));
	});
}
cornerLabels.forEach((label, c) => {
	label.addEventListener("click", () => {
		if (activeCorners.has(c)) activeCorners.delete(c);
		else activeCorners.add(c);
		// Selecting all is functionally identical to selecting none — collapse to none
		if (activeCorners.size === CORNERS) activeCorners.clear();
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

	// Lay all 4 label+dot pairs in a horizontal row in the upper-left of the scene.
	// Pills run left → right; each dot sits at the bottom edge of its pill,
	// horizontally centered.
	const edgeW = sceneW / 2;
	const edgeH = sceneH / 2;
	let stackX = -edgeW; // start at scene left edge
	const rowY = -edgeH + LABEL_INSET_Y; // top of scene + inset
	cornerLabels.forEach((label, c) => {
		const lx = stackX;
		const ly = rowY;
		label.style.transform =
			`translate(0, 0) translate3d(${lx}px, ${ly}px, 1px)`;

		// Reading offsetWidth/Height forces a layout flush
		const labelW = label.offsetWidth;
		const labelH = label.offsetHeight;

		// Dot at bottom edge of this label, horizontally centered
		const dx = stackX + labelW / 2;
		const dy = rowY + labelH;
		cornerDotPositions[c].x = dx;
		cornerDotPositions[c].y = dy;
		cornerDots[c].style.transform =
			`translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 2px)`;

		stackX += labelW + LABEL_STACK_GAP;
	});
}

let target = 0;
let current = 0;

// Infinite "scroll": wheel + touch events accumulate the rotation target
// directly, so the rotation never hits a maximum. Auto-rotation runs by default
// and pauses for IDLE_BEFORE_AUTO_MS after any user input.
let lastUserInput = -Infinity;
function markInteraction() {
	lastUserInput = performance.now();
}

function onWheel(e) {
	target += e.deltaY * SCROLL_FACTOR;
	markInteraction();
}

let lastTouchY = null;
function onTouchStart(e) {
	lastTouchY = e.touches[0].clientY;
	markInteraction();
}
function onTouchMove(e) {
	if (lastTouchY === null) return;
	const dy = lastTouchY - e.touches[0].clientY;
	target += dy * SCROLL_FACTOR;
	lastTouchY = e.touches[0].clientY;
	markInteraction();
}
function onTouchEnd() {
	lastTouchY = null;
}

function tick() {
	// Auto-rotate when user has been idle long enough
	if (performance.now() - lastUserInput > IDLE_BEFORE_AUTO_MS) {
		target += AUTO_ROTATE_SPEED;
	}
	current += (target - current) * EASE;

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

	// Card screen positions (cached so corner lines can reference them after the loop)
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

		// scale driven by orbital position
		// tNorm: 0 (back of orbit) → 1 (front of orbit)
		const tNorm = (Math.sin(t) + 1) / 2;
		const cardScale = MIN_SCALE + tNorm * (1 - MIN_SCALE);

		cards[i].style.transform =
			`translate3d(${fx}px, ${fy}px, ${z}px) scale(${cardScale})`;

		// Explicit paint order from depth: front (tNorm→1) stacks above back.
		// Throttled to integer changes to avoid redundant style writes.
		const zi = Math.round(tNorm * 10000);
		if (zi !== prevZ[i]) {
			cards[i].style.zIndex = zi;
			prevZ[i] = zi;
		}

		const scale = PERSPECTIVE / (PERSPECTIVE - z);
		cardSX[i] = cx + fx * scale;
		cardSY[i] = cy + fy * scale;

		lines[i].setAttribute("x1", dotX);
		lines[i].setAttribute("y1", dotY);
		lines[i].setAttribute("x2", cardSX[i]);
		lines[i].setAttribute("y2", cardSY[i]);
	}

	// Corner lines: each corner only connects to its color-matched cards
	for (let c = 0; c < 4; c++) {
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

// Adapt to the .aktuelles/.stage container size, not the viewport.
const resizeObserver = new ResizeObserver(recomputeFit);
resizeObserver.observe(stage);

recomputeFit();
// Re-run once custom fonts have loaded — label widths change when HAL Timezone
// replaces the system-ui fallback, which would otherwise leave dots off the edges.
if (document.fonts && document.fonts.ready) {
	document.fonts.ready.then(recomputeFit);
}
tick();
