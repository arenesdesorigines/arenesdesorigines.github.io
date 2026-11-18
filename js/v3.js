/* Vitrine : flèches des carrousels, téléchargement mobile, images repliées. */
(function(){
  "use strict";
  var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // flèches des carrousels (ordinateur)
  document.querySelectorAll(".carrousel").forEach(function(c){
    if(c.closest("#galerie")) return;
    var nav = document.createElement("div"); nav.className = "car-nav";
    ((document.documentElement.lang==="en") ? [["‹","Previous",-1],["›","Next",1]] : [["‹","Précédent",-1],["›","Suivant",1]]).forEach(function(b){
      var bt = document.createElement("button"); bt.type = "button"; bt.textContent = b[0]; bt.setAttribute("aria-label", b[1]);
      bt.addEventListener("click", function(){ c.scrollBy({left: b[2] * c.clientWidth * 0.9, behavior: reduit ? "auto" : "smooth"}); });
      nav.appendChild(bt);
    });
    c.parentNode.insertBefore(nav, c.nextSibling);
  });
  // Raccourci de téléchargement, uniquement hors accueil, stores et pied de page.
  var cta = document.getElementById("ctaFlottant"), hero = document.getElementById("accueil"), stores = document.getElementById("telecharger"), pied = document.querySelector("footer");
  if (cta && hero && stores && pied && "IntersectionObserver" in window) {
    var rel = [hero, stores, pied];
    var masques = new Set(rel); // Ne rien afficher avant d'avoir reçu le premier relevé.
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting) masques.add(e.target); else masques.delete(e.target); });
      cta.hidden = masques.size > 0;
    });
    stores.tabIndex = -1;
    rel.forEach(function(el){ io.observe(el); });
  }
  // contenus repliés : leurs images se chargent dès l'ouverture (WebKit/Safari ne les chargeait pas toujours en « lazy »)
  document.querySelectorAll("details").forEach(function(d){
    d.addEventListener("toggle", function(){ if (d.open) d.querySelectorAll('img[loading="lazy"]').forEach(function(i){ i.loading = "eager"; }); });
  });
  // images sous la ligne de flottaison (loading="lazy") : filet de sécurité pour WebKit/Safari,
  // qui ne les déclenche pas toujours. On les passe en "eager" à l'approche de l'écran, et au plus tard
  // peu après le chargement de la page (sauf celles des blocs repliés, gérées à l'ouverture ci-dessus).
  (function(){
    function charger(i){ if (i.loading === "lazy") i.loading = "eager"; }
    var lz = [].slice.call(document.querySelectorAll('img[loading="lazy"]'));
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { charger(e.target); io.unobserve(e.target); } }); }, { rootMargin: "900px 900px" });
      lz.forEach(function(i){ io.observe(i); });
    }
    window.addEventListener("load", function(){ setTimeout(function(){ lz.forEach(function(i){ if (!i.closest("details:not([open])")) charger(i); }); }, 1500); });
  })();
})();
