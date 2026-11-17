/* b-vi.fr · administration — interface (sans dépendances)
   Le contenu est édité en mémoire, gardé en brouillon dans le navigateur, et envoyé au serveur avec « Publier ». */
(() => {
  "use strict";
  const API = "api.php";
  const IMG = (p) => "/images/" + encodeURI(p);
  const LANGS = [["fr", "Français"], ["en", "English"], ["it", "Italiano"]];
  const BROUILLON = "bvi-admin-brouillon";

  let csrf = "", user = "", instance = "";
  let C = null;            // contenu en cours d'édition
  let publie = "";         // dernière version publiée (JSON) pour savoir s'il y a des changements
  let sel = { k: "dossier", chemin: [0] };   // chemin = indices dans l'arbre ; ou { k: "contact" }
  const app = document.getElementById("app");

  /* ---------- outils ---------- */
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "text") n.textContent = v;
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c));
    return n;
  };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  async function api(action, corps, form) {
    const opts = { method: corps || form ? "POST" : "GET", headers: { "X-CSRF": csrf }, credentials: "same-origin" };
    if (form) opts.body = form;
    else if (corps) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(corps); }
    let r, d;
    try { r = await fetch(API + "?a=" + action, opts); d = await r.json(); }
    catch (e) { throw new Error("Pas de réponse du serveur. Vérifie ta connexion internet."); }
    if (r.status === 401 && action !== "connexion") { repere(false); sauverBrouillon(); afficherConnexion("Ta session a expiré : reconnecte-toi, tes modifications sont gardées."); throw new Error(""); }
    if (!d.ok) throw new Error(d.erreur || "Erreur inconnue.");
    return d;
  }
  let toastT;
  function toast(msg, err) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    if (!msg) return;
    const t = el("div", { class: "toast" + (err ? " err" : ""), role: "status", text: msg });
    document.body.append(t); clearTimeout(toastT); toastT = setTimeout(() => t.remove(), err ? 6000 : 2800);
  }
  // Texte traduisible : {fr, en, it}, sans les langues vides (le site retombe alors sur le français)
  const tVal = (v, l) => (v == null ? "" : typeof v === "string" ? (l === "fr" ? v : "") : v[l] || "");
  function tSet(obj, key, l, val) {
    let v = obj[key];
    v = v == null ? {} : typeof v === "string" ? { fr: v } : { ...v };
    if (val.trim() === "") delete v[l]; else v[l] = val;
    if (!v.fr && (v.en || v.it)) v.fr = "";
    if (!Object.keys(v).length || Object.values(v).every((x) => x === "")) delete obj[key]; else obj[key] = v;
  }
  function champsLangues(obj, key, { lignes = 3, placeholder = "", liens = false } = {}) {
    return el("div", { class: "langues" }, LANGS.map(([l, nom]) => {
      const ta = el("textarea", { rows: lignes, placeholder: l === "fr" ? placeholder : "Vide = texte français affiché" });
      ta.value = tVal(obj[key], l);
      ta.addEventListener("input", () => { tSet(obj, key, l, ta.value); change(); });
      const lab = el("label", {}, nom, ta);
      return liens ? el("div", { class: "champ-lien" }, lab, outilLien(ta)) : lab;
    }));
  }

  // « Insérer un lien » : ajoute [texte](adresse) à l'endroit du curseur ; sur le site, le texte devient cliquable
  function outilLien(ta) {
    const txt = el("input", { type: "text", placeholder: "Texte affiché (ex. voir le site)" });
    const url = el("input", { type: "text", placeholder: "https://… ou mailto:…", inputmode: "url", autocapitalize: "none" });
    const msg = el("span", { class: "msg err" });
    const form = el("div", { class: "form-lien", hidden: true }, txt, url,
      el("div", { class: "actions-lien" },
        el("button", { class: "b sm pri", type: "button", onclick: () => {
          let u = url.value.trim(); const x = txt.value.trim().replace(/[\[\]]/g, "");
          if (u && !/^(https?:\/\/|mailto:)/i.test(u)) u = (u.includes("@") && !u.includes("/") ? "mailto:" : "https://") + u;
          if (!x || !/^(https?:\/\/|mailto:)[^\s)]+$/i.test(u)) { msg.textContent = "Mets un texte et une adresse valide."; return; }
          const a = ta.selectionStart ?? ta.value.length, b = ta.selectionEnd ?? a;
          const av = ta.value.slice(0, a), ap = ta.value.slice(b);
          const lien = (av && !/\s$/.test(av) ? " " : "") + "[" + x + "](" + u + ")" + (ap && !/^[\s.,;:!?)]/.test(ap) ? " " : "");
          ta.value = av + lien + ap;
          ta.dispatchEvent(new Event("input"));
          txt.value = url.value = msg.textContent = ""; form.hidden = true; ta.focus();
        } }, "Insérer"),
        el("button", { class: "b sm", type: "button", onclick: () => { form.hidden = true; } }, "Annuler"), msg));
    const ouvrir = el("button", { class: "b sm lien-btn", type: "button", onclick: () => {
      form.hidden = !form.hidden;
      if (!form.hidden) { const s = ta.value.slice(ta.selectionStart, ta.selectionEnd); if (s) txt.value = s; (s ? url : txt).focus(); }
    } }, "🔗 Insérer un lien");
    return el("div", {}, ouvrir, form);
  }

  /* ---------- brouillon & état ---------- */
  // repère pour le site : montre l'icône « admin » sur le bureau tant que la session est ouverte
  const repere = (oui) => { try { if (oui) localStorage.setItem("bvi-admin", "1"); else localStorage.removeItem("bvi-admin"); } catch (e) {} };
  function sauverBrouillon() { try { if (C) localStorage.setItem(BROUILLON + instance, JSON.stringify({ base: publie, contenu: C })); } catch (e) {} }
  function effacerBrouillon() { try { localStorage.removeItem(BROUILLON + instance); } catch (e) {} }
  let bT;
  function change() { majBarre(); clearTimeout(bT); bT = setTimeout(sauverBrouillon, 400); }
  const sale = () => C && JSON.stringify(C) !== publie;
  window.addEventListener("beforeunload", (e) => { if (sale()) { sauverBrouillon(); e.preventDefault(); e.returnValue = ""; } });

  /* ---------- connexion ---------- */
  function afficherConnexion(message) {
    const u = el("input", { type: "text", autocomplete: "username", autocapitalize: "none", required: true, value: "Lucas" });
    const p = el("input", { type: "password", autocomplete: "current-password", required: true });
    const msg = el("p", { class: "msg err", role: "alert", text: message || "" });
    const go = el("button", { class: "b pri", type: "submit", text: "Se connecter" });
    const f = el("form", { onsubmit: async (e) => {
      e.preventDefault(); go.disabled = true; msg.textContent = "";
      try {
        const d = await api("connexion", { user: u.value, pass: p.value });
        csrf = d.csrf; user = d.user; await charger();
      } catch (er) { msg.textContent = er.message; go.disabled = false; p.select(); }
    } },
      el("div", { class: "barre", text: "b-vi · administration" }),
      el("div", { class: "corps" }, el("label", {}, "Identifiant", u), el("label", {}, "Mot de passe", p), msg, go));
    app.replaceChildren(el("div", { class: "login" }, f));
    (message ? p : p).focus();
  }

  async function charger() {
    const d = await api("contenu");
    repere(true);
    publie = JSON.stringify(d.contenu);
    C = clone(d.contenu);
    try {
      const b = JSON.parse(localStorage.getItem(BROUILLON + instance) || "null");
      if (b && b.base === publie && JSON.stringify(b.contenu) !== publie) { C = b.contenu; setTimeout(() => toast("Tes modifications non publiées ont été retrouvées."), 300); }
      else if (b && b.base !== publie) effacerBrouillon();   // le site a changé entre-temps : le brouillon n'est plus à jour
    } catch (e) {}
    if (sel.k === "dossier" && !noeud(sel.chemin)) sel = { k: "dossier", chemin: [0] };
    rendu();
  }

  /* ---------- arbre ---------- */
  function noeud(chemin) {
    let n = { children: C.site };
    for (const i of chemin) { n = (n.children || [])[i]; if (!n) return null; }
    return n;
  }
  const parentDe = (chemin) => (chemin.length === 1 ? { children: C.site } : noeud(chemin.slice(0, -1)));
  const nbImages = (n) => (n.items || []).length + (n.children || []).reduce((s, c) => s + nbImages(c), 0);
  function choisir(s) { sel = s; rendu(); window.scrollTo(0, 0); }

  function arbre() {
    const liste = (enfants, base) => el("ul", {}, enfants.map((n, i) => {
      const chemin = [...base, i];
      const actif = sel.k === "dossier" && sel.chemin.join() === chemin.join();
      return el("li", {},
        el("button", { class: "noeud", type: "button", "aria-current": String(actif), onclick: () => choisir({ k: "dossier", chemin }) },
          el("span", { text: (n.children && n.children.length ? "▸ " : "· ") + n.name }), el("span", { class: "n", text: String(nbImages(n)) })),
        n.children && n.children.length ? liste(n.children, chemin) : null);
    }));
    const mobile = window.matchMedia("(max-width: 820px)").matches;
    const courant = sel.k === "contact" ? C.contact.name : (noeud(sel.chemin) || {}).name;
    const contenuArbre = [
      mobile ? null : el("h2", { class: "px", text: "Bureau" }),
      liste(C.site, []),
      el("button", { class: "b sm ajout", type: "button", onclick: () => { C.site.push({ name: "nouvelle rubrique", items: [] }); change(); choisir({ k: "dossier", chemin: [C.site.length - 1] }); } }, "+ Nouvelle rubrique (icône du bureau)"),
      el("div", { class: "sep" }),
      el("button", { class: "noeud", type: "button", "aria-current": String(sel.k === "contact"), onclick: () => choisir({ k: "contact" }) }, el("span", { text: "✉ " + (C.contact.name || "contact") }))];
    // sur téléphone, la liste est repliée pour garder l'éditeur visible
    if (mobile) return el("aside", { class: "arbre" }, el("details", { class: "arbre-mob" }, el("summary", {}, "📁 ", el("b", { text: courant || "Bureau" }), el("span", { class: "vide", text: " · changer de dossier" })), ...contenuArbre));
    return el("aside", { class: "arbre", "aria-label": "Rubriques du site" }, ...contenuArbre);
  }

  /* ---------- rendu général ---------- */
  function rendu() {
    const main = el("main", { class: "edit", id: "edit" });
    if (sel.k === "contact") editeurContact(main); else editeurDossier(main);
    app.replaceChildren(
      el("header", { class: "top" },
        el("h1", { text: "b-vi · admin" }),
        instance !== "prod" ? el("span", { class: "qui", text: "version de test (" + instance + ")" }) : null,
        el("span", { class: "qui", text: user }),
        el("a", { class: "b sm", href: "/?v=" + Date.now(), target: "_blank", rel: "noopener" }, "Voir le site ↗"),
        el("button", { class: "b sm", type: "button", onclick: statistiques }, "Statistiques"),
        el("button", { class: "b sm", type: "button", onclick: versions }, "Versions"),
        el("button", { class: "b sm", type: "button", onclick: deconnexion }, "Déconnexion")),
      el("div", { class: "cadre" }, arbre(), main),
      barrePublier());
    majBarre();
  }

  /* ---------- édition d'un dossier ---------- */
  function deplacer(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return false; [arr[i], arr[j]] = [arr[j], arr[i]]; return true; }

  function editeurDossier(main) {
    const ch = sel.chemin, n = noeud(ch);
    if (!n) { main.append(el("p", { class: "vide", text: "Choisis une rubrique à gauche." })); return; }
    const freres = parentDe(ch).children, idx = ch[ch.length - 1];
    // fil d'Ariane
    const fil = el("div", { class: "fil" }, "Bureau");
    ch.forEach((_, k) => { const c = ch.slice(0, k + 1); fil.append(" › ", k === ch.length - 1 ? noeud(c).name : el("button", { type: "button", onclick: () => choisir({ k: "dossier", chemin: c }) }, noeud(c).name)); });
    const nom = el("input", { type: "text", value: n.name, maxlength: 160 });
    nom.addEventListener("input", () => { n.name = nom.value; change(); const b = document.querySelector('.noeud[aria-current="true"] span'); if (b) b.textContent = (n.children && n.children.length ? "▸ " : "· ") + n.name; });
    const supp = boutonConfirme("Supprimer ce dossier", "Confirmer la suppression", () => {
      freres.splice(idx, 1); change();
      choisir(ch.length > 1 ? { k: "dossier", chemin: ch.slice(0, -1) } : { k: "dossier", chemin: [0] });
      toast("Dossier retiré du site (les photos restent sur le serveur). « Publier » pour valider.");
    });
    main.append(fil,
      el("div", { class: "titre-ligne" },
        el("label", {}, ch.length === 1 ? "Nom de la rubrique (icône du bureau, en français)" : "Nom du dossier (en français)", nom),
        el("button", { class: "b sm", type: "button", title: "Monter", disabled: idx === 0, onclick: () => { if (deplacer(freres, idx, -1)) { ch[ch.length - 1]--; change(); rendu(); } } }, "↑"),
        el("button", { class: "b sm", type: "button", title: "Descendre", disabled: idx === freres.length - 1, onclick: () => { if (deplacer(freres, idx, 1)) { ch[ch.length - 1]++; change(); rendu(); } } }, "↓"),
        supp),
      el("section", { class: "bloc" }, el("h2", {}, "Description", el("span", { class: "aide", text: "texte du panneau de droite de la fenêtre" })),
        champsLangues(n, "desc", { placeholder: "Ex. : Signalétique et identité visuelle pour… 2024", liens: true }),
        el("p", { class: "vide", text: "Un lien s'écrit [texte](https://adresse) : sur le site, seul le texte s'affiche, cliquable." })),
      blocSousDossiers(n, ch),
      blocImages(n, ch));
  }

  function blocSousDossiers(n, ch) {
    const enfants = n.children || [];
    const liste = el("div", { class: "liste" }, enfants.length ? enfants.map((c, i) => el("div", { class: "ligne" },
      el("span", { class: "grow", text: "📁 " + c.name + " · " + nbImages(c) + " image(s)" }),
      el("button", { class: "b sm ico", type: "button", title: "Monter", disabled: i === 0, onclick: () => { deplacer(enfants, i, -1); change(); rendu(); } }, "↑"),
      el("button", { class: "b sm ico", type: "button", title: "Descendre", disabled: i === enfants.length - 1, onclick: () => { deplacer(enfants, i, 1); change(); rendu(); } }, "↓"),
      el("button", { class: "b sm", type: "button", onclick: () => choisir({ k: "dossier", chemin: [...ch, i] }) }, "Ouvrir"))) : el("p", { class: "vide", text: "Aucun sous-dossier." }));
    return el("section", { class: "bloc" }, el("h2", {}, "Sous-dossiers", el("span", { class: "aide", text: "les projets rangés dans ce dossier" })),
      liste,
      el("button", { class: "b sm", type: "button", onclick: () => {
        n.children = n.children || []; n.children.push({ name: "nouveau projet", items: [] }); change();
        choisir({ k: "dossier", chemin: [...ch, n.children.length - 1] });
        setTimeout(() => { const i = document.querySelector(".titre-ligne input"); if (i) { i.focus(); i.select(); } }, 50);
      } }, "+ Nouveau sous-dossier"));
  }

  function cheminDossierTexte(ch) { return ch.map((_, k) => noeud(ch.slice(0, k + 1)).name).join("/"); }

  function blocImages(n, ch) {
    const items = n.items || [];   // ne pas créer de tableau vide : sinon l'admin croit à une modification
    const grille = el("div", { class: "grille" });
    let depart = null;
    items.forEach((it, i) => {
      const v = el("div", { class: "vign", draggable: "true", title: "Glisse pour changer l'ordre" }, el("span", { text: String(i + 1) }));
      if (it.video) {
        const yt = it.video.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
        const fond = it.src ? IMG(it.src) : it.poster || (yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : "");
        if (fond) v.style.backgroundImage = `url("${fond}")`;
        v.append(el("b", { class: "badge-video", text: "▶ vidéo" }));
      } else v.style.backgroundImage = `url("${IMG("_mini/" + it.src.replace(/\.[A-Za-z0-9]{2,4}$/, "") + ".jpg")}"), url("${IMG(it.src)}")`;
      const titre = el("input", { type: "text", value: it.title || "", placeholder: "Titre (facultatif)", maxlength: 200 });
      titre.addEventListener("input", () => { if (titre.value.trim()) it.title = titre.value; else delete it.title; change(); });
      const leg = el("details", {}, el("summary", { text: "Légende dans la visionneuse" + (it.desc ? " ✓" : "") }), champsLangues(it, "desc", { lignes: 2, liens: true }));
      let lienVideo = null;
      if (it.video) {
        lienVideo = el("input", { type: "text", value: it.video.startsWith("@images/") ? "fichier envoyé : " + it.video.split("/").pop() : it.video, disabled: it.video.startsWith("@images/") || null, title: "Lien YouTube ou Vimeo" });
        lienVideo.addEventListener("change", () => { const u = lienVideo.value.trim(); if (lienVideoOk(u)) { it.video = u; delete it.poster; change(); rendu(); } else toast("Lien non reconnu : colle un lien YouTube ou Vimeo.", true); });
      }
      const carte = el("div", { class: "carte" }, v,
        el("div", { class: "champs" }, lienVideo, titre, leg),
        el("div", { class: "actions" },
          el("button", { class: "b sm ico", type: "button", title: "Avant", disabled: i === 0, onclick: () => { deplacer(items, i, -1); change(); rendu(); } }, "←"),
          el("button", { class: "b sm ico", type: "button", title: "Après", disabled: i === items.length - 1, onclick: () => { deplacer(items, i, 1); change(); rendu(); } }, "→"),
          boutonConfirme("Retirer", "Sûr ?", () => { items.splice(i, 1); change(); rendu(); }, true)));
      // glisser-déposer pour réordonner (ordinateur)
      v.addEventListener("dragstart", (e) => { depart = i; carte.classList.add("glisse"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); });
      v.addEventListener("dragend", () => carte.classList.remove("glisse"));
      carte.addEventListener("dragover", (e) => { if (depart !== null) { e.preventDefault(); carte.classList.add("cible"); } });
      carte.addEventListener("dragleave", () => carte.classList.remove("cible"));
      carte.addEventListener("drop", (e) => { if (depart === null) return; e.preventDefault(); const [x] = items.splice(depart, 1); items.splice(i, 0, x); depart = null; change(); rendu(); });
      grille.append(carte);
    });
    const input = el("input", { type: "file", accept: "image/*", multiple: true, class: "sr", id: "fichiers" });
    const envois = el("div", { class: "envois", "aria-live": "polite" });
    const depot = el("div", { class: "depot" },
      el("p", {}, "Glisse tes photos ici, ou "), el("label", { for: "fichiers", class: "b pri", tabindex: "0" }, "Choisir des photos"), input,
      el("p", { class: "vide", text: "JPG, PNG, GIF ou WebP. Les grandes photos sont réduites automatiquement." }), envois);
    input.addEventListener("change", () => { envoyerPhotos([...input.files], n, ch, envois); input.value = ""; });
    depot.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); depot.classList.add("survol"); } });
    depot.addEventListener("dragleave", () => depot.classList.remove("survol"));
    depot.addEventListener("drop", (e) => { e.preventDefault(); depot.classList.remove("survol"); envoyerPhotos([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/")), n, ch, envois); });
    return el("section", { class: "bloc" }, el("h2", {}, "Images et vidéos", el("span", { class: "aide", text: items.length + " · glisse les vignettes ou utilise ← → pour l'ordre" })),
      items.length ? grille : el("p", { class: "vide", text: "Aucune image dans ce dossier." }), depot, blocAjoutVideo(n, ch));
  }

  /* ---------- vidéos ---------- */
  const lienVideoOk = (u) => /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?\S*v=|shorts\/|embed\/)[\w-]{11}|youtu\.be\/[\w-]{11}|vimeo\.com\/(video\/)?\d+|player\.vimeo\.com\/video\/\d+)\S*$/i.test(u);
  function blocAjoutVideo(n, ch) {
    const url = el("input", { type: "text", placeholder: "Lien YouTube ou Vimeo (https://…)", inputmode: "url", autocapitalize: "none" });
    const fic = el("input", { type: "file", accept: "video/mp4,video/webm,video/quicktime", class: "sr", id: "fichier-video" });
    const etat = el("span", { class: "vide" });
    const ajouter = async () => {
      let u = url.value.trim();
      if (u && !/^https?:\/\//.test(u)) u = "https://" + u;
      if (!lienVideoOk(u)) { toast("Lien non reconnu : colle un lien YouTube ou Vimeo.", true); return; }
      const it = { video: u };
      const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vm) {   // Vimeo : on récupère l'image de la vidéo pour la vignette
        try { const r = await fetch("https://vimeo.com/api/oembed.json?url=" + encodeURIComponent("https://vimeo.com/" + vm[1])); const d = await r.json(); if (d.thumbnail_url) it.poster = d.thumbnail_url.replace(/^http:/, "https:"); if (d.title) it.title = d.title; } catch (e) {}
      }
      (n.items = n.items || []).push(it); change(); rendu(); toast("Vidéo ajoutée. Pense à « Publier ».");
    };
    fic.addEventListener("change", async () => {
      const f = fic.files[0]; fic.value = ""; if (!f) return;
      etat.textContent = "⏳ envoi de " + f.name + " (" + Math.round(f.size / 1e6) + " Mo)…";
      try {
        const fd = new FormData(); fd.append("f", f); fd.append("dossier", "videos/" + cheminDossierTexte(ch));
        const d = await api("envoyer", null, fd);
        (n.items = n.items || []).push({ video: "@images/" + d.chemin, title: f.name.replace(/\.[^.]+$/, "") });
        change(); rendu(); toast("Vidéo envoyée. Pense à « Publier ».");
      } catch (e) { etat.textContent = "✗ " + (e.message || "échec"); }
    });
    return el("div", { class: "ajout-video" },
      el("p", { class: "vide", text: "Ajouter une vidéo : colle un lien YouTube ou Vimeo, ou envoie un fichier (MP4, 300 Mo max)." }),
      el("div", { class: "ligne-video" }, url, el("button", { class: "b sm pri", type: "button", onclick: ajouter }, "Ajouter la vidéo")),
      el("div", {}, el("label", { for: "fichier-video", class: "b sm", tabindex: "0" }, "Envoyer un fichier vidéo"), fic, " ", etat));
  }

  // Réduit la photo dans le navigateur avant l'envoi (plus rapide, et convertit les photos iPhone en JPG)
  async function preparer(f) {
    if (f.type === "image/gif" || f.size < 600 * 1024 && /jpe?g|png|webp/.test(f.type)) return f;
    try {
      const bmp = await createImageBitmap(f);
      const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const png = f.type === "image/png";
      const blob = await new Promise((r) => c.toBlob(r, png ? "image/png" : "image/jpeg", 0.88));
      if (!blob) return f;
      return new File([blob], f.name.replace(/\.[^.]+$/, "") + (png ? ".png" : ".jpg"), { type: blob.type });
    } catch (e) { return f; }
  }
  async function envoyerPhotos(files, n, ch, zone) {
    if (!files.length) return;
    const dossier = cheminDossierTexte(ch);
    let ok = 0;
    for (const f of files) {
      const ligne = el("div", { text: "⏳ " + f.name }); zone.append(ligne);
      try {
        const g = await preparer(f);
        const fd = new FormData(); fd.append("f", g); fd.append("dossier", dossier);
        const d = await api("envoyer", null, fd);
        (n.items = n.items || []).push({ src: d.chemin, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() });
        ok++; ligne.textContent = "✓ " + f.name; change();
      } catch (e) { ligne.className = "err"; ligne.textContent = "✗ " + f.name + " : " + (e.message || "échec"); }
    }
    if (ok) { rendu(); toast(ok + " photo(s) ajoutée(s). Pense à « Publier ».");}
  }

  /* ---------- contact ---------- */
  function editeurContact(main) {
    const ct = C.contact;
    const nom = el("input", { type: "text", value: ct.name, maxlength: 160 });
    nom.addEventListener("input", () => { ct.name = nom.value; change(); });
    const TYPES = [["big", "Texte normal"], ["small", "Petit texte"], ["gap", "Espace vide"]];
    const lignes = el("div", { class: "liste" });
    ct.lines.forEach((l, i) => {
      const type = l.gap ? "gap" : l.small != null ? "small" : "big";
      const sel_ = el("select", {}, TYPES.map(([v, t]) => el("option", { value: v, selected: v === type }, t)));
      sel_.addEventListener("change", () => {
        const txt = l.big ?? l.small; delete l.big; delete l.small; delete l.gap;
        if (sel_.value === "gap") l.gap = true; else l[sel_.value] = txt || { fr: "" };
        change(); rendu();
      });
      const corps = el("div", { class: "ct" },
        el("div", { class: "tete" }, el("span", { class: "px", text: String(i + 1) }), sel_,
          el("button", { class: "b sm ico", type: "button", title: "Monter", disabled: i === 0, onclick: () => { deplacer(ct.lines, i, -1); change(); rendu(); } }, "↑"),
          el("button", { class: "b sm ico", type: "button", title: "Descendre", disabled: i === ct.lines.length - 1, onclick: () => { deplacer(ct.lines, i, 1); change(); rendu(); } }, "↓"),
          boutonConfirme("Retirer", "Sûr ?", () => { ct.lines.splice(i, 1); change(); rendu(); }, true)));
      if (type !== "gap") {
        corps.append(champsLangues(l, type, { lignes: 1 }));
        // un lien simple (mail, Instagram, CV…)
        const aLien = l.href != null;
        const details = el("details", { open: aLien }, el("summary", { text: "Lien après le texte" + (aLien ? " ✓" : "") }));
        const url = el("input", { type: "text", value: (l.href || "").replace(/^@images\//, "/images/"), placeholder: "https://…, mailto:adresse@…, ou un fichier envoyé" });
        url.addEventListener("input", () => {
          const v = url.value.trim();
          if (!v) delete l.href; else l.href = v.startsWith("/images/") ? "@images/" + v.slice(8) : v;
          change();
        });
        const fic = el("input", { type: "file", accept: "application/pdf,image/*", class: "sr", id: "fic" + i });
        fic.addEventListener("change", async () => {
          const f = fic.files[0]; if (!f) return;
          toast("Envoi de " + f.name + "…");
          try { const fd = new FormData(); fd.append("f", f); fd.append("dossier", "fichiers"); const d = await api("envoyer", null, fd); l.href = "@images/" + d.chemin; change(); rendu(); toast("Fichier envoyé. Pense à « Publier »."); }
          catch (e) { toast(e.message, true); }
        });
        details.append(el("div", { class: "langues" }, LANGS.map(([lg, n]) => {
          const ta = el("input", { type: "text", value: tVal(l.link, lg), placeholder: lg === "fr" ? "Texte du lien (ex. télécharger)" : "Vide = français" });
          ta.addEventListener("input", () => { tSet(l, "link", lg, ta.value); change(); });
          return el("label", {}, "Texte du lien · " + n, ta);
        })), el("label", {}, "Adresse du lien", url), el("div", {}, el("label", { for: "fic" + i, class: "b sm", tabindex: "0" }, "Envoyer un fichier (PDF du CV…)"), fic));
        corps.append(details);
        // plusieurs petits liens à la suite (ligne des crédits)
        if (l.links) {
          const lm = el("div", { class: "liens-mult" });
          l.links.forEach((x, j) => {
            const a = el("input", { type: "text", value: x[0], placeholder: "Texte" }), b = el("input", { type: "text", value: x[1], placeholder: "https://…" });
            a.addEventListener("input", () => { x[0] = a.value; change(); }); b.addEventListener("input", () => { x[1] = b.value; change(); });
            lm.append(el("div", { class: "l" }, a, b, el("button", { class: "b sm ico", type: "button", title: "Retirer ce lien", onclick: () => { l.links.splice(j, 1); if (!l.links.length) delete l.links; change(); rendu(); } }, "✕")));
          });
          corps.append(el("div", {}, el("p", { class: "vide", text: "Liens à la suite :" }), lm));
        }
        corps.append(el("button", { class: "b sm", type: "button", onclick: () => { l.links = l.links || []; l.links.push(["", "https://"]); change(); rendu(); } }, "+ Ajouter un lien à la suite"));
      }
      lignes.append(corps);
    });
    main.append(el("div", { class: "fil", text: "Bureau › " + ct.name }),
      el("div", { class: "titre-ligne" }, el("label", {}, "Nom de l'icône (en français)", nom)),
      el("section", { class: "bloc" }, el("h2", {}, "Lignes de la fenêtre contact", el("span", { class: "aide", text: "de haut en bas" })), lignes,
        el("button", { class: "b sm", type: "button", onclick: () => { ct.lines.push({ big: { fr: "" } }); change(); rendu(); } }, "+ Ajouter une ligne")));
  }

  /* ---------- confirmation en deux temps (pas de fenêtre système) ---------- */
  function boutonConfirme(texte, confirmer, action, petit) {
    let arme = false, t;
    const b = el("button", { class: "b danger" + (petit ? " sm" : " sm"), type: "button", text: texte });
    b.addEventListener("click", () => {
      if (!arme) { arme = true; b.textContent = confirmer; b.classList.add("arme"); t = setTimeout(() => { arme = false; b.textContent = texte; b.classList.remove("arme"); }, 3000); return; }
      clearTimeout(t); action();
    });
    return b;
  }

  /* ---------- publication ---------- */
  let etatEl, pubBtn, annBtn;
  function barrePublier() {
    etatEl = el("span", { class: "etat" });
    pubBtn = el("button", { class: "b pri", type: "button", onclick: publier }, "Publier sur le site");
    annBtn = boutonConfirme("Annuler mes modifications", "Tout annuler ?", () => { C = JSON.parse(publie); effacerBrouillon(); if (sel.k === "dossier" && !noeud(sel.chemin)) sel = { k: "dossier", chemin: [0] }; rendu(); toast("Modifications annulées."); });
    return el("div", { class: "publier" }, etatEl, annBtn, pubBtn);
  }
  function majBarre() {
    if (!etatEl) return;
    const s = sale();
    etatEl.className = "etat" + (s ? " sale" : "");
    etatEl.textContent = s ? "● Modifications pas encore publiées" : "✓ Le site est à jour";
    pubBtn.disabled = !s; annBtn.hidden = !s;
  }
  function verifier() {
    const vides = [];
    const walk = (arr, base) => arr.forEach((n) => { if (!n.name || !n.name.trim()) vides.push(base || "Bureau"); if (n.children) walk(n.children, n.name); });
    walk(C.site, "");
    return vides.length ? "Un dossier n'a pas de nom (dans « " + vides[0] + " »)." : null;
  }
  async function publier() {
    const pb = verifier(); if (pb) { toast(pb, true); return; }
    pubBtn.disabled = true; pubBtn.textContent = "Publication…";
    try {
      const d = await api("publier", { contenu: C });
      publie = JSON.stringify(C); effacerBrouillon();
      toast("Publié à " + d.quand + " ✓ C'est en ligne.");
    } catch (e) { if (e.message) toast(e.message, true); }
    pubBtn.textContent = "Publier sur le site"; majBarre();
  }

  /* ---------- versions ---------- */
  async function versions() {
    const corps = el("div", { class: "corps" }, el("p", { class: "vide", text: "Chargement…" }));
    const fermer = () => voile.remove();
    const voile = el("div", { class: "voile", onclick: (e) => { if (e.target === voile) fermer(); } },
      el("div", { class: "modale", role: "dialog", "aria-modal": "true", "aria-label": "Versions précédentes" },
        el("div", { class: "barre" }, el("span", { text: "Versions précédentes" }), el("button", { type: "button", "aria-label": "Fermer", onclick: fermer }, "✕")), corps));
    document.body.append(voile);
    try {
      const d = await api("versions");
      corps.replaceChildren(el("p", { class: "vide", text: "À chaque publication, la version d'avant est gardée ici. Restaurer une version la remet en ligne tout de suite." }));
      if (!d.versions.length) corps.append(el("p", { text: "Pas encore de version précédente." }));
      d.versions.forEach((v) => corps.append(el("div", { class: "ligne" },
        el("span", { class: "grow", text: v.date + (v.note === "avant restauration" ? " (avant une restauration)" : "") }),
        boutonConfirme("Restaurer", "Confirmer", async () => {
          try { const r = await api("restaurer", { id: v.id }); C = r.contenu; publie = JSON.stringify(C); effacerBrouillon(); fermer(); sel = { k: "dossier", chemin: [0] }; rendu(); toast("Version du " + v.date + " remise en ligne."); }
          catch (e) { toast(e.message, true); }
        }, true))));
    } catch (e) { corps.replaceChildren(el("p", { class: "msg err", text: e.message })); }
  }

  /* ---------- statistiques ---------- */
  const ACCENTS = { à: "a", á: "a", â: "a", ä: "a", ã: "a", å: "a", ç: "c", è: "e", é: "e", ê: "e", ë: "e", ì: "i", í: "i", î: "i", ï: "i", ñ: "n", ò: "o", ó: "o", ô: "o", ö: "o", õ: "o", ù: "u", ú: "u", û: "u", ü: "u", ý: "y", ÿ: "y", œ: "oe", æ: "ae", ß: "ss" };
  const slug = (s) => s.toLowerCase().replace(/[àáâäãåçèéêëìíîïñòóôöõùúûüýÿœæß]/g, (c) => ACCENTS[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dossier";
  function nomsDesChemins() {
    const out = { contact: C.contact.name };
    const w = (arr, base) => { const pris = new Set(); arr.forEach((n) => { let s = slug(n.name), k = 2; while (pris.has(s)) s = slug(n.name) + "-" + k++; pris.add(s); const ch = base ? base + "/" + s : s; out[ch] = (base ? out[base] + " › " : "") + n.name; if (n.children) w(n.children, ch); }); };
    w(C.site, ""); return out;
  }
  async function statistiques() {
    const corps = el("div", { class: "corps" }, el("p", { class: "vide", text: "Chargement…" }));
    const fermer = () => voile.remove();
    const voile = el("div", { class: "voile", onclick: (e) => { if (e.target === voile) fermer(); } },
      el("div", { class: "modale large", role: "dialog", "aria-modal": "true", "aria-label": "Statistiques" },
        el("div", { class: "barre" }, el("span", { text: "Statistiques" }), el("button", { type: "button", "aria-label": "Fermer", onclick: fermer }, "✕")), corps));
    document.body.append(voile);
    try {
      const d = await api("stats");
      const ms = Object.keys(d.mois).sort().reverse();
      let periode = "30";
      const dessiner = () => {
        const tous = {}; const jours = {};
        ms.forEach((m) => { Object.entries(d.mois[m].jours || {}).forEach(([j, n]) => (jours[j] = n)); });
        const fin = new Date(d.aujourdhui + "T12:00:00"), nbj = periode === "30" ? 30 : 365;
        const debut = new Date(fin); debut.setDate(fin.getDate() - nbj + 1);
        const dj = (x) => x.toISOString().slice(0, 10);
        const garde = (m) => periode === "an" || m >= dj(debut).slice(0, 7);
        const somme = (k) => { const o = {}; ms.filter(garde).forEach((m) => Object.entries(d.mois[m][k] || {}).forEach(([x, n]) => (o[x] = (o[x] || 0) + n))); return o; };
        const serie = []; for (let i = 0; i < nbj; i++) { const x = new Date(debut); x.setDate(debut.getDate() + i); serie.push([dj(x), jours[dj(x)] || 0]); }
        const total = serie.reduce((s, [, n]) => s + n, 0), max = Math.max(1, ...serie.map(([, n]) => n));
        const noms = nomsDesChemins();
        const top = (o, nb, nom) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, nb).map(([k, n]) => el("div", { class: "st-l" }, el("span", { class: "grow", text: nom ? nom(k) : k }), el("b", { text: String(n) })));
        const barres = el("div", { class: "st-barres", role: "img", "aria-label": "Visites par jour" }, serie.map(([j, n]) => { const b = el("div", { class: "st-b", title: j.split("-").reverse().join("/") + " : " + n + " visite(s)" }); b.style.height = Math.round((n / max) * 100) + "%"; return b; }));
        const app = somme("appareils");
        corps.replaceChildren(
          el("div", { class: "st-tete" },
            el("div", {}, el("b", { class: "st-gros", text: String(total) }), " visites ", el("span", { class: "vide", text: periode === "30" ? "sur 30 jours" : "sur 12 mois" })),
            el("div", { class: "st-choix" }, [["30", "30 jours"], ["an", "12 mois"]].map(([v, t]) => el("button", { class: "b sm" + (v === periode ? " pri" : ""), type: "button", onclick: () => { periode = v; dessiner(); } }, t)))),
          barres,
          el("p", { class: "vide", text: "📱 " + (app["téléphone"] || 0) + " sur téléphone · 💻 " + (app["ordinateur"] || 0) + " sur ordinateur" }),
          el("h3", { text: "Dossiers les plus ouverts" }), el("div", { class: "st-liste" }, top(somme("projets"), 12, (k) => noms[k] || k + " (renommé ou supprimé)")),
          el("h3", { text: "D'où viennent les visiteurs" }), el("div", { class: "st-liste" }, top(somme("sources"), 10, (k) => (k === "direct" ? "accès direct / lien partagé" : k))),
          el("p", { class: "vide", text: "Mesure anonyme, sans cookie : une visite = un onglet ouvert sur le site. Tes propres visites (connecté à l'admin) ne sont pas comptées." }));
      };
      if (!ms.length) corps.replaceChildren(el("p", { text: "Pas encore de visite enregistrée. Les statistiques commencent aujourd'hui." }));
      else dessiner();
    } catch (e) { corps.replaceChildren(el("p", { class: "msg err", text: e.message })); }
  }

  async function deconnexion() {
    if (sale()) sauverBrouillon();
    try { await api("deconnexion", {}); } catch (e) {}
    repere(false);
    csrf = ""; afficherConnexion("");
  }

  /* ---------- démarrage ---------- */
  (async () => {
    try {
      const d = await api("etat");
      csrf = d.csrf; instance = d.instance;
      if (d.connecte) { user = d.user; await charger(); } else { repere(false); afficherConnexion(""); }
    } catch (e) { app.replaceChildren(el("p", { class: "chargement", text: e.message || "Erreur au chargement." })); }
  })();
})();
