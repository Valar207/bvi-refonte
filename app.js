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
  const walk = (nodes) => nodes.forEach((n) => { n.id = "w" + uid++; if (n.children) walk(n.children); });
  walk(SITE);
  CONTACT.id = "w-contact";
  CONTACT.isContact = true;

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
  const makeIcon = (node, icon) => {
    const f = el("div", "folder folder-item");
    f.tabIndex = 0;
    f.setAttribute("role", "button");
    const im = el("img");
    im.src = A + icon;
    im.alt = "";
    f.append(im, setT(el("h2"), node.name));
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
    focusWin(node.id);

    if (node.isContact) renderContact(content, true);
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
      im.onload = im.onerror = () => th.classList.add("loaded");
      im.src = it.src;
      th.append(im);
      card.append(th);
      if (it.title) card.append(setT(el("h2"), it.title));
      card.addEventListener("click", () => openLightbox(node, idx));
      left.append(card);
    });
    (node.children || []).forEach((child) => {
      const f = el("div", "foldersInW folder-item");
      f.style.setProperty("--d", 0.18 + i++ * 0.05 + "s");
      const im = el("img");
      im.src = A + "dossier.png";
      im.alt = "";
      f.append(im, setT(el("h2"), child.name));
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
    const it = lbItems[lbIndex];
    const token = ++lbToken;
    counter.innerHTML = `<b class="tick">${lbIndex + 1}</b> / ${n}`;
    const ready = preload(it.src);
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
      if (n > 1) { preload(lbItems[(lbIndex + 1) % n].src); preload(lbItems[(lbIndex - 1 + n) % n].src); }
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
    requestAnimationFrame(() => (lbOpen = true));
  }

  function closeLightbox() {
    lb.classList.remove("bg-active");
    lbOpen = false;
    lbToken++;
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

  /* ---------- Économiseur d'écran (B6 qui rebondit) ---------- */
  const saver = $("#saver"), logo = $("img", saver);
  let idle, sx = 80, sy = 80, svx = 2.2, svy = 1.8, hue = 0, sRaf = 0;
  const bounce = () => {
    const W = innerWidth - 120, H = innerHeight - 120;
    sx += svx; sy += svy;
    let hit = false;
    if (sx <= 0 || sx >= W) { svx *= -1; sx = clamp(sx, 0, W); hit = true; }
    if (sy <= 0 || sy >= H) { svy *= -1; sy = clamp(sy, 0, H); hit = true; }
    if (hit) { hue = (hue + 67) % 360; logo.style.filter = `hue-rotate(${hue}deg) saturate(3)`; }
    logo.style.transform = `translate(${sx}px, ${sy}px) rotate(${sx * 0.5}deg)`;
    sRaf = requestAnimationFrame(bounce);
  };
  const wake = () => {
    if (saver.classList.contains("on")) { saver.classList.remove("on"); cancelAnimationFrame(sRaf); }
    clearTimeout(idle);
    if (!reduced) idle = setTimeout(() => { saver.classList.add("on"); sRaf = requestAnimationFrame(bounce); }, 90000);
  };
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
})();
