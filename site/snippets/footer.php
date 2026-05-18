</main>
<?php $scriptFile = 'assets/script/script.js'; ?>
<?= js($scriptFile . '?v=' . filemtime(kirby()->root('index') . '/' . $scriptFile)) ?>
</body>
</html>
