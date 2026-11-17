<?php
/* b-vi.fr — mesure d'audience maison, anonyme et sans cookie (exemptée de consentement selon les critères de la CNIL :
   finalité limitée à la mesure d'audience, données agrégées, pas de suivi entre sites, pas d'adresse IP conservée).
   Le site envoie (navigator.sendBeacon) :
     e=v  une visite (une fois par onglet) : source, fuseau horaire, langue du navigateur, largeur d'écran, page d'arrivée
     e=p  un dossier ouvert (une fois par onglet)      e=i  une image regardée dans la visionneuse
     e=d  la durée de la visite (en quittant)           e=l  un changement de langue du site
   Le pays est déduit du fuseau horaire du navigateur (ou, à défaut, de sa langue) : jamais de l'adresse IP.
   On ne garde que des compteurs mensuels : bvi-admin/data/prod/stats/AAAA-MM.json, lus par l'administration. */
date_default_timezone_set('Europe/Paris');
header('Cache-Control: no-store');
http_response_code(204);

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|linkedin|headless|lighthouse|curl|wget|python|monitor/i', $ua)) exit;
$P = $_POST + $_GET;
$e = $P['e'] ?? '';
if (!in_array($e, ['v', 'p', 'i', 'd', 'l'], true)) exit;
$val = function ($k, $max = 120) use ($P) { return substr((string)($P[$k] ?? ''), 0, $max); };
$cheminOk = function ($c) { return (bool)preg_match('~^[a-z0-9-]+(/[a-z0-9-]+)*$~', $c); };

$dir = dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod/stats';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) exit;
$h = fopen("$dir/" . date('Y-m') . '.json', 'c+');
if (!$h || !flock($h, LOCK_EX)) exit;
$d = json_decode(stream_get_contents($h) ?: '', true) ?: [];
$plus = function ($groupe, $cle, $n = 1, $max = 400) use (&$d) {
    if ($cle === '' || $cle === null) return;
    if (!isset($d[$groupe])) $d[$groupe] = [];
    if (count($d[$groupe]) >= $max && !isset($d[$groupe][$cle])) $cle = 'autres';
    $d[$groupe][$cle] = ($d[$groupe][$cle] ?? 0) + $n;
};

if ($e === 'v') {
    $plus('jours', date('Y-m-d'));
    $plus('heures', date('G'));
    $plus('semaine', date('N'));   // 1 = lundi
    // source
    $src = strtolower(preg_replace('/[^a-z0-9.\-]/i', '', $val('s', 80)));
    $src = preg_replace('/^(www\.|m\.|l\.|lm\.)/', '', $src);
    if ($src === '' || $src === 'b-vi.fr') $src = 'direct';
    $utm = strtolower(preg_replace('/[^a-z0-9._\-]/i', '', $val('u', 40)));
    $plus('sources', $utm !== '' ? "$src ($utm)" : $src);
    // appareil, système, navigateur (d'après l'en-tête User-Agent)
    $tablette = preg_match('/iPad|Tablet|Android(?!.*Mobile)/i', $ua) || ($val('t', 2) === '1' && preg_match('/Macintosh/', $ua));
    $plus('appareils', $tablette ? 'tablette' : (preg_match('/Mobi|iPhone|Android/i', $ua) ? 'téléphone' : 'ordinateur'));
    $os = preg_match('/iPhone|iPad|iPod/', $ua) || ($tablette && preg_match('/Macintosh/', $ua)) ? 'iOS / iPadOS'
        : (preg_match('/Android/', $ua) ? 'Android' : (preg_match('/Windows/', $ua) ? 'Windows' : (preg_match('/Mac OS X|Macintosh/', $ua) ? 'macOS'
        : (preg_match('/CrOS/', $ua) ? 'ChromeOS' : (preg_match('/Linux/', $ua) ? 'Linux' : 'autre')))));
    $plus('systemes', $os);
    $nav = preg_match('/Instagram/', $ua) ? 'Instagram (appli)' : (preg_match('/FBAN|FBAV|FB_IAB|Messenger/', $ua) ? 'Facebook / Messenger (appli)'
        : (preg_match('/LinkedInApp/', $ua) ? 'LinkedIn (appli)' : (preg_match('/SamsungBrowser/', $ua) ? 'Samsung Internet' : (preg_match('/Edg\//', $ua) ? 'Edge'
        : (preg_match('/OPR\/|Opera/', $ua) ? 'Opera' : (preg_match('/Firefox|FxiOS/', $ua) ? 'Firefox' : (preg_match('/CriOS|Chrome\//', $ua) ? 'Chrome'
        : (preg_match('/Safari/', $ua) ? 'Safari' : 'autre'))))))));
    $plus('navigateurs', $nav);
    // pays : fuseau horaire, sinon région de la langue du navigateur
    $tz = preg_replace('~[^A-Za-z_/+\-]~', '', $val('z', 60));
    $pays = (@include __DIR__ . '/stats-pays.php') ?: [];
    $lg = preg_replace('/[^A-Za-z\-]/', '', $val('g', 20));
    $code = $pays[$tz] ?? (preg_match('/^[a-z]{2,3}-([A-Z]{2})$/', $lg, $m) ? $m[1] : '??');
    $plus('pays', $code);
    $plus('villes', $tz !== '' ? $tz : '??');   // fuseau = grande région (ex. Europe/Paris), pas la ville réelle
    $plus('langues', strtolower(substr($lg, 0, 2)) ?: '??');
    // écran
    $w = (int)$val('w', 6);
    $plus('ecrans', $w <= 0 ? '??' : ($w < 400 ? 'moins de 400 px' : ($w < 768 ? '400 à 767 px' : ($w < 1280 ? '768 à 1279 px' : ($w < 1920 ? '1280 à 1919 px' : '1920 px et plus')))));
    // page d'arrivée
    $ent = $val('a', 200);
    $plus('entrees', $ent === '' ? 'accueil' : ($cheminOk($ent) ? $ent : 'autre'));
} elseif ($e === 'p') {
    $c = $val('c', 200);
    if ($cheminOk($c)) $plus('projets', $c, 1, 500);
} elseif ($e === 'i') {
    $c = $val('c', 210);
    if (preg_match('~^[a-z0-9-]+(/[a-z0-9-]+)*/\d{1,4}$~', $c)) $plus('images', $c, 1, 1500);
} elseif ($e === 'd') {
    $s = (int)$val('n', 7);
    if ($s > 0 && $s < 86400) {
        $plus('durees', $s < 10 ? 'moins de 10 s' : ($s < 30 ? '10 à 30 s' : ($s < 60 ? '30 s à 1 min' : ($s < 180 ? '1 à 3 min' : ($s < 600 ? '3 à 10 min' : 'plus de 10 min')))));
        $plus('duree_totale', 'secondes', $s); $plus('duree_totale', 'visites', 1);
    }
} elseif ($e === 'l') {
    $l = $val('c', 2);
    if (in_array($l, ['fr', 'en', 'it'], true)) $plus('langue_site', $l);
}
ftruncate($h, 0); rewind($h);
fwrite($h, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
fflush($h); flock($h, LOCK_UN); fclose($h);
