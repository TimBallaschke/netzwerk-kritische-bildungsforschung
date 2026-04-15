const cards = document.querySelectorAll('.aktuelles-card');
const overlay = document.querySelector('.scroll-overlay');

const stackRange = 4;
const stackMax = 6;
const stackScale = 0.03;
const exitDistance = 10.5;

function update() {
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  const raw = scrollMax > 0 ? window.scrollY / scrollMax : 0;
  const progress = Math.max(0, Math.min(1, raw)) * cards.length;

  cards.forEach((card, i) => {
    const eff = i - progress;
    let ty, sc, op;
    if (eff >= 0) {
      const t = Math.min(eff, stackRange) / stackRange;
      ty = stackMax * (1 - Math.pow(1 - t, 2));
      sc = 1 - eff * stackScale;
      op = Math.max(0, Math.min(1, stackRange - eff));
    } else {
      ty = eff * exitDistance;
      sc = 1;
      op = 1;
    }
    card.style.transform = `translateY(${ty}rem) scale(${sc})`;
    card.style.opacity = op;
  });
}

window.addEventListener('scroll', update, { passive: true });
window.addEventListener('resize', update);
update();
