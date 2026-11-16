# b-vi.fr — refonte 2026

Même design que b-vi.fr (bureau, dossiers, fenêtres), même contenu, réécrit en HTML/CSS/JS sans dépendances (plus de jQuery ni de Hugo) avec des animations.

## Fichiers
- `index.html` — la page
- `content.js` — **tout le contenu** (dossiers, images, titres, textes, contact). Il est **réécrit par l'administration** (`/admin`) : ne pas le modifier à la main sur le serveur, la version du dépôt n'est qu'un instantané.
- `data.js` — textes de l'interface, langues, et les fonctions `prepDossier` / `prepContact` qui transforment le contenu pour `app.js`.
- `style.css` — le design
- `app.js` — fenêtres, visionneuse, animations
- `assets/` — icônes d'origine + police Px Grotesk Screen

## Mise en ligne
Copier le dossier à la racine de b-vi.fr, à côté du dossier `images/` existant. Les images sont prises sur `/images/...` quand le site tourne sur b-vi.fr, et sur `https://www.b-vi.fr/images/...` ailleurs (aperçu local).

## Animations
Écran de démarrage, icônes qui arrivent en cascade, fenêtres qui s'ouvrent depuis l'icône et se réduisent dans la barre des tâches, inclinaison pendant le glisser, plein écran animé, miniatures en cascade, texte tapé à la machine, visionneuse avec glissement, swipe et compteur, halo qui suit la souris, grain animé, économiseur d'écran B6 après 90 s, Konami code, et un easter egg : taper « lucasbessis » sur le clavier déclenche une explosion en pixel art suivie de 3 danseuses en maillot de bain (≈ 20 s, avec le clip officiel de « Never Gonna Give You Up » intégré depuis YouTube dans une petite fenêtre « never_gonna.exe » — intégration autorisée, la chanson n'est pas hébergée sur le site ; clic ou Échap pour arrêter ; fonction `boom()` dans app.js, dessin sur un petit canvas agrandi sans lissage). Tout est coupé si l'utilisateur a demandé moins d'animations.

## Langues
Boutons FR / EN / IT dans la barre du bas. Le changement se fait sans recharger la page, la langue choisie est mémorisée, et à la première visite le site prend la langue du navigateur (français par défaut).

## Administration (`/admin`)
Lucas met à jour le site sans code ni FTP sur **b-vi.fr/admin** (identifiant `Lucas`) : dossiers, sous-dossiers, photos (envoi par glisser-déposer, réduites automatiquement à 2400 px), titres, descriptions FR/EN/IT, fenêtre contact, puis « Publier ». Chaque publication garde la version d'avant (bouton « Versions » pour revenir en arrière, 60 versions).

- Code : `admin/index.php` (page), `admin/admin.js` / `admin.css` (interface), `admin/api.php` (actions), `admin/lib.php` (validation, écriture). PHP 7.4+, sans base de données.
- Données privées **hors du web**, dans `bvi-admin/` à côté de `www/` : `auth.php` (identifiant + mot de passe chiffré bcrypt), `data/<instance>/contenu.json` (contenu publié), `data/<instance>/versions/`, `essais.json` (5 essais de connexion ratés → 10 min de blocage). L'instance vaut `prod` pour le site à la racine, `nouveau` pour la copie de test dans `/nouveau/`.
- Les photos envoyées vont dans `images/<rubrique>/<dossier>/` et ne sont jamais écrasées ni supprimées du serveur (« Retirer » les enlève seulement du site).
- `.htaccess` à la racine : `content.js` toujours rechargé (pas de cache).

## Liens dans les textes
Dans les descriptions des dossiers et les légendes de la visionneuse, un lien s'écrit `[texte](https://adresse)` (ou `mailto:`). Sur le site, seul « texte » s'affiche, cliquable (nouvel onglet). Dans l'administration, le bouton « 🔗 Insérer un lien » l'écrit à la place du curseur. Code : `LIEN`, `sansLiens` et `avecLiens` dans `app.js` (la machine à écrire tape le texte simple, puis les liens apparaissent à la fin). Dans la visionneuse, les zones « précédente / suivante » s'arrêtent au-dessus de la légende (`--cap-h`), pour que ses liens restent cliquables.

## Cache
`index.html` charge les fichiers avec `?v=AAAAMMJJHHMM` (à changer à chaque modification de app.js, data.js ou style.css), et `.htaccess` impose `Cache-Control: no-cache` sur index.html, content.js, data.js, app.js et style.css : les visiteurs voient toujours la dernière version.
