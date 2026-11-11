import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

// ======================================================
// PUNTOS DEL INTERIOR
// buscar: nombre (regex) del objeto en el .glb.
// auto:   si no lo encuentra por nombre, usa una posición aproximada.
// pos:    [x, y, z] exacto (tecla P dentro de la iglesia, clic sobre la figura).
// cura:   true → el punto sigue al cura.
// ======================================================

export const FUENTE =
    "Información proporcionada por quienes atienden la Iglesia de Catavi.";

export const PUNTOS_INTERIOR = [
    {
        id: "crucifijo",
        titulo: "El crucifijo",
        buscar: "crucifij|cristo|jesus|jesús|christ|cross|cruz",
        relativo: "crucifijo", // se ubica sobre la pared detrás del altar
        auto: "crucifijo",
        tam: 4,
        oclusion: false,
        texto:
            "Imagen de Jesucristo crucificado. Es el centro del altar y de la fe cristiana: " +
            "recuerda su entrega por la humanidad. Toda la nave de la iglesia está orientada hacia él."
    },
    {
        id: "altar",
        titulo: "La mesa del altar",
        buscar: "altar|mesa|mantel|table",
        auto: "altar",
        tam: 2.5,
        oclusion: false,
        texto:
            "Sobre esta mesa se celebra la Eucaristía. Es el lugar donde la comunidad se reúne " +
            "alrededor del pan y del vino, y por eso es el centro de la celebración."
    },
    {
        id: "cura",
        titulo: "El cura",
        cura: true,
        tam: 3,
        oclusion: false,
        texto:
            "El párroco es quien guía la vida de la comunidad: celebra la misa, los sacramentos " +
            "y acompaña a las familias de Catavi."
    },
    {
        id: "san-jose",
        titulo: "San José",
        buscar: "jos[eé]|joseph|santo|saint",
        relativo: "espejo", // se ubica frente a la Virgen, al otro lado del altar
        tam: 2.2,
        oclusion: false,
        texto:
            "San José, esposo de María y padre adoptivo de Jesús, es patrono de los trabajadores. " +
            "Se lo representa con el Niño en brazos y con azucenas, símbolo de pureza."
    },
    {
        id: "virgen",
        titulo: "Nuestra Señora del Buen Consejo",
        buscar: "virgen|gruta|buen.?consejo|mar[ií]a",
        tam: 2.2,
        oclusion: false,
        texto:
            "La Virgen del Buen Consejo es la advocación bajo la que está puesta esta iglesia. " +
            "Se la invoca como la Madre que aconseja y guía, y se la representa con el Niño Jesús."
    },
    {
        id: "vitral",
        titulo: "Vitral",
        buscar: "vitral|stained|glass|vidrio|ventana|window",
        auto: "vitrales",
        todos: true,
        tam: 5,
        oclusion: false,
        texto:
            "Los vitrales dejan entrar la luz en colores y representan personajes y escenas de la " +
            "fe cristiana. Antes, quien no sabía leer podía «leer» la historia sagrada en ellos."
    },
    {
        id: "cuadro",
        titulo: "Cuadro",
        buscar: "cuadro|pintura|painting|lienzo",
        todos: true,
        tam: 1.6,
        texto:
            "Pintura religiosa que acompaña las paredes de la nave y invita a la oración y " +
            "a la reflexión."
    }

    // Punto ubicado a mano con la tecla P:
    // { id: "vitral-1", titulo: "Vitral de San Juan", pos: [1.2, 4.5, -6.3], tam: 5,
    //   texto: "Explica aquí qué personaje o escena muestra." },
];

