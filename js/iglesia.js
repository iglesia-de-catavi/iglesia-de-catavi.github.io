import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createInterior } from "./interior.js";
import { createAmbiente } from "./ambiente.js";
import { createPuntos, PUNTOS } from "./puntos.js";
import { createAves } from "./aves.js";

// ======================================================
// AJUSTES RÁPIDOS
// ======================================================

// Altura de la Virgen en la escena (todo se calcula a partir de este valor).
const VIRGIN_HEIGHT = 6;

// Giro automático: empieza encendido y el botón lo detiene.
const AUTO_ROTATE_AL_INICIO = true;
const AUTO_ROTATE_SPEED = 0.1; // radianes por segundo

// Resplandor (halo) alrededor de la Virgen, como el de "Las 4 plagas".
// - strength: intensidad (sube o baja este número primero)
// - glow:     cuánto se difumina hacia afuera (0 = línea fina, 1 = muy suave)
// - thickness: ancho del halo
const HALO = {
    color: "#efe6d2",   // blanco hueso
    strength: 4.5,
    glow: 1.0,
    thickness: 3.0,
    nightBoost: 0.35    // cuánto más fuerte brilla de noche (0 = igual siempre)
};

// ======================================================
// ELEMENTOS HTML
// ======================================================

const container = document.querySelector("#viewer");
const loaderText = document.querySelector("#loader");

const btnReset = document.querySelector("#btnReset");
const btnAuto = document.querySelector("#btnAuto");
const btnInterior = document.querySelector("#btnInterior");
const btnWalk = document.querySelector("#btnWalk");
const btnTour = document.querySelector("#btnTour");
const btnPhoto = document.querySelector("#btnPhoto");
const btnFull = document.querySelector("#btnFull");
const btnMenu = document.querySelector("#btnMenu");
const walkHelp = document.querySelector("#walkHelp");
const btnInicio = document.querySelector("#btnInicio");

if (!container) {
    throw new Error("No se encontró el elemento #viewer en modelo3d.html");
}

// ======================================================
// ESCENA, CÁMARA Y RENDER
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color("#a9c9df");
scene.fog = null;

const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.05,
    1000
);

camera.position.set(0, VIRGIN_HEIGHT * 0.62, VIRGIN_HEIGHT * 2.5);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

container.appendChild(renderer.domElement);

// ======================================================
// POSPROCESAMIENTO: render → halo hueso → bloom → salida
// ======================================================

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const halo = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);

halo.edgeStrength = HALO.strength;
halo.edgeGlow = HALO.glow;
halo.edgeThickness = HALO.thickness;
halo.pulsePeriod = 0;
halo.visibleEdgeColor.set(HALO.color);
halo.hiddenEdgeColor.set("#000000"); // donde una paloma tapa a la Virgen no hay halo
composer.addPass(halo);

const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.34,
    0.55,
    0.78
);

composer.addPass(bloom);
composer.addPass(new OutputPass());

// ======================================================
// ILUMINACIÓN Y ENTORNO
// ======================================================

const pmrem = new THREE.PMREMGenerator(renderer);
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04);
scene.environment = environment.texture;
pmrem.dispose();

const hemiLight = new THREE.HemisphereLight(0xdce9ff, 0x554638, 2.0);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffe6b5, 3.4);
keyLight.position.set(-8, 14, 10);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -25;
keyLight.shadow.camera.right = 25;
keyLight.shadow.camera.top = 25;
keyLight.shadow.camera.bottom = -25;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8ebdff, 1.8);
fillLight.position.set(10, 8, -10);
scene.add(fillLight);

const rimLight = new THREE.SpotLight(0xffd477, 110, 100, Math.PI / 5, 0.55, 1.2);
rimLight.position.set(0, 20, -12);
rimLight.target.position.set(0, 3, 0);
scene.add(rimLight, rimLight.target);

const frontLight = new THREE.PointLight(0xffe2ac, 42, 50, 2);
frontLight.position.set(0, 5, 12);
scene.add(frontLight);

