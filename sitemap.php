<?php
/* b-vi.fr — plan du site pour Google (/sitemap.xml), toujours à jour avec le contenu publié par l'administration. */
require_once __DIR__ . '/projet-lib.php';
header('Content-Type: application/xml; charset=utf-8');
$c = json_decode(@file_get_contents(dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod/contenu.json'), true);
$f = dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod/contenu.json';
$date = is_file($f) ? date('Y-m-d', filemtime($f)) : date('Y-m-d');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo "  <url><loc>https://www.b-vi.fr/</loc><lastmod>$date</lastmod></url>\n";
$tous = [];
if (is_array($c) && !empty($c['site'])) indexer($c['site'], '', $tous);
foreach ($tous as $ch => $_) echo '  <url><loc>https://www.b-vi.fr/projet/' . htmlspecialchars(implode('/', array_map('rawurlencode', explode('/', $ch)))) . "</loc><lastmod>$date</lastmod></url>\n";
echo "</urlset>\n";
