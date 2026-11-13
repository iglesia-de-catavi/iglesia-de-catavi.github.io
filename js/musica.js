(function () {
  const CARPETA = "assets/musica/";
  const EXT = "mp3";
  const PAGINAS_3D = ["modelo3d", "coleccion"];
  const VOLUMEN = 0.45;
  const INICIO_SEG = 3;        // segundo donde empieza y donde vuelve al repetirse
  const FADE_IN_MS = 500;
  const FADE_OUT_MS = 250;
  const ESPERA_MAX_MS = 2500;  // máximo que el 3D espera a la música
  const MAX_SALTO_S = 20;      // si pasó más que esto, empieza desde INICIO_SEG
  const KEY = "catavi_musica";

  const pagina = (location.pathname.split("/").pop() || "index")
    .toLowerCase().replace(/\.html?$/, "");
  const pista = PAGINAS_3D.includes(pagina) ? "mus_3d" : "mus_todo";
  const KEY_PISTA = KEY + "_" + pista; // cada pista guarda su propio progreso

  let estado = {};
  try { estado = JSON.parse(sessionStorage.getItem(KEY_PISTA) || "{}"); } catch (e) {}
  let silencio = false;
  try { silencio = localStorage.getItem(KEY + "_mute") === "1"; } catch (e) {}

  const audio = new Audio(CARPETA + pista + "." + EXT);
  audio.loop = false;
  audio.preload = "auto";
  audio.volume = 0;
  audio.muted = silencio;

  // ---- La música está lista (la usan modelo3d.html y coleccion.html) ----
  window.musicaLista = new Promise(resolve => {
    audio.addEventListener("canplay", resolve, { once: true });
    audio.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, ESPERA_MAX_MS);
  });

  // ---- Dónde debe estar la pista AHORA (continúa si es la misma) ----
  function objetivo() {
    let t = INICIO_SEG;
    if (estado.t > 0 && estado.ts) {
      const dt = (Date.now() - estado.ts) / 1000;
      if (dt < MAX_SALTO_S) t = estado.t + dt;
    }
    const d = audio.duration;
    if (isFinite(d) && d > INICIO_SEG && t >= d) {
      t = INICIO_SEG + ((t - INICIO_SEG) % (d - INICIO_SEG));
    }
    return Math.max(t, INICIO_SEG);
  }

  function sincronizar() {
    try { audio.currentTime = objetivo(); } catch (e) {}
  }
  if (audio.readyState >= 1) sincronizar();
  else audio.addEventListener("loadedmetadata", sincronizar, { once: true });

  // Al empezar a sonar de verdad, corrige lo que se haya retrasado
  let corregido = false;
  audio.addEventListener("playing", () => {
    ocultarAviso();
    if (corregido) return;
    corregido = true;
    const t = objetivo();
    if (Math.abs(t - audio.currentTime) > 0.4) {
      try { audio.currentTime = t; } catch (e) {}
    }
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = INICIO_SEG;
    if (!audio.muted) audio.play().catch(() => {});
  });

  // ---- Fundidos ----
  let fadeId = 0;
  function fade(hasta, ms, cb) {
    cancelAnimationFrame(fadeId);
    const desde = audio.volume, t0 = performance.now();
    const paso = now => {
      const k = Math.min((now - t0) / ms, 1);
      audio.volume = desde + (hasta - desde) * k;
      if (k < 1) fadeId = requestAnimationFrame(paso);
      else if (cb) cb();
    };
    fadeId = requestAnimationFrame(paso);
  }

  // ---- Guardado (por pista) ----
  function guardar() {
    try {
      if (!audio.paused) {
        sessionStorage.setItem(KEY_PISTA, JSON.stringify({ t: audio.currentTime, ts: Date.now() }));
      }
      localStorage.setItem(KEY + "_mute", audio.muted ? "1" : "0");
    } catch (e) {}
  }
  let ultimo = 0;
  audio.addEventListener("timeupdate", () => {
    const ahora = Date.now();
    if (ahora - ultimo > 500) { ultimo = ahora; guardar(); }
  });
  window.addEventListener("pagehide", guardar);

  // ---- Fundido corto al salir por un enlace interno ----
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey || a.target === "_blank") return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#") || /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:")) return;
    if (audio.paused || audio.muted) return;
    e.preventDefault();
    guardar();
    fade(0, FADE_OUT_MS);
    setTimeout(() => { guardar(); location.href = a.href; }, FADE_OUT_MS);
  }, true);

  // ---- Estilos y botones ----
  const css = document.createElement("style");
  css.textContent = `
    .musica-btn{position:fixed;left:16px;bottom:16px;z-index:60;width:42px;height:42px;
      border-radius:50%;border:1px solid rgba(255,215,0,.45);background:rgba(8,13,24,.85);
      color:#ffe27a;font-size:18px;cursor:pointer;display:flex;align-items:center;
      justify-content:center;backdrop-filter:blur(6px);transition:transform .2s}
    .musica-btn:hover{transform:scale(1.08)}
    .musica-aviso{position:fixed;left:68px;bottom:21px;z-index:60;padding:8px 14px;
      border-radius:999px;border:1px solid rgba(255,215,0,.5);background:rgba(8,13,24,.9);
      color:#ffe9a8;font:600 12px Inter,sans-serif;cursor:pointer;display:none;
      animation:musAviso 1.6s ease-in-out infinite}
    @keyframes musAviso{50%{transform:scale(1.05)}}`;
  document.head.appendChild(css);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "musica-btn";
  btn.title = "Música";

  const aviso = document.createElement("button");
  aviso.type = "button";
  aviso.className = "musica-aviso";
  aviso.textContent = "🔊 Toca para activar la música";

  function ocultarAviso() { aviso.style.display = "none"; }
  function mostrarAviso() { if (!audio.muted) aviso.style.display = "block"; }

  function pintar() {
    btn.textContent = audio.muted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", audio.muted ? "Activar música" : "Silenciar música");
    btn.setAttribute("aria-pressed", audio.muted ? "true" : "false");
  }

  btn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (audio.muted) { audio.pause(); ocultarAviso(); }
    else { audio.play().then(() => fade(VOLUMEN, FADE_IN_MS)).catch(() => {}); }
    pintar();
    guardar();
  });
  pintar();

  const montar = () => { document.body.appendChild(btn); document.body.appendChild(aviso); };
  if (document.body) montar(); else document.addEventListener("DOMContentLoaded", montar);

  // ---- Arranque ----
  const EVENTOS = ["pointerdown", "pointerup", "click", "touchend", "keydown"];

  function quitarEscuchas() {
    EVENTOS.forEach(ev => window.removeEventListener(ev, arrancar, true));
  }

  function arrancar() {
    if (audio.muted || document.hidden) return;
    audio.play().then(() => {
      fade(VOLUMEN, FADE_IN_MS);
      quitarEscuchas();
    }).catch(() => mostrarAviso());
  }

  EVENTOS.forEach(ev => window.addEventListener(ev, arrancar, true));
  arrancar(); // intenta de inmediato; si el navegador lo permite, suena sin clic

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { audio.pause(); guardar(); }
    else if (!audio.muted) { audio.play().then(() => fade(VOLUMEN, 400)).catch(() => {}); }
  });
})();