// Luz dedicada a la Virgen (siempre encendida en la vista exterior).
const virginLight = new THREE.SpotLight(0xffe5ad, 24, 40, Math.PI / 4, 0.55, 1.4);
virginLight.position.set(0, VIRGIN_HEIGHT * 1.7, VIRGIN_HEIGHT * 1.8);
virginLight.target.position.set(0, VIRGIN_HEIGHT * 0.5, 0);
scene.add(virginLight, virginLight.target);

// ======================================================
// SUELO (solo recibe la sombra de la Virgen)
// ======================================================

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.ShadowMaterial({ opacity: 0.35 })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
ground.receiveShadow = true;
scene.add(ground);

// ======================================================
// AMBIENTE: FOTO DE CATAVI + CICLO DÍA / ATARDECER / NOCHE
// ======================================================

const ambiente = createAmbiente({
    scene,
    camera,
    renderer,
    bloom,
    ground,
    lights: {
        hemi: hemiLight,
        key: keyLight,
        fill: fillLight,
        rim: rimLight,
        front: frontLight
    },
    photoUrl: "assets/img/detalles/CATAVI FOTO.jpg"
});

// ======================================================
// CONTROLES
// ======================================================

const controls = new OrbitControls(camera, renderer.domElement);
const walkControls = new PointerLockControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.rotateSpeed = 0.72;
controls.zoomSpeed = 0.85;
controls.panSpeed = 0.55;
controls.enablePan = true;
controls.minDistance = VIRGIN_HEIGHT * 0.8;
controls.maxDistance = VIRGIN_HEIGHT * 7;
controls.minPolarAngle = 0.08;
controls.maxPolarAngle = Math.PI * 0.95;
controls.target.set(0, VIRGIN_HEIGHT * 0.5, 0);
controls.update();

let walkMode = false;
let tourActive = false;
let autoRotate = false;
let controlsVisible = true;

const walkKeys = {};
const tourStops = [];

// ======================================================
// MODELOS
// ======================================================

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const world = new THREE.Group();
scene.add(world);

let virgin = null;
let aves = null;

const pointerDown = { x: 0, y: 0 };

// ======================================================
// PUNTOS / PANEL INFORMATIVO (textos en js/puntos.js)
// ======================================================

const puntos = createPuntos({
    mensaje(texto) {
        if (loaderText) loaderText.textContent = texto;
    }
});

function showInfo(story) {
    if (story) puntos.abrir(story.id);
}

function hideInfo() {
    puntos.cerrar();
}

// ======================================================
// BOTONES: ayudas para no repetir código
// ======================================================

function setButtonText(button, text) {
    const span = button && button.querySelector("span");
    if (span) span.textContent = text;
}

function setAutoRotate(on) {
    autoRotate = on;

    if (btnAuto) {
        btnAuto.classList.toggle("active", on);
        setButtonText(btnAuto, on ? "Detener giro" : "Giro automático");
    }
}

function setTourButton(on) {
    setButtonText(btnTour, on ? "Detener recorrido" : "Recorrido guiado");
}

// ======================================================
// INTERIOR DE LA IGLESIA (js/interior.js)
// ======================================================

const interior = createInterior({
    scene,
    camera,
    renderer,
    controls,
    loader,
    setExteriorVisible(visible) {
        world.visible = visible;
        ground.visible = visible;
        halo.enabled = visible;

        [keyLight, fillLight, rimLight, frontLight, virginLight].forEach(light => {
            light.visible = visible;
        });

        if (btnInterior) btnInterior.hidden = !visible;

        ambiente.setExteriorVisible(visible);
    }
});

// ======================================================
// ENTRAR A LA IGLESIA CON UN DESTELLO DE LUZ
// Doble clic en la Virgen (o el punto dorado / el botón): la luz brota de
// la Virgen, cubre la pantalla y, al disiparse, estás dentro de la iglesia
// junto a su imagen.
// ======================================================

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let entering = false;
let flashK = 0;       // 0..1: fuerza del destello sobre el halo y el bloom
let flashTarget = 0;

