<?php
/* b-vi.fr · administration — fonctions communes (PHP 7.4+)
   Données privées (mot de passe, contenu, versions) : dossier bvi-admin/ À CÔTÉ de www/, donc jamais servi par le web.
   Le site public lit content.js, que ce fichier régénère à chaque publication. */

if (!defined('BVI_ADMIN')) { http_response_code(403); exit; }

date_default_timezone_set('Europe/Paris');

const MAX_UPLOAD = 25 * 1024 * 1024;
const MAX_VERSIONS = 60;
const MAX_ESSAIS = 5;          // échecs de connexion avant blocage
const BLOCAGE = 600;           // secondes

$WWW = realpath($_SERVER['DOCUMENT_ROOT']) ?: rtrim($_SERVER['DOCUMENT_ROOT'], '/');
$SITE_DIR = realpath(dirname(__DIR__));                  // dossier du site (www/ ou www/nouveau/)
$PRIV = dirname($WWW) . '/bvi-admin';                    // hors du web
$INST = ($SITE_DIR === $WWW) ? 'prod' : preg_replace('/[^a-z0-9_-]/i', '', basename($SITE_DIR));
$DATA = "$PRIV/data/$INST";
$IMAGES = "$WWW/images";

function demarrer_session() {
    session_name('bviadmin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
}

function repondre($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function erreur($msg, $code = 400) { repondre(['ok' => false, 'erreur' => $msg], $code); }

function connecte() { return !empty($_SESSION['user']); }
function exiger_connexion() { if (!connecte()) erreur('Session expirée : reconnecte-toi.', 401); }
function exiger_csrf() {
    $t = $_SERVER['HTTP_X_CSRF'] ?? '';
    if (!is_string($t) || !hash_equals($_SESSION['csrf'], $t)) erreur('Jeton de sécurité invalide : recharge la page.', 403);
}

function lire_json($f, $defaut = null) {
    if (!is_file($f)) return $defaut;
    $d = json_decode(file_get_contents($f), true);
    return $d === null ? $defaut : $d;
}
function ecrire_atomique($f, $txt) {
    if (!is_dir(dirname($f))) mkdir(dirname($f), 0750, true);
    $tmp = $f . '.tmp' . bin2hex(random_bytes(4));
    if (file_put_contents($tmp, $txt, LOCK_EX) === false) erreur("Écriture impossible sur le serveur.", 500);
    if (!rename($tmp, $f)) { @unlink($tmp); erreur("Écriture impossible sur le serveur.", 500); }
}

/* ---------- Connexion : limite d'essais par adresse IP ---------- */
function ip() { return $_SERVER['REMOTE_ADDR'] ?? '?'; }
function essais_bloque() {
    global $PRIV;
    $e = lire_json("$PRIV/essais.json", []);
    $x = $e[ip()] ?? null;
    return $x && $x['n'] >= MAX_ESSAIS && time() - $x['t'] < BLOCAGE ? BLOCAGE - (time() - $x['t']) : 0;
}
function essai_rate($echec) {
    global $PRIV;
    $e = lire_json("$PRIV/essais.json", []);
    foreach ($e as $k => $v) if (time() - $v['t'] > BLOCAGE) unset($e[$k]);
    if ($echec) { $x = $e[ip()] ?? ['n' => 0, 't' => time()]; $x['n']++; $x['t'] = time(); $e[ip()] = $x; }
    else unset($e[ip()]);
    ecrire_atomique("$PRIV/essais.json", json_encode($e));
}

/* ---------- Validation du contenu ---------- */
function texte_ok($v, $max) { return is_string($v) && mb_strlen($v) <= $max; }
function trad_ok($v, $max = 6000) {   // chaîne simple ou {fr, en, it}
    if (is_string($v)) return mb_strlen($v) <= $max;
    if (!is_array($v)) return false;
    foreach ($v as $k => $x) if (!in_array($k, ['fr', 'en', 'it'], true) || !texte_ok($x, $max)) return false;
    return isset($v['fr']);
}
function chemin_image_ok($p) {
    return is_string($p) && $p !== '' && mb_strlen($p) <= 400 && strpos($p, '..') === false
        && $p[0] !== '/' && strpos($p, '://') === false && strpos($p, "\0") === false && strpos($p, '\\') === false;
}
function lien_ok($u) {
    if (!is_string($u) || mb_strlen($u) > 600) return false;
    if (strpos($u, '@images/') === 0) return chemin_image_ok(substr($u, 8));
    return (bool)preg_match('~^(https?://|mailto:)[^\s"<>]+$~i', $u);
}
function dossier_ok($n, $prof, &$compte) {
    if (!is_array($n) || $prof > 8 || ++$compte > 5000) return false;
    foreach ($n as $k => $_) if (!in_array($k, ['name', 'desc', 'children', 'items'], true)) return false;
    if (!texte_ok($n['name'] ?? null, 160) || trim($n['name']) === '') return false;
    if (isset($n['desc']) && !trad_ok($n['desc'])) return false;
    if (isset($n['children'])) {
        if (!is_array($n['children'])) return false;
        foreach ($n['children'] as $c) if (!dossier_ok($c, $prof + 1, $compte)) return false;
    }
    if (isset($n['items'])) {
        if (!is_array($n['items'])) return false;
        foreach ($n['items'] as $it) {
            if (!is_array($it) || ++$compte > 5000) return false;
            foreach ($it as $k => $_) if (!in_array($k, ['src', 'title', 'desc'], true)) return false;
            if (!chemin_image_ok($it['src'] ?? null)) return false;
            if (isset($it['title']) && !texte_ok($it['title'], 200)) return false;
            if (isset($it['desc']) && !trad_ok($it['desc'])) return false;
        }
    }
    return true;
}
function contenu_ok($c) {
    if (!is_array($c) || !isset($c['site'], $c['contact']) || !is_array($c['site'])) return false;
    $compte = 0;
    foreach ($c['site'] as $n) if (!dossier_ok($n, 0, $compte)) return false;
    $ct = $c['contact'];
    if (!is_array($ct) || !texte_ok($ct['name'] ?? null, 160) || !is_array($ct['lines'] ?? null) || count($ct['lines']) > 80) return false;
    foreach ($ct['lines'] as $l) {
        if (!is_array($l)) return false;
        foreach ($l as $k => $v) {
            if (in_array($k, ['big', 'small', 'link'], true)) { if (!trad_ok($v, 600)) return false; }
            elseif ($k === 'gap') { if ($v !== true) return false; }
            elseif ($k === 'href') { if (!lien_ok($v)) return false; }
            elseif ($k === 'links') {
                if (!is_array($v) || count($v) > 12) return false;
                foreach ($v as $x) if (!is_array($x) || count($x) !== 2 || !texte_ok($x[0], 120) || !lien_ok($x[1])) return false;
            } else return false;
        }
    }
    return true;
}

/* ---------- Publication ---------- */
function contenu_courant() {
    global $DATA;
    return lire_json("$DATA/contenu.json");
}
function ecrire_site($c) {
    global $SITE_DIR;
    $json = json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    $js = "/* Contenu du site, écrit par l'administration (/admin) le " . date('d/m/Y à H:i') . ". Ne pas modifier à la main sur le serveur. */\n"
        . "const CONTENU = $json;\nconst SITE = CONTENU.site.map(prepDossier);\nconst CONTACT = prepContact(CONTENU.contact);\n";
    ecrire_atomique("$SITE_DIR/content.js", $js);
}
function enregistrer($c, $note) {
    global $DATA;
    $actuel = contenu_courant();
    if ($actuel !== null) {   // la version d'avant part dans l'historique
        $id = date('Ymd-His') . '-' . bin2hex(random_bytes(2));
        ecrire_atomique("$DATA/versions/$id.json", json_encode(['note' => $note, 'par' => $_SESSION['user'] ?? '?', 'contenu' => $actuel], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $vs = glob("$DATA/versions/*.json"); sort($vs);
        while (count($vs) > MAX_VERSIONS) @unlink(array_shift($vs));
    }
    ecrire_atomique("$DATA/contenu.json", json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    ecrire_site($c);
}

/* ---------- Fichiers envoyés ---------- */
function nom_propre($s, $max = 80) {
    $s = preg_replace('/[^\p{L}\p{N} ._-]+/u', '-', $s);
    $s = trim(preg_replace('/[ -]{2,}/', ' ', $s), ' .-');
    return mb_substr($s === '' ? 'fichier' : $s, 0, $max);
}
