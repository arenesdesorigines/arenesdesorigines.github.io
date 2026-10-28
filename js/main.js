/* Arène des Origines · script unique, sans dépendance */

/* ---------- Téléchargements : remplis ces adresses quand elles existent ----------
   Dès qu'une adresse https est renseignée, le bouton et son badge deviennent actifs tout seuls.
   Pour l'APK, le plus simple : créer une « Release » sur ce dépôt GitHub, y joindre le fichier
   (ex. arene-des-origines.apk) et coller ici :
   https://github.com/<compte>/<depot>/releases/latest/download/arene-des-origines.apk */
const DOWNLOADS = {
  apk: "",
  play: "",
  appstore: ""
};

(() => {
  const labels = {apk: "Télécharger l'APK", play: "Ouvrir Google Play", appstore: "Ouvrir l'App Store"};
  let apk = false;
  for (const [cle, url] of Object.entries(DOWNLOADS)) {
    if (!/^https:\/\//.test(url)) continue;
    document.querySelectorAll('[data-dl="' + cle + '"]').forEach(b => {
      b.href = url; b.textContent = labels[cle]; b.removeAttribute("aria-disabled"); b.hidden = false; b.classList.remove("sec"); b.rel = "noopener";
    });
    document.querySelectorAll('[data-badge="' + cle + '"]').forEach(g => { g.textContent = "Disponible"; g.className = "badge ok"; });
    if (cle === "apk") apk = true;
  }
  if (apk) document.querySelectorAll("[data-hero-dl]").forEach(b => { b.textContent = "Télécharger l'APK"; });
})();

/* ---------- Menu sur téléphone ---------- */
(() => {
  const b = document.getElementById("burger"), m = document.getElementById("menu");
  if (!b || !m) return;
  const fermer = () => { m.classList.remove("ouvert"); b.setAttribute("aria-expanded", "false"); b.textContent = "☰"; };
  b.addEventListener("click", () => {
    const o = m.classList.toggle("ouvert");
    b.setAttribute("aria-expanded", String(o)); b.textContent = o ? "✕" : "☰";
  });
  m.addEventListener("click", e => { if (e.target.closest("a")) fermer(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") fermer(); });
})();

/* ---------- Musique d'ambiance : essaie de démarrer toute seule (si le navigateur l'autorise),
   sinon au premier appui ; se coupe avec le bouton 🔊, la ligne « Musique » de l'accueil ou l'image de Ragnar ---------- */
const musique = (() => {
  const audio = document.getElementById("bgMusic");
  const btn = document.getElementById("musicBtn");
  const note = document.getElementById("musicNote");
  const boutons = Array.from(document.querySelectorAll("#musicBtn, [data-music-toggle]"));
  if (!audio || !boutons.length) return {pause() {}};
  let voulu = true;
  try { voulu = localStorage.getItem("musique") !== "off"; } catch (e) {}
  const garder = v => { try { localStorage.setItem("musique", v); } catch (e) {} };
  audio.volume = 0.35;
  const maj = () => {
    const joue = !audio.paused;
    if (btn) {
      btn.setAttribute("aria-pressed", String(joue));
      btn.setAttribute("aria-label", joue ? "Couper la musique" : "Activer la musique");
      btn.textContent = joue ? "🔊" : "🔇";
    }
    document.querySelectorAll(".art-music .mi").forEach(i => { i.textContent = joue ? "🔊" : "🔇"; });
    if (note) note.textContent = joue ? "🔊 Musique activée · touche ici pour la couper"
      : (voulu ? "🔇 Touche ici pour lancer la musique" : "🔇 Musique coupée · touche ici pour la relancer");
  };
  const lancer = async () => { try { await audio.play(); } catch (e) {} maj(); };
  boutons.forEach(b => b.addEventListener("click", e => {
    e.preventDefault();
    if (!audio.paused) { voulu = false; garder("off"); audio.pause(); }
    else { voulu = true; garder("on"); lancer(); }
    maj();
  }));
  ["play", "pause", "ended"].forEach(ev => audio.addEventListener(ev, maj));
  audio.addEventListener("error", () => { if (note) note.textContent = "Musique indisponible pour le moment."; });
  if (voulu) {
    // Essai de démarrage automatique une fois la page chargée (le fichier n'est téléchargé qu'à ce moment-là).
    const auto = () => { if (voulu && audio.paused && !videoJoue()) lancer(); };
    if (document.readyState === "complete") setTimeout(auto, 300); else window.addEventListener("load", () => setTimeout(auto, 300), {once: true});
    // Les navigateurs refusent souvent un son sans geste : on relance au premier appui (sauf sur la vidéo ou un bouton musique).
    const evs = ["pointerdown", "keydown"];
    const retirer = () => evs.forEach(ev => window.removeEventListener(ev, premier, true));
    const premier = e => {
      const t = e && e.target && e.target.closest ? e.target : null;
      if (t && t.closest("#musicBtn, [data-music-toggle]")) { retirer(); return; }
      if (t && t.closest(".hero-video")) { retirer(); return; }
      retirer(); if (voulu && audio.paused && !videoJoue()) lancer();
    };
    evs.forEach(ev => window.addEventListener(ev, premier, true));
  }
  maj();
  return {pause() { if (!audio.paused) audio.pause(); }};
})();

/* ---------- Bande-annonce v2 : se charge seulement quand on appuie sur lecture ----------
   La vidéo est découpée en morceaux de moins de 2,4 Mo (video/v2/, liste dans parties.json) :
   - Safari / iPhone : lecture native du flux HLS (index.m3u8) ;
   - les autres navigateurs : les morceaux (init.mp4 + segNN.m4s) sont recollés ici en une vidéo.
   Si quelque chose échoue, on lit l'ancienne bande-annonce (data-repli). */
function videoJoue() { const v = document.getElementById("trailer"); return v && !v.paused; }
(() => {
  const v = document.getElementById("trailer"), p = document.getElementById("trailerPlay");
  if (!v) return;
  const lbl = p ? p.querySelector("em") : null, txt0 = lbl ? lbl.textContent : "";
  let pret = !v.dataset.parties, enCours = false;
  const dire = t => { if (lbl) lbl.textContent = t; };
  const lancer = () => {
    v.controls = true;
    const r = v.play();
    if (p) p.hidden = true;
    if (r && r.catch) r.catch(() => { if (p) { p.hidden = false; dire("Prête ! Touche pour lancer"); } });
  };
  const charger = async () => {
    if (pret) return lancer();
    if (enCours) return;
    enCours = true; dire("Chargement… 0 %");
    try {
      const base = v.dataset.parties.replace(/[^/]*$/, "");
      const man = await (await fetch(v.dataset.parties, {cache: "no-cache"})).json();
      if (man.hls && v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = base + man.hls; pret = true; enCours = false; dire(txt0); return lancer();
      }
      const tot = man.parties.reduce((a, x) => a + x.taille, 0);
      let fait = 0;
      const morceaux = await Promise.all(man.parties.map(async x => {
        const r = await fetch(base + x.fichier);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const b = await r.blob();
        if (b.size !== x.taille) throw new Error("taille");
        fait += x.taille; dire("Chargement… " + Math.round(fait * 100 / tot) + " %");
        return b;
      }));
      v.src = URL.createObjectURL(new Blob(morceaux, {type: "video/mp4"}));
    } catch (e) {
      v.src = v.dataset.repli || "video/bande-annonce.mp4";
    }
    pret = true; enCours = false; dire(txt0);
    lancer();
  };
  if (p) p.addEventListener("click", charger);
  v.addEventListener("error", () => {
    const repli = v.dataset.repli || "video/bande-annonce.mp4";
    if (v.dataset.parties && !v.src.endsWith(repli)) { v.src = repli; lancer(); }
  });
  v.addEventListener("play", () => { musique.pause(); if (p) p.hidden = true; });
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

/* ---------- Captures : agrandissement ---------- */
(() => {
  const dlg = document.getElementById("lightbox"), img = document.getElementById("lbImg"), cap = document.getElementById("lbCap");
  if (!dlg) return;
  document.querySelectorAll(".shot").forEach(b => b.addEventListener("click", () => {
    const src = b.dataset.full || b.querySelector("img").currentSrc || b.querySelector("img").src;
    img.src = src; img.alt = b.dataset.cap || ""; cap.textContent = b.dataset.cap || "";
    if (dlg.showModal) dlg.showModal(); else window.open(src, "_blank");
  }));
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
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
    msg.textContent = "Ton application e-mail devrait s'ouvrir. Si rien ne se passe, écris à arenedesorigines@gmail.com.";
  });
})();
