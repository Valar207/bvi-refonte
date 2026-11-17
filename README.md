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
Écran de démarrage, icônes qui arrivent en cascade, fenêtres qui s'ouvrent depuis l'icône et se réduisent dans la barre des tâches, inclinaison pendant le glisser, plein écran animé, miniatures en cascade, texte tapé à la machine, visionneuse avec glissement, swipe et compteur, halo qui suit la souris, grain animé, économiseur d'écran B6 après 90 s (sur ordinateur il rebondit tout seul ; sur téléphone il obéit à la gravité et aux secousses via les capteurs de mouvement — sur iPhone, la première touche sur l'écran de veille demande l'autorisation ; calibrage automatique du sens des mesures iOS/Android avec l'inclinaison), Konami code, et un easter egg : taper « lucasbessis » sur le clavier déclenche une explosion en pixel art suivie de 3 danseuses en maillot de bain (≈ 1 min, avec le clip officiel de « Never Gonna Give You Up » intégré depuis YouTube dans une petite fenêtre « never_gonna.exe » — intégration autorisée, la chanson n'est pas hébergée sur le site ; clic ou Échap pour arrêter ; fonction `boom()` dans app.js, dessin sur un petit canvas agrandi sans lissage). Tout est coupé si l'utilisateur a demandé moins d'animations.

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

## Icône « admin » sur le bureau
En bas à droite du bureau (règle `.folder.admin-icon`, plus forte que `.folder { position: relative }`), un cadenas « admin » mène à `/admin/`, **uniquement pour Lucas connecté**. À la connexion, l'administration pose un repère `bvi-admin` dans le `localStorage` du navigateur (retiré à la déconnexion ou à l'expiration de la session). Le site ne fait la vérification auprès du serveur (`/admin/api.php?a=etat`) que si ce repère existe : un visiteur normal n'envoie aucune requête et ne voit rien. Icône : `assets/admin.png` (pixel art, même trait blanc que les autres).

## Liens directs et aperçus de partage
- Chaque dossier a son adresse : `b-vi.fr/projet/<rubrique>/<dossier>` (ex. `/projet/identite/kosmos`), et `/projet/identite/kosmos/3` ouvre aussi la 3e image. `/projet/kosmos` marche aussi, comme `b-vi.fr/#identite/kosmos`. L'adresse dans la barre du navigateur suit ce qui est ouvert : il suffit de la copier pour partager.
- Les adresses sont calculées à partir des noms (minuscules, sans accents, tirets) : `slug()` dans `app.js` et `slug_bvi()` dans `projet-lib.php` doivent rester identiques. Renommer un dossier dans l'administration change donc son adresse.
- `page.php` sert la page d'accueil et les `/projet/...` : il renvoie `index.html` avec le titre, la description et l'image du projet (Open Graph / Twitter, pour WhatsApp, LinkedIn, Instagram…), l'adresse canonique et une version texte du contenu pour Google (`.seo`, hors écran). En cas de souci, il renvoie `index.html` tel quel. Adresse inconnue → 404.
- `sitemap.php` répond sur `/sitemap.xml` (toujours à jour avec le contenu publié), `robots.txt` le déclare et exclut `/admin/`.
- `.htaccess` : `DirectoryIndex page.php index.php index.html`, réécritures vers page.php / sitemap.php. Le script ne doit PAS s'appeler projet.php : MultiViews (actif chez OVH, et nécessaire car certaines images sont référencées sans extension) enverrait /projet/... directement dessus. Ne pas couper MultiViews. `index.html` a `<base href="/">` pour que les fichiers se chargent depuis n'importe quelle adresse.

