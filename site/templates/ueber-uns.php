<?php snippet('header') ?>





<!-- Braunes Kategorie-Banner oben -->
<div class="category-banner">
  <span><?= $page->title()->kti() ?></span>
</div>

<main class="page-ueber-uns">

  <div class="ueber-uns-sections">

    <!-- 1. WAS WOLLEN WIR? -->
    <section class="ueber-uns-block" x-data="{ open: false }" :class="{ 'is-open': open }">
      <div class="block-header" @click="open = !open">
        <h2 class="block-headline">
          <?= $page->wasWollenWirHeadline()->or('Was wollen wir?')->kti() ?>
        </h2>

        <div class="block-content-wrapper">
          <?php if ($page->wasWollenWir()->isNotEmpty()): ?>
            <div class="text-content">
              <?= $page->wasWollenWir()->kt() ?>
            </div>
          <?php endif ?>
        </div>

        <button class="toggle-btn" type="button" :aria-expanded="open" aria-label="Abschnitt umschalten">
          <span class="toggle-icon"></span>
        </button>
      </div>
    </section>


    <!-- 2. WAS MACHEN WIR? -->
    <section class="ueber-uns-block" x-data="{ open: false }" :class="{ 'is-open': open }">
      <div class="block-header" @click="open = !open">
        <h2 class="block-headline">
          <?= $page->wasMachenWirHeadline()->or('Was machen wir?')->kti() ?>
        </h2>

        <div class="block-content-wrapper">
          <?php if ($page->wasMachenWir()->isNotEmpty()): ?>
            <div class="text-content">
              <?= $page->wasMachenWir()->kt() ?>
            </div>
          <?php endif ?>
        </div>

        <button class="toggle-btn" type="button" :aria-expanded="open" aria-label="Abschnitt umschalten">
          <span class="toggle-icon"></span>
        </button>
      </div>
    </section>


    <!-- 3. WER SIND WIR? -->
    <section class="ueber-uns-block" x-data="{ open: false }" :class="{ 'is-open': open }">
      <div class="block-header" @click="open = !open">
        <h2 class="block-headline">
          <?= $page->werSindWirHeadline()->or('Wer sind wir?')->kti() ?>
        </h2>

        <div class="block-content-wrapper">
          <?php if ($page->werSindWir()->isNotEmpty()): ?>
            <div class="text-content">
              <?= $page->werSindWir()->kt() ?>
            </div>
          <?php endif ?>

          <!-- Ansprechpersonen -->
          <?php $kontakte = $page->kontakte()->toStructure(); ?>
          <?php if ($kontakte->isNotEmpty()): ?>
            <ul class="kontakt-liste">
              <?php foreach ($kontakte as $kontakt): ?>
                <li>
                  <p class="kontakt-name">● <?= $kontakt->name()->kti() ?></p>
                  <?php if ($kontakt->email()->isNotEmpty()): ?>
                    <p class="kontakt-email">
                      ↘ <a href="mailto:<?= $kontakt->email() ?>"><?= $kontakt->email()->kti() ?></a>
                    </p>
                  <?php endif ?>
                </li>
              <?php endforeach ?>
            </ul>
          <?php endif ?>

          <!-- Link -->
          <?php if ($page->akLink()->isNotEmpty()): ?>
            <p class="ak-link">
              ↘ <a href="<?= $page->akLink() ?>" target="_blank" rel="noopener noreferrer">
                <?= $page->akLinkTitle()->or($page->akLink())->kti() ?>
              </a>
            </p>
          <?php endif ?>

          <!-- Logo -->
          <?php if ($logo = $page->rmuLogo()->toFile()): ?>
            <div class="rmu-logo-box">
              <img src="<?= $logo->url() ?>" alt="<?= $logo->alt()->or('RMU Logo') ?>">
            </div>
          <?php endif ?>

          <!-- Vertiefungsblöcke -->
          <?php $vertiefungen = $page->vertiefungsBloecke()->toStructure(); ?>
          <?php if ($vertiefungen->isNotEmpty()): ?>
            <div class="vertiefungs-bloecke">
              <?php foreach ($vertiefungen as $block): ?>
                <article class="vertiefung-item">
                  <h3 class="vertiefung-headline"><?= $block->zwischenueberschrift()->kti() ?></h3>
                  <div class="text-content">
                    <?= $block->fliesstext()->replace('*', '\*')->kt() ?>
                  </div>

                  <?php if ($block->ansprechpersonName()->isNotEmpty() || $block->ansprechpersonEmail()->isNotEmpty() || $block->kontaktLink()->isNotEmpty()): ?>
                    <div class="vertiefung-kontakt">
                      <?php if ($block->ansprechpersonName()->isNotEmpty()): ?>
                        <p class="kontakt-name">● <?= $block->ansprechpersonName()->kti() ?></p>
                      <?php endif ?>

                      <?php if ($block->ansprechpersonEmail()->isNotEmpty()): ?>
                        <p class="kontakt-email">
                          ↘ <a href="mailto:<?= $block->ansprechpersonEmail() ?>"><?= $block->ansprechpersonEmail()->kti() ?></a>
                        </p>
                      <?php endif ?>

                      <?php if ($block->kontaktLink()->isNotEmpty()): ?>
                        <p class="kontakt-link">
                          ↘ <a href="<?= $block->kontaktLink() ?>" target="_blank">
                            <?= $block->kontaktLinkTitle()->or($block->kontaktLink())->kti() ?>
                          </a>
                        </p>
                      <?php endif ?>
                    </div>
                  <?php endif ?>
                </article>
              <?php endforeach ?>
            </div>
          <?php endif ?>

        </div>

        <button class="toggle-btn" type="button" :aria-expanded="open" aria-label="Abschnitt umschalten">
          <span class="toggle-icon"></span>
        </button>
      </div>
    </section>

  </div>


  <!-- 4. VERGANGENE VERANSTALTUNGEN (GRÜNE INTERAKTIVE LISTE) -->
  <?php 
  $pastEvents = page('aktuelles') 
    ? page('aktuelles')->index()->listed()
        ->filterBy('intendedTemplate', 'in', ['veranstaltung', 'veranstaltungen'])
        ->filter(fn($event) => $event->date()->isNotEmpty() && $event->date()->toDate() < time())
        ->sortBy('date', 'desc')
    : collect();
  ?>

  <?php if ($pastEvents->count() > 0): ?>
    <section class="vergangene-veranstaltungen-wrapper">
      <h2 class="vergangene-headline">
        <?= $page->vergangeneHeadline()->or('Vergangene Veranstaltungen des Netzwerkes')->kti() ?>
      </h2>

      <div class="interactive-list interactive-list--green">
        <?php foreach ($pastEvents as $event): ?>
          <article class="interactive-list-item" x-data="{ open: false }" :class="{ 'is-open': open }">
            
            <button class="toggle-btn" type="button" @click="open = !open" :aria-expanded="open" aria-label="Veranstaltung umschalten">
              <span class="toggle-icon"></span>
            </button>

            <!-- Eingeklappt (50% / 50%) -->
            <div class="list-item-header-row">
              <div class="list-item-main" @click="open = !open">
                <p class="item-date"><?= $event->date()->toDate('j.n.Y') ?></p>
                <h3 class="item-title"><?= $event->title()->kti() ?></h3>
                <?php if ($event->subinfo()->isNotEmpty()): ?>
                  <p class="item-subinfo"><?= $event->subinfo()->kirbytextinline() ?></p>
                <?php endif ?>
              </div>

              <div class="list-item-desc" @click="open = true">
                <p><?= $event->description()->or($event->text())->excerpt(220) ?></p>
              </div>
            </div>

            <!-- Ausgeklappt (220px / Full-Text) -->
            <div class="list-item-content-grid">
              <div class="left-col">
                <!-- Optionales Bild oder Zusatzinfo -->
              </div>

              <div class="right-col">
                <div class="text-content">
                  <?= $event->body()->or($event->text())->or($event->description())->kt() ?>
                </div>
              </div>
            </div>

          </article>
        <?php endforeach ?>
      </div>
    </section>
  <?php endif ?>

</main>

<?php snippet('footer') ?>