const cards = document.querySelectorAll('.aktuelles-card');
const overlay = document.querySelector('.scroll-overlay');

const stackStep = 1.25;
const stackScale = 0.03;
const exitDistance = 10.5;

function update() {
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  const raw = scrollMax > 0 ? window.scrollY / scrollMax : 0;
  const progress = Math.max(0, Math.min(1, raw)) * cards.length;

  cards.forEach((card, i) => {
    const eff = i - progress;
    let ty, sc;
    if (eff >= 0) {
      ty = Math.sqrt(eff) * stackStep;
      sc = 1 - eff * stackScale;
    } else {
      ty = eff * exitDistance;
      sc = 1;
    }
    card.style.transform = `translateY(${ty}rem) scale(${sc})`;
  });
}

window.addEventListener('scroll', update, { passive: true });
window.addEventListener('resize', update);
update();