## Miniatures
Les vignettes des fenêtres chargent des miniatures légères : `images/_mini/<chemin de l'image sans extension>.jpg` (240 px de haut max, JPEG). Elles sont créées automatiquement quand Lucas envoie une photo par l'administration (`miniature()` dans `admin/lib.php`, avec GD). Si une miniature manque, le site affiche l'image en grand à la place. Les 146 miniatures des images existantes ont été générées le 2026-11-17 (34 Mo d'originaux → 1,9 Mo).

## Vidéos
Un élément d'un dossier peut être une vidéo : `{ video: "https://youtu.be/…" | "https://vimeo.com/…" | "@images/videos/…/x.mp4", title, desc, poster?, src? }`. Dans l'administration : « Ajouter la vidéo » (lien YouTube ou Vimeo ; pour Vimeo, l'image et le titre sont récupérés automatiquement) ou « Envoyer un fichier vidéo » (MP4/WebM/MOV, 300 Mo max, rangé dans `images/videos/`). Sur le site (`prepVideo()` dans data.js) : vignette avec ▶ (image YouTube/Vimeo, ou première image du fichier), lecture dans la visionneuse en 16:9 (YouTube sans cookies, Vimeo sans suivi), son coupé à la fermeture ou au passage à l'image suivante.

## Statistiques
Mesure d'audience maison, anonyme et sans cookie (pas de bandeau de consentement nécessaire) : `stats.php` reçoit une visite par onglet (avec le site d'où l'on vient) et chaque dossier ouvert (une fois par onglet), envoyés par `mesurer()` dans app.js avec `navigator.sendBeacon`. Les robots et aperçus de liens sont ignorés, et les visites de Lucas connecté à l'admin ne sont pas comptées. Seuls des compteurs sont gardés (jour, dossier, source, téléphone/ordinateur), dans `bvi-admin/data/prod/stats/AAAA-MM.json`. Lecture : bouton « Statistiques » de l'administration (30 jours ou 12 mois).

## Badge « nouveau »
Dans l'administration, chaque dossier a une case « Afficher le badge nouveau » (`nouveau: true` dans le contenu). Sur le site, une étiquette « nouveau / new / nuovo » s'affiche sur l'icône du dossier (bureau et fenêtres), et un petit carré blanc sur les dossiers qui en contiennent un (`badgeNouveau()` dans app.js).

## Clic droit, sons, icônes déplaçables, jeux
- **Clic droit sur le bureau** : menu rétro (`ouvrirMenu()` dans app.js) — Actualiser (rejoue l'arrivée des icônes), Fond d'écran (couleurs qui changent / noir / damier / grille de points, mémorisé dans le navigateur), Ranger les icônes, Sons activés/coupés, À propos de B6 (petite fenêtre avec le logo qui tourne). Sur téléphone (iPhone compris) : rester appuyé une demi-seconde sur un endroit vide du bureau ouvre le même menu (le clic envoyé en levant le doigt est ignoré, le sous-menu s'ouvre au toucher en dessous).
- **Sons système** : bips 8 bits synthétisés avec Web Audio (aucun fichier) à l'ouverture, la fermeture, la réduction, au clic, dans les jeux. Coupés par défaut ; bouton haut-parleur dans la barre des tâches (`son()`, `basculerSons()`), choix mémorisé.
- **Icônes déplaçables** (souris uniquement) : glisser une icône du bureau la déplace, aimantée sur une grille de 8 px ; positions mémorisées dans le navigateur (`bvi-icones`, en proportion de l'écran), « Ranger les icônes » remet tout en place. Le clic qui suit un glisser n'ouvre pas le dossier.
- **Jeux** : icône « jeux » sur le bureau (nœud `JEUX` dans app.js, pas dans le contenu de l'administration) avec un démineur (4 niveaux : facile 9 × 9 / 10 mines, moyen 12 × 12 / 22, difficile 16 × 16 / 40, extrême 16 × 30 / 99 — mis en hauteur sur téléphone ; niveau mémorisé ; cases de 18 à 30 px selon la place ; premier clic jamais sur une mine, clic droit ou appui long = drapeau, clic sur un chiffre : s'il reste exactement autant de cases cachées que sa valeur, des drapeaux y sont posés ; s'il est déjà entouré d'autant de drapeaux, les autres cases autour sont découvertes (`accord()`), logo B6 pour rejouer) et un snake (les murs ne tuent pas : on ressort de l'autre côté, seul le corps est mortel ; flèches/ZQSD, glisser du doigt ou croix à l'écran sur téléphone, la pomme est le logo B6, le serpent prend la couleur du fond, record mémorisé). Liens directs : `/projet/jeux/demineur`, `/projet/jeux/snake`.
