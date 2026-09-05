<?php snippet('header', ['categoryTitle' => $page->title()]) ?>

<div class="page-ueber-uns">

  <div class="ueber-uns-sections">

    <!-- 1. WAS WOLLEN WIR? -->
    <section class="ueber-uns-block" x-data="disclosure">
      <div class="block-header" @click="if (!open && !$event.target.closest('a, button')) toggle()">
        <h2 class="block-headline" @click.stop="toggle()">
          <?= $page->wasWollenWirHeadline()->or('Was wollen wir?')->kti() ?>
        </h2>

        <div class="block-content-viewport disclosure-content" x-ref="content">
          <div class="block-content-wrapper" x-ref="inner" :inert="!open" id="was-wollen-wir">
            <?php if ($page->wasWollenWir()->isNotEmpty()): ?>
              <div class="text-content" data-disclosure-preview>
                <?= $page->wasWollenWir()->prose() ?>
              </div>
            <?php endif ?>
          </div>
        </div>

        <?php snippet('toggle-button', ['controls' => 'was-wollen-wir', 'label' => 'Was wollen wir? öffnen oder schließen']) ?>
      </div>
    </section>


    <!-- 2. WAS MACHEN WIR? -->
    <section class="ueber-uns-block" x-data="disclosure">
      <div class="block-header" @click="if (!open && !$event.target.closest('a, button')) toggle()">
        <h2 class="block-headline" @click.stop="toggle()">
          <?= $page->wasMachenWirHeadline()->or('Was machen wir?')->kti() ?>
        </h2>

        <div class="block-content-viewport disclosure-content" x-ref="content">
          <div class="block-content-wrapper" x-ref="inner" :inert="!open" id="was-machen-wir">
            <?php if ($page->wasMachenWir()->isNotEmpty()): ?>
              <div class="text-content" data-disclosure-preview>
                <?= $page->wasMachenWir()->prose() ?>
              </div>
            <?php endif ?>
          </div>
        </div>

        <?php snippet('toggle-button', ['controls' => 'was-machen-wir', 'label' => 'Was machen wir? öffnen oder schließen']) ?>
      </div>
    </section>


    <!-- 3. WER SIND WIR? -->
    <section class="ueber-uns-block" x-data="disclosure">
      <div class="block-header" @click="if (!open && !$event.target.closest('a, button')) toggle()">
        <h2 class="block-headline" @click.stop="toggle()">
          <?= $page->werSindWirHeadline()->or('Wer sind wir?')->kti() ?>
        </h2>

        <div class="block-content-viewport disclosure-content" x-ref="content">
          <div class="block-content-wrapper" x-ref="inner" :inert="!open" id="wer-sind-wir">
            <?php if ($page->werSindWir()->isNotEmpty()): ?>
              <div class="text-content" data-disclosure-preview>
                <?= $page->werSindWir()->prose() ?>
              </div>
            <?php endif ?>

            <?php snippet('kontakt-liste', ['kontakte' => $page->kontakte()->toStructure()]) ?>
            <?php snippet('kontakt-link', ['link' => $page->akLink(), 'title' => $page->akLinkTitle()]) ?>

            <!-- Logo -->
            <?php if ($logo = $page->rmuLogo()->toFile()): ?>
              <div class="rmu-logo-box">
                <?php snippet('responsive-image', [
                  'image' => $logo,
                  'alt' => $logo->alt()->or('RMU Logo')->value(),
                  'widths' => [160, 320, 480, 640, 960],
                  'defaultWidth' => 480,
                  'quality' => 90,
                  'sizes' => '(max-width: 900px) min(242px, calc(100vw - 24px)), clamp(168px, 18.45vw, 335px)',
                ]) ?>
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
                      <?= $block->fliesstext()->prose() ?>
                    </div>

                    <?php snippet('kontakt-liste', ['kontakte' => $block->kontakte()->toStructure()]) ?>
                    <?php snippet('kontakt-link', ['link' => $block->kontaktLink(), 'title' => $block->kontaktLinkTitle()]) ?>
                  </article>
                <?php endforeach ?>
              </div>
            <?php endif ?>

          </div>
        </div>

        <?php snippet('toggle-button', ['controls' => 'wer-sind-wir', 'label' => 'Wer sind wir? öffnen oder schließen']) ?>
      </div>
    </section>

  </div>


  <!-- 4. VERGANGENE VERANSTALTUNGEN (BLAUE INTERAKTIVE LISTE) -->
  <?php 
  $pastEvents = page('aktuelles') 
    ? page('aktuelles')->index()->listed()
        ->filterBy('intendedTemplate', 'in', ['veranstaltung', 'veranstaltungen'])
        ->filter(fn($event) => $event->date()->isNotEmpty() && $event->date()->toDate() < time())
        ->sortBy('date', 'desc')
    : collect();
  ?>

  <?php snippet('content-list', [
      'title' => $page->vergangeneHeadline()->or('Vergangene Veranstaltungen des Netzwerkes'),
      'items' => $pastEvents,
      'variant' => 'events',
  ]) ?>

</div>

<?php snippet('footer') ?>