// Círculo de luz que nace en la posición de la Virgen en pantalla y crece.
function createFlashElement() {
    const p = new THREE.Vector3(0, VIRGIN_HEIGHT * 0.55, 0).project(camera);
    const el = document.createElement("div");

    Object.assign(el.style, {
        position: "fixed",
        left: `${(p.x * 0.5 + 0.5) * 100}%`,
        top: `${(-p.y * 0.5 + 0.5) * 100}%`,
        width: "20vmax",
        height: "20vmax",
        margin: "-10vmax 0 0 -10vmax",
        borderRadius: "50%",
        zIndex: "49",
        pointerEvents: "none",
        background:
            "radial-gradient(circle, #ffffff 0%, #fff6d6 25%, rgba(255,222,130,.9) 55%, rgba(255,210,100,0) 72%)",
        opacity: "0",
        transform: "scale(0.1)",
        transition: "transform .9s cubic-bezier(.2,.7,.2,1), opacity .5s ease-out"
    });

    document.body.appendChild(el);
    void el.offsetWidth; // fija el estado inicial antes de animar
    return el;
}

async function enterInterior() {
    if (entering || interior.isActive() || !virgin) return;
    entering = true;

    exitWalkMode();
    setAutoRotate(false);
    tourActive = false;
    setTourButton(false);
    hideInfo();
    renderer.domElement.style.cursor = "";

    // 1) El destello brota de la Virgen (halo y bloom suben de golpe).
    const flash = createFlashElement();
    flash.style.opacity = "1";
    flash.style.transform = "scale(14)";
    flashTarget = 1;
    await wait(850);

    // 2) La pantalla ya es pura luz: se apaga el destello 3D y se entra.
    //    interior.js carga el interior bajo la luz y la va disipando.
    flashTarget = 0;
    flashK = 0;

    try {
        await interior.enter({ luz: true, spawn: "virgen" });
    } finally {
        flash.remove();
        entering = false;
    }
}

if (btnInterior) {
    btnInterior.addEventListener("click", () => enterInterior());
}

// Doble clic sobre la Virgen. Se usa un cilindro invisible un poco más ancho
// que ella para que no haya que apuntar con tanta precisión.
const hitProxy = new THREE.Mesh(
    new THREE.CylinderGeometry(VIRGIN_HEIGHT * 0.22, VIRGIN_HEIGHT * 0.22, VIRGIN_HEIGHT, 16),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
);
hitProxy.position.y = VIRGIN_HEIGHT / 2;
hitProxy.updateMatrixWorld(true);

const entryRay = new THREE.Raycaster();
const entryPointer = new THREE.Vector2();

function pointerOverVirgin(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    entryPointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    entryRay.setFromCamera(entryPointer, camera);
    return entryRay.intersectObject(hitProxy, false).length > 0;
}

renderer.domElement.addEventListener("dblclick", event => {
    if (!virgin || walkMode || entering || interior.isActive()) return;
    if (pointerOverVirgin(event)) enterInterior();
});

// La mano indica que la Virgen se puede pulsar.
renderer.domElement.addEventListener("pointermove", event => {
    if (!virgin || event.buttons || entering || interior.isActive()) return;
    renderer.domElement.style.cursor = pointerOverVirgin(event) ? "pointer" : "";
});

// ======================================================
// LABELS CSS2D (los usan los puntos del interior)
// ======================================================

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);

Object.assign(labelRenderer.domElement.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "3"
});

container.appendChild(labelRenderer.domElement);

// ======================================================
// PUNTO DORADO DE ENTRADA: "Pasar adentro"
// Flota delante de la base de la Virgen (usa los estilos .puerta-wrap y
// .puerta-punto de css/puntos.css). Al acercarse muestra el texto.
// ======================================================