const CSS = `
.pi-wrap{pointer-events:none}
.pi-punto{pointer-events:auto;cursor:pointer;position:relative;width:18px;height:18px;border:0;padding:0;
  border-radius:50%;background:radial-gradient(circle,#fff7cf 0%,#ffd45a 50%,#d9a21b 100%);
  box-shadow:0 0 10px 3px rgba(255,210,90,.8),0 0 24px 8px rgba(255,190,50,.35);
  animation:piPulso 2.2s ease-in-out infinite}
.pi-punto span{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:8px;
  white-space:nowrap;padding:4px 10px;border-radius:999px;background:rgba(8,13,24,.9);
  border:1px solid rgba(255,215,0,.45);color:#ffe9a8;font:600 12px Inter,sans-serif;
  opacity:0;pointer-events:none;transition:opacity .2s}
.pi-punto:hover span,.pi-punto:focus-visible span{opacity:1}
@keyframes piPulso{50%{transform:scale(1.2)}}
.pi-panel{position:fixed;left:20px;bottom:90px;z-index:12;width:min(380px,calc(100% - 40px));
  max-height:55vh;overflow:auto;padding:18px 20px 14px;border:1px solid rgba(255,215,0,.4);
  border-radius:14px;background:rgba(5,8,18,.92);color:#fff;font:400 14px/1.6 Inter,sans-serif;
  opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .3s,transform .3s}
.pi-panel.abierto{opacity:1;transform:none;pointer-events:auto}
.pi-panel h3{margin:0 26px 8px 0;font:600 22px "Cormorant Garamond",serif;color:#ffe27a}
.pi-panel p{margin:0 0 8px}
.pi-panel .pi-fuente{margin:10px 0 0;padding-top:8px;border-top:1px solid rgba(255,255,255,.12);
  font-size:11px;font-style:italic;color:rgba(255,255,255,.55)}
.pi-x{position:absolute;top:8px;right:10px;width:28px;height:28px;border:0;border-radius:50%;
  background:transparent;color:#fff;font-size:22px;line-height:1;cursor:pointer}
.pi-x:hover{background:rgba(255,255,255,.12)}
.pi-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:60;max-width:90%;
  padding:10px 16px;border-radius:10px;background:rgba(5,8,18,.92);border:1px solid rgba(255,215,0,.4);
  color:#fff;font:13px/1.5 Inter,sans-serif;text-align:center;display:none}
`;

