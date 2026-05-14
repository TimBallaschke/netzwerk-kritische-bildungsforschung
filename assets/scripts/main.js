// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

const CARDS = 14;        // number of cards
const RADIUS = 400;      // preferred circle radius (px) — actual radius is fit
const TILT_X_DEG = -30;  // tilt around X axis (negative = front down, back up)
const TILT_Z_DEG = -15;  // tilt around Z axis (diagonal lean)
const OFFSET_X = 0;      // horizontal nudge for visual centering
const OFFSET_Y = -60;    // vertical nudge for visual centering
const JITTER_Y = 700;    // preferred max Y offset per card (px) — also fit-scaled
const SCENE_W = 80;      // scene width as % of viewport
const SCENE_H = 75;      // scene height as % of viewport
const PERSPECTIVE = 1600;// must match `perspective` in stage CSS (px)
const TURNS = 1;         // full rotations across the entire scroll
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

const cards = [];
const lines = [];
for (let i = 0; i < CARDS; i++) {
	const card = document.createElement("div");
	card.className = "card";
	ring.appendChild(card);
	cards.push(card);

	const line = document.createElementNS(SVG_NS, "line");
	svg.appendChild(line);
	lines.push(line);
}

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
	return { width: maxX - minX, height: maxY - minY };
}

let fitRx = RADIUS;
let fitRz = RADIUS;
let fitJitter = JITTER_Y;

function recomputeFit() {
	const sceneW = (window.innerWidth * SCENE_W) / 100;
	const sceneH = (window.innerHeight * SCENE_H) / 100;
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
}

let target = 0;
let current = 0;

function readScroll() {
	const max = document.documentElement.scrollHeight - window.innerHeight;
	const progress = max > 0 ? window.scrollY / max : 0;
	target = progress * 360 * TURNS;
}

function tick() {
	current += (target - current) * EASE;

	const step = (Math.PI * 2) / CARDS;
	const baseRot = (current * Math.PI) / 180;

	const stageRect = stage.getBoundingClientRect();
	const cx = stageRect.width / 2;
	const cy = stageRect.height / 2;

	const dotX = cx + OFFSET_X;
	const dotY = cy + OFFSET_Y;

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

		const fx = x + OFFSET_X;
		const fy = y + OFFSET_Y;

		cards[i].style.transform = `translate3d(${fx}px, ${fy}px, ${z}px)`;

		const scale = PERSPECTIVE / (PERSPECTIVE - z);
		lines[i].setAttribute("x1", dotX);
		lines[i].setAttribute("y1", dotY);
		lines[i].setAttribute("x2", cx + fx * scale);
		lines[i].setAttribute("y2", cy + fy * scale);
	}

	requestAnimationFrame(tick);
}

window.addEventListener("scroll", readScroll, { passive: true });
window.addEventListener("resize", () => {
	readScroll();
	recomputeFit();
}, { passive: true });

recomputeFit();
readScroll();
tick();