let entryDot = null;
let entryDotEl = null;
const entryPos = new THREE.Vector3();

function createEntryDot() {
    const wrap = document.createElement("div");
    wrap.className = "puerta-wrap";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "puerta-punto";
    btn.setAttribute("aria-label", "Pasar adentro");
    btn.innerHTML = "<span>Pasar adentro</span>";

    btn.addEventListener("click", event => {
        event.stopPropagation();
        if (!virgin || walkMode || interior.isActive()) return;
        enterInterior();
    });

    wrap.appendChild(btn);
    entryDotEl = btn;

    entryDot = new CSS2DObject(wrap);
    entryDot.position.set(0, VIRGIN_HEIGHT * 0.1, VIRGIN_HEIGHT * 0.35);
    scene.add(entryDot);
}

function updateEntryDot() {
    if (!entryDot) return;

    // Solo se ve desde el frente, y no en modo caminar ni dentro de la iglesia.
    entryDot.visible = !walkMode && !interior.isActive() && camera.position.z > 0;

    if (entryDot.visible) {
        entryDot.getWorldPosition(entryPos);
        entryDotEl.classList.toggle(
            "cerca",
            camera.position.distanceTo(entryPos) < VIRGIN_HEIGHT * 2.4
        );
    }
}

// ======================================================
// VISTA INICIAL
// ======================================================

function applyHomeView() {
    const H = VIRGIN_HEIGHT;

    camera.position.set(0, H * 0.62, H * 2.5);
    controls.target.set(0, H * 0.5, 0);
    controls.minDistance = H * 0.8;
    controls.maxDistance = H * 7;
    controls.maxPolarAngle = Math.PI * 0.95;

    camera.near = 0.05;
    camera.far = 1000;
    camera.updateProjectionMatrix();

    controls.update();
}

// ======================================================
// CARGAR LA VIRGEN DEL BUEN CONSEJO (modelo principal)
// ======================================================

loader.load(
    "assets/models/virgensita-draco.glb",
    gltf => {
        virgin = gltf.scene;

        virgin.traverse(object => {
            if (!object.isMesh) return;

            object.castShadow = true;
            object.receiveShadow = true;

            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            materials.forEach(material => {
                material.envMapIntensity = 1.35;
                material.needsUpdate = true;
            });
        });

        ambiente.trackMaterials(virgin, 1.35);

        // Escala: la Virgen mide VIRGIN_HEIGHT.
        const size0 = new THREE.Box3().setFromObject(virgin).getSize(new THREE.Vector3());
        virgin.scale.setScalar(VIRGIN_HEIGHT / Math.max(size0.y, 0.001));
        virgin.updateMatrixWorld(true);

        // Centrada en X/Z y con la base apoyada en y = 0.
        const box = new THREE.Box3().setFromObject(virgin);
        const center = box.getCenter(new THREE.Vector3());

        virgin.position.x -= center.x;
        virgin.position.y -= box.min.y;
        virgin.position.z -= center.z;

        world.add(virgin);

        // El halo sigue la silueta de la Virgen.
        halo.selectedObjects = [virgin];

        // Escenario para las palomas y las lámparas del atardecer.
        const H = VIRGIN_HEIGHT;
        const stage = { x: H * 1.2, y: H * 1.2, z: H * 1.2 };

        ambiente.setChurchSize(stage);
        aves = createAves({ scene, churchSize: stage });

        // Punto dorado para entrar a la iglesia.
        createEntryDot();

        // Recorrido guiado: da la vuelta alrededor de la Virgen.
        tourStops.length = 0;
        tourStops.push(
            {
                p: new THREE.Vector3(0, H * 0.55, H * 2.6),
                t: new THREE.Vector3(0, H * 0.5, 0),
                story: PUNTOS[0]
            },
            {
                p: new THREE.Vector3(H * 2.0, H * 0.7, H * 1.2),
                t: new THREE.Vector3(0, H * 0.5, 0),
                story: PUNTOS[2]
            },
            {
                p: new THREE.Vector3(-H * 2.0, H * 0.55, -H * 1.4),
                t: new THREE.Vector3(0, H * 0.5, 0),
                story: PUNTOS[4]
            }
        );

        applyHomeView();
        setAutoRotate(AUTO_ROTATE_AL_INICIO);
        showInfo(PUNTOS.find(p => p.id === "virgen"));

        if (loaderText) loaderText.textContent = "Virgen del Buen Consejo";
    },
    undefined,
    error => {
        console.error("Error al cargar la Virgen:", error);

        if (loaderText) {
            loaderText.textContent =
                "No se pudo cargar virgensita-draco.glb. Revisa assets/models.";
        }
    }
);

