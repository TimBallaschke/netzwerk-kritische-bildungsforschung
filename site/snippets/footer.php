</main>
<?php $alpineJs = 'assets/script/vendor/alpine.min.js'; ?>
<?= js($alpineJs . '?v=' . filemtime(kirby()->root('index') . '/' . $alpineJs), ['defer' => true]) ?>
<?php $scriptFile = 'assets/script/script.js'; ?>
<?= js($scriptFile . '?v=' . filemtime(kirby()->root('index') . '/' . $scriptFile)) ?>
<?php $aktuellesJs = 'assets/script/aktuelles.js'; ?>
<?= js($aktuellesJs . '?v=' . filemtime(kirby()->root('index') . '/' . $aktuellesJs), ['type' => 'module']) ?>
</body>
</html>

<footer class="site-footer">
  
  <div class="site-footer__left">
    <!-- Seitentitel -->
    <p class="site-footer__title">
      Netzwerk Kritische<br>Bildungsforschung
    </p>

    <!-- Footer Logos -->
    <?php if ($logos = $site->footerLogos()->toFiles()): ?>
      <div class="site-footer__logos">
        <?php foreach ($logos as $logo): ?>
          <img src="<?= $logo->url() ?>" alt="<?= $logo->alt()->or('Logo') ?>" class="site-footer__logo">
        <?php endforeach ?>
      </div>
    <?php endif ?>
  </div>

  <?php if ($site->instagramUrl()->isNotEmpty()): ?>
    <div class="site-footer__right">
      <a class="site-footer__social-link" 
         href="<?= $site->instagramUrl() ?>" 
         target="_blank" 
         rel="noopener noreferrer" 
         aria-label="Instagram">
            <svg class="instagram-icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor" />
            <circle cx="12" cy="12" r="4.2" fill="none" stroke="#ffffff" stroke-width="2.2" />
            <circle cx="18" cy="6" r="1.6" fill="#ffffff" />
            </svg>
      </a>
    </div>
  <?php endif ?>

</footer>

</body>
</html>