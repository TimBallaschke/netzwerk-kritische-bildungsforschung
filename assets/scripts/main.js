// =============================================================================
// Tilted ring carousel — cards orbit a tilted circle, always facing the camera
// =============================================================================

const CARDS = 14;        // number of cards
const RADIUS = 400;      // circle radius (px)
const TILT_X_DEG = -30;  // tilt around X axis (negative = front goes down, back goes up)
const TILT_Z_DEG = -15;  // tilt around Z axis (diagonal lean)
const OFFSET_X = 0;      // horizontal nudge for visual centering
const OFFSET_Y = -60;    // vertical nudge — front cards are larger so the visual
                         // center of mass sits below geometric center; shift up
const JITTER_Y = 180;    // max Y offset per card (± this many px)
const TURNS = 1;         // full rotations across the entire scroll
const EASE = 0.08;       // smoothing factor (lower = smoother)

const TILT_X = (TILT_X_DEG * Math.PI) / 180;
const TILT_Z = (TILT_Z_DEG * Math.PI) / 180;
const cosX = Math.cos(TILT_X);
const sinX = Math.sin(TILT_X);
const cosZ = Math.cos(TILT_Z);
const sinZ = Math.sin(TILT_Z);

const ring = document.querySelector(".ring");

// Stratified Y offsets: split [-JITTER_Y, +JITTER_Y] into N equal slots,
// jitter slightly within each, then shuffle. Guarantees even coverage.
const slotWidth = (2 * JITTER_Y) / CARDS;
const jitterY = Array.from({ length: CARDS }, (_, i) => {
	const center = -JITTER_Y + (i + 0.5) * slotWidth;
	return center + (Math.random() - 0.5) * slotWidth * 0.6;
});
for (let i = jitterY.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[jitterY[i], jitterY[j]] = [jitterY[j], jitterY[i]];
}

const cards = [];
for (let i = 0; i < CARDS; i++) {
	const card = document.createElement("div");
	card.className = "card";
	ring.appendChild(card);
	cards.push(card);
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

	for (let i = 0; i < CARDS; i++) {
		const t = step * i + baseRot;

		// untilted point on XZ-plane circle, with per-card Y jitter
		let x = RADIUS * Math.cos(t);
		let y = jitterY[i];
		let z = RADIUS * Math.sin(t);

		// tilt around X axis (rotates Y and Z)
		const y1 = y * cosX - z * sinX;
		const z1 = y * sinX + z * cosX;
		y = y1;
		z = z1;

		// tilt around Z axis (rotates X and Y)
		const x2 = x * cosZ - y * sinZ;
		const y2 = x * sinZ + y * cosZ;
		x = x2;
		y = y2;

		// pure translation — cards stay flat to the viewer
		cards[i].style.transform =
			`translate3d(${x + OFFSET_X}px, ${y + OFFSET_Y}px, ${z}px)`;
	}

	requestAnimationFrame(tick);
}

window.addEventListener("scroll", readScroll, { passive: true });
window.addEventListener("resize", readScroll, { passive: true });
readScroll();
tick();
