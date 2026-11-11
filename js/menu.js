/* Menú móvil + activo automático según URL + sombra al hacer scroll */
(function () {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  // Nombre de página sin extensión, ignorando #hash y ?query
  function nombrePagina(ruta) {
    return (ruta.split("#")[0].split("?")[0].split("/").pop() || "index")
      .toLowerCase()
      .replace(/\.html?$/, "");
  }

  if (links) {
    // Marca como activo el enlace que apunta a la página actual
    const actual = nombrePagina(location.pathname);
    links.querySelectorAll("a").forEach(a => {
      const href = a.getAttribute("href") || "";
      if (/^(https?:)?\/\//i.test(href) || href.startsWith("#")) return; // externos o anclas
      a.classList.toggle("active", nombrePagina(href) === actual);
    });
  }

  if (toggle && links) {
    toggle.setAttribute("aria-controls", "navLinks");
    toggle.setAttribute("aria-expanded", "false");

    function abrir(abierto) {
      links.classList.toggle("open", abierto);
      toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    }

    toggle.addEventListener("click", () => abrir(!links.classList.contains("open")));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => abrir(false)));

    // Cerrar con Escape
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && links.classList.contains("open")) {
        abrir(false);
        toggle.focus();
      }
    });
  }

  // Sombra al hacer scroll
  const nav = document.querySelector(".navbar");
  if (nav) {
    const onScroll = () => {
      nav.style.boxShadow = window.scrollY > 10 ? "0 8px 30px -10px rgba(0,0,0,.6)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();