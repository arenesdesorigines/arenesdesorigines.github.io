/* Arène des Origines · script unique, sans dépendance */

/* ---------- Lien Google Play ----------
   Le jour de la sortie, coller ici l'adresse de la fiche Google Play (https://play.google.com/store/apps/details?id=...). */
const DOWNLOADS = {
  play: "https://play.google.com/store/apps/details?id=com.amar.arenedesorigines",
  apple: "https://apps.apple.com/fr/app/ar%C3%A8nes-des-origines/id6832243086"
};

(() => {
  for (const [cle, url] of Object.entries(DOWNLOADS)) {
    if (!/^https:\/\//.test(url)) continue;
    document.querySelectorAll('[data-dl="' + cle + '"]').forEach(b => {
      b.href = url;
      b.target = "_blank";
      const isApple = cle === "apple";
      if (document.documentElement.lang === "en") {
        b.textContent = isApple ? "Download on the App Store" : "Download on Google Play";
      } else {
        b.textContent = isApple ? "Télécharger sur l'App Store" : "Télécharger sur Google Play";
      }
      b.removeAttribute("aria-disabled");
      b.hidden = false;
      b.classList.remove("sec");
      b.rel = "noopener";
    });
    document.querySelectorAll('[data-badge="' + cle + '"]').forEach(g => {
      g.textContent = (document.documentElement.lang === "en") ? "Available" : "Déjà disponible";
      g.className = "badge ok";
    });
  }
})();

/* Navigation sticky : repli au clavier, en dehors du menu et au changement de largeur. */
(() => {
  const b = document.getElementById('burger'), m = document.getElementById('menu');
  if (!b || !m) return;
  const set = open => {
    m.classList.toggle('ouvert', open);
    b.setAttribute('aria-expanded', String(open)); b.textContent = open ? '✕' : '☰';
  };
  b.addEventListener('click', () => set(!m.classList.contains('ouvert')));
  m.addEventListener('click', e => {
    const link = e.target.closest('a'); if (!link) return;
    const target = link.hash && document.getElementById(link.hash.slice(1));
    if (m.classList.contains('ouvert')) { set(false); if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); } }
  });
  document.addEventListener('pointerdown', e => { if (!b.contains(e.target) && !m.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.classList.contains('ouvert')) { set(false); b.focus(); } });
  matchMedia('(max-width: 1279px)').addEventListener('change', () => set(false));
})();

/* Aucun démarrage automatique, pas même au premier tap ni après un ancien choix enregistré. */
const musique = (() => {
  const audio = document.getElementById('bgMusic');
  const boutons = Array.from(document.querySelectorAll('#musicBtn, [data-music-toggle]'));
  if (!audio || !boutons.length) return {pause() {}};
  const en = document.documentElement.lang === 'en';
  audio.volume = .35;
  const note = document.getElementById('music-status');
  let playingRequest = 0, pending = false;
  const maj = () => {
    const joue = !audio.paused;
    boutons.forEach(b => {
      b.setAttribute('aria-pressed', String(joue));
      b.setAttribute('aria-label', joue ? (en ? 'Mute the music' : 'Couper la musique') : (en ? 'Play the music' : 'Activer la musique'));
      if (b.id === 'musicBtn') b.textContent = joue ? '♫' : '♪';
    });
  };
  const pause = () => { playingRequest++; pending=false; audio.pause(); maj(); };
  const toggle = async () => {
    if (!audio.paused || pending) return pause();
    const id = ++playingRequest; pending = true;
    if (note) note.textContent = '';
    try { await audio.play(); }
    catch (error) { if (id === playingRequest && note) note.textContent = en ? 'Music is unavailable.' : 'Musique indisponible.'; }
    finally { if (id === playingRequest) pending = false; maj(); }
  };
  boutons.forEach(b => b.addEventListener('click',toggle));
  ['play','pause','ended'].forEach(ev => audio.addEventListener(ev,maj));
  maj(); return {pause};
})();

/* ---------- Fiches des combattants ---------- */
(() => {
  const dlg = document.getElementById("fiche-dlg"), zone = document.getElementById("fiche-zone");
  if (!dlg || !zone) return;
  let retour = null;
  const ouvrir = li => {
    const f = li.querySelector(".fiche");
    if (!f) return;
    zone.innerHTML = f.innerHTML;
    const titre = zone.querySelector('.fiche-titre'); if (titre) titre.id = 'fiche-titre';
    zone.querySelectorAll("img[data-src]").forEach(i => { i.src = i.dataset.src; i.removeAttribute("data-src"); });
    retour = li.querySelector(".f-btn");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    if (history.replaceState) history.replaceState(null, "", "#" + li.id);
  };
  document.querySelectorAll(".roster .f-btn").forEach(b => b.addEventListener("click", () => ouvrir(b.closest("li"))));
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => {
    if (history.replaceState && /^#perso-/.test(location.hash)) history.replaceState(null, "", "#personnages");
    if (retour) retour.focus();
  });
  const h = location.hash.slice(1);
  if (/^perso-/.test(h)) { const li = document.getElementById(h); if (li) ouvrir(li); }
})();

