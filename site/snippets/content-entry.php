<?php
$templateName = $item->intendedTemplate()->name();
$wideImage = $templateName === 'veranstaltung';
$typeLabels = ['veranstaltung' => 'Veranstaltungen', 'call-for-papers' => 'Call for Papers', 'beitrag' => 'Beiträge', 'notiz' => 'Notizen', 'publikation' => 'Publikationen'];
$pillLabel = $item->category()->or($typeLabels[$templateName] ?? ucfirst($templateName));
?>
      <!-- Der Schließen-Button bleibt außerhalb des Scrollbereichs. -->
      <div class="aktuelles-modal__header">
        <span class="aktuelles-modal__pill">
          <?= html($pillLabel) ?>
        </span>
      </div>

      <!-- Content -->
      <div class="aktuelles-modal__body">
        
        <!-- Meta-Daten (Datum, Titel, Autor, Deadline) -->
        <div class="modal-meta-block">
          
          <?php if ($item->date()->isNotEmpty()): ?>
            <?php 
              $dateStr = $item->date()->toDate('j.n.Y');
              $timeStr = $item->date()->toDate('H.i');
              if ($timeStr !== '00.00') {
                  $dateStr .= ', ' . $timeStr . ' Uhr';
              }
            ?>
            <p class="modal-date"><?= $dateStr ?></p>
          <?php endif ?>

          <<?= $headingTag ?? 'h2' ?> class="modal-title" id="<?= $headingId ?>"><?= $item->title()->kti() ?></<?= $headingTag ?? 'h2' ?>>

          <?php 
            // Subtitle oder Subinfo (je nach Blueprint)
            $subtitle = $item->subinfo()->isNotEmpty() ? $item->subinfo() : $item->subtitle();
          ?>
          <?php if ($subtitle->isNotEmpty()): ?>
            <p class="modal-subtitle"><?= $subtitle->kti() ?></p>
          <?php endif ?>
          
          <?php if ($item->authors()->isNotEmpty()): ?>
            <p class="modal-author">Von <?= $item->authors()->kti() ?></p>
          <?php endif ?>

          <?php if ($item->deadline()->isNotEmpty()): ?>
            <p class="modal-deadline">
              <strong>Deadline Call:</strong> <?= $item->deadline()->toDate('j.n.Y') ?>
            </p>
          <?php endif ?>

        </div>

        <!-- 2-Spalten Layout: Bild & Text -->
        <div class="modal-content-grid">
          <?php 
            $photos = $templateName === 'publikation'
                ? $item->cover()->toFiles()
                : $item->content()->get('image')->toFiles();
            if ($photos->isEmpty()) $photos = $item->authorPhoto()->toFiles();
          ?>
          <?php if ($photos->isNotEmpty() && !$wideImage): ?>
            <div class="modal-photo-col">
              <?php snippet('content-image', ['image' => $photos->first(), 'class' => 'content-image--beside-text']) ?>
            </div>
          <?php endif ?>

          <div class="modal-text-col">
            <div class="text-content">
              <?php 
                $textContent = $item->body()->isNotEmpty() ? $item->body() : 
                              ($item->text()->isNotEmpty() ? $item->text() : 
                              $item->description());
              ?>
              <?= $textContent->prose() ?>
            </div>

            <?php 
              $location = $item->ort()->isNotEmpty() ? $item->ort() : $item->location(); 
              $online   = $item->onlineHinweis();
            ?>
            <?php if ($location->isNotEmpty() || $online->isNotEmpty()): ?>
              <div class="modal-location">
                <?php if ($location->isNotEmpty()): ?>
                  <p><strong>Ort:</strong> <?= $location->kti() ?></p>
                <?php endif ?>
                
                <?php if ($online->isNotEmpty()): ?>
                  <p><strong>Hinweis:</strong> <?= $online->kti() ?></p>
                <?php endif ?>
              </div>
            <?php endif ?>

            <?php foreach (($wideImage ? $photos : $photos->offset(1)) as $photo): ?>
              <?php snippet('content-image', ['image' => $photo, 'class' => 'content-image--inline']) ?>
            <?php endforeach ?>

            <!-- Buttons / Links Section (PDFs & Externe URLs) -->
            <div class="modal-actions">
              
              <!-- 1. PDF Download -->
              <?php if ($pdf = $item->downloadPdf()->toFile()): ?>
                <?php snippet('pdf-button', ['pdf' => $pdf]) ?>
              <?php endif ?>

              <!-- 2. Externe URL (allgemein) -->
              <?php 
                if ($item->linkType()->value() === 'external' && $item->externalUrl()->isNotEmpty()): 
                  $extTitle = $item->externalUrlTitle()->isNotEmpty() ? $item->externalUrlTitle()->kti() : 'Weitere Informationen';
              ?>
                <a href="<?= $item->externalUrl() ?>" class="pdf-button" target="_blank" rel="noopener noreferrer">
                  <?= $extTitle ?>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="18" y2="6"></line><polyline points="9 6 18 6 18 15"></polyline></svg>
                </a>
              <?php endif ?>

              <!-- 3. Ausführlicher Call URL (Call for Papers Blueprint) -->
              <?php 
                if ($item->linkType()->value() === 'self' && $item->callUrl()->isNotEmpty()): 
                  $callTitle = $item->callUrlTitle()->isNotEmpty() ? $item->callUrlTitle()->kti() : 'Ausführlicher Call';
              ?>
                <a href="<?= $item->callUrl() ?>" class="pdf-button" target="_blank" rel="noopener noreferrer">
                  <?= $callTitle ?>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="18" y2="6"></line><polyline points="9 6 18 6 18 15"></polyline></svg>
                </a>
              <?php endif ?>

              <!-- 4. Weiterführender Link (Veranstaltung Blueprint) -->
              <?php 
                if ($item->linkType()->value() === 'self' && $item->linkUrl()->isNotEmpty()): 
                  $linkTitle = $item->linkTitle()->isNotEmpty() ? $item->linkTitle()->kti() : 'Weiterführender Link';
              ?>
                <a href="<?= $item->linkUrl() ?>" class="pdf-button" target="_blank" rel="noopener noreferrer">
                  <?= $linkTitle ?>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="18" x2="18" y2="6"></line><polyline points="9 6 18 6 18 15"></polyline></svg>
                </a>
              <?php endif ?>

            </div>

          </div>
        </div>
      </div>

