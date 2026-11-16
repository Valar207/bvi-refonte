/* =========================================================
   B-VI — contenu du site (FR / EN / IT)
   Tout le contenu est ici : dossiers, images, titres, textes.

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

const S = "signalétique/";
const LDF = S + "Musée Louis de Funès/";

/* Titres d'images qui reviennent souvent (toujours en français) */
const t_affiche1 = "affiche 1";
const t_affiche2 = "affiche 2";
const t_cartels = "cartels";
const t_plan = "plan-guide";
const t_charte = "charte";
const t_bourget = "affiche Bourget";
const t_combi = "combi";
const t_prez = "prez";
const t_site = "site";
const t_edition = "édition";
const t_inter = "intérieur";
const t_kids = "parcours enfants";
const t_serigra = T("Sérigraphie sur la combinaison.", "Screen print on the jumpsuit.", "Serigrafia sulla tuta.");

const SITE = [
  {
    name: "expos & musées",
    desc: T(
      "Signalétique, scénographie, identité visuelle, édition et illustration pour différents musées. 2019 – 2025",
      "Signage, scenography, visual identity, publishing and illustration for various museums. 2019 – 2025",
      "Segnaletica, scenografia, identità visiva, editoria e illustrazione per diversi musei. 2019 – 2025"
    ),
    children: [
      {
        name: "Centre Pompidou",
        desc: T(
          "Signalétique d'exposition, mise en page des titres et des cartels, textes muraux pour le Centre Pompidou, pour le compte d'Œil de Lynx. 2022 – aujourd'hui",
          "Exhibition signage, layout of titles and labels, and wall texts for the Centre Pompidou, on behalf of Œil de Lynx. 2022 – present",
          "Segnaletica espositiva, impaginazione di titoli e didascalie, testi murali per il Centre Pompidou, per conto di Œil de Lynx. 2022 – oggi"
        ),
        items: Array.from({ length: 11 }, (_, i) => ({
          src: img(`${S}Centre Pompidou/Sign_Pompidou_${String(i + 1).padStart(2, "0")}.jpg`),
        })),
      },
      {
        name: "Collection automobile du Prince de Monaco",
        desc: T(
          "Panneaux et bandeaux de cartels le long du parcours de visite de la Collection automobile du Prince de Monaco, pour le compte de Téra-création. 2022",
          "Panels and label strips along the visitor route of the Prince of Monaco's Car Collection, on behalf of Téra-création. 2022",
          "Pannelli e fasce di didascalie lungo il percorso di visita della Collezione automobilistica del Principe di Monaco, per conto di Téra-création. 2022"
        ),
        items: Array.from({ length: 5 }, (_, i) => ({
          src: img(`${S}Collec auto Monaco/Signaletique_Monaco_0${i + 1}.jpg`),
        })),
      },
      {
        name: "Musée d'Amiens",
        desc: T(
          "Affiches, plan-guide, brochures et cartels pour le Musée de Picardie à Amiens, pour le compte de Téra-création. 2020",
          "Posters, visitor map, brochures and labels for the Musée de Picardie in Amiens, on behalf of Téra-création. 2020",
          "Manifesti, pianta-guida, brochure e didascalie per il Musée de Picardie ad Amiens, per conto di Téra-création. 2020"
        ),
        items: [
          { src: img(`${S}Musée d_Amiens/Affiche-reouverture.jpg`), title: t_affiche1 },
          { src: img(`${S}Musée d_Amiens/Affiche-reouverture2.jpg`), title: t_affiche2 },
          { src: img(`${S}Musée d_Amiens/DSC_0381.jpg`), title: "éditions" },
          { src: img(`${S}Musée d_Amiens/MdP 8.jpg`), title: "brochures" },
          { src: img(`${S}Musée d_Amiens/MdP 6.jpg`), title: t_plan },
          { src: img(`${S}Musée d_Amiens/MdP 7.jpg`), title: t_plan },
          { src: img(`${S}Musée d_Amiens/DSC_0172.JPG`), title: t_cartels },
          { src: img(`${S}Musée d_Amiens/IMG_6550.JPG`), title: t_cartels },
          { src: img(`${S}Musée d_Amiens/MdP 13.JPG`), title: t_cartels, desc: T("Moi, avec les cartels.", "Me, with the labels.", "Io, con le didascalie.") },
          { src: img(`${S}Musée d_Amiens/MdP 14 (1).jpg`), title: t_cartels },
        ],
      },
      {
        name: "Musée d'Épernay",
        desc: T(
          "Illustrations d'une mascotte et parcours de questions-réponses sur le champagne et l'histoire de la région pour le musée d'Épernay, pour le compte de Téra-création. 2019",
          "Mascot illustrations and a question-and-answer trail about champagne and the history of the region for the Épernay museum, on behalf of Téra-création. 2019",
          "Illustrazioni di una mascotte e percorso di domande e risposte sullo champagne e sulla storia della regione per il museo di Épernay, per conto di Téra-création. 2019"
        ),
        items: [
          { src: img(`${S}Musée d_Epernay/IMG_0430.JPG`), title: "QR fermé" },
          { src: img(`${S}Musée d_Epernay/IMG_0429.JPG`), title: "QR ouvert" },
          { src: img(`${S}Musée d_Epernay/IMG_6668.jpg`), title: "plaques" },
          { src: img(`${S}Musée d_Epernay/Plan de travail 1 copie 9.png`), title: "romains" },
          { src: img(`${S}Musée d_Epernay/Plan de travail 1 copie 11.png`), title: "bain" },
          { src: img(`${S}Musée d_Epernay/Plan de travail 1v copie 15.png`), title: "bulles" },
          { src: img(`${S}Musée d_Epernay/Plan de travail 1v.png`), title: "silex" },
          { src: img(`${S}Musée d_Epernay/QR-planche.png`), title: "tout" },
          { src: img(`${S}Musée d_Epernay/epernay-cartels-planche.jpg`), title: t_cartels },
        ],
      },
      {
        name: "Musée de La Poste",
        desc: T(
          "Affiches de la campagne de réouverture du Musée de La Poste à Paris, pour le compte de Téra-création. 2019",
          "Posters for the reopening campaign of the Musée de La Poste in Paris, on behalf of Téra-création. 2019",
          "Manifesti della campagna di riapertura del Musée de La Poste a Parigi, per conto di Téra-création. 2019"
        ),
        items: [
          { src: img(`${S}Musée de La Poste/affiche-reouverture.jpg`), title: t_affiche1 },
          { src: img(`${S}Musée de La Poste/affiche-reouverture-totem.jpg`), title: t_affiche2 },
          { src: img(`${S}Musée de La Poste/20191119_190749.jpg`), title: "métro" },
          { src: img(`${S}Musée de La Poste/IMG_0025.JPG`), title: "papèterie" },
        ],
      },
      {
        name: "Musée des égouts de Paris",
        desc: T(
          "Signalétique, panneaux et schémas techniques pour le Musée des égouts de Paris, pour le compte de Téra-création. 2019 – 2021",
          "Signage, panels and technical diagrams for the Paris Sewer Museum, on behalf of Téra-création. 2019 – 2021",
          "Segnaletica, pannelli e schemi tecnici per il Museo delle fognature di Parigi, per conto di Téra-création. 2019 – 2021"
        ),
        items: ["20210924_141654", "20210924_142857", "20210924_142936", "20210924_143513", "IMG_9248", "IMG_9257"].map((f) => ({
          src: img(`${S}Musée des égouts de Paris/${f}`),
        })),
      },
      {
        name: "Musée Louis de Funès",
        desc: T(
          "Signalétique, scénographie, graphisme et éditions pour quatre expositions du Musée Louis de Funès à Saint-Raphaël : la gastronomie (2022), Chaplin (2023), La Grande Vadrouille (2024) et Les mondes fantastiques (2025).",
          "Signage, scenography, graphic design and publications for four exhibitions at the Louis de Funès Museum in Saint-Raphaël: gastronomy (2022), Chaplin (2023), La Grande Vadrouille (2024) and Fantastic Worlds (2025).",
          "Segnaletica, scenografia, grafica e pubblicazioni per quattro mostre del Museo Louis de Funès a Saint-Raphaël: la gastronomia (2022), Chaplin (2023), La Grande Vadrouille (2024) e I mondi fantastici (2025)."
        ),
        children: [
          {
            name: "Expo Gastro",
            desc: T("Exposition sur la gastronomie. 2022", "Exhibition about gastronomy. 2022", "Mostra sulla gastronomia. 2022"),
            items: [
              { src: img(LDF + "Sign_LDF_02.jpg"), title: "Expo Gastro" },
              { src: img(LDF + "Sign_LDF_03.jpg"), title: "Expo Gastro" },
              { src: img(LDF + "Sign_LDF_04.jpg"), title: "Expo Gastro" },
              { src: img(LDF + "recettes-vrac.jpg"), title: "recettes" },
              { src: img(LDF + "LDF_Glaude_1080px"), title: "Le Glaude" },
              { src: img(LDF + "LDF_Denree_1080px"), title: "La Denrée" },
            ],
          },
          {
            name: "Expo Chaplin",
            desc: T("Exposition Louis de Funès et Chaplin. 2023", "Louis de Funès and Chaplin exhibition. 2023", "Mostra Louis de Funès e Chaplin. 2023"),
            items: [
              { src: img(LDF + "Sign_LDF_05.jpg"), title: "Expo Chaplin" },
              { src: img(LDF + "Sign_LDF_06.jpg"), title: "Expo Chaplin" },
              { src: img(LDF + "Sign_LDF_07.jpg"), title: "Expo Chaplin" },
              { src: img(LDF + "Sign_LDF_08.jpg"), title: "Expo Chaplin" },
              { src: img(LDF + "LDFCHAP_silhouettes_1080px.png"), title: "silhouettes" },
              { src: img(LDF + "LDFCHAP_fresque_foule_1080px.png"), title: "foules" },
              { src: img(LDF + "LDFCHAP-livret-spreads.jpg"), title: t_kids },
            ],
          },
          {
            name: "Expo Grande Vadrouille",
            desc: T("Exposition La Grande Vadrouille. 2024", "La Grande Vadrouille exhibition. 2024", "Mostra La Grande Vadrouille. 2024"),
            items: [
              { src: img(LDF + "Sign_LDF_09.jpg"), title: "Expo Grande Vadrouille" },
              { src: img(LDF + "Sign_LDF_10.jpg"), title: "Expo Grande Vadrouille" },
              { src: img(LDF + "Sign_LDF_11.jpg"), title: "Expo Grande Vadrouille" },
              { src: img(LDF + "Sign_LDF_12.jpg"), title: "fresque" },
              { src: img(LDF + "Sign_LDF_13.jpg"), title: t_kids },
            ],
          },
          {
            name: "Expo Les mondes fantastiques",
            desc: T("Exposition Les mondes fantastiques. 2025", "Fantastic Worlds exhibition. 2025", "Mostra I mondi fantastici. 2025"),
            items: [14, 15, 16].map((n) => ({
              src: img(LDF + `Sign_LDF_${n}.jpg`),
              title: "Les mondes fantastiques",
            })),
          },
        ],
      },
      {
        name: "Notre-Dame du Raincy",
        desc: T(
          "Graphisme de l'exposition du centenaire de l'église Notre-Dame du Raincy. 2023",
          "Graphic design for the centenary exhibition of the Notre-Dame du Raincy church. 2023",
          "Grafica della mostra per il centenario della chiesa di Notre-Dame du Raincy. 2023"
        ),
        items: Array.from({ length: 7 }, (_, i) => ({
          src: img(`${S}Notre-Dame du Raincy/Sign_NDR_0${i + 1}.jpg`),
        })),
      },
    ],
  },

  {
    name: "identité",
    children: [
      {
        name: "kewb",
        desc: T(
          "KEWB est une police développée pour moi-même depuis plusieurs années, mais que j’ai eu par la suite l’occasion d’utiliser dans le cadre de projets. Très caractéristique, elle est basée sur une simple grille de 3 par 3. Le concept fondamental est l’aspect ludique de la police. Chaque lettre est conçue comme un module, elles sont faites pour s’empiler, s’imbriquer, se construire les unes avec les autres, pour remplir l’espace en deux ou en trois dimensions. 2014 – 2016",
          "KEWB is a typeface I have been developing for myself for several years, and which I later had the chance to use in projects. Very distinctive, it is based on a simple 3 by 3 grid. The core idea is playfulness. Each letter is designed as a module: they are made to stack, interlock and build on one another, filling space in two or three dimensions. 2014 – 2016",
          "KEWB è un carattere tipografico che sviluppo per me stesso da diversi anni e che in seguito ho avuto occasione di usare in alcuni progetti. Molto riconoscibile, si basa su una semplice griglia 3 per 3. Il concetto di fondo è l'aspetto ludico. Ogni lettera è pensata come un modulo: sono fatte per impilarsi, incastrarsi e costruirsi le une con le altre, riempiendo lo spazio in due o tre dimensioni. 2014 – 2016"
        ),
        items: [
          { src: img("identité/kewb/KEWB.png"), title: "KEWB" },
          { src: img("identité/kewb/specimen.png"), title: "specimen" },
          { src: img("identité/kewb/affiche 3.jpg"), title: "ToysRUs", desc: T("2016", "2016", "2016") },
          { src: img("identité/kewb/affiche 2.jpg"), title: "ToysRUs", desc: T("2016", "2016", "2016") },
          {
            src: img("identité/kewb/alphabyrinthe.jpg"),
            title: "alphabyrinthe",
            desc: T("Affiche de l'alphabet disposé en labyrinthe. 2014", "Poster of the alphabet laid out as a labyrinth. 2014", "Manifesto con l'alfabeto disposto a labirinto. 2014"),
          },
        ],
      },
      {
        name: "kosmos",
        desc: T(
          "Projet de diplôme de M2 Design à Intuit Lab Paris. Refonte de l'identité de Roscosmos, qui devient Kosmos, en gardant un K cyrillique en clin d'œil à son héritage. 2019",
          "Master's degree (M2 Design) final project at Intuit Lab Paris. A rebrand of Roscosmos, renamed Kosmos, keeping a Cyrillic K as a nod to its heritage. 2019",
          "Progetto di diploma del Master (M2 Design) all'Intuit Lab di Parigi. Rinnovo dell'identità di Roscosmos, che diventa Kosmos, mantenendo una K cirillica come omaggio alla sua storia. 2019"
        ),
        items: [
          { src: img("identité/kosmos/20190624_135435.jpg"), title: t_charte, desc: T("Charte graphique.", "Brand guidelines.", "Manuale d'identità visiva.") },
          { src: img("identité/kosmos/20190624_135630.jpg"), title: t_charte, desc: T("Page sur la couleur principale de l'identité.", "Page about the identity's main colour.", "Pagina sul colore principale dell'identità.") },
          { src: img("identité/kosmos/20190624_135728.jpg"), title: t_charte, desc: T("Page sur la typographie cyrillique (Soyuz Grotesk, par The Temporary State).", "Page about the Cyrillic typeface (Soyuz Grotesk, by The Temporary State).", "Pagina sul carattere cirillico (Soyuz Grotesk, di The Temporary State).") },
          { src: img("identité/kosmos/20190624_135842.jpg"), title: t_charte, desc: T("Page sur les applications textiles.", "Page about textile applications.", "Pagina sulle applicazioni tessili.") },
          { src: img("identité/kosmos/kosmos-allpages-charte.png"), title: t_charte },
          { src: img("identité/kosmos/affiche.jpg"), title: t_bourget, desc: T("Affiche pour la présentation de Kosmos au salon du Bourget 2021.", "Poster for the presentation of Kosmos at the 2021 Paris Air Show in Le Bourget.", "Manifesto per la presentazione di Kosmos al salone di Le Bourget 2021.") },
          { src: img("identité/kosmos/affiche bus stop.jpg"), title: t_bourget },
          { src: img("identité/kosmos/stand01.jpg"), title: "stand Bourget", desc: T("Le stand Kosmos au salon du Bourget 2021.", "The Kosmos stand at the 2021 Paris Air Show.", "Lo stand Kosmos al salone di Le Bourget 2021.") },
          { src: img("identité/kosmos/depliant-recto-verso.jpg"), title: "flyer" },
          { src: img("identité/kosmos/20190615_175352.jpg"), title: "t-shirt", desc: T("Sérigraphie sur t-shirt.", "Screen print on a t-shirt.", "Serigrafia su t-shirt.") },
          { src: img("identité/kosmos/20190615_171429.jpg"), title: t_combi, desc: t_serigra },
          { src: img("identité/kosmos/20190615_185148.jpg"), title: t_combi, desc: t_serigra },
          { src: img("identité/kosmos/20190624_165855.jpg"), title: "casquette", desc: T("Symbole brodé sur une casquette.", "Symbol embroidered on a cap.", "Simbolo ricamato su un cappellino.") },
          { src: img("identité/kosmos/combis.jpg"), title: "moi", desc: T("Moi, en cosplay de livreur spatial le jour du jury.", "Me, cosplaying as a space courier on jury day.", "Io, in cosplay da corriere spaziale il giorno della discussione.") },
          { src: img("identité/kosmos/4-slides.jpg"), title: t_prez },
          { src: img("identité/kosmos/kosmos-allpages-prez.jpg"), title: t_prez },
          { src: img("identité/kosmos/anim-kosmos.gif"), title: "anim logo" },
        ],
      },
      {
        name: "tempo",
        desc: T(
          "Collaboration avec des étudiants du CELSA Sorbonne autour d'un concept pour faciliter l'attente à l'hôpital : un système de gestion du temps et un espace de détente. Communication : identité, site, dépliant et dossier de presse. 2018",
          "Collaboration with CELSA Sorbonne students on a concept to make waiting at the hospital easier: a time-management system and a relaxation area. Communication: identity, website, leaflet and press kit. 2018",
          "Collaborazione con studenti del CELSA Sorbonne su un progetto per rendere più semplice l'attesa in ospedale: un sistema di gestione del tempo e uno spazio di relax. Comunicazione: identità, sito, pieghevole e cartella stampa. 2018"
        ),
        items: [
          ...["185254", "185304", "185317"].map((n) => ({ src: img(`identité/tempo/20180124_${n} - Copie.jpg`), title: "flyer" })),
          ...["site1.png", "site3.png", "site5.png"].map((f) => ({ src: img("identité/tempo/" + f), title: t_site })),
          ...["06", "07", "08"].map((n) => ({ src: img(`identité/tempo/tempo-${n}.jpg`), title: t_edition })),
        ],
      },
    ],
  },

  {
    name: "illustration",
    items: [
      {
        src: img("illustration/actua-illu_4.jpg"),
        title: "Actua",
        desc: T("Illustration pour le magazine Actua, pour l'agence Mouvement Up (Groupe SOS).", "Illustration for Actua magazine, for the Mouvement Up agency (Groupe SOS).", "Illustrazione per la rivista Actua, per l'agenzia Mouvement Up (Groupe SOS)."),
      },
      {
        src: img("illustration/bbmix_mockup.jpg"),
        title: "BBMIX",
        desc: T("Illustration et affiche pour le festival BBMIX.", "Illustration and poster for the BBMIX festival.", "Illustrazione e manifesto per il festival BBMIX."),
      },
      {
        src: img("illustration/chatrusse.jpg"),
        title: "minou",
        desc: T("Carnet de dessins.", "Sketchbook.", "Taccuino di disegni."),
      },
      {
        src: img("illustration/compo1.jpg"),
        title: "jurassique",
        desc: T(
          "Workshop pour lequel il était demandé \"d'illustrer sans le montrer\". J'ai fait le choix de parler du changement et donc pour cela de mettre côte à côte l'état \"avant\" et \"après\". Et j'ai pris comme sujets des dinosaures parce que c'est cool. 2015",
          "A workshop where the brief was \"illustrate without showing it\". I chose to talk about change, so I put the \"before\" and \"after\" states side by side. And I picked dinosaurs as subjects because they're cool. 2015",
          "Un workshop in cui si chiedeva di \"illustrare senza mostrare\". Ho scelto di parlare del cambiamento, mettendo fianco a fianco lo stato \"prima\" e \"dopo\". E come soggetti ho preso i dinosauri, perché sono fighi. 2015"
        ),
      },
      {
        src: img("illustration/fille_final2.jpg"),
        title: "Savanfou - fille",
        desc: T("Extrait d'un jeu des 7 familles sur une famille de savants fous : la fille. 2015", "From a Happy Families card game about a family of mad scientists: the daughter. 2015", "Da un gioco di carte delle famiglie su una famiglia di scienziati pazzi: la figlia. 2015"),
      },
      {
        src: img("illustration/pere_final2.jpg"),
        title: "Savanfou - père",
        desc: T("Extrait d'un jeu des 7 familles sur une famille de savants fous : le père. 2015", "From a Happy Families card game about a family of mad scientists: the father. 2015", "Da un gioco di carte delle famiglie su una famiglia di scienziati pazzi: il padre. 2015"),
      },
      {
        src: img("illustration/punk.jpg"),
        title: "Bagarre Molle - Punk",
        desc: T(
          "Mise en image de la chanson \"Bagarre Molle\" de Flavien Berger, un texte cyberpunk parlant de pizza et de néons. 2016",
          "Visuals for the song \"Bagarre Molle\" by Flavien Berger, a cyberpunk text about pizza and neon lights. 2016",
          "Immagini per la canzone \"Bagarre Molle\" di Flavien Berger, un testo cyberpunk che parla di pizza e di neon. 2016"
        ),
      },
    ],
  },

  {
    name: "print",
    children: [
      {
        name: "apesanteur",
        desc: T(
          "Anthologie de textes de science-fiction sur l'espace, avec des jeux typographiques. 2016",
          "An anthology of science-fiction texts about space, with typographic play. 2016",
          "Antologia di testi di fantascienza sullo spazio, con giochi tipografici. 2016"
        ),
        items: [
          { src: img("print/apesanteur/cover.jpg"), title: "couverture" },
          { src: img("print/apesanteur/int 01 (1).jpg"), title: t_inter },
          { src: img("print/apesanteur/int 02.jpg"), title: t_inter },
        ],
      },
      {
        name: "apocryphe",
        desc: T(
          "Livre fait main lors d'un workshop encadré par Kiösk, construit à partir d'images du Rijksmuseum autour des quatre Évangiles. 2018",
          "A handmade book from a workshop led by Kiösk, built from Rijksmuseum images around the four Gospels. 2018",
          "Libro fatto a mano durante un workshop guidato da Kiösk, costruito con immagini del Rijksmuseum attorno ai quattro Vangeli. 2018"
        ),
        items: [
          { src: img("print/apocryphe/IMG_6228.JPG"), title: "page titre" },
          ...["IMG_6239.jpg", "IMG_6255.jpg", "IMG_6264.jpg", "SKM_C30818020820390.jpg", "SKM_C30818020820410.jpg", "SKM_C30818020820411.jpg"].map((f) => ({ src: img("print/apocryphe/" + f) })),
          { src: img("print/apocryphe/SKM_C30818020820420.jpg"), title: "planche" },
        ],
      },
      {
        name: "giga-soirée",
        desc: T(
          "Le récit, façon carnet de bord, d'une soirée bien arrosée, reconstitué à partir des messages envoyés après coup. 2018",
          "A logbook-style account of a boozy night out, pieced together from the messages sent afterwards. 2018",
          "Il racconto, in stile diario di bordo, di una serata molto alcolica, ricostruito a partire dai messaggi inviati dopo. 2018"
        ),
        items: [
          { src: img("print/giga-soirée/mockup_couv.jpg"), title: "couv et 4e" },
          { src: img("print/giga-soirée/mockup_interieur.jpg"), title: t_inter },
          { src: img("print/giga-soirée/mockup_interieur-2.jpg"), title: t_inter },
        ],
      },
      {
        name: "GPNK",
        desc: T(
          "GPNK est le consumer magazine pour la marque de Gosha Rubchinskiy, un photographe et créateur de mode russe. L’objectif de ce magazine est de décrire et de comprendre l’intérêt naissant chez les occidentaux pour les pays de l’Est et la Russie en particulier ; de saisir le mode de vie et d’expression si particuliers de cette génération post-soviétique qui tente de s’en sortir. 2016",
          "GPNK is the consumer magazine for the brand of Gosha Rubchinskiy, a Russian photographer and fashion designer. The magazine sets out to describe and understand the growing Western interest in Eastern Europe, and Russia in particular, and to capture the unique way of life and expression of a post-Soviet generation trying to get by. 2016",
          "GPNK è il consumer magazine del marchio di Gosha Rubchinskiy, fotografo e stilista russo. L'obiettivo della rivista è descrivere e capire il nascente interesse degli occidentali per l'Europa dell'Est e in particolare per la Russia, e cogliere lo stile di vita e di espressione così particolare di questa generazione post-sovietica che cerca di farcela. 2016"
        ),
        items: ["couv.jpg", "02.jpg", "03.jpg", "04.jpg", "08.jpg", "09.jpg", "4e-couv.jpg"].map((f) => ({ src: img("print/GPNK/" + f) })),
      },
      {
        name: "poster",
        desc: T("Série d'affiches. 2013 – 2019", "A series of posters. 2013 – 2019", "Una serie di manifesti. 2013 – 2019"),
        items: [
          { src: img("print/poster/LabPan_SaulBass.jpg"), title: "Pan", desc: T("\"Le Labyrinthe de Pan\" à la manière de Saul Bass. 2013", "\"Pan's Labyrinth\" in the style of Saul Bass. 2013", "\"Il labirinto del fauno\" alla maniera di Saul Bass. 2013") },
          { src: img("print/poster/1969small.jpg"), title: "DéFAKE 1", desc: T("Affiche pour une campagne contre les fake news. 2017", "Poster for a campaign against fake news. 2017", "Manifesto per una campagna contro le fake news. 2017") },
          { src: img("print/poster/Poster_V2.png"), title: "Synthzilla", desc: T("Proposition d'affiche pour le festival Synthzilla.", "Poster proposal for the Synthzilla festival.", "Proposta di manifesto per il festival Synthzilla.") },
          { src: img("print/poster/afficha ultima new.jpg"), title: "Carambolage", desc: T("Affiche sur l'évolution de la forme. 2017", "A poster about the evolution of form. 2017", "Manifesto sull'evoluzione della forma. 2017") },
          { src: img("print/poster/eucalyptus-print-small.jpg"), title: "Valda menthe", desc: T("Maquette d'affiche pour les pastilles Valda, réalisée chez SuperCafard. 2019", "Poster mock-up for Valda lozenges, made at SuperCafard. 2019", "Bozza di manifesto per le pastiglie Valda, realizzata da SuperCafard. 2019") },
          { src: img("print/poster/poster-infime-volume.jpg"), title: "Infime", desc: T("Concept d'affiche pour la gamme de soins Infime, réalisé chez SuperCafard. 2019", "Poster concept for the Infime skincare range, made at SuperCafard. 2019", "Concept di manifesto per la linea di cosmetici Infime, realizzato da SuperCafard. 2019") },
        ],
      },
    ],
  },

  {
    name: "web",
    children: [
      {
        name: "b-vi.fr",
        desc: T("La version précédente de ce site. 2018 – 2021", "The previous version of this website. 2018 – 2021", "La versione precedente di questo sito. 2018 – 2021"),
        items: [
          { src: img("web/b-vi.fr/b-vi.fr.jpg"), title: "fenêtres" },
          { src: img("web/b-vi.fr/old_01.jpg"), title: "bureau" },
        ],
      },
      {
        name: "havana-club",
        desc: T(
          "Webdesign et maquettes du site international de Havana Club, réalisés chez SuperCafard. 2020",
          "Web design and mock-ups for Havana Club's international website, made at SuperCafard. 2020",
          "Web design e mock-up del sito internazionale di Havana Club, realizzati da SuperCafard. 2020"
        ),
        items: [
          ["01-main", "mainpage"], ["02-menu", "menu"], ["03-cocktails", "cocktails"],
          ["04-event-collab", "events"], ["05-projects", "projects"], ["06-products", "products"],
        ].map(([f, t]) => ({ src: img(`web/havana-club/havanaclub_fin_screen-${f}.jpg`), title: t })),
      },
    ],
  },
];

