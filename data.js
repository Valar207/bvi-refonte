/* =========================================================
   B-VI — contenu du site (FR / EN / IT)
   Textes de l'interface et outils. Le contenu (dossiers, images,
   titres, textes, contact) est dans content.js, géré par /admin.

   Les noms des dossiers et les titres des images restent en français.
   Les descriptions s'écrivent T("français", "english", "italiano").
   Pour corriger une traduction, il suffit de changer le texte
   entre guillemets dans la bonne langue.

   - img(chemin) : chemin relatif à /images/ sur b-vi.fr
   - desc : texte du panneau de droite de la fenêtre
   - items : images de la fenêtre { src, title, desc }
   - children : sous-dossiers
   ========================================================= */

const T = (fr, en, it) => ({ fr, en, it });

// En ligne sur b-vi.fr → chemins relatifs. Ailleurs (aperçu) → images chargées depuis b-vi.fr.
const IMG_BASE = /(^|\.)b-vi\.fr$/.test(location.hostname) ? "/images/" : "https://www.b-vi.fr/images/";
const img = (p) => IMG_BASE + encodeURI(p);

/* Le contenu (dossiers, images, textes, contact) est dans content.js, écrit par l'administration (/admin).
   content.js déclare CONTENU puis appelle ces deux fonctions pour reconstruire SITE et CONTACT. */
const prepDossier = (n) => {
  const o = { ...n };
  if (n.children) o.children = n.children.map(prepDossier);
  // mini : miniature légère (images/_mini/<chemin sans extension>.jpg), créée à l'envoi par l'administration
  if (n.items) o.items = n.items.map((it) => (it.video ? prepVideo(it) : { ...it, src: img(it.src), mini: img("_mini/" + it.src.replace(/\.[A-Za-z0-9]{2,4}$/, "") + ".jpg") }));
  return o;
};
// Vidéo : lien YouTube ou Vimeo, ou fichier envoyé (@images/videos/x.mp4). Vignette : celle de YouTube/Vimeo, ou l'image choisie.
function prepVideo(it) {
  const v = it.video, o = { ...it, isVideo: true };
  let m;
  if ((m = v.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/))) {
    o.embed = `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1`;
    o.poster = it.poster || `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  } else if ((m = v.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
    o.embed = `https://player.vimeo.com/video/${m[1]}?autoplay=1&dnt=1`;
  } else if (v.startsWith("@images/")) {
    o.fichier = img(v.slice(8));
  }
  if (it.src) { o.poster = img(it.src); o.mini = img("_mini/" + it.src.replace(/\.[A-Za-z0-9]{2,4}$/, "") + ".jpg"); }
  o.src = o.poster || "";
  return o;
}

const prepContact = (c) => ({
  ...c,
  lines: c.lines.map((l) => (l.href && l.href.startsWith("@images/") ? { ...l, href: IMG_BASE + encodeURI(l.href.slice(8)) } : { ...l })),
});

/* Textes de l'interface */
const UI = {
  nouveau: T("nouveau", "new", "nuovo"),
  jeux: T("jeux", "games", "giochi"),
  actualiser: T("Actualiser", "Refresh", "Aggiorna"),
  fondEcran: T("Fond d'écran", "Wallpaper", "Sfondo"),
  fonds: { anime: T("Couleurs qui changent", "Shifting colours", "Colori che cambiano"), noir: T("Noir", "Black", "Nero"), damier: T("Damier", "Checkerboard", "Scacchiera"), points: T("Grille de points", "Dot grid", "Griglia di punti") },
  ranger: T("Ranger les icônes", "Tidy up icons", "Riordina le icone"),
  apropos: T("À propos de B6", "About B6", "Informazioni su B6"),
  aproposTexte: [
    T("B-VI · système 6.0", "B-VI · system 6.0", "B-VI · sistema 6.0"),
    T("Lucas Bessis — graphisme & direction artistique, Paris.", "Lucas Bessis — graphic design & art direction, Paris.", "Lucas Bessis — grafica e direzione artistica, Parigi."),
    T("Développé par Valentin Rossi.", "Developed by Valentin Rossi.", "Sviluppato da Valentin Rossi."),
    T("Mémoire : 640 Ko (largement suffisant).", "Memory: 640 KB (plenty).", "Memoria: 640 KB (più che sufficiente)."),
    T("Astuce : essaie de taper « lucasbessis ».", "Tip: try typing “lucasbessis”.", "Suggerimento: prova a digitare « lucasbessis »."),
  ],
  demineur: T("démineur", "minesweeper", "campo minato"),
  niveaux: { facile: T("facile", "easy", "facile"), moyen: T("moyen", "medium", "medio"), difficile: T("difficile", "hard", "difficile"), extreme: T("extrême", "extreme", "estremo") },
  perdu: T("Perdu !", "Game over!", "Hai perso!"),
  gagne: T("Gagné !", "You win!", "Hai vinto!"),
  rejouer: T("Rejouer", "Play again", "Rigioca"),
  snakeAide: T("Flèches ou glisser du doigt pour jouer", "Arrow keys or swipe to play", "Frecce o scorri per giocare"),
  meilleur: T("record", "best", "record"),
  classement: T("classement", "leaderboard", "classifica"),
  tonPseudo: T("Bravo ! Ton pseudo pour le classement :", "Well done! Your name for the leaderboard:", "Bravo! Il tuo nome per la classifica:"),
  valider: T("OK", "OK", "OK"),
  changerPseudo: T("changer de pseudo", "change name", "cambia nome"),
  aucunScore: T("Pas encore de score. À toi de jouer !", "No scores yet. Your turn!", "Ancora nessun punteggio. Tocca a te!"),
  rang: T("Tu es n°", "You're #", "Sei n°"),
  minimize: T("Réduire", "Minimize", "Riduci"),
  fullscreen: T("Plein écran", "Fullscreen", "Schermo intero"),
  close: T("Fermer", "Close", "Chiudi"),
  minimizeAll: T("Tout réduire", "Minimize all", "Riduci tutto"),
  prev: T("Précédente", "Previous", "Precedente"),
  next: T("Suivante", "Next", "Successiva"),
  viewer: T("Visionneuse", "Image viewer", "Visualizzatore"),
  desktop: T("Bureau", "Desktop", "Scrivania"),
  language: T("Langue", "Language", "Lingua"),
  metaDesc: T(
    "Lucas Bessis — Graphisme, Direction artistique. Paris, France.",
    "Lucas Bessis — Graphic design, Art direction. Paris, France.",
    "Lucas Bessis — Grafica, Direzione artistica. Parigi, Francia."
  ),
};

const LANGS = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "it", label: "IT" },
];
