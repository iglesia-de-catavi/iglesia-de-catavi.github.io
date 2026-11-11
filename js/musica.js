/* ======================================================
   MÚSICA DE FONDO (todas las páginas)
   - mus_todo: en todas las páginas.
   - mus_3d:   solo en las páginas de modelos 3D (lista de abajo).
   - Los archivos van en assets/musica/  (mus_todo.mp3 y mus_3d.mp3)
   - Arranca con el primer gesto del usuario (el navegador no deja antes).
   - Si cambias de página con la misma pista, continúa donde iba.
   - Botón pequeño abajo a la izquierda para silenciar.
   - Si está silenciada, el audio se pausa (no gasta datos ni batería).
   Uso: <script src="js/musica.js"></script> en cada .html
   ====================================================== */
(function () {
  const CARPETA = "assets/musica/";
  const EXT = "mp3";                                  // cambia si tus archivos son .ogg, .wav...
  const PAGINAS_3D = ["modelo3d", "coleccion"];       // páginas con mus_3d (sin ".html")
  const VOLUMEN = 0.45;
  const KEY = "catavi_musica";
  const GUARDAR_CADA_MS = 2000;

  // Nombre de página sin extensión: sirve con "coleccion.html" y con "/coleccion"
  const pagina = (location.pathname.split("/").pop() || "index")
    .toLowerCase()
    .replace(/\.html?$/, "");
  const pista = PAGINAS_3D.includes(pagina) ? "mus_3d" : "mus_todo";

  let estado = {};
  try { estado = JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch (e) { /* nada */ }
  let silencio = false;
  try { silencio = localStorage.getItem(KEY + "_mute") === "1"; } catch (e) { /* nada */ }

  const audio = new Audio(CARPETA + pista + "." + EXT);
  audio.loop = true;
  audio.volume = VOLUMEN;
  audio.preload = silencio ? "metadata" : "auto";
  audio.muted = silencio;

  // Continuar desde donde iba (solo si es la misma pista)
  if (estado.pista === pista && estado.t > 0) {
    audio.addEventListener("loadedmetadata", () => {
      try {
        if (isFinite(audio.duration) && audio.duration > 0) {
          audio.currentTime = estado.t % audio.duration;
        }
      } catch (e) { /* nada */ }
    }, { once: true });
  }

  // ---- Guardado ----
  function guardar() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ pista, t: audio.currentTime }));
      localStorage.setItem(KEY + "_mute", audio.muted ? "1" : "0");
    } catch (e) { /* nada */ }
  }
  let ultimoGuardado = 0;
  audio.addEventListener("timeupdate", () => {
    const ahora = Date.now();
    if (ahora - ultimoGuardado > GUARDAR_CADA_MS) {
      ultimoGuardado = ahora;
      guardar();
    }
  });
  window.addEventListener("pagehide", guardar);

  // ---- Botón silenciar ----
  const css = document.createElement("style");
  css.textContent = `
    .musica-btn{position:fixed;left:16px;bottom:16px;z-index:60;width:42px;height:42px;
      border-radius:50%;border:1px solid rgba(255,215,0,.45);background:rgba(8,13,24,.85);
      color:#ffe27a;font-size:18px;cursor:pointer;display:flex;align-items:center;
      justify-content:center;backdrop-filter:blur(6px);transition:transform .2s}
    .musica-btn:hover{transform:scale(1.08)}`;
  document.head.appendChild(css);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "musica-btn";
  btn.title = "Música";

  function pintar() {
    btn.textContent = audio.muted ? "🔇" : "🔊";
    btn.setAttribute("aria-label", audio.muted ? "Activar música" : "Silenciar música");
    btn.setAttribute("aria-pressed", audio.muted ? "true" : "false");
  }

  btn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    pintar();
    guardar();
  });
  pintar();

  const montar = () => document.body.appendChild(btn);
  if (document.body) montar(); else document.addEventListener("DOMContentLoaded", montar);

  // ---- Arranque ----
  // Incluye click, pointerup y touchend: en móvil, pointerdown/touchstart
  // no cuentan como gesto válido para reproducir audio.
  const EVENTOS_GESTO = ["pointerdown", "pointerup", "click", "touchend", "keydown"];

  function arrancar() {
    if (audio.muted || document.hidden) return;   // en silencio no se reproduce
    audio.play().then(quitarEscuchas).catch(() => {});
  }
  function quitarEscuchas() {
    EVENTOS_GESTO.forEach(e => window.removeEventListener(e, arrancar, true));
  }
  EVENTOS_GESTO.forEach(e => window.addEventListener(e, arrancar, true));
  arrancar(); // intenta ya; si el navegador lo bloquea, espera el primer gesto

  // Pausa si la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      audio.pause();
      guardar();
    } else if (!audio.muted) {
      audio.play().catch(() => {});
    }
  });
})();