/* ---------- Captures : agrandissement et parcours clavier de la galerie ---------- */
(() => {
  const dlg = document.getElementById("lightbox"), img = document.getElementById("lbImg"), cap = document.getElementById("lbCap");
  if (!dlg) return;
  const en = document.documentElement.lang === "en";
  const shots = Array.from(document.querySelectorAll("#galerie .shot"));
  const controls = document.createElement("div");
  controls.className = "lightbox-gallery"; controls.hidden = true;
  const count = document.createElement("span");
  count.setAttribute("role", "status");
  let pos = -1, retour = null;
  const draw = b => {
    const photo = b.querySelector("img");
    img.src = b.dataset.full || photo.dataset.full || photo.currentSrc || photo.src;
    img.alt = b.dataset.cap || ""; cap.textContent = b.dataset.cap || "";
    if (pos >= 0) count.textContent = `${pos + 1} / ${shots.length}`;
  };
  const move = direction => {
    if (pos < 0) return;
    pos = (pos + direction + shots.length) % shots.length;
    draw(shots[pos]);
  };
  [["‹",en ? "Previous image" : "Image précédente",-1],["›",en ? "Next image" : "Image suivante",1]].forEach(([glyph,label,dir],i) => {
    const bt = document.createElement("button");
    bt.type = "button"; bt.textContent = glyph; bt.setAttribute("aria-label", label);
    bt.addEventListener("click", () => move(dir)); controls.appendChild(bt);
    if (i === 0) controls.appendChild(count);
  });
  dlg.appendChild(controls);
  document.querySelectorAll(".shot").forEach(b => b.addEventListener("click", () => {
    pos = shots.indexOf(b); retour = b;
    controls.hidden = pos < 0;
    draw(b);
    if (dlg.showModal) dlg.showModal(); else window.open(img.src, "_blank");
  }));
  dlg.addEventListener("keydown", e => {
    if (pos >= 0 && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault(); move(e.key === "ArrowLeft" ? -1 : 1);
    }
  });
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => { if (retour) retour.focus({preventScroll:true}); });
})();

/* ---------- Formulaire : prépare un e-mail (rien n'est envoyé par le site) ---------- */
(() => {
  const form = document.getElementById("formSuggestion"), msg = document.getElementById("formMsg");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(form);
    const sujet = "[Arène des Origines] " + d.get("type");
    const corps = "Pseudo : " + d.get("pseudo") + "\nType : " + d.get("type") + "\n\n" + d.get("details");
    window.location.href = "mailto:arenedesorigines@gmail.com?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
    msg.textContent = (document.documentElement.lang==="en") ? "Your email app should open. If nothing happens, write to arenedesorigines@gmail.com." : "Ton application e-mail devrait s'ouvrir. Si rien ne se passe, écris à arenedesorigines@gmail.com.";
  });
})();

/* ---------- Bande-annonce : démarre au clic, arrête et rend le focus à la fermeture ---------- */
(() => {
  const c = document.getElementById("trailerYT");
  if (!c) return;
  const img = c.querySelector(".yt-affiche"), b = c.querySelector(".video-play");
  if (!b || !img) return;
  const en = document.documentElement.lang === "en";
  const fermer = document.createElement("button");
  fermer.type = "button";
  fermer.className = "trailer-close";
  fermer.textContent = en ? "Close ✕" : "Fermer ✕";
  fermer.setAttribute("aria-label", en ? "Close the trailer" : "Fermer la bande-annonce");
  fermer.hidden = true;
  c.appendChild(fermer);
  let f = null;
  const arreter = () => {
    if (!f) return;
    f.remove(); f = null;
    window.ytLancee = false;
    fermer.hidden = true;
    img.hidden = false; b.hidden = false;
    b.focus({preventScroll:true});
  };
  b.addEventListener("click", () => {
    if (f) return;
    f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + c.dataset.yt + "?autoplay=1&rel=0&playsinline=1";
    f.title = en ? "Arenas of Origins: official trailer" : "Arènes des Origines : bande-annonce officielle";
    f.width = 540; f.height = 960;
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.allowFullscreen = true;
    window.ytLancee = true;
    musique.pause();
    img.hidden = true; b.hidden = true;
    c.insertBefore(f, fermer);
    fermer.hidden = false;
    fermer.focus({preventScroll:true});
  });
  fermer.addEventListener("click", arreter);
  c.addEventListener("keydown", e => { if (e.key === "Escape" && f) arreter(); });
})();
