// ======================================================
// PUNTOS / FICHAS DEL EXTERIOR
// - Ya no se crean puntos numerados en el exterior (solo el punto dorado
//   de la puerta, que vive en iglesia.js).
// - Este archivo guarda los textos que usan el recorrido guiado y la
//   vista de la Virgen, y controla el panel #infoCard de modelo3d.html.
// - Edita PUNTOS para cambiar o completar los textos.
// ======================================================

export const FUENTE =
    "Información proporcionada por quienes atienden la Iglesia de Catavi.";

// El recorrido guiado usa las posiciones 0, 2 y 4: no cambies el orden.
export const PUNTOS = [
    {
        id: "fachada",
        kicker: "Exterior",
        titulo: "Iglesia de Nuestra Señora del Buen Consejo",
        texto:
            "En el corazón de Catavi, esta iglesia representa una parte importante de la " +
            "memoria espiritual y cultural de la histórica población minera del norte de Potosí."
    },
    {
        id: "puerta",
        kicker: "Exterior",
        titulo: "La puerta principal",
        texto:
            "Por aquí entran las familias y los habitantes de Catavi a las celebraciones " +
            "religiosas. Pulsa el punto dorado para pasar adentro."
    },
    {
        id: "comunidad",
        kicker: "Historia",
        titulo: "Un legado de fe y comunidad",
        texto:
            "Durante el crecimiento de Catavi, la vida religiosa formó parte de la organización " +
            "social de la población. La iglesia se convirtió en un espacio de encuentro para " +
            "trabajadores, familias y habitantes."
    },
    {
        id: "tradicion",
        kicker: "Historia",
        titulo: "Tradiciones que continúan",
        texto:
            "A través de los años, sus celebraciones religiosas, oraciones y tradiciones han " +
            "contribuido a conservar la identidad de Catavi, manteniendo vivo el vínculo entre " +
            "su pasado minero y la vida de sus habitantes."
    },
    {
        id: "patrimonio",
        kicker: "Patrimonio",
        titulo: "Patrimonio religioso",
        texto:
            "Su espacio interior, sus elementos arquitectónicos y sus imágenes religiosas " +
            "reflejan la tradición católica que forma parte de la historia cultural de la población."
    },
    {
        id: "virgen",
        kicker: "Imagen sagrada",
        titulo: "Nuestra Señora del Buen Consejo",
        texto:
            "Bajo la advocación de Nuestra Señora del Buen Consejo, el templo conserva un " +
            "significado especial para los habitantes y las familias que mantienen su devoción."
    }
];

export function createPuntos({ mensaje } = {}) {
    const $ = id => document.getElementById(id);

    const panel = $("infoCard");
    const kicker = $("infoKicker");
    const titulo = $("infoTitle");
    const texto = $("infoText");
    const curiosoWrap = $("infoCuriosoWrap");
    const curioso = $("infoCurioso");
    const fuente = $("infoFuente");
    const nav = $("infoNav");
    const cerrarBtn = $("closeInfo");

    // El panel se muestra con estilos en línea para no depender del nombre de la
    // clase de puntos.css; al cerrar se quitan y vuelve a mandar el CSS.
    function mostrarPanel(si) {
        if (!panel) return;

        ["visible", "open", "abierto", "activo", "show"].forEach(c =>
            panel.classList.toggle(c, si)
        );

        if (si) {
            panel.style.opacity = "1";
            panel.style.visibility = "visible";
            panel.style.pointerEvents = "auto";
            panel.style.transform = "none";
        } else {
            ["opacity", "visibility", "pointerEvents", "transform"].forEach(p =>
                panel.style.removeProperty(p.replace(/[A-Z]/g, m => "-" + m.toLowerCase()))
            );
        }
    }

    function abrir(id) {
        const p = PUNTOS.find(x => x.id === id);
        if (!p || !panel) return;

        if (kicker) {
            kicker.textContent = p.kicker || "";
            kicker.hidden = !p.kicker;
        }

        if (titulo) titulo.textContent = p.titulo;
        if (texto) texto.textContent = p.texto;

        if (curiosoWrap) {
            curiosoWrap.hidden = !p.curioso;
            if (curioso) curioso.textContent = p.curioso || "";
        }

        if (fuente) {
            fuente.textContent = "Fuente: " + (p.fuente || FUENTE);
            fuente.hidden = false;
        }

        if (nav) nav.hidden = true;

        mostrarPanel(true);
    }

    function cerrar() {
        mostrarPanel(false);
    }

    if (cerrarBtn) cerrarBtn.addEventListener("click", cerrar);

    return {
        objetos: [],                 // ya no hay puntos numerados en el exterior
        crear() {},                  // (se deja vacío a propósito)
        abrir,
        cerrar,
        update() {},
        salirDeColocacion() {},
        estaColocando: () => false
    };
}