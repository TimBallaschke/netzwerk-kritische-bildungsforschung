<?php
$template = $item->intendedTemplate()->name();
if ($template === 'call-for-papers' && $item->deadline()->isNotEmpty()) {
    echo 'Deadline ' . $item->deadline()->toDate('j.n.Y');
} elseif (in_array($template, ['beitrag', 'publikation'], true) && $item->authors()->isNotEmpty()) {
    echo 'von ' . $item->authors()->kti();
} elseif ($item->subinfo()->isNotEmpty()) {
    echo $item->subinfo()->kti();
}