export function createPuntosInterior({
    scene, camera, canvas, getRoot, getCollidables, getInfo, isActive, focusOn, releaseFocus
}) {
    let items = [];
    let built = false;
    let panelOpen = false;
    let colocando = false;
    let frame = 0;

    const rc = new THREE.Raycaster();
    rc.firstHitOnly = true;
    const dir = new THREE.Vector3();
    const fwd = new THREE.Vector3();
    const ptr = new THREE.Vector2();
    const ABAJO = new THREE.Vector3(0, -1, 0);

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    // ---- Ficha ----
    const panel = document.createElement("aside");
    panel.className = "pi-panel";
    panel.innerHTML =
        '<button type="button" class="pi-x" aria-label="Cerrar">×</button>' +
        '<h3></h3><div class="pi-txt"></div><p class="pi-fuente"></p>';
    document.body.appendChild(panel);

    const pTitulo = panel.querySelector("h3");
    const pTxt = panel.querySelector(".pi-txt");
    const pFuente = panel.querySelector(".pi-fuente");

    panel.querySelector(".pi-x").addEventListener("click", () => {
        cerrarPanel();
        releaseFocus();
    });

    const toastEl = document.createElement("div");
    toastEl.className = "pi-toast";
    document.body.appendChild(toastEl);
    let toastTimer = 0;

    function toast(texto, ms = 4000) {
        toastEl.textContent = texto;
        toastEl.style.display = "block";
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => (toastEl.style.display = "none"), ms);
    }

    function cerrarPanel() {
        panel.classList.remove("abierto");
        panelOpen = false;
    }

    function abrir(def, pos, tam) {
        focusOn(pos, tam);

        pTitulo.textContent = def.titulo;
        pTxt.innerHTML = (def.texto || "")
            .split("\n\n")
            .map(t => `<p>${t}</p>`)
            .join("");
        pFuente.textContent = "Fuente: " + (def.fuente || FUENTE);

        panel.classList.add("abierto");
        panelOpen = true;
        items.forEach(it => (it.obj.visible = false));
    }

    // ---- Posiciones aproximadas (cuando no se encuentra el objeto por nombre) ----
    function posicionesAuto(tipo) {
        const i = getInfo();
        if (!i) return [];

        const alongPos = t =>
            new THREE.Vector3(
                i.center.x + i.naveDir.x * t,
                0,
                i.center.z + i.naveDir.z * t
            );

        if (tipo === "crucifijo") {
            if (i.crucifixBox) {
                const c = i.crucifixBox.getCenter(new THREE.Vector3());
                return [{ pos: c, tam: Math.max(3, i.crucifixBox.max.y - i.crucifixBox.min.y) }];
            }
            const p = alongPos(i.naveLen / 2 - 2.2);
            p.y = i.floorY + 5.2;
            return [{ pos: p, tam: 4 }];
        }

        if (tipo === "altar") {
            const p = alongPos(i.naveLen / 2 - 3.6);
            p.y = i.floorY + 1.1;
            return [{ pos: p, tam: 2.5 }];
        }

        if (tipo === "vitrales") {
            const lat = new THREE.Vector3(-i.naveDir.z, 0, i.naveDir.x);
            const salida = [];
            [-0.3, -0.1, 0.1, 0.3].forEach(f => {
                [-1, 1].forEach(lado => {
                    const p = alongPos(i.naveLen * f);
                    p.addScaledVector(lat, lado * (i.width / 2 - 0.6));
                    p.y = i.floorY + 5.2;
                    salida.push({ pos: p, tam: 5 });
                });
            });
            return salida;
        }

        return [];
    }

    // ---- Buscar objetos por nombre dentro del .glb ----
    function buscarNombre(root, def, ts) {
        let re;
        try { re = new RegExp(def.buscar, "i"); } catch (e) { return []; }

        const box = new THREE.Box3();
        const s = new THREE.Vector3();
        const hallados = [];

        root.traverse(o => {
            if (o === root || !o.name || !re.test(o.name)) return;
            if (hallados.some(h => {
                for (let p = o.parent; p; p = p.parent) if (p === h.o) return true;
                return false;
            })) return;

            box.setFromObject(o);
            if (box.isEmpty()) return;
            box.getSize(s);

            // Descarta grupos gigantes (por ejemplo, uno que contiene toda la iglesia).
            if (s.y > ts.y * 0.6 || Math.max(s.x, s.z) > Math.min(ts.x, ts.z) * 0.4) return;

            hallados.push({
                o,
                centro: box.getCenter(new THREE.Vector3()),
                tam: Math.max(s.x, s.y, s.z)
            });
        });

        return hallados;
    }

    // ---- Posición de figuras medida sobre la geometría real, a partir del altar ----
    function estimarRelativo(def, buscarId) {
        const i = getInfo();
        const altar = buscarId("altar");
        if (!i || !altar) return null;

        const col = getCollidables();
        const alto = i.ceilY - i.floorY;
        const alongX = Math.abs(i.naveDir.x) > 0.5;
        const A = v => (alongX ? v.x : v.z);   // a lo largo de la nave
        const L = v => (alongX ? v.z : v.x);   // de lado a lado
        const armar = (a, l, y) =>
            alongX ? new THREE.Vector3(a, y, l) : new THREE.Vector3(l, y, a);

        const ap = altar.pos;
        let signo = Math.sign(A(ap) - A(i.center));
        if (!signo) signo = alongX ? i.naveDir.x : i.naveDir.z;

        const previo = rc.firstHitOnly;

        // ---------- CRUCIFIJO ----------
        if (def.relativo === "crucifijo") {
            const d = armar(signo, 0, 0);
            const desde = i.floorY + Math.min(2.8, alto * 0.25);
            const hasta = i.ceilY - 0.6;
            let mejor = null;

            rc.firstHitOnly = true;
            rc.near = 0;
            rc.far = 25;

            // Varias columnas verticales hacia la pared del fondo: donde el rayo choca
            // ANTES que la pared, ahí está la cruz (sobresale de la pared).
            for (let dl = -0.9; dl <= 0.91; dl += 0.3) {
                const muestras = [];

                for (let y = desde; y <= hasta; y += 0.25) {
                    rc.set(armar(A(ap), L(ap) + dl, y), d);
                    const h = rc.intersectObjects(col, false)[0];
                    muestras.push({ y, dist: h ? h.distance : null });
                }

                const ds = muestras.filter(m => m.dist !== null).map(m => m.dist).sort((p, q) => p - q);
                if (ds.length < 4) continue;
                const pared = ds[Math.floor(ds.length * 0.65)];

                let run = null;
                let cur = null;

                muestras.forEach(m => {
                    const cerca = m.dist !== null && m.dist < pared - 0.06 && m.dist > pared - 1.5;
                    if (cerca) {
                        if (!cur) cur = { y0: m.y, y1: m.y, d: [] };
                        cur.y1 = m.y;
                        cur.d.push(m.dist);
                    } else if (cur) {
                        if (!run || cur.y1 - cur.y0 > run.y1 - run.y0) run = cur;
                        cur = null;
                    }
                });
                if (cur && (!run || cur.y1 - cur.y0 > run.y1 - run.y0)) run = cur;

                if (run && (!mejor || run.y1 - run.y0 > mejor.y1 - mejor.y0)) mejor = { ...run, dl };
            }

            if (mejor && mejor.y1 - mejor.y0 >= 1.2) {
                const yc = (mejor.y0 + mejor.y1) / 2;
                const dm = mejor.d.slice().sort((p, q) => p - q)[Math.floor(mejor.d.length / 2)];
                const pos = armar(A(ap), L(ap) + mejor.dl, yc).addScaledVector(d, Math.max(0.3, dm - 0.5));
                rc.firstHitOnly = previo;

                console.log(
                    `Crucifijo medido: de ${(mejor.y0 - i.floorY).toFixed(1)} a ` +
                    `${(mejor.y1 - i.floorY).toFixed(1)} m sobre el suelo.`
                );

                return { pos, tam: mejor.y1 - mejor.y0 + 0.8, fiable: true, valida: () => true };
            }

            // No se pudo medir: rayo a una altura proporcional a la nave.
            const y = i.floorY + (def.altura ?? alto * 0.55);
            const origen = armar(A(ap), L(ap), y);
            rc.set(origen, d);
            const hit = rc.intersectObjects(col, false)[0];
            const dist = hit ? Math.max(0.3, hit.distance - 0.5) : 3.2;
            rc.firstHitOnly = previo;

            return {
                pos: origen.clone().addScaledVector(d, dist),
                tam: def.tam || 4,
                fiable: false,
                valida: c =>
                    Math.abs(L(c) - L(ap)) < 2.5 &&
                    signo * (A(c) - A(ap)) > 0 &&
                    c.y > i.floorY + alto * 0.25
            };
        }

        // ---------- SAN JOSÉ (frente a la Virgen, al otro lado del altar) ----------
        if (def.relativo === "espejo") {
            const vir = buscarId("virgen");
            if (!vir) return null;

            const est = armar(A(vir.pos), 2 * L(ap) - L(vir.pos), i.floorY + alto * 0.2);
            const tops = [];

            rc.firstHitOnly = false;
            rc.near = 0;
            rc.far = alto;

            // Cuadrícula de rayos hacia abajo: la parte más alta que se ve es la cabeza de la figura.
            for (let dx = -1.6; dx <= 1.61; dx += 0.25) {
                for (let dz = -1.6; dz <= 1.61; dz += 0.25) {
                    const x = est.x + dx;
                    const z = est.z + dz;
                    rc.set(new THREE.Vector3(x, i.ceilY - 0.3, z), ABAJO);

                    const h = rc.intersectObjects(col, false).find(
                        q => q.point.y > i.floorY + 1.2 && q.point.y < i.floorY + alto * 0.6
                    );
                    if (h) tops.push({ x, z, y: h.point.y });
                }
            }

            rc.firstHitOnly = previo;

            if (tops.length >= 3) {
                const max = tops.reduce((m, t) => (t.y > m.y ? t : m), tops[0]);
                const cerca = tops.filter(
                    t => t.y > max.y - 1.4 && Math.hypot(t.x - max.x, t.z - max.z) < 1.3
                );
                const cx = cerca.reduce((a, t) => a + t.x, 0) / cerca.length;
                const cz = cerca.reduce((a, t) => a + t.z, 0) / cerca.length;
                const figura = max.y - i.floorY;

                console.log(`San José medido: figura + pedestal de ${figura.toFixed(1)} m de alto.`);

                return {
                    pos: new THREE.Vector3(cx, i.floorY + figura * 0.55, cz),
                    tam: figura * 1.1,
                    fiable: true,
                    valida: () => true
                };
            }

            est.y = i.floorY + alto * 0.25;
            return { pos: est, tam: def.tam || 4, fiable: false, valida: c => c.distanceTo(est) < 2.2 };
        }

        return null;
    }

    // ---- Ubicar los puntos ----
    function resolver(root) {
        const total = new THREE.Box3().setFromObject(root);
        const ts = total.getSize(new THREE.Vector3());
        const salida = [];
        const buscarId = id => salida.find(s => s.def.id === id);

        // 1) Puntos normales: por nombre, por pos, o posición aproximada.
        PUNTOS_INTERIOR.forEach(def => {
            if (def.cura || def.relativo) return;

            if (def.pos) {
                salida.push({ def, pos: new THREE.Vector3(...def.pos), tam: def.tam || 1.5 });
                return;
            }

            const hallados = buscarNombre(root, def, ts);

            if (!hallados.length) {
                if (def.auto) {
                    console.warn(
                        `Punto "${def.id}": no hallé /${def.buscar}/; uso posición aproximada. ` +
                        "Para afinarla usa la tecla P y pon pos: [x, y, z]."
                    );
                    posicionesAuto(def.auto).forEach(a =>
                        salida.push({ def, pos: a.pos, tam: def.tam || a.tam })
                    );
                } else {
                    console.warn(
                        `Punto "${def.id}": no encontré ningún objeto con el nombre /${def.buscar}/. ` +
                        "Usa la tecla P para ubicarlo con pos: [x, y, z]."
                    );
                }
                return;
            }

            const lista = def.todos
                ? hallados.slice(0, 20)
                : hallados.sort((a, b) => b.tam - a.tam).slice(0, 1);

            lista.forEach(h => salida.push({ def, pos: h.centro, tam: def.tam || h.tam }));
        });

        // 2) Puntos relativos (crucifijo, San José): se comprueba que lo hallado por nombre
        //    esté donde debe; si no, se usa la posición calculada desde el altar.
        PUNTOS_INTERIOR.forEach(def => {
            if (!def.relativo) return;

            if (def.pos) {
                salida.push({ def, pos: new THREE.Vector3(...def.pos), tam: def.tam || 1.5 });
                return;
            }

            const nombrado = buscarNombre(root, def, ts).sort((a, b) => b.tam - a.tam)[0];
            const est = estimarRelativo(def, buscarId);

            if (est && est.fiable) {
                salida.push({ def, pos: est.pos, tam: est.tam });
            } else if (est && nombrado && est.valida(nombrado.centro)) {
                salida.push({ def, pos: nombrado.centro, tam: def.tam || nombrado.tam });
            } else if (est) {
                console.warn(
                    `Punto "${def.id}": lo ubiqué según el altar. Si queda desviado, ` +
                    "usa la tecla P y pon pos: [x, y, z]."
                );
                salida.push({ def, pos: est.pos, tam: est.tam || def.tam || 1.5 });
            } else if (nombrado) {
                salida.push({ def, pos: nombrado.centro, tam: def.tam || nombrado.tam });
            } else if (def.auto) {
                posicionesAuto(def.auto).forEach(a =>
                    salida.push({ def, pos: a.pos, tam: def.tam || a.tam })
                );
            } else {
                console.warn(`Punto "${def.id}": no se pudo ubicar. Usa la tecla P.`);
            }
        });

        return salida;
    }

    function crearItem({ def, pos, tam, dyn }) {
        const wrap = document.createElement("div");
        wrap.className = "pi-wrap";

        const item = { def, pos, tam, dyn: !!dyn, obj: null, tapado: false };

        const b = document.createElement("button");
        b.type = "button";
        b.className = "pi-punto";
        b.setAttribute("aria-label", def.titulo);
        b.innerHTML = `<span>${def.titulo}</span>`;
        b.addEventListener("click", e => {
            e.stopPropagation();
            abrir(def, item.pos.clone(), item.tam);
        });
        wrap.appendChild(b);

        const obj = new CSS2DObject(wrap);
        obj.position.copy(pos);
        obj.visible = false;
        scene.add(obj);

        item.obj = obj;
        return item;
    }

    function construir() {
        const root = getRoot();
        if (built || !root) return;
        built = true;

        items = resolver(root).map(crearItem);

        PUNTOS_INTERIOR.filter(d => d.cura).forEach(def => {
            items.push(crearItem({ def, pos: new THREE.Vector3(), tam: def.tam || 3, dyn: true }));
        });

        console.log(`Interior: ${items.length} puntos creados.`);
        items.forEach(it =>
            console.log(
                `  · ${it.def.id}: pos: [${it.pos.x.toFixed(2)}, ${it.pos.y.toFixed(2)}, ${it.pos.z.toFixed(2)}]`
            )
        );
    }

    function mostrar() {
        construir();
    }

    function ocultar() {
        items.forEach(it => (it.obj.visible = false));
        cerrarPanel();
        colocando = false;
        toastEl.style.display = "none";
    }

    function update() {
        if (!isActive()) return;
        frame++;

        if (panelOpen) {
            items.forEach(it => (it.obj.visible = false));
            return;
        }

        const colisiones = getCollidables();
        const info = getInfo();
        camera.getWorldDirection(fwd);

        items.forEach((it, i) => {
            // El punto del cura sigue al cura.
            if (it.dyn && info && info.priest) {
                it.pos.set(
                    info.priest.position.x,
                    info.priest.position.y + info.priestHeight * 0.55,
                    info.priest.position.z
                );
                it.obj.position.copy(it.pos);
            }

            dir.copy(it.pos).sub(camera.position);
            const dist = dir.length();
            const delante = dir.dot(fwd) > 0;

            if (it.def.oclusion !== false && delante && (frame + i) % 5 === 0) {
                dir.divideScalar(dist);
                rc.set(camera.position, dir);
                rc.near = 0;
                rc.far = Math.max(0.1, dist - Math.max(0.6, it.tam * 0.6));
                it.tapado = rc.intersectObjects(colisiones, false).length > 0;
            }

            let visible = delante && !it.tapado && dist < 45;
            if (it.dyn && info && (info.controlling || dist < 1.5)) visible = false;

            it.obj.visible = visible;
        });
    }

    // ---- Herramienta para ubicar puntos (tecla P) ----
    document.addEventListener("keydown", e => {
        if (!isActive() || e.code !== "KeyP" || e.repeat) return;
        colocando = !colocando;
        toast(
            colocando
                ? "Modo ubicar: haz clic sobre la figura y se copia su posición. P para salir."
                : "Modo ubicar desactivado."
        );
    });

    let downX = 0;
    let downY = 0;
    canvas.addEventListener("pointerdown", e => { downX = e.clientX; downY = e.clientY; });

    canvas.addEventListener("click", e => {
        if (!colocando || !isActive()) return;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;

        const r = canvas.getBoundingClientRect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        rc.setFromCamera(ptr, camera);
        rc.near = 0;
        rc.far = 200;

        const hit = rc.intersectObjects(getCollidables(), false)[0];
        if (!hit) return;

        const f = n => Math.round(n * 100) / 100;
        const linea =
            `{ id: "nuevo", titulo: "Título", pos: [${f(hit.point.x)}, ${f(hit.point.y)}, ${f(hit.point.z)}], ` +
            `tam: 1.5, texto: "Qué es..." },`;

        console.log("Pega esto en PUNTOS_INTERIOR (js/puntosInterior.js):\n" + linea);
        if (navigator.clipboard) navigator.clipboard.writeText(linea).catch(() => {});
        toast("Copiado. Pégalo en PUNTOS_INTERIOR y cambia id, título y texto.");
    });

    return { mostrar, ocultar, update, cerrarPanel };
}