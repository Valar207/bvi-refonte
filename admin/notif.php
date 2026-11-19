<?php
/* b-vi.fr · administration — mail de notification après chaque publication (ou restauration).
   Le destinataire est dans bvi-admin/notif.php (hors du web, hors du dépôt) :
       <?php return ['a' => 'adresse@exemple.fr'];
   Sans ce fichier, rien n'est envoyé. Une erreur ici ne bloque jamais la publication. */

if (!defined('BVI_ADMIN')) { http_response_code(403); exit; }

// Aplatit l'arbre : [chemin "a › b" => dossier] et [clé d'élément => [chemin, élément, position]]
function notif_aplatir($noeuds, $parent, &$dossiers, &$elements) {
    foreach ($noeuds as $n) {
        $ch = $parent === '' ? $n['name'] : "$parent › {$n['name']}";
        $dossiers[$ch] = $n;
        foreach ($n['items'] ?? [] as $i => $it) {
            $k = $it['video'] ?? $it['src'] ?? '';
            if ($k !== '' && !isset($elements[$k])) $elements[$k] = [$ch, $it, $i];
        }
        notif_aplatir($n['children'] ?? [], $ch, $dossiers, $elements);
    }
}
function notif_nom_element($it) {
    if (!empty($it['title'])) return $it['title'];
    if (!empty($it['src'])) return basename($it['src']);
    return $it['video'] ?? '?';
}
function notif_langues($a, $b) {   // langues dont le texte a changé
    $a = is_array($a) ? $a : ['fr' => (string)$a]; $b = is_array($b) ? $b : ['fr' => (string)$b];
    $l = [];
    foreach (array_unique(array_merge(array_keys($a), array_keys($b))) as $k) if (($a[$k] ?? '') !== ($b[$k] ?? '')) $l[] = strtoupper($k);
    return $l ? ' (' . implode(', ', $l) . ')' : '';
}
function notif_court($t, $max = 160) {
    $t = is_array($t) ? ($t['fr'] ?? reset($t) ?: '') : (string)$t;
    $t = trim(preg_replace('/\s+/', ' ', $t));
    return mb_strlen($t) > $max ? mb_substr($t, 0, $max - 1) . '…' : $t;
}

// Liste des changements : [[icône, texte, vignette|null], …]
function notif_changements($avant, $apres) {
    $da = $ea = $dn = $en = [];
    notif_aplatir($avant['site'] ?? [], '', $da, $ea);
    notif_aplatir($apres['site'] ?? [], '', $dn, $en);
    $out = [];

    foreach ($dn as $ch => $n) if (!isset($da[$ch])) $out[] = ['➕', "Nouveau dossier : $ch", null];
    foreach ($da as $ch => $n) if (!isset($dn[$ch])) $out[] = ['➖', "Dossier supprimé ou renommé : $ch", null];

    foreach ($dn as $ch => $n) {
        if (!isset($da[$ch])) continue;
        $o = $da[$ch];
        if (($o['desc'] ?? '') !== ($n['desc'] ?? '')) {
            $out[] = ['✏️', "Description modifiée" . notif_langues($o['desc'] ?? '', $n['desc'] ?? '') . " : $ch", null, notif_court($n['desc'] ?? '')];
        }
        if (!empty($o['nouveau']) !== !empty($n['nouveau'])) $out[] = ['🏷️', (empty($n['nouveau']) ? 'Badge « nouveau » retiré' : 'Badge « nouveau » ajouté') . " : $ch", null];
        $ko = array_values(array_filter(array_map(function ($x) { return $x['video'] ?? $x['src'] ?? ''; }, $o['items'] ?? [])));
        $kn = array_values(array_filter(array_map(function ($x) { return $x['video'] ?? $x['src'] ?? ''; }, $n['items'] ?? [])));
        $communs_o = array_values(array_intersect($ko, $kn)); $communs_n = array_values(array_intersect($kn, $ko));
        if ($communs_o !== $communs_n) $out[] = ['↕️', "Ordre des images changé : $ch", null];
        if (array_keys($o['children'] ?? []) !== array_keys($n['children'] ?? []) || array_column($o['children'] ?? [], 'name') !== array_column($n['children'] ?? [], 'name')) {
            $no = array_column($o['children'] ?? [], 'name'); $nn = array_column($n['children'] ?? [], 'name');
            if (array_values(array_intersect($no, $nn)) !== array_values(array_intersect($nn, $no))) $out[] = ['↕️', "Ordre des sous-dossiers changé : $ch", null];
        }
    }
    $no = array_column($avant['site'] ?? [], 'name'); $nn = array_column($apres['site'] ?? [], 'name');
    if (array_values(array_intersect($no, $nn)) !== array_values(array_intersect($nn, $no))) $out[] = ['↕️', 'Ordre des rubriques changé', null];

    foreach ($en as $k => [$ch, $it]) {
        if (!isset($ea[$k])) {
            $type = isset($it['video']) ? 'Vidéo ajoutée' : (preg_match('/\.pdf$/i', $it['src'] ?? '') ? 'PDF ajouté' : 'Image ajoutée');
            $out[] = ['➕', "$type dans $ch : " . notif_nom_element($it), $it['src'] ?? null, isset($it['desc']) ? notif_court($it['desc']) : null];
            continue;
        }
        [$cho, $o] = $ea[$k];
        if ($cho !== $ch && isset($dn[$cho]) && isset($da[$ch])) $out[] = ['➡️', notif_nom_element($it) . " déplacé de $cho vers $ch", null];
        $to = $o['title'] ?? ''; $tn = $it['title'] ?? '';
        if ($to !== $tn) $out[] = ['✏️', $to === '' ? "Titre ajouté dans $ch : « $tn » (" . basename($it['src'] ?? '') . ')' : ($tn === '' ? "Titre retiré dans $ch : « $to »" : "Titre modifié dans $ch : « $to » → « $tn »"), null];
        if (($o['desc'] ?? '') !== ($it['desc'] ?? '')) $out[] = ['✏️', "Légende modifiée" . notif_langues($o['desc'] ?? '', $it['desc'] ?? '') . " : " . notif_nom_element($it) . " ($ch)", null, notif_court($it['desc'] ?? '')];
        if (($o['poster'] ?? '') !== ($it['poster'] ?? '') || (isset($it['video']) && ($o['src'] ?? '') !== ($it['src'] ?? ''))) $out[] = ['✏️', "Image d'aperçu changée : " . notif_nom_element($it), null];
    }
    foreach ($ea as $k => [$ch, $it]) {
        if (isset($en[$k])) continue;
        // élément retiré (s'il était dans un dossier supprimé, la ligne du dossier suffit)
        if (isset($dn[$ch])) $out[] = ['➖', (isset($it['video']) ? 'Vidéo retirée' : 'Image retirée') . " de $ch : " . notif_nom_element($it), null];
    }

    if (($avant['contact'] ?? null) !== ($apres['contact'] ?? null)) $out[] = ['✏️', 'Page contact modifiée', null];
    return $out;
}

