<?php
/* b-vi.fr — mesure d'audience maison, anonyme et sans cookie.
   Le site envoie : e=v (une visite, une fois par onglet) avec la source (site d'où l'on vient), ou e=p (un dossier ouvert) avec son chemin.
   On ne garde que des compteurs (par jour, par dossier, par source, par type d'appareil) : ni adresse IP, ni identifiant.
   Fichiers : bvi-admin/data/prod/stats/AAAA-MM.json (hors du web), lus par l'administration (« Statistiques »). */
date_default_timezone_set('Europe/Paris');
header('Cache-Control: no-store');
http_response_code(204);

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|linkedin|headless|lighthouse|curl|wget|python|monitor/i', $ua)) exit;
$e = $_POST['e'] ?? $_GET['e'] ?? '';
if (!in_array($e, ['v', 'p'], true)) exit;

$dir = dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod/stats';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) exit;
$f = "$dir/" . date('Y-m') . '.json';
$h = fopen($f, 'c+');
if (!$h || !flock($h, LOCK_EX)) exit;
$d = json_decode(stream_get_contents($h) ?: '', true) ?: ['jours' => [], 'projets' => [], 'sources' => [], 'appareils' => []];
$jour = date('Y-m-d');

if ($e === 'v') {
    $d['jours'][$jour] = ($d['jours'][$jour] ?? 0) + 1;
    $src = strtolower(preg_replace('/[^a-z0-9.\-]/i', '', substr((string)($_POST['s'] ?? $_GET['s'] ?? ''), 0, 80)));
    $src = preg_replace('/^(www\.|m\.|l\.|lm\.)/', '', $src);
    if ($src === '' || $src === 'b-vi.fr') $src = 'direct';
    if (count($d['sources']) < 300 || isset($d['sources'][$src])) $d['sources'][$src] = ($d['sources'][$src] ?? 0) + 1;
    $app = preg_match('/Mobi|Android|iPhone|iPad/i', $ua) ? 'téléphone' : 'ordinateur';
    $d['appareils'][$app] = ($d['appareils'][$app] ?? 0) + 1;
} else {
    $c = substr((string)($_POST['c'] ?? $_GET['c'] ?? ''), 0, 200);
    if (!preg_match('~^[a-z0-9-]+(/[a-z0-9-]+)*$~', $c)) { flock($h, LOCK_UN); exit; }
    if (count($d['projets']) < 500 || isset($d['projets'][$c])) $d['projets'][$c] = ($d['projets'][$c] ?? 0) + 1;
}
ftruncate($h, 0); rewind($h);
fwrite($h, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($h); flock($h, LOCK_UN); fclose($h);
