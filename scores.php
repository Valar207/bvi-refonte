<?php
/* b-vi.fr — classements des jeux (démineur par niveau : meilleur temps ; snake : meilleur score).
   GET  ?jeu=…            → top 10
   POST jeu, pseudo, score → enregistre puis renvoie le top 10 et le rang
   Données : bvi-admin/data/prod/scores.json (hors du web). Aucune adresse IP n'est gardée : la limite d'envois
   utilise une empreinte de l'IP salée et renouvelée chaque heure. Modération : bouton « Classements » de l'admin. */
date_default_timezone_set('Europe/Paris');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const JEUX = ['snake' => 'haut', 'mines-facile' => 'bas', 'mines-moyen' => 'bas', 'mines-difficile' => 'bas', 'mines-extreme' => 'bas'];
const GARDES = 50;
function rep($d, $c = 200) { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

$priv = dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod';
$f = "$priv/scores.json";
$jeu = (string)($_POST['jeu'] ?? $_GET['jeu'] ?? '');
if (!isset(JEUX[$jeu])) rep(['ok' => false, 'erreur' => 'jeu inconnu'], 400);

function trier($liste, $sens) {
    usort($liste, function ($a, $b) use ($sens) { return $sens === 'haut' ? ($b['s'] <=> $a['s'] ?: $a['d'] <=> $b['d']) : ($a['s'] <=> $b['s'] ?: $a['d'] <=> $b['d']); });
    return $liste;
}
function top($liste) { return array_map(function ($x) { return ['p' => $x['p'], 's' => $x['s']]; }, array_slice($liste, 0, 10)); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $d = is_file($f) ? (json_decode(file_get_contents($f), true) ?: []) : [];
    rep(['ok' => true, 'top' => top(trier($d[$jeu] ?? [], JEUX[$jeu]))]);
}

// ----- envoi d'un score -----
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|headless|curl|wget|python/i', $ua)) rep(['ok' => false], 403);
$pseudo = trim(preg_replace('/\s+/u', ' ', (string)($_POST['pseudo'] ?? '')));
if (!preg_match('/^[\p{L}\p{N} ._\-\']{2,16}$/u', $pseudo)) rep(['ok' => false, 'erreur' => 'pseudo invalide'], 400);
$score = (int)($_POST['score'] ?? -1);
$bornes = $jeu === 'snake' ? [1, 2000] : [1, 99999];   // snake : points ; démineur : secondes
if ($score < $bornes[0] || $score > $bornes[1]) rep(['ok' => false, 'erreur' => 'score invalide'], 400);

if (!is_dir($priv)) @mkdir($priv, 0750, true);
$h = fopen($f, 'c+');
if (!$h || !flock($h, LOCK_EX)) rep(['ok' => false], 500);
$d = json_decode(stream_get_contents($h) ?: '', true) ?: [];

// limite : 30 envois par heure et par appareil (empreinte salée, jamais l'IP elle-même)
$sel = $d['_sel'] ?? ''; if ($sel === '') $sel = $d['_sel'] = bin2hex(random_bytes(16));
$cle = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $sel . date('YmdH')), 0, 16);
if (($d['_lim']['h'] ?? '') !== date('YmdH')) $d['_lim'] = ['h' => date('YmdH'), 'n' => []];
$d['_lim']['n'][$cle] = ($d['_lim']['n'][$cle] ?? 0) + 1;
if ($d['_lim']['n'][$cle] > 30) { flock($h, LOCK_UN); rep(['ok' => false, 'erreur' => 'trop d\'envois, réessaie plus tard'], 429); }

$liste = $d[$jeu] ?? [];
// un pseudo n'apparaît qu'une fois : on garde son meilleur résultat
$sens = JEUX[$jeu]; $trouve = false;
foreach ($liste as &$x) if (mb_strtolower($x['p']) === mb_strtolower($pseudo)) {
    $trouve = true;
    if ($sens === 'haut' ? $score > $x['s'] : $score < $x['s']) { $x['s'] = $score; $x['d'] = time(); $x['p'] = $pseudo; }
}
unset($x);
if (!$trouve) $liste[] = ['p' => $pseudo, 's' => $score, 'd' => time()];
$liste = array_slice(trier($liste, $sens), 0, GARDES);
$d[$jeu] = $liste;
ftruncate($h, 0); rewind($h); fwrite($h, json_encode($d, JSON_UNESCAPED_UNICODE)); fflush($h); flock($h, LOCK_UN); fclose($h);
$rang = null; foreach ($liste as $i => $x) if (mb_strtolower($x['p']) === mb_strtolower($pseudo)) { $rang = $i + 1; break; }
rep(['ok' => true, 'top' => top($liste), 'rang' => $rang]);