function notif_envoyer($avant, $apres, $note) {
    global $PRIV, $INST;
    try {
        $cfg = is_file("$PRIV/notif.php") ? (include "$PRIV/notif.php") : null;
        $a = is_array($cfg) ? ($cfg['a'] ?? '') : '';
        if (!filter_var($a, FILTER_VALIDATE_EMAIL) || !is_array($avant)) return false;
        $ch = notif_changements($avant, $apres);
        if (!$ch) return false;   // publication identique : pas de mail

        $site = 'https://www.b-vi.fr';
        $qui = $_SESSION['user'] ?? 'Quelqu’un';
        $quand = date('d/m/Y à H:i');
        $resto = $note === 'avant restauration';
        $titre = $resto ? "$qui a restauré une ancienne version de b-vi.fr" : "$qui a publié sur b-vi.fr";
        $inst = $INST === 'prod' ? '' : " [$INST]";
        $sujet = '=?UTF-8?B?' . base64_encode("b-vi.fr$inst : " . count($ch) . ' changement' . (count($ch) > 1 ? 's' : '') . " publié" . (count($ch) > 1 ? 's' : '') . " par $qui") . '?=';

        $h = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); };
        $txt = "$titre ($quand)\n\n";
        $html = '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:15px;color:#222;max-width:640px">'
              . '<p style="font-size:17px;margin:0 0 4px"><b>' . $h($titre) . '</b></p>'
              . '<p style="color:#777;margin:0 0 16px">' . $h($quand) . '</p><table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%">';
        $max = 80;
        foreach (array_slice($ch, 0, $max) as $c) {
            [$ico, $t, $img] = $c; $extrait = $c[3] ?? null;
            $txt .= "$ico $t\n" . ($extrait ? "     « $extrait »\n" : '');
            $vign = '';
            if ($img && !preg_match('/\.pdf$/i', $img)) {
                $mini = 'images/_mini/' . preg_replace('/\.[A-Za-z0-9]{2,4}$/', '', $img) . '.jpg';
                $u = $site . '/' . implode('/', array_map('rawurlencode', explode('/', $mini)));
                $vign = '<br><img src="' . $h($u) . '" alt="" style="max-height:120px;max-width:100%;margin-top:6px;border-radius:4px">';
            }
            $html .= '<tr><td style="vertical-align:top;padding:6px 8px 6px 0;width:24px">' . $ico . '</td><td style="padding:6px 0;border-bottom:1px solid #eee">'
                   . $h($t) . ($extrait ? '<br><span style="color:#777;font-style:italic">« ' . $h($extrait) . ' »</span>' : '') . $vign . '</td></tr>';
        }
        if (count($ch) > $max) { $r = count($ch) - $max; $txt .= "… et $r autres changements\n"; $html .= '<tr><td></td><td style="padding:6px 0;color:#777">… et ' . $r . ' autres changements</td></tr>'; }
        $txt .= "\nVoir le site : $site\n";
        $html .= '</table><p style="margin-top:20px"><a href="' . $site . '" style="color:#0b57d0">Voir le site</a> · <a href="' . $site . '/admin/" style="color:#0b57d0">Administration</a></p>'
               . '<p style="color:#999;font-size:12px">Mail automatique envoyé par l’administration de b-vi.fr.</p></div>';

        $b = 'bvi' . bin2hex(random_bytes(8));
        $corps = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($txt))
               . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$b--\r\n";
        $entetes = "From: =?UTF-8?B?" . base64_encode('Site b-vi.fr') . "?= <noreply@b-vi.fr>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=\"$b\"";
        return @mail($a, $sujet, $corps, $entetes, '-fnoreply@b-vi.fr');
    } catch (Throwable $e) {
        return false;
    }
}