// ======================================================
// RESTABLECER VISTA / VOLVER AL INICIO
// ======================================================

function resetView() {
    if (interior.isActive()) {
        interior.exit();
        return;
    }

    if (!virgin) return;

    applyHomeView();
    hideInfo();
}

if (btnReset) btnReset.addEventListener("click", resetView);

if (btnInicio) {
    btnInicio.addEventListener("click", () => {
        exitWalkMode();
        window.location.href = "index.html";
    });
}

// ======================================================
// GIRO AUTOMÁTICO
// ======================================================

if (btnAuto) {
    btnAuto.addEventListener("click", () => setAutoRotate(!autoRotate));
}

// ======================================================
// MODO CAMINAR
// ======================================================

function exitWalkMode() {
    walkMode = false;
    controls.enabled = true;

    if (walkHelp) walkHelp.classList.remove("visible");
    if (document.pointerLockElement) document.exitPointerLock();

    setButtonText(btnWalk, "Caminar");
}

if (btnWalk) {
    btnWalk.addEventListener("click", () => {
        if (!virgin || interior.isActive()) return;

        if (walkMode) {
            exitWalkMode();
            return;
        }

        walkMode = true;
        controls.enabled = false;

        if (walkHelp) walkHelp.classList.add("visible");
        setButtonText(btnWalk, "Salir de caminar");

        walkControls.lock();
    });
}

walkControls.addEventListener("unlock", () => {
    if (walkMode) exitWalkMode();
});

document.addEventListener("keydown", event => {
    walkKeys[event.code] = true;

    if (event.code === "Escape") {
        tourActive = false;
        setTourButton(false);
    }
});

document.addEventListener("keyup", event => {
    walkKeys[event.code] = false;
});

// ======================================================
// RECORRIDO GUIADO
// ======================================================

let tourStart = 0;
const tourFromPos = new THREE.Vector3();
const tourFromTarget = new THREE.Vector3();

if (btnTour) {
    btnTour.addEventListener("click", () => {
        if (!virgin || interior.isActive() || tourStops.length === 0) return;

        tourActive = !tourActive;
        tourStart = performance.now();

        if (tourActive) {
            exitWalkMode();
            hideInfo();
            tourFromPos.copy(camera.position);
            tourFromTarget.copy(controls.target);
        }

        setTourButton(tourActive);
    });
}

// ======================================================
// GUARDAR CAPTURA
// ======================================================

if (btnPhoto) {
    btnPhoto.addEventListener("click", () => {
        try {
            composer.render();

            const link = document.createElement("a");
            link.download = interior.isActive()
                ? "iglesia-catavi-interior.png"
                : "virgen-del-buen-consejo.png";

            link.href = renderer.domElement.toDataURL("image/png");
            link.click();
        } catch (error) {
            console.warn("No se pudo guardar la captura:", error);

            if (loaderText) {
                loaderText.textContent = "No se pudo guardar la captura en este navegador.";
            }
        }
    });
}

// ======================================================
// PANTALLA COMPLETA
// ======================================================

if (btnFull) {
    btnFull.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.warn("Pantalla completa no disponible:", error);
        }
    });
}

// ======================================================
// MOSTRAR / OCULTAR CONTROLES
// ======================================================

