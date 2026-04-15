const cards = document.querySelectorAll('.aktuelles-card');
const overlay = document.querySelector('.scroll-overlay');
const stackContainer = document.querySelector('.aktuelles-cards');

const stackRange = 4;
const stackMax = 6;
const topStackMax = 1.5;
const stackScale = 0.03;
const exitDistance = 10.5;
const topOffset = 8;

function update() {
  const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
  const raw = scrollMax > 0 ? window.scrollY / scrollMax : 0;
  const progress = Math.max(0, Math.min(1, raw)) * cards.length;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const containerTop = stackContainer.getBoundingClientRect().top;
  const topThreshold = containerTop / rem - topOffset;

  cards.forEach((card, i) => {
    const eff = i - progress;
    let ty, sc, op, origin = 'top center';
    if (eff >= 0) {
      const t = Math.min(eff, stackRange) / stackRange;
      ty = stackMax * (1 - Math.pow(1 - t, 2));
      sc = 1 - eff * stackScale;
      op = Math.max(0, Math.min(1, stackRange - eff));
    } else {
      const exitEff = -eff;
      const slideExit = topThreshold / exitDistance;
      if (exitEff <= slideExit) {
        ty = eff * exitDistance;
        sc = 1;
        op = 1;
      } else {
        const topEff = exitEff - slideExit;
        const t = Math.min(topEff, stackRange) / stackRange;
        const extraTy = topStackMax * (1 - Math.pow(1 - t, 2));
        ty = -topThreshold - extraTy;
        sc = 1 - topEff * stackScale;
        op = Math.max(0, 1 - topEff);
        origin = 'bottom center';
      }
    }
    card.style.transform = `translateY(${ty}rem) scale(${sc})`;
    card.style.opacity = op;
    card.style.transformOrigin = origin;
    card.style.zIndex = Math.round(1000 - Math.abs(eff) * 10);
  });
}

window.addEventListener('scroll', update, { passive: true });
window.addEventListener('resize', update);
update();
