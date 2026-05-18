</main>
<?php $scriptFile = 'assets/script/script.js'; ?>
<?= js($scriptFile . '?v=' . filemtime(kirby()->root('index') . '/' . $scriptFile)) ?>
<?php $aktuellesJs = 'assets/script/aktuelles.js'; ?>
<?= js($aktuellesJs . '?v=' . filemtime(kirby()->root('index') . '/' . $aktuellesJs), ['type' => 'module']) ?>
</body>
</html>
