/* B-VI — bureau, fenêtres, visionneuse, langues et animations. Aucune dépendance. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => innerWidth <= 768;
  const footerH = () => $("#footer").offsetHeight || 52;
  const A = "assets/";

  /* ---------- Langue ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };
  const codes = LANGS.map((l) => l.code);
  let lang = store.get("bvi-lang");
  if (!codes.includes(lang)) {
    const nav = (navigator.language || "fr").slice(0, 2).toLowerCase();
    lang = codes.includes(nav) ? nav : "fr";
  }
  const tr = (x) => (x == null ? "" : typeof x === "string" ? x : x[lang] ?? x.fr ?? "");

  // Texte lié à la langue : il sera mis à jour au changement de langue
  const setT = (node, obj) => {
    node._t = obj;
    node.classList.add("i18n");
    node.textContent = tr(obj);
    return node;
  };
  // Attribut lié à la langue (aria-label, alt, title)
  const setA = (node, attr, obj) => {
    (node._a = node._a || {})[attr] = obj;
    node.classList.add("i18n-a");
    node.setAttribute(attr, tr(obj));
    return node;
  };

  // Effet "brouillage" pixel au changement de langue
  const GLYPHS = "█▓▒░#*+=/<>";
  function scrambleTo(node, text) {
    if (reduced || !node.isConnected || node.offsetParent === null) { node.textContent = text; return; }
    const from = node.textContent;
    const len = Math.max(from.length, text.length);
    const dur = clamp(len * 18, 250, 650);
    const start = performance.now();
    node._scr && cancelAnimationFrame(node._scr);
    const step = (t) => {
      const p = clamp((t - start) / dur, 0, 1);
      const fixed = Math.floor(p * text.length);
      let out = text.slice(0, fixed);
      const tail = Math.round((1 - p) * (len - fixed));
      for (let i = 0; i < tail && fixed + i < len; i++) {
        const c = text[fixed + i] ?? from[fixed + i] ?? " ";
        out += c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.textContent = out;
      if (p < 1) node._scr = requestAnimationFrame(step);
      else { node.textContent = text; node._scr = 0; }
    };
    node._scr = requestAnimationFrame(step);
  }

  function applyLang(next, animate) {
    lang = next;
    store.set("bvi-lang", lang);
    document.documentElement.lang = lang;
    $('meta[name="description"]').setAttribute("content", tr(UI.metaDesc));
    document.querySelectorAll(".i18n").forEach((n) => (animate ? scrambleTo(n, tr(n._t)) : (n.textContent = tr(n._t))));
    document.querySelectorAll(".i18n-a").forEach((n) => Object.entries(n._a).forEach(([a, o]) => n.setAttribute(a, tr(o))));
    document.querySelectorAll(".i18n-desc").forEach((n) => {
      n.textContent = "";
      typewrite(n, tr(n._t), 0, animate ? 1 : 0);
    });
    document.querySelectorAll(".window-content.contact").forEach((c) => renderContact(c, animate));
    if (lbOpen) renderLightbox(lbNode, lbIndex);
    document.querySelectorAll(".lang-btn").forEach((b) => b.classList.toggle("activeFF", b.dataset.lang === lang));
  }

  /* ---------- Index des nœuds ---------- */
  let uid = 0;
  // Lien direct : chaque dossier a une adresse /projet/<rubrique>/<dossier> (même calcul que projet.php côté serveur)
  const ACCENTS = { à: "a", á: "a", â: "a", ä: "a", ã: "a", å: "a", ç: "c", è: "e", é: "e", ê: "e", ë: "e", ì: "i", í: "i", î: "i", ï: "i", ñ: "n", ò: "o", ó: "o", ô: "o", ö: "o", õ: "o", ù: "u", ú: "u", û: "u", ü: "u", ý: "y", ÿ: "y", œ: "oe", æ: "ae", ß: "ss" };
  const slug = (s) => s.toLowerCase().replace(/[àáâäãåçèéêëìíîïñòóôöõùúûüýÿœæß]/g, (c) => ACCENTS[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "dossier";
  const PAR_CHEMIN = new Map();
  const walk = (nodes, parent) => {
    const pris = new Set();
    nodes.forEach((n) => {
      n.id = "w" + uid++;
      let s = slug(n.name), k = 2; while (pris.has(s)) s = slug(n.name) + "-" + k++; pris.add(s);
      n.parent = parent; n.chemin = parent ? parent.chemin + "/" + s : s;
      PAR_CHEMIN.set(n.chemin, n);
      if (n.children) walk(n.children, n);
    });
  };
  walk(SITE, null);
  CONTACT.id = "w-contact";
  CONTACT.isContact = true;
  CONTACT.chemin = "contact";
  PAR_CHEMIN.set("contact", CONTACT);
  // Dossier « jeux » (pas dans le contenu de l'administration) : démineur et snake
  const JEUX = { id: "w-jeux", name: "jeux", chemin: "jeux", desc: T("Deux petits jeux, aux couleurs du bureau.", "Two little games, in the desktop's colours.", "Due piccoli giochi, con i colori della scrivania."),
    children: [{ id: "w-mines", name: "démineur", jeu: "mines", icone: "mine.png", chemin: "jeux/demineur" }, { id: "w-snake", name: "snake", jeu: "snake", icone: "snake.png", chemin: "jeux/snake" }] };
  JEUX.children.forEach((c) => { c.parent = JEUX; PAR_CHEMIN.set(c.chemin, c); });
  PAR_CHEMIN.set("jeux", JEUX);

  // Mesure d'audience maison (stats.php) : anonyme, sans cookie. Une visite par onglet, chaque dossier une fois par onglet.
  // Lucas connecté à l'administration (repère bvi-admin) n'est pas compté.
  const vus = new Set();
  function mesurer(e, c) {
    try {
      if (localStorage.getItem("bvi-admin") || !navigator.sendBeacon) return;
      const cle = e + ":" + (c || "");
      if (vus.has(cle) || sessionStorage.getItem("bvi-m-" + cle)) return;
      vus.add(cle); sessionStorage.setItem("bvi-m-" + cle, "1");
      const fd = new FormData(); fd.append("e", e);
      if (c) fd.append("c", c);
      if (e === "v") { let s = ""; try { s = document.referrer ? new URL(document.referrer).hostname : ""; } catch (_) {} fd.append("s", s); }
      navigator.sendBeacon("/stats.php", fd);
    } catch (_) {}
  }

  // L'adresse suit ce qui est ouvert : fenêtre au premier plan (+ numéro de l'image dans la visionneuse)
  let urlPrete = false;
  function majURL() {
    if (!urlPrete) return;
    let haut = null;
    wins.forEach((w) => { if (!w.min && (!haut || +w.el.style.zIndex > +haut.el.style.zIndex)) haut = w; });
    let u = "/";
    if (lbOpen && lbNode) u = "/projet/" + lbNode.chemin + "/" + (lbIndex + 1);
    else if (haut) u = "/projet/" + haut.node.chemin;
    if (location.pathname + location.hash !== u) history.replaceState(null, "", u);
  }

  /* ---------- Fond : halo qui suit le curseur ---------- */
  let spotRaf = 0;
  addEventListener("pointermove", (e) => {
    if (spotRaf) return;
    spotRaf = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--mx", e.clientX + "px");
      document.documentElement.style.setProperty("--my", e.clientY + "px");
      spotRaf = 0;
    });
  });

  /* ---------- Bureau ---------- */
  const desktop = $("#desktop");
  setA(desktop, "aria-label", UI.desktop);
  // Badge « nouveau » (case cochée dans l'administration) ; un petit point sur les dossiers qui en contiennent un
  const aDuNouveau = (n) => !!(n.children || []).some((c) => c.nouveau || aDuNouveau(c));
  function badgeNouveau(f, n) {
    if (n.nouveau) f.append(setT(el("span", "badge-nouveau"), UI.nouveau));
    else if (aDuNouveau(n)) { const p = el("span", "point-nouveau"); setA(p, "title", tr(UI.nouveau)); f.append(p); }
  }
  const makeIcon = (node, icon) => {
    const f = el("div", "folder folder-item");
    f.addEventListener("animationend", (e) => { if (e.animationName === "iconIn") f.classList.add("pose"); });
    f.tabIndex = 0;
    f.setAttribute("role", "button");
    const im = el("img");
    im.src = A + icon;
    im.alt = "";
    f.append(im, setT(el("h2"), node.name));
    badgeNouveau(f, node);
    const open = () => {
      document.querySelectorAll(".folder.selected").forEach((x) => x.classList.remove("selected"));
      f.classList.add("selected");
      openWindow(node, im);
    };
    f.addEventListener("click", open);
    f.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return f;
  };
  SITE.forEach((n) => desktop.append(makeIcon(n, "dossier.png")));
  desktop.append(makeIcon(CONTACT, "ordi.png"));
  desktop.append(makeIcon(JEUX, "dossier.png"));

  // Icône « admin » en bas à droite du bureau : seulement pour Lucas connecté à l'administration.
  // L'administration pose un repère « bvi-admin » dans le navigateur ; on vérifie alors auprès du serveur que la session est vraiment ouverte.
  // Un visiteur normal n'a pas ce repère : aucune requête, aucune icône.
  (async () => {
    let repere = null;
    try { repere = localStorage.getItem("bvi-admin"); } catch (e) {}
    if (!repere) return;
    try {
      const r = await fetch("/admin/api.php?a=etat", { credentials: "same-origin", cache: "no-store" });
      const d = await r.json();
      if (!d.connecte) { try { localStorage.removeItem("bvi-admin"); } catch (e) {} return; }
      const a = el("a", "folder admin-icon");
      a.href = "/admin/";
      const im = el("img"); im.src = A + "admin.png"; im.alt = "";
      const h = el("h2"); h.textContent = "admin";
      a.append(im, h);
      document.body.append(a);
      requestAnimationFrame(() => a.classList.add("in"));
    } catch (e) {}
  })();
  desktop.addEventListener("pointerdown", (e) => {
    if (e.target === desktop) document.querySelectorAll(".folder.selected").forEach((x) => x.classList.remove("selected"));
  });

  /* ---------- Fenêtres ---------- */
  const wins = new Map();
  const layer = $("#windows");
  const tabs = $("#tabs");
  let z = 100;
  let cascade = 0;

  const genie = (win, fromRect, reverse = false, duration = 480) => {
    const r = win.getBoundingClientRect();
    if (!fromRect || reduced) return Promise.resolve();
    const dx = fromRect.left + fromRect.width / 2 - (r.left + r.width / 2);
    const dy = fromRect.top + fromRect.height / 2 - (r.top + r.height / 2);
    const s = Math.max(0.04, fromRect.width / r.width);
    const small = { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0, filter: "blur(6px)" };
    const big = { transform: "translate(0,0) scale(1)", opacity: 1, filter: "blur(0)" };
    const a = win.animate(reverse ? [big, small] : [small, big], {
      duration,
      easing: reverse ? "cubic-bezier(.55,0,.75,.3)" : "cubic-bezier(.2,1.1,.3,1)",
      fill: reverse ? "forwards" : "none",
    });
    return a.finished.then(() => { if (reverse) a.cancel(); }).catch(() => {});
  };

  function focusWin(id) {
    const w = wins.get(id);
    if (!w) return;
    w.el.style.zIndex = ++z;
    wins.forEach((o, k) => {
      const on = k === id;
      o.el.classList.toggle("active-w", on);
      o.el.classList.toggle("unactive-w", !on);
      o.tab.classList.toggle("activeFF", on && !o.min);
    });
    w.tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
    majURL();
  }

  function ctrlButton(cls, icon, label) {
    const b = el("button", cls);
    setA(b, "aria-label", label);
    const im = el("img");
    im.src = A + icon;
    im.alt = "";
    b.append(im);
    return b;
  }

  function openWindow(node, originEl) {
    const existing = wins.get(node.id);
    if (existing) {
      if (existing.min) restore(node.id);
      else {
        focusWin(node.id);
        if (!reduced) existing.el.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.025)" }, { transform: "scale(0.99)" }, { transform: "scale(1)" }],
          { duration: 380, easing: "ease-out" }
        );
      }
      return;
    }

    const win = el("section", "windows active-w" + (node.isContact ? " contactW" : ""));
    setA(win, "aria-label", node.name);

    const header = el("div", "window-header");
    const hl = el("div", "header-left");
    const hIcon = el("img", node.isContact ? "contact" : "");
    hIcon.src = A + (node.isContact ? "contact-small.png" : "dossier-ouvert-black.png");
    hIcon.alt = "";
    hl.append(hIcon, setT(el("p"), node.name));
    const hr = el("div", "header-right");
    const bMin = ctrlButton("min", "window-noir-reduire.png", UI.minimize);
    const bFs = ctrlButton("fs", "window-noir-fullscreen.png", UI.fullscreen);
    const bClose = ctrlButton("close", "window-noir-close.png", UI.close);
    hr.append(bMin, bFs, bClose);
    header.append(hl, hr);
    const content = el("div", "window-content" + (node.isContact ? " contact" : ""));
    win.append(header, content, el("div", "resize-handle"));

    // Taille & position (comme l'original : position aléatoire, en cascade)
    const vw = innerWidth, vh = innerHeight - footerH();
    const w = Math.min(800, vw - 20);
    const h = Math.min(node.isContact ? 550 : 400, vh - 20);
    const left = clamp(rand(20, 300) + (cascade % 6) * 28, 10, Math.max(10, vw - w - 10));
    const top = clamp(rand(110, 190) + (cascade % 6) * 22, 10, Math.max(10, vh - h - 10));
    cascade++;
    Object.assign(win.style, { width: w + "px", height: h + "px", left: left + "px", top: top + "px" });
    layer.append(win);

    // Onglet dans la barre des tâches
    const tab = el("div", "folder-footer");
    const tIcon = el("img");
    tIcon.src = A + (node.isContact ? "contact-small.png" : "dossier-ouvert.png");
    tIcon.alt = "";
    tab.append(tIcon, setT(el("span"), node.name));
    tabs.append(tab);

    const state = { el: win, tab, node, min: false };
    wins.set(node.id, state);
    mesurer("p", node.chemin);
    son("ouvre");
    focusWin(node.id);

    if (node.isContact) renderContact(content, true);
    else if (node.jeu) renderJeu(node, content, win);
    else renderFolder(node, content);

    bMin.addEventListener("click", (e) => { e.stopPropagation(); minimize(node.id); });
    bFs.addEventListener("click", (e) => { e.stopPropagation(); toggleFs(win); });
    bClose.addEventListener("click", (e) => { e.stopPropagation(); closeWin(node.id); });
    header.addEventListener("dblclick", (e) => { if (!e.target.closest("button")) toggleFs(win); });
    win.addEventListener("pointerdown", () => focusWin(node.id));
    tab.addEventListener("click", () => {
      if (state.min) restore(node.id);
      else if (win.classList.contains("active-w")) minimize(node.id);
      else focusWin(node.id);
    });
    makeDraggable(win);
    makeResizable(win);

    genie(win, originEl && originEl.getBoundingClientRect());
  }

  function renderFolder(node, content) {
    const left = el("div", "left-content");
    content.append(left);
    let i = 0;
    (node.items || []).forEach((it, idx) => {
      const card = el("div", "imgPlusTitle");
      card.style.setProperty("--d", 0.18 + i++ * 0.045 + "s");
      const th = el("div", "thumb");
      const im = el("img");
      im.loading = "lazy";
      im.decoding = "async";
      setA(im, "alt", it.title || node.name);
      im.onload = () => th.classList.add("loaded");
      // miniature légère ; si elle n'existe pas encore, on retombe sur l'image en grand
      im.onerror = () => { if (it.src && im.src !== it.src) im.src = it.src; else th.classList.add("loaded"); };
      if (it.isVideo) {
        th.classList.add("video");
        if (!it.mini && !it.poster && it.fichier) {   // fichier vidéo sans image : la première image de la vidéo sert de vignette
          const vd = el("video"); vd.muted = true; vd.preload = "metadata"; vd.playsInline = true;
          vd.onloadeddata = () => th.classList.add("loaded"); vd.src = it.fichier + "#t=0.5";
          th.append(vd);
        } else im.src = it.mini || it.poster;
        if (!it.mini && !it.poster && !it.fichier) th.classList.add("loaded");
      } else im.src = it.mini || it.src;
      if (!(it.isVideo && !it.mini && !it.poster)) th.append(im);
      card.append(th);
      if (it.title) card.append(setT(el("h2"), it.title));
      card.addEventListener("click", () => openLightbox(node, idx));
      left.append(card);
    });
    (node.children || []).forEach((child) => {
      const f = el("div", "foldersInW folder-item");
      f.style.setProperty("--d", 0.18 + i++ * 0.05 + "s");
      const im = el("img");
      im.src = A + (child.icone || "dossier.png");
      im.alt = "";
      f.append(im, setT(el("h2"), child.jeu === "mines" ? UI.demineur : child.name));
      badgeNouveau(f, child);
      f.addEventListener("click", () => openWindow(child, im));
      left.append(f);
    });
    requestAnimationFrame(() => left.querySelectorAll(".imgPlusTitle, .foldersInW").forEach((c) => c.classList.add("in")));

    if (node.desc) {
      const right = el("div", "right-content");
      const h3 = el("h3", "i18n-desc");
      h3._t = node.desc;
      right.append(h3);
      content.append(right);
      typewrite(h3, tr(node.desc), 250);
    }
  }

  function renderContact(content, animate) {
    content.textContent = "";
    let d = 0.15;
    CONTACT.lines.forEach((l) => {
      let node;
      if (l.gap) { content.append(el("br")); return; }
      if (l.small != null) {
        node = el("h4");
        node.append(tr(l.small));
        (l.links || []).forEach(([t, h], k) => {
          if (k) node.append(" - ");
          const a = el("a");
          a.href = h; a.target = "_blank"; a.rel = "noopener"; a.textContent = t;
          node.append(a);
        });
      } else {
        node = el("h2");
        node.append(tr(l.big));
        if (l.link) {
          const a = el("a");
          a.href = l.href;
          a.textContent = tr(l.link);
          if (!l.href.startsWith("mailto")) { a.target = "_blank"; a.rel = "noopener"; }
          node.append(a);
        }
      }
      if (animate) { node.classList.add("line-in"); node.style.setProperty("--d", (d += 0.06) + "s"); }
      content.append(node);
    });
  }

  // Liens dans les textes : [texte](https://adresse) → texte cliquable (seulement http, https et mailto)
  const LIEN = /\[([^\]\n]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g;
  const sansLiens = (s) => s.replace(LIEN, "$1");
  function avecLiens(target, s) {
    target.textContent = "";
    let i = 0;
    for (const m of s.matchAll(LIEN)) {
      if (m.index > i) target.append(s.slice(i, m.index));
      const a = el("a");
      a.href = m[2]; a.textContent = m[1];
      if (!m[2].startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; }
      target.append(a);
      i = m.index + m[0].length;
    }
    if (i < s.length) target.append(s.slice(i));
  }

  function typewrite(target, text, delay = 0, speed = 1) {
    target._tw = (target._tw || 0) + 1;
    const run = target._tw;
    const riche = text;
    text = sansLiens(text);   // on tape le texte simple, puis les liens apparaissent à la fin
    if (reduced || speed === 0) { avecLiens(target, riche); return; }
    target.textContent = "";
    const caret = el("span", "caret");
    const tn = document.createTextNode("");
    target.append(tn, caret);
    const total = clamp(text.length * 9, 400, 1400) * speed;
    let start = 0;
    const step = (t) => {
      if (run !== target._tw) return; // un autre texte a pris la place
      if (!start) start = t;
      const p = clamp((t - start) / total, 0, 1);
      tn.data = text.slice(0, Math.round(p * text.length));
      if (p < 1) requestAnimationFrame(step);
      else { if (riche !== text) { avecLiens(target, riche); target.append(caret); } setTimeout(() => caret.remove(), 900); }
    };
    setTimeout(() => requestAnimationFrame(step), delay);
  }

  function minimize(id, delay = 0) {
    const w = wins.get(id);
    if (!w || w.min) return;
    w.min = true;
    majURL();
    son("reduit");
    w.tab.classList.remove("activeFF");
    w.tab.classList.add("minim");
    setTimeout(() => {
      genie(w.el, w.tab.getBoundingClientRect(), true, 380).then(() => w.el.classList.add("minimized"));
    }, delay);
  }

  function restore(id) {
    const w = wins.get(id);
    if (!w) return;
    w.min = false;
    w.tab.classList.remove("minim");
    w.el.classList.remove("minimized");
    focusWin(id);
    genie(w.el, w.tab.getBoundingClientRect());
  }

  function closeWin(id) {
    const w = wins.get(id);
    if (!w) return;
    wins.delete(id);
    majURL();
    son("ferme");
    w.tab.classList.add("out");
    setTimeout(() => w.tab.remove(), reduced ? 0 : 300);
    const done = () => w.el.remove();
    if (reduced) done();
    else w.el.animate(
      [{ transform: "scale(1)", opacity: 1, filter: "blur(0)" }, { transform: "scale(0.88)", opacity: 0, filter: "blur(4px)" }],
      { duration: 260, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
    ).finished.then(done, done);
    let best = null, bz = -1;
    wins.forEach((o, k) => { const zz = +o.el.style.zIndex || 0; if (!o.min && zz > bz) { bz = zz; best = k; } });
    if (best) focusWin(best);
  }

  function toggleFs(win) {
    if (isMobile()) return;
    win.classList.add("anim-geom");
    win.classList.toggle("window-fullscreen");
    setTimeout(() => win.classList.remove("anim-geom"), 520);
  }

  function makeDraggable(win) {
    const header = $(".window-header", win);
    let sx, sy, ox, oy, lastX, vx = 0, dragging = false;
    header.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button") || isMobile() || win.classList.contains("window-fullscreen")) return;
      dragging = true;
      header.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop; lastX = e.clientX;
      win.classList.add("dragging");
      win.style.transition = "";
    });
    header.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      win.style.left = clamp(ox + e.clientX - sx, -win.offsetWidth + 80, innerWidth - 80) + "px";
      win.style.top = clamp(oy + e.clientY - sy, 0, innerHeight - footerH() - 40) + "px";
      vx = vx * 0.7 + (e.clientX - lastX) * 0.3;
      lastX = e.clientX;
      if (!reduced) win.style.transform = `rotate(${clamp(vx * 0.35, -4, 4)}deg) scale(1.01)`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; vx = 0;
      win.classList.remove("dragging");
      win.style.transition = "transform .6s cubic-bezier(.34,1.56,.64,1)";
      win.style.transform = "";
      setTimeout(() => (win.style.transition = ""), 600);
    };
    header.addEventListener("pointerup", end);
    header.addEventListener("pointercancel", end);
  }

  function makeResizable(win) {
    const h = $(".resize-handle", win);
    let sx, sy, sw, sh, on = false;
    h.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      on = true; h.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; sw = win.offsetWidth; sh = win.offsetHeight;
    });
    h.addEventListener("pointermove", (e) => {
      if (!on) return;
      win.style.width = Math.max(300, sw + e.clientX - sx) + "px";
      win.style.height = Math.max(200, sh + e.clientY - sy) + "px";
    });
    h.addEventListener("pointerup", () => (on = false));
  }

  /* ---------- Visionneuse ---------- */
  // Une image à la fois : le cadre prend la taille exacte de l'image + du texte,
  // et s'anime d'une taille à l'autre.
  const lb = $("#lightbox"), modal = $(".modal", lb), stage = $("#lbTrack"), counter = $("#lbCounter");
  const btnPrev = $("#lbPrev"), btnNext = $("#lbNext"), btnClose = $("#lbClose");
  let lbItems = [], lbNode = null, lbIndex = 0, lbOpen = false, lbToken = 0;
  const cache = new Map();

  function preload(src) {
    if (!cache.has(src)) {
      cache.set(src, new Promise((res) => {
        const im = new Image();
        im.onload = im.onerror = () => res();
        im.src = src;
      }));
    }
    return cache.get(src);
  }

  function buildFig(it) {
    const fig = el("figure", "lb-fig");
    if (it.isVideo) {
      const box = el("div", "lb-video");
      if (it.embed) {
        const f = el("iframe");
        f.src = it.embed; f.allow = "autoplay; fullscreen; picture-in-picture; encrypted-media"; f.allowFullscreen = true;
        f.title = it.title || "vidéo";
        box.append(f);
      } else if (it.fichier) {
        const v = el("video");
        v.src = it.fichier; v.controls = true; v.autoplay = true; v.playsInline = true;
        if (it.poster) v.poster = it.poster;
        box.append(v);
      }
      fig.append(box);
      if (it.desc) { const cap = el("figcaption", "description_img"); avecLiens(cap, tr(it.desc)); fig.append(cap); }
      return fig;
    }
    const im = el("img");
    im.src = it.src;
    im.alt = tr(it.title || (lbNode && lbNode.name));
    im.draggable = false;
    fig.append(im);
    if (it.desc) {
      const cap = el("figcaption", "description_img");
      avecLiens(cap, tr(it.desc));
      fig.append(cap);
    }
    return fig;
  }

  // Remplace le contenu en animant le cadre de l'ancienne à la nouvelle taille
  // Les zones cliquables « précédente / suivante » s'arrêtent au-dessus de la légende (lien cliquable, pas de flèche dessus)
  const zones = () => { const cap = stage.querySelector("figcaption"); modal.style.setProperty("--cap-h", (cap ? cap.offsetHeight : 0) + "px"); };
  if (window.ResizeObserver) new ResizeObserver(zones).observe(stage);

  function swap(node, dir) {
    const before = modal.getBoundingClientRect();
    const old = stage.firstElementChild;
    stage.replaceChildren(node);
    zones();
    if (reduced || !lbOpen || !old) return;
    const after = modal.getBoundingClientRect();
    modal.animate(
      [{ width: before.width + "px", height: before.height + "px" }, { width: after.width + "px", height: after.height + "px" }],
      { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" }
    );
    if (dir) {
      node.animate(
        [{ transform: `translateX(${dir * 60}px)`, opacity: 0, filter: "blur(4px)" }, { transform: "none", opacity: 1, filter: "blur(0)" }],
        { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" }
      );
    }
  }

  function go(i, dir = 0) {
    const n = lbItems.length;
    lbIndex = (i + n) % n;
    majURL();
    const it = lbItems[lbIndex];
    const token = ++lbToken;
    counter.innerHTML = `<b class="tick">${lbIndex + 1}</b> / ${n}`;
    const ready = it.isVideo ? Promise.resolve() : preload(it.src);
    let shownLoader = false;
    const loaderTimer = setTimeout(() => {
      if (token !== lbToken) return;
      shownLoader = true;
      swap(el("div", "lb-loading"), 0);
    }, 120);
    ready.then(() => {
      if (token !== lbToken) return;
      clearTimeout(loaderTimer);
      swap(buildFig(it), shownLoader ? 0 : dir);
      // précharge les voisines
      if (n > 1) [lbItems[(lbIndex + 1) % n], lbItems[(lbIndex - 1 + n) % n]].forEach((x) => { if (!x.isVideo) preload(x.src); });
    });
  }

  function renderLightbox(node, index) {
    lbNode = node;
    lbItems = node.items;
    const cur = stage.firstElementChild;
    if (cur && cur.classList.contains("lb-fig") && lbItems[index]) {
      // changement de langue : on met juste à jour le texte, sans animation
      stage.replaceChildren(buildFig(lbItems[index]));
      zones();
    } else go(index);
  }

  function openLightbox(node, index) {
    lbNode = node;
    lbItems = node.items;
    stage.replaceChildren();
    const many = lbItems.length > 1;
    btnPrev.style.display = btnNext.style.display = many ? "" : "none";
    counter.style.display = many ? "" : "none";
    lbOpen = false; // pas d'animation de taille pour la première image
    go(index);
    lb.classList.add("bg-active");
    requestAnimationFrame(() => { lbOpen = true; majURL(); });
  }

  function closeLightbox() {
    lb.classList.remove("bg-active");
    lbOpen = false;
    lbToken++;
    if (stage.querySelector(".lb-video")) stage.replaceChildren();   // coupe le son de la vidéo
    majURL();
  }

  // Flèches (on ignore le clic qui suit un swipe)
  let justSwiped = false;
  btnNext.addEventListener("click", () => { if (!justSwiped) go(lbIndex + 1, 1); });
  btnPrev.addEventListener("click", () => { if (!justSwiped) go(lbIndex - 1, -1); });
  btnClose.addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  // Swipe au doigt, sur toute la visionneuse (y compris par-dessus les zones des flèches)
  let tx = null, ty = 0, tdx = 0, axis = null, tStart = 0;
  modal.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || lbItems.length < 2) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    tdx = 0; axis = null; tStart = performance.now();
  }, { passive: true });
  modal.addEventListener("touchmove", (e) => {
    if (tx == null) return;
    const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
    if (!axis && Math.abs(dx) + Math.abs(dy) > 8) axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (axis !== "x") return;
    e.preventDefault();
    tdx = dx;
    const fig = stage.firstElementChild;
    if (fig) {
      fig.style.transition = "none";
      fig.style.transform = `translateX(${dx}px) rotate(${dx * 0.02}deg)`;
      fig.style.opacity = String(1 - Math.min(0.6, Math.abs(dx) / 600));
    }
  }, { passive: false });
  const touchEnd = () => {
    if (tx == null) return;
    const wasX = axis === "x";
    tx = null;
    if (!wasX) return;
    justSwiped = true;
    setTimeout(() => (justSwiped = false), 400);
    const fast = Math.abs(tdx) / Math.max(1, performance.now() - tStart) > 0.4;
    if (Math.abs(tdx) > modal.offsetWidth * 0.18 || (fast && Math.abs(tdx) > 30)) {
      const d = tdx < 0 ? 1 : -1;
      go(lbIndex + d, d);
    } else {
      // pas assez loin : l'image revient en place
      const fig = stage.firstElementChild;
      if (fig) {
        fig.style.transition = "transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s";
        fig.style.transform = "";
        fig.style.opacity = "";
      }
    }
  };
  modal.addEventListener("touchend", touchEnd);
  modal.addEventListener("touchcancel", touchEnd);

  addEventListener("keydown", (e) => {
    if (!lbOpen) return;
    if (e.key === "ArrowRight") go(lbIndex + 1, 1);
    else if (e.key === "ArrowLeft") go(lbIndex - 1, -1);
    else if (e.key === "Escape") closeLightbox();
  });

  setA(lb, "aria-label", UI.viewer);
  setA(btnPrev, "aria-label", UI.prev);
  setA(btnNext, "aria-label", UI.next);
  setA(btnClose, "aria-label", UI.close);

  /* ---------- Barre des tâches ---------- */
  const b6 = $("#b6");
  setA(b6, "alt", UI.minimizeAll);
  setA(b6, "title", UI.minimizeAll);
  b6.addEventListener("click", () => {
    let k = 0;
    [...wins.keys()].reverse().forEach((id) => minimize(id, reduced ? 0 : k++ * 70));
  });

  // Sélecteur de langue
  const langBox = $("#langs");
  setA(langBox, "aria-label", UI.language);
  LANGS.forEach((l) => {
    const b = el("button", "folder-footer lang-btn");
    b.type = "button";
    b.dataset.lang = l.code;
    b.textContent = l.label;
    b.setAttribute("lang", l.code);
    b.addEventListener("click", () => {
      if (l.code === lang) return;
      applyLang(l.code, true);
      if (!reduced) b.animate([{ transform: "scale(0.8)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 350, easing: "ease-out" });
    });
    langBox.append(b);
  });

  const clock = $("#clock");
  const tickClock = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    clock.innerHTML = `${p(d.getHours())}<span class="colon">:</span>${p(d.getMinutes())}`;
  };
  tickClock();
  setInterval(tickClock, 5000);

  applyLang(lang, false);

  /* ---------- Démarrage ---------- */
  function startDesktop() {
    $("#footer").classList.add("in");
    [...desktop.children].forEach((f, i) => {
      f.style.setProperty("--d", 0.1 + i * 0.08 + "s");
      f.classList.add("in");
    });
    ouvrirDepuisURL();
    mesurer("v");
  }

  // /projet/identite/kosmos → ouvre identité puis kosmos ; /projet/identite/kosmos/3 → et la 3e image
  function ouvrirDepuisURL() {
    let p = decodeURIComponent(location.pathname).replace(/^\/projet\/?/, "");
    if (p === location.pathname) p = location.hash.replace(/^#\/?/, "");   // aussi b-vi.fr/#identite/kosmos
    p = p.replace(/\/+$/, "");
    const m = p.match(/^(.*?)(?:\/(\d+))?$/);
    let node = m && PAR_CHEMIN.get(m[1]);
    const img = m && m[2] ? +m[2] - 1 : null;
    if (!node && m && m[1]) node = [...PAR_CHEMIN.values()].find((n) => n.chemin.split("/").pop() === m[1]);   // juste « kosmos »
    if (!node) { urlPrete = true; majURL(); return; }
    const chaine = []; for (let n = node; n; n = n.parent) chaine.unshift(n);
    const icone = (n) => [...desktop.children].find((f) => f.querySelector("h2") && f.querySelector("h2")._t === n.name);
    let d = reduced ? 0 : 700;
    chaine.forEach((n, i) => setTimeout(() => openWindow(n, i === 0 ? icone(n) : null), d + i * (reduced ? 0 : 450)));
    setTimeout(() => {
      urlPrete = true;
      if (img != null && node.items && node.items[img]) openLightbox(node, img); else majURL();
    }, d + chaine.length * (reduced ? 0 : 450) + 200);
  }

  function boot() {
    const b = $("#boot");
    let seen = false;
    try { seen = sessionStorage.getItem("bvi-boot") === "1"; sessionStorage.setItem("bvi-boot", "1"); } catch (_) {}
    if (seen || reduced) { b.remove(); startDesktop(); return; }

    const bar = $("#bootBar"), txt = $("#bootText");
    const N = 14;
    for (let i = 0; i < N; i++) bar.append(el("span"));
    const word = "B-VI";
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      b.classList.add("out");
      setTimeout(() => { b.remove(); startDesktop(); }, 650);
    };
    b.addEventListener("click", finish);
    let i = 0;
    const iv = setInterval(() => {
      if (i < N) bar.children[i].classList.add("on");
      txt.textContent = word.slice(0, Math.ceil(((i + 1) / N) * word.length));
      if (++i > N) { clearInterval(iv); setTimeout(finish, 280); }
    }, 85);
  }
  boot();

  /* ---------- Économiseur d'écran (B6 qui rebondit) ----------
     Ordinateur : le logo rebondit tout seul. Téléphone : il obéit à la gravité (inclinaison) et aux secousses.
     Sur iPhone, Safari demande l'accès aux capteurs : la première touche sur l'écran de veille sert à l'autoriser. */
  const saver = $("#saver"), logo = $("img", saver);
  const hint = el("p", "saver-hint"); saver.append(hint);
  let idle, sx = 80, sy = 80, svx = 2.2, svy = 1.8, hue = 0, sRaf = 0, rot = 0;
  const tactile = matchMedia("(pointer: coarse)").matches && "DeviceMotionEvent" in window;
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const aDemander = tactile && typeof DeviceMotionEvent.requestPermission === "function";
  let capteurs = aDemander ? "inconnu" : tactile ? "ok" : "non";   // inconnu → ok / refuse
  let gx = 0, gy = 0, dernierCapteur = 0, last = 0;
  const TL = 120;   // taille du logo
  const couleur = () => { hue = (hue + 67) % 360; logo.style.filter = `hue-rotate(${hue}deg) saturate(3)`; };

  // iOS et Android donnent les mesures avec des signes opposés : on part d'une supposition,
  // puis on se cale sur l'inclinaison (beta, identique partout) dès que le téléphone est assez penché
  let signe = ios ? -1 : 1, beta = null;
  addEventListener("deviceorientation", (e) => { if (e.beta != null) beta = e.beta; });
  addEventListener("devicemotion", (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    if (beta != null && Math.abs(Math.sin((beta * Math.PI) / 180)) > 0.6 && Math.abs(a.y) > 5) signe = Math.sign(a.y * Math.sin((beta * Math.PI) / 180)) || signe;
    // gravité dans le repère de l'écran
    let x = -signe * a.x, y = signe * a.y;
    const ang = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * Math.PI / 180;
    gx = x * Math.cos(ang) + y * Math.sin(ang);
    gy = -x * Math.sin(ang) + y * Math.cos(ang);
    dernierCapteur = performance.now();
    if (capteurs !== "ok") { capteurs = "ok"; if (saver.classList.contains("on")) dire("Incline ou secoue ton téléphone", 3500); }   // les mesures arrivent : pas besoin de demander
  });

  const bounce = (now) => {
    const W = innerWidth - TL, H = innerHeight - TL;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    let hit = false;
    if (now - dernierCapteur < 1000) {
      // physique : la gravité mesurée (m/s²) devient une accélération à l'écran ; secouer = grosses accélérations
      svx = (svx + gx * 260 * dt) * 0.995; svy = (svy + gy * 260 * dt) * 0.995;
      sx += svx * dt; sy += svy * dt;
      if (sx < 0 || sx > W) { if (Math.abs(svx) > 120) hit = true; svx *= -0.62; sx = clamp(sx, 0, W); }
      if (sy < 0 || sy > H) { if (Math.abs(svy) > 120) hit = true; svy *= -0.62; sy = clamp(sy, 0, H); }
      rot += (svx / (TL / 2)) * dt * 57.3;   // la boule roule
    } else {
      // rebond classique (ordinateur, ou capteurs indisponibles)
      if (Math.abs(svx) > 10) { svx = Math.sign(svx) * 2.2; svy = Math.sign(svy || 1) * 1.8; }
      sx += svx; sy += svy;
      if (sx <= 0 || sx >= W) { svx *= -1; sx = clamp(sx, 0, W); hit = true; }
      if (sy <= 0 || sy >= H) { svy *= -1; sy = clamp(sy, 0, H); hit = true; }
      rot = sx * 0.5;
    }
    if (hit) couleur();
    logo.style.transform = `translate(${sx}px, ${sy}px) rotate(${rot}deg)`;
    sRaf = requestAnimationFrame(bounce);
  };
  const dire = (txt, ms) => { hint.textContent = txt; hint.classList.add("on"); clearTimeout(hint._t); if (ms) hint._t = setTimeout(() => hint.classList.remove("on"), ms); };
  const allumer = () => {
    saver.classList.add("on"); last = 0;
    if (capteurs === "ok" && tactile) svx = svy = 0;
    sRaf = requestAnimationFrame(bounce);
    // on laisse une demi-seconde aux capteurs pour répondre avant de demander l'autorisation (iPhone)
    setTimeout(() => {
      if (!saver.classList.contains("on")) return;
      if (capteurs === "inconnu" && aDemander) dire("Touche l'écran, puis incline ou secoue ton téléphone");
      else if (capteurs === "ok") dire("Incline ou secoue ton téléphone", 3500);
    }, 600);
  };
  const wake = () => {
    if (saver.classList.contains("on")) { saver.classList.remove("on"); cancelAnimationFrame(sRaf); hint.classList.remove("on"); }
    clearTimeout(idle);
    if (!reduced) idle = setTimeout(allumer, 90000);
  };
  // iPhone : tant que l'accès aux capteurs n'est pas demandé, toucher l'écran de veille sert à le demander (et ne le ferme pas)
  ["touchstart", "pointerdown"].forEach((ev) => saver.addEventListener(ev, (e) => { if (capteurs === "inconnu" && saver.classList.contains("on")) e.stopPropagation(); }));
  saver.addEventListener("click", (e) => {
    if (capteurs !== "inconnu") return;
    e.stopPropagation();
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") DeviceOrientationEvent.requestPermission().catch(() => {});
    DeviceMotionEvent.requestPermission().then((r) => {
      capteurs = r === "granted" ? "ok" : "refuse";
      if (capteurs === "ok") { svx = svy = 0; dire("Incline ou secoue ton téléphone", 3500); } else hint.classList.remove("on");
    }).catch(() => { capteurs = "refuse"; hint.classList.remove("on"); });
  });
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => addEventListener(ev, wake, { passive: true }));
  wake();

  /* ---------- Konami code ---------- */
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let buf = [];
  addEventListener("keydown", ({ key }) => {
    buf = [...buf, key].slice(-seq.length);
    if (seq.every((k, i) => k === buf[i])) {
      for (let i = 0; i < 40; i++) {
        const r = el("img", "rain");
        r.src = A + "B6_round_small.png";
        r.style.left = rand(0, innerWidth - 60) + "px";
        document.body.append(r);
        r.animate(
          [{ transform: "translateY(0) rotate(0)" }, { transform: `translateY(${innerHeight + 160}px) rotate(${rand(-720, 720)}deg)` }],
          { duration: rand(1400, 2800), delay: rand(0, 900), easing: "cubic-bezier(.5,0,1,1)", fill: "both" }
        ).finished.then(() => r.remove());
      }
    }
  });

  /* ---------- Easter egg : taper « lucasbessis » → explosion pixel, puis 3 danseuses (≈ 1 min) ---------- */
  const MOT = "lucasbessis";
  let tape = "";
  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || /input|textarea|select/i.test(e.target.tagName)) return;
    tape = (tape + e.key.toLowerCase()).slice(-MOT.length);
    if (tape === MOT && !document.querySelector(".boom")) { tape = ""; boom(); }
  });

  function boom() {
    const cv = el("canvas", "boom");
    document.body.append(cv);
    const W = 160, H = Math.max(96, Math.round((W * innerHeight) / innerWidth));
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
    const cx = W / 2, cy = H * 0.55;
    const FEU = ["#ffffff", "#fff3a3", "#ffd23f", "#ff9f1c", "#ff5a1f", "#d62828", "#6b6b6b"];
    const parts = Array.from({ length: 110 }, () => {
      const a = Math.random() * Math.PI * 2, v = 25 + Math.random() * 85;
      return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, s: 1 + ((Math.random() * 3) | 0), c: FEU[(Math.random() * 6) | 0], vie: 0.6 + Math.random() * 1.1 };
    });
    const fumee = Array.from({ length: 16 }, (_, k) => ({ a: (k / 16) * Math.PI * 2, r: 6 + Math.random() * 6, d: 10 + Math.random() * 16 }));
    const danseuses = [
      { peau: "#f1c27d", cheveux: "#f4d35e", maillot: "#ff4fa3", dx: -32, ph: 0 },
      { peau: "#8d5524", cheveux: "#2b1b14", maillot: "#2ec4b6", dx: 0, ph: 1 },
      { peau: "#ffdbac", cheveux: "#c0392b", maillot: "#ffd23f", dx: 32, ph: 2 },
    ];
    const notes = Array.from({ length: 100 }, (_, k) => ({ x: 20 + Math.random() * (W - 40), t0: 2 + k * 0.58 + Math.random() * 0.4, c: ["#ff4fa3", "#2ec4b6", "#ffd23f", "#ffffff"][k % 4] }));
    const NOTE = ["..##", "..#.", "..#.", "###.", "###."];
    const DUREE = reduced ? 3 : 60;
    // la musique : le clip officiel, intégré depuis YouTube (lecture lancée par la frappe au clavier), dans une petite fenêtre du site
    const rick = el("div", "rick");
    const barre = el("div", "rick-barre"); barre.textContent = "never_gonna.exe · Échap pour fermer";
    const yt = el("iframe");
    yt.src = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&playsinline=1&rel=0&modestbranding=1";
    yt.allow = "autoplay; encrypted-media";
    yt.title = "Rick Astley — Never Gonna Give You Up";
    rick.append(barre, yt);
    document.body.append(rick);
    let t0 = 0, fini = false;
    const stop = () => { if (fini) return; fini = true; cv.remove(); rick.classList.add("out"); setTimeout(() => rick.remove(), 400); };
    cv.addEventListener("click", stop);
    addEventListener("keydown", (e) => { if (e.key === "Escape") stop(); }, { once: true });

    function danseuse(d, t) {
      const f = (Math.floor(t * 4) + d.ph) % 4;              // 4 pas de danse
      const bob = f % 2 ? -1 : 0, hx = [0, 1, 0, -1][f];
      const x = Math.round(cx + d.dx), y = Math.round(H * 0.86) + bob;
      // jambes (une pliée sur les pas 1 et 3)
      px(x - 3 + hx, y - 9, 2, f === 1 ? 7 : 9, d.peau); px(x + 1 + hx, y - 9, 2, f === 3 ? 7 : 9, d.peau);
      // maillot (bas), ventre, maillot (haut)
      px(x - 3 + hx, y - 11, 6, 2, d.maillot);
      px(x - 3 + Math.round(hx / 2), y - 17, 6, 6, d.peau);
      px(x - 3 + Math.round(hx / 2), y - 16, 6, 2, d.maillot);
      // bras selon le pas : haut / un en l'air / à l'horizontale / l'autre en l'air
      const bras = [[[-1, -1], [1, -1]], [[-1, -1], [1, 0]], [[-1, 0], [1, 0]], [[-1, 0], [1, -1]]][f];
      bras.forEach(([sx, sy], k) => {
        const ex = x + (k ? 3 : -4) + Math.round(hx / 2), ey = y - 17;
        for (let i = 0; i < 6; i++) px(ex + sx * (sy ? Math.min(i, 1) : i), ey + sy * i, 1, 1, d.peau);
      });
      // cou, tête, cheveux longs, yeux, sourire
      px(x - 1, y - 18, 2, 1, d.peau);
      px(x - 2, y - 23, 5, 5, d.peau);
      px(x - 3, y - 25, 7, 2, d.cheveux); px(x - 3, y - 23, 1, 6, d.cheveux); px(x + 3, y - 23, 1, 6, d.cheveux);
      px(x - 1, y - 21, 1, 1, "#1a1a1a"); px(x + 1, y - 21, 1, 1, "#1a1a1a");
      if (f % 2) px(x - 1, y - 19, 3, 1, "#c0392b");
    }

    function image(now) {
      if (fini) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000 + (reduced ? 2.2 : 0);
      g.clearRect(0, 0, W, H);
      const fondu = t > DUREE - 0.8 ? Math.max(0, (DUREE - t) / 0.8) : 1;
      g.globalAlpha = fondu;
      // fond sombre, lumières de boîte de nuit qui tournent
      px(0, 0, W, H, "rgba(8,6,18,.82)");
      if (t > 1.6) for (let k = 0; k < 3; k++) {
        const a = t * 1.3 + k * 2.1, lx = cx + Math.cos(a) * W * 0.4;
        g.fillStyle = ["rgba(255,79,163,.18)", "rgba(46,196,182,.18)", "rgba(255,210,63,.18)"][k];
        g.beginPath(); g.moveTo(cx + (k - 1) * 50, 0); g.lineTo(lx - 18, H); g.lineTo(lx + 18, H); g.fill();
      }
      if (t > 1.2) { px(0, Math.round(H * 0.86) + 1, W, 1, "#ffffff"); danseuses.forEach((d) => danseuse(d, t)); }
      // notes de musique qui montent
      notes.forEach((n) => { const u = t - n.t0; if (u < 0 || u > 2.5) return; const y = H * 0.75 - u * 22; NOTE.forEach((row, j) => [...row].forEach((ch, i) => ch === "#" && px(n.x + i + Math.sin(u * 4) * 3, y + j, 1, 1, n.c))); });
      // explosion : éclair, boule de feu, onde, débris, fumée
      if (t < 0.12) px(0, 0, W, H, "#ffffff");
      if (t < 0.9) {
        const r = 6 + t * 40, feu = 30 * Math.sin((Math.PI * t) / 0.9);
        const disque = (R, c) => { for (let yy = -R; yy <= R; yy++) { const w = Math.round(Math.sqrt(Math.max(0, R * R - yy * yy))); px(cx - w, cy + yy, w * 2 + 1, 1, c); } };
        for (let k = 0; k < 4; k++) disque(Math.round(Math.max(0, feu * (1 - k * 0.22))), FEU[k + 1]);
        g.fillStyle = "#fff3a3"; for (let a = 0; a < 6.28; a += 0.12) px(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 1.4, 1, 1, "#fff3a3");
      }
      parts.forEach((p) => { if (t > p.vie) return; const k = t; px(p.x + p.vx * k, p.y + p.vy * k + 40 * k * k, p.s, p.s, t > p.vie * 0.7 ? FEU[6] : p.c); });
      if (t > 0.4 && t < 2.4) {
        const u = (t - 0.4) / 2, a = 1 - u;
        fumee.forEach((s) => { g.fillStyle = `rgba(110,110,120,${a * 0.8})`; const R = s.r + u * 8, X = cx + Math.cos(s.a) * (s.d + u * 18), Y = cy + Math.sin(s.a) * (s.d + u * 10) - u * 10; for (let yy = -R; yy <= R; yy += 2) { const w = Math.round(Math.sqrt(R * R - yy * yy)); px(X - w, Y + yy, w * 2, 2, g.fillStyle); } });
      }
      g.globalAlpha = 1;
      if (t < DUREE) requestAnimationFrame(image); else stop();
    }
    requestAnimationFrame(image);
  }

  /* =====================================================================
     Sons système rétro (coupés par défaut, haut-parleur dans la barre des tâches)
     Synthétisés avec Web Audio : aucun fichier à charger.
     ===================================================================== */
  var audio = null, sonsOn = false;
  try { sonsOn = localStorage.getItem("bvi-son") === "1"; } catch (_) {}
  function bip(f1, f2, duree, type = "square", vol = 0.06, delai = 0) {
    if (!audio) return;
    const t0 = audio.currentTime + delai, o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + duree);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
    o.connect(g).connect(audio.destination); o.start(t0); o.stop(t0 + duree + 0.02);
  }
  function son(nom) {
    if (!sonsOn || !audio) return;
    if (audio.state === "suspended") audio.resume();
    const S = {
      ouvre: () => { bip(330, 660, 0.09); bip(660, 990, 0.08, "square", 0.05, 0.07); },
      ferme: () => { bip(660, 220, 0.12); },
      reduit: () => { bip(520, 260, 0.1, "triangle", 0.08); },
      clic: () => { bip(1200, 900, 0.025, "square", 0.04); },
      demarrage: () => { [523, 659, 784, 1047].forEach((f, i) => bip(f, f, 0.16, "triangle", 0.07, i * 0.11)); },
      mange: () => { bip(880, 1320, 0.06, "square", 0.05); },
      boum: () => { bip(200, 40, 0.5, "sawtooth", 0.09); bip(120, 30, 0.6, "square", 0.06, 0.05); },
      gagne: () => { [659, 784, 988, 1319].forEach((f, i) => bip(f, f, 0.12, "square", 0.05, i * 0.1)); },
      drapeau: () => { bip(1500, 1500, 0.03, "square", 0.04); },
    };
    (S[nom] || (() => {}))();
  }
  const hp = el("button", "hp-btn");
  const dessinHP = () => {
    hp.innerHTML = `<svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M2 6h3l4-3h1v10H9L5 10H2z"/>${sonsOn ? '<path fill="currentColor" d="M12 5h1v1h-1zM13 6h1v4h-1zM12 10h1v1h-1z"/>' : '<path fill="currentColor" d="M11 6h1v1h-1zM14 6h1v1h-1zM12 7h2v2h-2zM11 9h1v1h-1zM14 9h1v1h-1z"/>'}</svg>`;
    setA(hp, "aria-label", sonsOn ? UI.sonsOn : UI.sonsOff); setA(hp, "title", sonsOn ? UI.sonsOn : UI.sonsOff);
    hp.classList.toggle("activeFF", sonsOn);
  };
  function basculerSons() {
    sonsOn = !sonsOn;
    try { localStorage.setItem("bvi-son", sonsOn ? "1" : "0"); } catch (_) {}
    if (sonsOn && !audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { sonsOn = false; } }
    dessinHP(); son("demarrage");
  }
  hp.addEventListener("click", basculerSons);
  $("#langs").before(hp, el("div", "line"));
  dessinHP();
  // le navigateur n'autorise le son qu'après un geste : on prépare l'audio au premier clic si les sons sont activés
  addEventListener("pointerdown", () => { if (sonsOn && !audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} } }, { once: true, capture: true });
  desktop.addEventListener("click", (e) => { if (e.target.closest(".folder")) son("clic"); });

  /* =====================================================================
     Icônes déplaçables sur le bureau (souris), positions mémorisées
     ===================================================================== */
  const CLE_ICONES = "bvi-icones";
  const idIcone = (f) => { const h = f.querySelector("h2"); return h ? String(h._t && h._t.fr ? h._t.fr : h._t || h.textContent) : ""; };
  let positions = {};
  try { positions = JSON.parse(localStorage.getItem(CLE_ICONES) || "{}") || {}; } catch (_) {}
  function modeLibre() {
    if (desktop.classList.contains("libre")) return;
    const r0 = desktop.getBoundingClientRect();
    const pos = [...desktop.children].map((f) => { const r = f.getBoundingClientRect(); return [f, r.left - r0.left + desktop.scrollLeft, r.top - r0.top + desktop.scrollTop]; });
    desktop.classList.add("libre");
    pos.forEach(([f, x, y]) => { f.style.left = x + "px"; f.style.top = y + "px"; });
  }
  function placer() {
    const ids = Object.keys(positions);
    if (!ids.length) return;
    modeLibre();
    const W = desktop.clientWidth, H = desktop.clientHeight;
    [...desktop.children].forEach((f) => {
      const p = positions[idIcone(f)];
      if (p) { f.style.left = clamp(p[0] * W, 0, W - f.offsetWidth) + "px"; f.style.top = clamp(p[1] * H, 0, H - f.offsetHeight) + "px"; }
    });
  }
  function ranger() {
    positions = {}; try { localStorage.removeItem(CLE_ICONES); } catch (_) {}
    desktop.classList.remove("libre");
    [...desktop.children].forEach((f) => { f.style.left = f.style.top = ""; });
  }
  if (matchMedia("(pointer: fine)").matches) {
    let glisse = null;
    desktop.addEventListener("pointerdown", (e) => {
      const f = e.target.closest(".folder"); if (!f || e.button !== 0) return;
      glisse = { f, x: e.clientX, y: e.clientY, bouge: false };
    });
    addEventListener("pointermove", (e) => {
      if (!glisse) return;
      const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y;
      if (!glisse.bouge && Math.hypot(dx, dy) < 6) return;
      if (!glisse.bouge) {
        modeLibre(); glisse.bouge = true;
        glisse.l = parseFloat(glisse.f.style.left) || 0; glisse.t = parseFloat(glisse.f.style.top) || 0;
        glisse.f.classList.add("en-main"); glisse.f.style.zIndex = 5;
      }
      const W = desktop.clientWidth, H = desktop.clientHeight;
      glisse.f.style.left = clamp(glisse.l + dx, 0, W - glisse.f.offsetWidth) + "px";
      glisse.f.style.top = clamp(glisse.t + dy, 0, H - glisse.f.offsetHeight) + "px";
    });
    addEventListener("pointerup", () => {
      if (!glisse) return;
      const g = glisse; glisse = null;
      if (!g.bouge) return;
      g.f.classList.remove("en-main"); g.f.style.zIndex = "";
      const snap = (v) => Math.round(v / 8) * 8;
      g.f.style.left = snap(parseFloat(g.f.style.left)) + "px"; g.f.style.top = snap(parseFloat(g.f.style.top)) + "px";
      [...desktop.children].forEach((f) => { positions[idIcone(f)] = [parseFloat(f.style.left) / desktop.clientWidth, parseFloat(f.style.top) / desktop.clientHeight]; });
      try { localStorage.setItem(CLE_ICONES, JSON.stringify(positions)); } catch (_) {}
      son("clic");
      // le clic qui suit un glisser ne doit pas ouvrir le dossier
      const bloque = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      g.f.addEventListener("click", bloque, { capture: true, once: true });
      setTimeout(() => g.f.removeEventListener("click", bloque, { capture: true }), 50);
    });
    addEventListener("resize", () => { if (desktop.classList.contains("libre")) placer(); });
    requestAnimationFrame(placer);
  }

  /* =====================================================================
     Clic droit sur le bureau : menu rétro
     ===================================================================== */
  const FONDS = ["anime", "noir", "damier", "points"];
  let fond = "anime";
  try { fond = localStorage.getItem("bvi-fond") || "anime"; } catch (_) {}
  const appliquerFond = () => { FONDS.forEach((f) => document.body.classList.toggle("fond-" + f, f === fond && f !== "anime")); };
  appliquerFond();
  let menu = null;
  const fermerMenu = () => { if (menu) { menu.remove(); menu = null; } };
  function ouvrirMenu(x, y) {
    fermerMenu();
    menu = el("div", "ctx");
    setA(menu, "role", "menu");
    const item = (txt, action, coche) => {
      const b = el("button", "ctx-i" + (coche ? " coche" : ""));
      setA(b, "role", "menuitem"); b.textContent = tr(txt);
      b.addEventListener("click", (e) => { e.stopPropagation(); fermerMenu(); son("clic"); action(); });
      menu.append(b);
    };
    const sep = () => menu.append(el("hr"));
    item(UI.actualiser, () => { [...desktop.children].forEach((f, i) => { f.classList.remove("in", "pose"); void f.offsetWidth; f.style.setProperty("--d", i * 0.06 + "s"); f.classList.add("in"); }); });
    const sous = el("div", "ctx-sous");
    const titre = el("div", "ctx-t"); titre.textContent = tr(UI.fondEcran) + " ▸"; sous.append(titre);
    const liste = el("div", "ctx-liste");
    FONDS.forEach((f) => { const b = el("button", "ctx-i" + (f === fond ? " coche" : "")); b.textContent = tr(UI.fonds[f]); b.addEventListener("click", (e) => { e.stopPropagation(); fond = f; try { localStorage.setItem("bvi-fond", f); } catch (_) {} appliquerFond(); fermerMenu(); son("clic"); }); liste.append(b); });
    sous.append(liste); menu.append(sous);
    if (matchMedia("(pointer: fine)").matches) item(UI.ranger, ranger);
    item(sonsOn ? UI.sonsOn : UI.sonsOff, basculerSons, sonsOn);
    sep();
    item(UI.apropos, aPropos);
    document.body.append(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = clamp(x, 4, innerWidth - r.width - 4) + "px";
    menu.style.top = clamp(y, 4, innerHeight - footerH() - r.height - 4) + "px";
    if (x + r.width + 180 > innerWidth) menu.classList.add("gauche");
  }
  // clic droit n'importe où sur le bureau (pas dans une fenêtre, la barre des tâches ou la visionneuse)
  addEventListener("contextmenu", (e) => {
    if (e.target.closest(".windows, footer, .modal-bg, .apropos, .ctx, .boom, .rick, .screensaver, a, input, textarea")) return;
    e.preventDefault(); ouvrirMenu(e.clientX, e.clientY);
  });
  addEventListener("pointerdown", (e) => { if (menu && !menu.contains(e.target)) fermerMenu(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") fermerMenu(); });

  function aPropos() {
    const id = "w-apropos";
    if (document.getElementById(id)) return;
    const v = el("div", "apropos"); v.id = id;
    setA(v, "role", "dialog"); setA(v, "aria-label", tr(UI.apropos));
    const barre = el("div", "apropos-barre"); barre.textContent = tr(UI.apropos);
    const x = el("button", "apropos-x"); x.textContent = "✕"; setA(x, "aria-label", tr(UI.close)); barre.append(x);
    const corps = el("div", "apropos-corps");
    const logo = el("img"); logo.src = A + "B6_round.png"; logo.alt = "";
    corps.append(logo);
    UI.aproposTexte.forEach((t, i) => { const p = el("p"); p.textContent = tr(t); if (i === 0) p.className = "gros"; corps.append(p); });
    const ok = el("button", "apropos-ok"); ok.textContent = "OK"; corps.append(ok);
    v.append(barre, corps); document.body.append(v);
    const fermer = () => { v.remove(); son("ferme"); };
    x.addEventListener("click", fermer); ok.addEventListener("click", fermer);
    son("ouvre"); ok.focus();
  }

  /* =====================================================================
     Jeux : démineur et snake, aux couleurs du site
     ===================================================================== */
  function renderJeu(node, content, win) {
    content.classList.add("jeu");
    if (node.jeu === "mines") demineur(content, win); else snake(content, win);
  }

  function demineur(content, win) {
    // 4 niveaux : seule la taille de la grille change (et le nombre de mines avec)
    const NIVEAUX = { facile: [9, 9, 10], moyen: [12, 12, 22], difficile: [16, 16, 40], extreme: [16, 30, 99] };
    let niveau = "facile";
    try { niveau = NIVEAUX[localStorage.getItem("bvi-mines")] ? localStorage.getItem("bvi-mines") : "facile"; } catch (_) {}
    let L, C, NB;
    const zone = el("div", "mines");
    const choix = el("div", "mines-niveaux");
    Object.keys(NIVEAUX).forEach((k) => {
      const b = setT(el("button", "mines-niv"), UI.niveaux[k]); b.dataset.niv = k;
      b.addEventListener("click", () => { niveau = k; try { localStorage.setItem("bvi-mines", k); } catch (_) {} son("clic"); nouvelle(); });
      choix.append(b);
    });
    zone.append(choix);
    const haut = el("div", "mines-haut");
    const cpt = el("span", "mines-cpt"), face = el("button", "mines-face"), chrono = el("span", "mines-cpt");
    haut.append(cpt, face, chrono);
    const grille = el("div", "mines-grille");
    zone.append(haut, grille); content.append(zone);
    let cases, fini, premier, drapeaux, t0, timer;
    const fmt = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, "0");
    function taille() {   // la grille tient dans la fenêtre : cases de 18 à 30 px
      const dispo = content.clientWidth - 40;
      const px = Math.max(18, Math.min(30, Math.floor(dispo / C) - 2));
      grille.style.setProperty("--m", px + "px");
      grille.style.gridTemplateColumns = `repeat(${C}, var(--m))`;
    }
    function nouvelle() {
      [L, C, NB] = NIVEAUX[niveau];
      if (content.clientWidth < 600 && C > L) [L, C] = [C, L];   // téléphone : la grande grille passe en hauteur
      choix.querySelectorAll("button").forEach((b) => b.classList.toggle("actif", b.dataset.niv === niveau));
      const h = { facile: 500, moyen: 600, difficile: 720, extreme: 720 }[niveau];
      if (innerWidth > 768) { win.style.height = Math.min(h, innerHeight - footerH() - 20) + "px"; if (C > 16) win.style.width = Math.min(980, innerWidth - 20) + "px"; }
      cases = []; fini = false; premier = true; drapeaux = 0; clearInterval(timer); t0 = 0;
      grille.textContent = ""; face.textContent = "B6"; face.className = "mines-face";
      cpt.textContent = fmt(NB); chrono.textContent = "000";
      for (let i = 0; i < L * C; i++) {
        const b = el("button", "m-c");
        const c = { b, mine: false, n: 0, vu: false, drap: false, i };
        b.addEventListener("click", () => decouvrir(c));
        b.addEventListener("contextmenu", (e) => { e.preventDefault(); marquer(c); });
        let appui;   // appui long sur téléphone = drapeau
        b.addEventListener("touchstart", () => { appui = setTimeout(() => { appui = "long"; marquer(c); }, 420); }, { passive: true });
        b.addEventListener("touchend", (e) => { if (appui === "long") e.preventDefault(); else clearTimeout(appui); appui = null; });
        b.addEventListener("touchmove", () => { clearTimeout(appui); appui = null; }, { passive: true });
        cases.push(c); grille.append(b);
      }
      requestAnimationFrame(taille);
    }
    if (window.ResizeObserver) new ResizeObserver(() => C && taille()).observe(content);
    const voisins = (c) => { const r = Math.floor(c.i / C), k = c.i % C, out = []; for (let dr = -1; dr <= 1; dr++) for (let dk = -1; dk <= 1; dk++) { if (!dr && !dk) continue; const rr = r + dr, kk = k + dk; if (rr >= 0 && rr < L && kk >= 0 && kk < C) out.push(cases[rr * C + kk]); } return out; };
    function poser(sauf) {   // le premier clic n'est jamais une mine
      const interdit = new Set([sauf, ...voisins(sauf)]);
      let n = 0; while (n < NB) { const c = cases[(Math.random() * cases.length) | 0]; if (c.mine || interdit.has(c)) continue; c.mine = true; n++; }
      cases.forEach((c) => (c.n = voisins(c).filter((v) => v.mine).length));
    }
    function marquer(c) {
      if (fini || c.vu) return;
      c.drap = !c.drap; drapeaux += c.drap ? 1 : -1;
      c.b.textContent = c.drap ? "⚑" : ""; c.b.classList.toggle("drap", c.drap);
      cpt.textContent = fmt(NB - drapeaux); son("drapeau");
    }
    // Clic sur un chiffre déjà découvert : si le bon nombre de drapeaux l'entoure, on découvre toutes les autres cases autour
    function accord(c) {
      const v = voisins(c);
      if (!c.n || v.filter((x) => x.drap).length !== c.n) return;
      const aOuvrir = v.filter((x) => !x.drap && !x.vu);
      if (!aOuvrir.length) return;
      const mine = aOuvrir.find((x) => x.mine);
      if (mine) { perdu(mine); return; }
      aOuvrir.forEach((x) => ouvrir(x));
      son("clic"); verifier();
    }
    function ouvrir(c) {
      const pile = [c];
      while (pile.length) {
        const x = pile.pop(); if (x.vu || x.drap) continue;
        x.vu = true; x.b.classList.add("vu");   // pas désactivée : un chiffre reste cliquable (découverte des voisins)
        if (x.n) { x.b.textContent = x.n; x.b.dataset.n = x.n; } else voisins(x).forEach((v) => !v.vu && pile.push(v));
      }
    }
    function verifier() {
      if (cases.every((x) => x.mine || x.vu)) { fini = true; clearInterval(timer); face.textContent = "B6 ✓"; face.classList.add("gagne"); cases.forEach((x) => { if (x.mine) { x.b.textContent = "⚑"; x.b.classList.add("drap"); } }); cpt.textContent = "000"; son("gagne"); }
    }
    function decouvrir(c) {
      if (fini || c.drap) return;
      if (c.vu) { accord(c); return; }
      if (premier) { premier = false; poser(c); t0 = Date.now(); timer = setInterval(() => { if (!content.isConnected) clearInterval(timer); else chrono.textContent = fmt(Math.floor((Date.now() - t0) / 1000)); }, 500); }
      if (c.mine) { perdu(c); return; }
      ouvrir(c);
      son("clic"); verifier();
    }
    function perdu(c) {
      fini = true; clearInterval(timer); face.textContent = "x_x"; face.classList.add("perdu");
      cases.forEach((x) => { if (x.mine) { x.b.textContent = "✸"; x.b.classList.add("mine"); } else if (x.drap) x.b.classList.add("faux"); });
      c.b.classList.add("boum"); son("boum");
    }
    face.addEventListener("click", () => { son("clic"); nouvelle(); });
    setA(face, "aria-label", tr(UI.rejouer));
    nouvelle();
  }

  function snake(content, win) {
    win.style.height = Math.min(480, innerHeight - footerH() - 20) + "px";
    const COL = 21, LIG = 15, P = 16;
    const zone = el("div", "snake");
    const info = el("div", "snake-info");
    const score = el("span"), record = el("span");
    info.append(score, record);
    const cv = el("canvas", "snake-cv"); cv.width = COL * P; cv.height = LIG * P; cv.tabIndex = 0;
    const aide = el("p", "snake-aide"); aide.textContent = tr(UI.snakeAide);
    const pad = el("div", "snake-pad");
    [["↑", 0, -1], ["←", -1, 0], ["↓", 0, 1], ["→", 1, 0]].forEach(([t, dx, dy]) => { const b = el("button"); b.textContent = t; b.addEventListener("click", () => tourner(dx, dy)); pad.append(b); });
    zone.append(info, cv, aide, pad); content.append(zone);
    const g = cv.getContext("2d");
    const logo = new Image(); logo.src = A + "B6_round_small.png";
    let serpent, dir, prochaine, pomme, pts, enJeu, mort, dernier = 0, vitesse;
    let best = 0; try { best = +localStorage.getItem("bvi-snake") || 0; } catch (_) {}
    const majInfo = () => { score.textContent = "score " + pts; record.textContent = tr(UI.meilleur) + " " + best; };
    function depart() { serpent = [[5, 7], [4, 7], [3, 7]]; dir = [1, 0]; prochaine = [1, 0]; pts = 0; vitesse = 140; mort = false; enJeu = false; placerPomme(); majInfo(); }
    function placerPomme() { do { pomme = [(Math.random() * COL) | 0, (Math.random() * LIG) | 0]; } while (serpent.some(([x, y]) => x === pomme[0] && y === pomme[1])); }
    function tourner(dx, dy) {
      if (mort) { depart(); }
      if (dx === -dir[0] && dy === -dir[1] && serpent.length > 1) return;
      prochaine = [dx, dy]; if (!enJeu) { enJeu = true; aide.classList.add("cache"); }
    }
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#625aff";
    function dessiner() {
      const a = accent();
      g.fillStyle = "#121212"; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = "#1e1e1e"; for (let x = 0; x < COL; x++) for (let y = 0; y < LIG; y++) if ((x + y) % 2) g.fillRect(x * P, y * P, P, P);
      if (logo.complete) g.drawImage(logo, pomme[0] * P + 1, pomme[1] * P + 1, P - 2, P - 2); else { g.fillStyle = "#fff"; g.fillRect(pomme[0] * P + 4, pomme[1] * P + 4, P - 8, P - 8); }
      serpent.forEach(([x, y], i) => { g.fillStyle = i ? a : "#ffffff"; g.fillRect(x * P + 1, y * P + 1, P - 2, P - 2); });
      const [hx, hy] = serpent[0]; g.fillStyle = "#000"; g.fillRect(hx * P + 5 + dir[0] * 3, hy * P + 5 + dir[1] * 3, 3, 3); g.fillRect(hx * P + 9 + dir[0] * 3 - (dir[1] ? 0 : 0), hy * P + 9 + dir[1] * 3, 3, 3);
      if (mort) {
        g.fillStyle = "rgba(0,0,0,.65)"; g.fillRect(0, 0, cv.width, cv.height);
        g.fillStyle = "#fff"; g.font = "20px PxGroteskScreen, monospace"; g.textAlign = "center";
        g.fillText(tr(UI.perdu) + "  " + pts, cv.width / 2, cv.height / 2 - 6);
        g.font = "13px PxGroteskScreen, monospace"; g.fillText(tr(UI.rejouer) + " : ↑ ↓ ← →", cv.width / 2, cv.height / 2 + 18);
      }
    }
    function pas() {
      dir = prochaine;
      const t = [serpent[0][0] + dir[0], serpent[0][1] + dir[1]];
      if (t[0] < 0 || t[1] < 0 || t[0] >= COL || t[1] >= LIG || serpent.some(([x, y]) => x === t[0] && y === t[1])) {
        mort = true; enJeu = false; son("boum");
        if (pts > best) { best = pts; try { localStorage.setItem("bvi-snake", best); } catch (_) {} }
        majInfo(); return;
      }
      serpent.unshift(t);
      if (t[0] === pomme[0] && t[1] === pomme[1]) { pts++; vitesse = Math.max(60, vitesse - 4); placerPomme(); son("mange"); majInfo(); }
      else serpent.pop();
    }
    function boucle(now) {
      if (!cv.isConnected) return;
      if (enJeu && !mort && now - dernier > vitesse) { dernier = now; pas(); }
      dessiner(); requestAnimationFrame(boucle);
    }
    const touches = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], z: [0, -1], s: [0, 1], q: [-1, 0], d: [1, 0], w: [0, -1], a: [-1, 0] };
    const clavier = (e) => {
      if (!cv.isConnected) { removeEventListener("keydown", clavier); return; }
      if (!win.classList.contains("active-w") || win.classList.contains("minimized")) return;
      const d = touches[e.key]; if (!d) return;
      e.preventDefault(); tourner(d[0], d[1]);
    };
    addEventListener("keydown", clavier);
    let tx = 0, ty = 0;   // glisser du doigt
    cv.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    cv.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; if (Math.abs(dx) > Math.abs(dy)) tourner(Math.sign(dx), 0); else tourner(0, Math.sign(dy)); });
    cv.addEventListener("click", () => cv.focus());
    depart(); requestAnimationFrame(boucle);
  }
})();
