<?php
/* b-vi.fr · administration — page unique (l'interface est dans admin.js) */
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https://i.ytimg.com https://i.vimeocdn.com; media-src 'self' blob:; connect-src 'self' https://vimeo.com; style-src 'self'; script-src 'self'; frame-ancestors 'none'");
$v = function ($f) { return @filemtime(__DIR__ . "/$f") ?: 1; };
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>b-vi · administration</title>
<link rel="stylesheet" href="admin.css?v=<?= $v('admin.css') ?>">
</head>
<body>
<div id="app"><p class="chargement">Chargement…</p></div>
<script src="admin.js?v=<?= $v('admin.js') ?>"></script>
</body>
</html>
