</main>
<?php $alpineJs = 'assets/script/vendor/alpine.min.js'; ?>
<?= js($alpineJs . '?v=' . filemtime(kirby()->root('index') . '/' . $alpineJs), ['defer' => true]) ?>
<?php $scriptFile = 'assets/script/script.js'; ?>
<?= js($scriptFile . '?v=' . filemtime(kirby()->root('index') . '/' . $scriptFile)) ?>
<?php $aktuellesJs = 'assets/script/aktuelles.js'; ?>
<?= js($aktuellesJs . '?v=' . filemtime(kirby()->root('index') . '/' . $aktuellesJs), ['type' => 'module']) ?>
</body>
</html>
