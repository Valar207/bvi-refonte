<?php
/* b-vi.fr · administration — API (JSON). Toutes les actions qui modifient demandent la connexion + le jeton CSRF. */
define('BVI_ADMIN', 1);
require __DIR__ . '/lib.php';
demarrer_session();

$a = $_GET['a'] ?? '';
$methode = $_SERVER['REQUEST_METHOD'];
$corps = [];
if ($methode === 'POST' && strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === 0) {
    $corps = json_decode(file_get_contents('php://input'), true);
    if (!is_array($corps)) erreur('Requête illisible.');
}

switch ($a) {

case 'etat':
    repondre(['ok' => true, 'connecte' => connecte(), 'user' => $_SESSION['user'] ?? null, 'csrf' => $_SESSION['csrf'], 'instance' => $INST]);

case 'connexion':
    if ($methode !== 'POST') erreur('Méthode invalide.', 405);
    $reste = essais_bloque();
    if ($reste) erreur('Trop d’essais. Réessaie dans ' . ceil($reste / 60) . ' min.', 429);
    $auth = is_file("$PRIV/auth.php") ? (include "$PRIV/auth.php") : null;
    if (!is_array($auth)) erreur('Administration pas encore configurée.', 500);
    $u = (string)($corps['user'] ?? ''); $p = (string)($corps['pass'] ?? '');
    $ok = hash_equals(mb_strtolower($auth['user']), mb_strtolower(trim($u))) & password_verify($p, $auth['hash']);
    if (!$ok) { essai_rate(true); usleep(400000); erreur('Identifiant ou mot de passe incorrect.', 401); }
    essai_rate(false);
    session_regenerate_id(true);
    $_SESSION['user'] = $auth['user'];
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    repondre(['ok' => true, 'user' => $auth['user'], 'csrf' => $_SESSION['csrf']]);

case 'deconnexion':
    exiger_csrf();
    $_SESSION = []; session_destroy();
    repondre(['ok' => true]);

case 'contenu':
    exiger_connexion();
    $c = contenu_courant();
    if ($c === null) erreur('Contenu introuvable sur le serveur.', 500);
    repondre(['ok' => true, 'contenu' => $c]);

case 'publier':
    exiger_connexion(); exiger_csrf();
    $c = $corps['contenu'] ?? null;
    if (!contenu_ok($c)) erreur('Le contenu envoyé n’est pas valide : rien n’a été publié.');
    enregistrer($c, 'publication');
    repondre(['ok' => true, 'quand' => date('H:i')]);

case 'versions':
    exiger_connexion();
    $out = [];
    $vs = glob("$DATA/versions/*.json"); rsort($vs);
    foreach ($vs as $f) {
        $id = basename($f, '.json');
        $d = DateTime::createFromFormat('Ymd-His', substr($id, 0, 15));
        $v = lire_json($f, []);
        $out[] = ['id' => $id, 'date' => $d ? $d->format('d/m/Y à H:i') : $id, 'par' => $v['par'] ?? '', 'note' => $v['note'] ?? ''];
    }
    repondre(['ok' => true, 'versions' => $out]);

case 'restaurer':
    exiger_connexion(); exiger_csrf();
    $id = (string)($corps['id'] ?? '');
    if (!preg_match('/^\d{8}-\d{6}-[0-9a-f]{4}$/', $id) || !is_file("$DATA/versions/$id.json")) erreur('Version introuvable.', 404);
    $v = lire_json("$DATA/versions/$id.json");
    if (!contenu_ok($v['contenu'] ?? null)) erreur('Cette version est illisible.', 500);
    enregistrer($v['contenu'], 'avant restauration');
    repondre(['ok' => true, 'contenu' => $v['contenu']]);

case 'envoyer':   // une image (ou un PDF) → images/<dossier>/<nom>
    exiger_connexion(); exiger_csrf();
    if ($methode !== 'POST' || empty($_FILES['f'])) erreur('Aucun fichier reçu.');
    $f = $_FILES['f'];
    if ($f['error'] !== UPLOAD_ERR_OK) erreur($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE ? 'Fichier trop lourd.' : 'Envoi interrompu, réessaie.');
    $debut12 = file_get_contents($f['tmp_name'], false, null, 0, 12);
    $estVideo = substr($debut12, 4, 4) === 'ftyp' || substr($debut12, 0, 4) === "\x1A\x45\xDF\xA3";
    if ($f['size'] > ($estVideo ? MAX_VIDEO : MAX_UPLOAD)) erreur($estVideo ? 'Vidéo trop lourde (300 Mo maximum).' : 'Fichier trop lourd (25 Mo maximum).');
    $dest = trim((string)($_POST['dossier'] ?? 'ajouts'), '/');
    $parts = array_values(array_filter(array_map('nom_propre', explode('/', $dest)), 'strlen'));
    if (!$parts) $parts = ['ajouts'];
    $rel = implode('/', array_slice($parts, 0, 6));
    $info = @getimagesize($f['tmp_name']);
    $ext = null;
    if ($info) {
        $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_GIF => 'gif', IMAGETYPE_WEBP => 'webp'];
        $ext = $types[$info[2]] ?? null;
        if (!$ext) erreur('Format d’image non accepté (JPG, PNG, GIF ou WebP).');
    } else {
        $debut = file_get_contents($f['tmp_name'], false, null, 0, 5);
        if ($debut === '%PDF-') $ext = 'pdf';
        elseif ($estVideo) { $e = strtolower(pathinfo((string)$f['name'], PATHINFO_EXTENSION)); $ext = in_array($e, ['mp4', 'webm', 'mov'], true) ? $e : (substr($debut12, 0, 4) === "\x1A\x45\xDF\xA3" ? 'webm' : 'mp4'); }
        else erreur('Ce fichier n’est ni une image, ni une vidéo, ni un PDF.');
    }
    $base = nom_propre(pathinfo((string)$f['name'], PATHINFO_FILENAME), 60);
    if (!is_dir("$IMAGES/$rel") && !mkdir("$IMAGES/$rel", 0755, true)) erreur('Impossible de créer le dossier sur le serveur.', 500);
    $nom = "$base.$ext"; $i = 2;
    while (file_exists("$IMAGES/$rel/$nom")) $nom = "$base-" . $i++ . ".$ext";   // jamais d'écrasement
    $cible = "$IMAGES/$rel/$nom";
    // JPG / PNG / WebP réencodés (nettoie le fichier, retire les métadonnées) si GD est disponible ; GIF et PDF gardés tels quels
    if (in_array($ext, ['jpg', 'png', 'webp'], true) && function_exists('imagecreatefromstring')) {
        $im = @imagecreatefromstring(file_get_contents($f['tmp_name']));
        if (!$im) erreur('Image illisible.');
        $w = imagesx($im); $h = imagesy($im); $max = 2400;
        if (max($w, $h) > $max) {
            $k = $max / max($w, $h);
            $im2 = imagecreatetruecolor((int)round($w * $k), (int)round($h * $k));
            imagealphablending($im2, false); imagesavealpha($im2, true);
            imagecopyresampled($im2, $im, 0, 0, 0, 0, imagesx($im2), imagesy($im2), $w, $h);
            imagedestroy($im); $im = $im2;
        }
        $ok = $ext === 'png' ? imagepng($im, $cible, 7) : ($ext === 'webp' && function_exists('imagewebp') ? imagewebp($im, $cible, 86) : imagejpeg($im, $cible, 86));
        imagedestroy($im);
        if (!$ok) erreur('Enregistrement de l’image impossible.', 500);
    } elseif (!move_uploaded_file($f['tmp_name'], $cible)) erreur('Enregistrement du fichier impossible.', 500);
    @chmod($cible, 0644);
    if (!in_array($ext, ['pdf', 'mp4', 'webm', 'mov'], true)) miniature($cible, "$IMAGES/_mini/$rel/" . preg_replace('/\.[A-Za-z0-9]{2,4}$/', '', $nom) . '.jpg');
    repondre(['ok' => true, 'chemin' => "$rel/$nom", 'pdf' => $ext === 'pdf', 'video' => in_array($ext, ['mp4', 'webm', 'mov'], true)]);

default:
    erreur('Action inconnue.', 404);
}
