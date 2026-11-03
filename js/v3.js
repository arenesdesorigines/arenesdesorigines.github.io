/* v3 : apparitions douces, flèches des carrousels, bouton flottant « S'inscrire » */
(function(){
  "use strict";
  var reduit = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // apparitions
  if ("IntersectionObserver" in window && !reduit) {
    document.documentElement.classList.add("js-rv");
    var cibles = document.querySelectorAll("main section:not(.hero3) h2, main section:not(.hero3) .lead, .carte, .roster li, .galerie figure, .shorts li, .plus3");
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting || e.boundingClientRect.top < 0){ e.target.classList.add("in"); io.unobserve(e.target);} }); }, {rootMargin:"0px 0px 6% 0px", threshold:0.05});
    cibles.forEach(function(el){ el.classList.add("rv"); io.observe(el); });
    // saut d'ancre ou défilement rapide : tout ce qui est déjà passé au-dessus apparaît aussi
    var att = false;
    var balaye = function(){ att = false; var lim = window.innerHeight * 1.02; cibles.forEach(function(el){ if (!el.classList.contains("in") && el.getBoundingClientRect().top < lim) el.classList.add("in"); }); };
    window.addEventListener("scroll", function(){ if (!att){ att = true; requestAnimationFrame(balaye); } }, {passive:true});
    window.addEventListener("hashchange", balaye);
    setTimeout(function(){ cibles.forEach(function(el){ el.classList.add("in"); }); }, 8000); // filet de sécurité
  }
  // flèches des carrousels (ordinateur)
  document.querySelectorAll(".carrousel").forEach(function(c){
    var nav = document.createElement("div"); nav.className = "car-nav";
    [["‹","Précédent",-1],["›","Suivant",1]].forEach(function(b){
      var bt = document.createElement("button"); bt.type = "button"; bt.textContent = b[0]; bt.setAttribute("aria-label", b[1]);
      bt.addEventListener("click", function(){ c.scrollBy({left: b[2] * c.clientWidth * 0.9, behavior: reduit ? "auto" : "smooth"}); });
      nav.appendChild(bt);
    });
    c.parentNode.insertBefore(nav, c.nextSibling);
  });
  // bouton flottant : visible après le héros, caché quand le formulaire est à l'écran
  var cta = document.getElementById("ctaFlottant"), hero = document.getElementById("accueil"), insc = document.getElementById("inscription"), pied = document.querySelector("footer");
  if (cta && hero && insc && "IntersectionObserver" in window) {
    var etat = {hero:true, insc:false, pied:false};
    var maj = function(){ cta.classList.toggle("vu", !etat.hero && !etat.insc && !etat.pied); };
    new IntersectionObserver(function(es){ es.forEach(function(e){ var k = e.target === hero ? "hero" : (e.target === insc ? "insc" : "pied"); etat[k] = e.isIntersecting; }); maj(); }).observe(hero);
    var io2 = new IntersectionObserver(function(es){ es.forEach(function(e){ var k = e.target === insc ? "insc" : "pied"; etat[k] = e.isIntersecting; }); maj(); });
    io2.observe(insc); if (pied) io2.observe(pied);
  }
  // bulle « Touche Ragnar pour le son » : texte selon l'état de la musique, disparaît au premier toucher de Ragnar
  var bulle = document.getElementById("bulleSon"), rag = document.querySelector(".ragnar3-btn"), aud = document.getElementById("bgMusic");
  if (bulle && rag) {
    var majBulle = function(){ if (aud) bulle.textContent = aud.paused ? "🔊 Touche Ragnar pour le son" : "🔇 Touche Ragnar pour couper le son"; };
    if (aud) ["play","pause"].forEach(function(ev){ aud.addEventListener(ev, majBulle); });
    rag.addEventListener("click", function(){ bulle.classList.add("parti"); rag.classList.add("touche"); setTimeout(function(){ bulle.hidden = true; }, 450); });
  }
  // contenus repliés : leurs images se chargent dès l'ouverture (WebKit/iPhone ne les chargeait pas toujours en « lazy »)
  document.querySelectorAll("details").forEach(function(d){
    d.addEventListener("toggle", function(){ if (d.open) d.querySelectorAll('img[loading="lazy"]').forEach(function(i){ i.loading = "eager"; }); });
  });
  // images sous la ligne de flottaison (loading="lazy") : filet de sécurité pour WebKit/iPhone,
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
