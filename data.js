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
  if (n.items) o.items = n.items.map((it) => ({ ...it, src: img(it.src), mini: img("_mini/" + it.src.replace(/\.[A-Za-z0-9]{2,4}$/, "") + ".jpg") }));
  return o;
};
const prepContact = (c) => ({
  ...c,
  lines: c.lines.map((l) => (l.href && l.href.startsWith("@images/") ? { ...l, href: IMG_BASE + encodeURI(l.href.slice(8)) } : { ...l })),
});

/* Textes de l'interface */
const UI = {
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