const CONTACT = {
  name: "contact & cv",
  lines: [
    { big: T("Lucas Bessis", "Lucas Bessis", "Lucas Bessis") },
    { big: T("Graphisme — Direction artistique", "Graphic design — Art direction", "Grafica — Direzione artistica") },
    { big: T("Paris, France", "Paris, France", "Parigi, Francia") },
    { gap: true },
    { big: T("mail : ", "email: ", "email: "), link: "contact@b-vi.fr", href: "mailto:contact@b-vi.fr" },
    { big: T("instagram : ", "instagram: ", "instagram: "), link: "@l.bvi", href: "https://www.instagram.com/l.bvi/" },
    { big: T("CV : ", "CV: ", "CV: "), link: T("télécharger", "download", "scarica"), href: IMG_BASE.replace(/images\/$/, "") + "images/CV_Lucas-Bessis_2025_FR-EN-IT" },
    { big: T("---", "---", "---") },
    { small: T("Webdesign par Lucas Bessis", "Webdesign by Lucas Bessis", "Webdesign di Lucas Bessis") },
    { small: T("Développé par Valentin Rossi : ", "Developed by Valentin Rossi: ", "Sviluppato da Valentin Rossi: "), links: [["GitHub", "https://github.com/Valar207"], ["Linkedin", "https://www.linkedin.com/in/valentin-rossi-8a5639a6/"]] },
    { small: T("Typographie : 'Px Grotesk Screen' par ", "Typeface: 'Px Grotesk Screen' by ", "Carattere: 'Px Grotesk Screen' di "), links: [["Optimo", "https://optimo.ch/"]] },
  ],
};

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
