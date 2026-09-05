<?php if ($kontakte->isNotEmpty()): ?>
  <ul class="kontakt-liste" role="list">
    <?php foreach ($kontakte as $kontakt): ?>
      <li>
        <p class="kontakt-name"><span aria-hidden="true">●</span> <?= $kontakt->name()->html() ?></p>
        <?php if ($kontakt->email()->isNotEmpty()): ?>
          <p class="kontakt-email">
            <span aria-hidden="true">↘</span> <a href="<?= esc('mailto:' . trim($kontakt->email()->value()), 'attr') ?>"><?= $kontakt->email()->html() ?></a>
          </p>
        <?php endif ?>
      </li>
    <?php endforeach ?>
  </ul>
<?php endif ?>
