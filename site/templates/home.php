<!DOCTYPE html>
<html lang="<?= $kirby->language() ? $kirby->language()->code() : 'de' ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $page->title() ?></title>
  <?= css('assets/style.css') ?>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
</head>
<body>
  <div class="sidebar">
    <div class="sidebar-content">
      <div class="aktuelles-cards">
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
        <div class="aktuelles-card"></div>
      </div>
    </div>
  </div>
  <div class="scroll-spacer"></div>
  <script>
    gsap.registerPlugin(ScrollTrigger);

    const cards = document.querySelectorAll(".aktuelles-card");
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cardHeight = 10 * rem;
    const cardSpacing = 1 * rem;

    const zStep = 120;

    gsap.set(cards, {
      zIndex: (i) => cards.length - i,
      z: (i) => -i * zStep
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: `+=${window.innerHeight * cards.length}`,
        scrub: true
      }
    });

    const stagger = 0.4;

    cards.forEach((item, index) => {
      tl.to(item, {
        y: () => -(cardHeight + cardSpacing) * (cards.length - index),
        duration: () => (cards.length - index) * stagger
      }, index * stagger);

      for (let depth = 1; depth < cards.length - index; depth++) {
        const next = cards[index + depth];
        if (!next) continue;
        tl.to(next, {
          z: -(depth - 1) * zStep,
          duration: stagger
        }, index * stagger);
      }
    });
  </script>
</body>
</html>
