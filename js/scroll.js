/* Efectos de scroll: aparición, barra de progreso, parallax y línea de tiempo.
   (Usa este contenido en el archivo donde ya tenías este script.) */
(function () {
  const bar = document.getElementById("progress");
  const heroBg = document.getElementById("heroBg");
  const tl = document.getElementById("tl");
  const fill = document.getElementById("tlFill");

  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Aparición al hacer scroll
  const elementos = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reducir) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    elementos.forEach(el => io.observe(el));
  } else {
    // Sin soporte o con "reducir movimiento": mostrar todo de una vez
    elementos.forEach(el => el.classList.add("in"));
  }

  function actualizar() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    // Barra de progreso de lectura
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    // Parallax de la foto de cabecera
    if (heroBg && !reducir && y < window.innerHeight * 1.2) {
      heroBg.style.transform = "translateY(" + y * 0.25 + "px)";
    }

    // La línea de tiempo se dibuja al bajar
    if (tl && fill) {
      const r = tl.getBoundingClientRect();
      const reach = window.innerHeight * 0.6 - r.top;
      fill.style.height = Math.max(0, Math.min(reach, r.height)) + "px";
    }
  }

  // Un solo cálculo por fotograma, aunque el navegador dispare muchos eventos
  let pendiente = false;
  function onScroll() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      actualizar();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  actualizar();
})();