if (btnMenu) {
    btnMenu.addEventListener("click", () => {
        controlsVisible = !controlsVisible;

        document.querySelectorAll(".controls-3d > *").forEach(element => {
            if (element.id === "btnMenu") return;
            if (element.dataset.hiddenByInterior) return;
            element.style.display = controlsVisible ? "" : "none";
        });

        setButtonText(btnMenu, controlsVisible ? "Ocultar controles" : "Mostrar controles");
    });
}

// ======================================================
// CERRAR INFORMACIÓN (clic en la escena sin arrastrar, X o ESC)
// ======================================================

renderer.domElement.addEventListener("pointerdown", event => {
    pointerDown.x = event.clientX;
    pointerDown.y = event.clientY;
});

renderer.domElement.addEventListener("click", event => {
    if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
    hideInfo();
});

window.addEventListener("keydown", event => {
    if (event.key === "Escape") hideInfo();
});

// ======================================================
// REDIMENSIONAR
// ======================================================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ======================================================
// ANIMACIÓN PRINCIPAL
// ======================================================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const dt = Math.min(clock.getDelta(), 0.05);

    if (controls.enabled) controls.update();

    // Giro automático de la Virgen.
    if (autoRotate && virgin) {
        world.rotation.y += dt * AUTO_ROTATE_SPEED;
    }

    // Movimiento con teclado en modo caminar.
    if (walkMode && walkControls.isLocked) {
        const speed = VIRGIN_HEIGHT * 0.48;

        if (walkKeys["KeyW"] || walkKeys["ArrowUp"]) walkControls.moveForward(speed * dt);
        if (walkKeys["KeyS"] || walkKeys["ArrowDown"]) walkControls.moveForward(-speed * dt);
        if (walkKeys["KeyA"] || walkKeys["ArrowLeft"]) walkControls.moveRight(-speed * dt);
        if (walkKeys["KeyD"] || walkKeys["ArrowRight"]) walkControls.moveRight(speed * dt);

        camera.position.y = Math.max(camera.position.y, VIRGIN_HEIGHT * 0.12);
    }

    // Recorrido guiado alrededor de la Virgen.
    if (tourActive && tourStops.length) {
        const elapsed = (performance.now() - tourStart) / 1000;
        const duration = 6;

        if (elapsed >= tourStops.length * duration) {
            tourActive = false;
            setTourButton(false);
        } else {
            const index = Math.min(Math.floor(elapsed / duration), tourStops.length - 1);
            const local = (elapsed % duration) / duration;
            const stop = tourStops[index];

            const previous = index === 0
                ? { p: tourFromPos, t: tourFromTarget }
                : tourStops[index - 1];

            camera.position.lerpVectors(
                previous.p,
                stop.p,
                THREE.MathUtils.smoothstep(local, 0, 1)
            );

            controls.target.lerp(stop.t, 0.12);
            controls.update();

            if (local < 0.03 && stop.story) showInfo(stop.story);
        }
    }

    // Palomas alrededor de la Virgen (no se ven dentro de la iglesia).
    if (aves) {
        aves.group.visible = !interior.isActive();
        if (aves.group.visible) aves.update(dt);
    }

    // Punto dorado "Pasar adentro".
    updateEntryDot();

    // El halo brilla un poco más al caer la noche (y mucho más en el destello).
    flashK += (flashTarget - flashK) * (1 - Math.exp(-6 * dt));
    halo.edgeStrength =
        HALO.strength * (1 + HALO.nightBoost * ambiente.getTime()) * (1 + 3 * flashK);
    halo.edgeThickness = HALO.thickness + 4 * flashK;

    interior.update(dt);
    ambiente.update(dt);

    // ambiente.update() fija el bloom en cada fotograma; el destello se suma después.
    if (flashK > 0.001) bloom.strength += 1.4 * flashK;

    composer.render();
    labelRenderer.render(scene, camera);
}

if (loaderText) loaderText.textContent = "Cargando modelo 3D…";

animate();