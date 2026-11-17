<?php
/* b-vi.fr — fonctions communes à projet.php et sitemap.php (adresses des dossiers, comme dans app.js) */
$SITE_URL = 'https://www.b-vi.fr';
function slug_bvi($s) {   // même calcul que slug() dans app.js
    $s = mb_strtolower($s, 'UTF-8');
    $s = strtr($s, ['à'=>'a','á'=>'a','â'=>'a','ä'=>'a','ã'=>'a','å'=>'a','ç'=>'c','è'=>'e','é'=>'e','ê'=>'e','ë'=>'e','ì'=>'i','í'=>'i','î'=>'i','ï'=>'i','ñ'=>'n','ò'=>'o','ó'=>'o','ô'=>'o','ö'=>'o','õ'=>'o','ù'=>'u','ú'=>'u','û'=>'u','ü'=>'u','ý'=>'y','ÿ'=>'y','œ'=>'oe','æ'=>'ae','ß'=>'ss']);
    $s = trim(preg_replace('/[^a-z0-9]+/', '-', $s), '-');
    return $s === '' ? 'dossier' : $s;
}
function fr($t) { return is_array($t) ? ($t['fr'] ?? '') : (string)$t; }
function sans_liens($s) { return preg_replace('/\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/', '$1', $s); }
function h($s) { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function img_url($p) { global $SITE_URL; return $SITE_URL . '/images/' . implode('/', array_map('rawurlencode', explode('/', $p))); }
// Dimensions et type de l'image d'aperçu : Facebook / Messenger les veulent pour afficher l'aperçu tout de suite
function dims_image($p) {
    $f = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/images/' . $p;
    if (!is_file($f)) { $g = glob(str_replace(['[', ']', '*', '?'], ['\\[', '\\]', '\\*', '\\?'], $f) . '.*'); $f = $g ? $g[0] : ''; }
    $i = $f ? @getimagesize($f) : false;
    if (!$i) return '';
    return "\n    <meta property=\"og:image:width\" content=\"{$i[0]}\" />\n    <meta property=\"og:image:height\" content=\"{$i[1]}\" />\n    <meta property=\"og:image:type\" content=\"" . htmlspecialchars($i['mime']) . "\" />";
}
function premiere_image($n) {
    foreach ($n['items'] ?? [] as $it) if (!empty($it['src'])) return $it['src'];
    foreach ($n['children'] ?? [] as $c) { $i = premiere_image($c); if ($i) return $i; }
    return null;
}
// Tous les dossiers, avec leur chemin (les doublons entre frères prennent -2, -3… comme dans app.js)
function indexer($noeuds, $parent, &$out) {
    $pris = [];
    foreach ($noeuds as $n) {
        $s = slug_bvi($n['name']); $k = 2; $b = $s;
        while (isset($pris[$s])) $s = $b . '-' . $k++;
        $pris[$s] = 1;
        $chemin = $parent === '' ? $s : "$parent/$s";
        $out[$chemin] = $n;
        indexer($n['children'] ?? [], $chemin, $out);
    }
}

