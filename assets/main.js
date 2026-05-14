// =============================================================================
// 3D ring carousel — scroll-driven rotation
// =============================================================================

const CARDS = 12;       // number of cards around the ring
const RADIUS = 480;     // distance from center (px)
const TURNS = 1;        // full rotations across the entire scroll
const EASE = 0.08;      // smoothing factor (0..1, lower = smoother)

const ring = document.querySelector(".ring");

// Build the cards
for (let i = 0; i < CARDS; i++) {
	const card = document.createElement("div");
	card.className = "card";
	const angle = (360 / CARDS) * i;
	card.style.transform = `rotateY(${angle}deg) translateZ(${RADIUS}px)`;
	ring.appendChild(card);
}

// Scroll → target rotation
let target = 0;
let current = 0;

function readScroll() {
	const max = document.documentElement.scrollHeight - window.innerHeight;
	const progress = max > 0 ? window.scrollY / max : 0;
	target = progress * 360 * TURNS;
}

function tick() {
	current += (target - current) * EASE;
	ring.style.setProperty("--ring-rotation", `${current}deg`);
	requestAnimationFrame(tick);
}

window.addEventListener("scroll", readScroll, { passive: true });
window.addEventListener("resize", readScroll, { passive: true });
readScroll();
tick();
