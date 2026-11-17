<?php
/* b-vi.fr (page.php) — page d'accueil et liens directs vers un projet (/projet/<rubrique>/<dossier>[/<n° d'image>]).
   Renvoie index.html, enrichi pour les aperçus de partage (WhatsApp, LinkedIn, Instagram…) et pour Google :
   titre, description et image du projet (Open Graph / Twitter), adresse canonique, et une version texte du contenu.
   Le JavaScript du site ouvre ensuite les bonnes fenêtres. En cas de souci, on renvoie index.html tel quel. */

$INDEX = __DIR__ . '/index.html';

require_once __DIR__ . '/projet-lib.php';

try {
    $html = file_get_contents($INDEX);
    if ($html === false) throw new Exception('index');
    $c = json_decode(@file_get_contents(dirname(realpath($_SERVER['DOCUMENT_ROOT'])) . '/bvi-admin/data/prod/contenu.json'), true);
    if (!is_array($c) || empty($c['site'])) throw new Exception('contenu');
    $tous = []; indexer($c['site'], '', $tous);

    $p = trim((string)($_GET['p'] ?? ($_SERVER['PATH_INFO'] ?? '')), '/');
    $num = null;
    if (preg_match('~^(.*?)/(\d+)$~', $p, $m)) { $p = $m[1]; $num = (int)$m[2]; }
    $n = $p !== '' ? ($tous[$p] ?? null) : null;
    if ($p !== '' && !$n) {   // juste « kosmos »
        foreach ($tous as $ch => $x) if (basename($ch) === $p) { $n = $x; $p = $ch; break; }
    }
    if ($p === 'contact' || $p === 'jeux' || strpos($p, 'jeux/') === 0) { $n = null; $p = $p === 'contact' ? 'contact' : 'jeux'; }

    if ($n) {
        $titre = $n['name'] . ' — Lucas Bessis · B-VI';
        $desc = trim(sans_liens(fr($n['desc'] ?? '')));
        if ($desc === '') $desc = 'Lucas Bessis — Graphisme, direction artistique. Paris, France.';
        $item = ($num && !empty($n['items'][$num - 1])) ? $n['items'][$num - 1] : null;
        $img = ($item && !empty($item['src'])) ? $item['src'] : premiere_image($n);
        $canon = "$SITE_URL/projet/$p" . ($item ? "/$num" : '');
    } else {
        $titre = 'Lucas Bessis · B-VI — Graphisme, direction artistique';
        $desc = 'Portfolio de Lucas Bessis, graphiste et directeur artistique à Paris : signalétique, scénographie, identité visuelle, édition, illustration, web.';
        $img = premiere_image(['children' => $c['site']]);
        $canon = "$SITE_URL/" . ($p === 'contact' ? 'projet/contact' : '');
    }
    $court = mb_strlen($desc) > 200 ? mb_substr($desc, 0, 197) . '…' : $desc;

    $meta = "\n    <link rel=\"canonical\" href=\"" . h($canon) . "\" />"
        . "\n    <meta property=\"og:type\" content=\"website\" />"
        . "\n    <meta property=\"og:site_name\" content=\"B-VI · Lucas Bessis\" />"
        . "\n    <meta property=\"og:locale\" content=\"fr_FR\" />"
        . "\n    <meta property=\"og:title\" content=\"" . h($titre) . "\" />"
        . "\n    <meta property=\"og:description\" content=\"" . h($court) . "\" />"
        . "\n    <meta property=\"og:url\" content=\"" . h($canon) . "\" />"
        . ($img ? "\n    <meta property=\"og:image\" content=\"" . h(img_url($img)) . "\" />\n    <meta name=\"twitter:image\" content=\"" . h(img_url($img)) . "\" />" : '')
        . "\n    <meta name=\"twitter:card\" content=\"summary_large_image\" />"
        . "\n    <meta name=\"twitter:title\" content=\"" . h($titre) . "\" />"
        . "\n    <meta name=\"twitter:description\" content=\"" . h($court) . "\" />";

    // Version texte pour Google (masquée à l'écran, le site JavaScript s'affiche par-dessus)
    $seo = "\n    <div class=\"seo\" aria-hidden=\"true\">";
    if ($n) {
        $seo .= "<h1>" . h($n['name']) . "</h1><p>" . h($desc) . "</p>";
        foreach ($n['items'] ?? [] as $i => $it) if (!empty($it['src'])) $seo .= "<img src=\"" . h(img_url($it['src'])) . "\" alt=\"" . h(($it['title'] ?? $n['name']) . ' — ' . sans_liens(fr($it['desc'] ?? ''))) . "\" loading=\"lazy\" />";
        foreach ($n['children'] ?? [] as $ch) $seo .= "<a href=\"/projet/$p/" . h(slug_bvi($ch['name'])) . "\">" . h($ch['name']) . "</a> ";
    } else {
        $seo .= "<h1>Lucas Bessis — B-VI</h1><p>" . h($desc) . "</p><ul>";
        foreach ($tous as $ch => $x) $seo .= "<li><a href=\"/projet/" . h($ch) . "\">" . h($x['name']) . "</a> — " . h(sans_liens(fr($x['desc'] ?? ''))) . "</li>";
        $seo .= "</ul>";
    }
    $seo .= "</div>";

    $html = preg_replace('~<title>.*?</title>~s', '<title>' . h($titre) . '</title>', $html, 1);
    $html = preg_replace('~<meta name="description" content="[^"]*" />~', '<meta name="description" content="' . h($court) . '" />' . $meta, $html, 1);
    $html = preg_replace('~<body>~', "<body>$seo", $html, 1);
    if ($p !== '' && !$n && $p !== 'contact' && $p !== 'jeux') http_response_code(404);
} catch (Throwable $e) {
    $html = @file_get_contents($INDEX);
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
echo $html;
