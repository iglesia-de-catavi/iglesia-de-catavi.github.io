import * as THREE from "three";

// ======================================================
// PALOMAS BLANCAS
// Vuelan en círculos alrededor de la iglesia (independientes del giro
// automático, así se ven pasar mientras la iglesia rota). Cada cierto tiempo
// cada paloma "parte" de lo alto de la iglesia y se abre en espiral.
// ======================================================

export function createAves({ scene, churchSize, cantidad = 10 }) {
    const group = new THREE.Group();
    group.name = "palomas";
    scene.add(group);

    const unidad = Math.max(churchSize.y * 0.055, 0.05); // largo de una paloma
    const base = Math.max(churchSize.x, churchSize.z);

    const blanco = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.85,
        emissive: 0x8a8a8a, emissiveIntensity: 0.35, // se ven también de noche
        side: THREE.DoubleSide
    });
    const picoMat = new THREE.MeshStandardMaterial({ color: 0xe9a36b, roughness: 0.7 });

    // Cuerpo, cabeza, pico y cola (la paloma mira hacia +Z).
    const cuerpoGeo = new THREE.SphereGeometry(0.5, 10, 8);
    cuerpoGeo.scale(0.38, 0.34, 1);
    const cabezaGeo = new THREE.SphereGeometry(0.13, 8, 6);
    const picoGeo = new THREE.ConeGeometry(0.035, 0.12, 5);
    picoGeo.rotateX(Math.PI / 2);
    const colaGeo = new THREE.PlaneGeometry(0.28, 0.42);
    colaGeo.rotateX(-Math.PI / 2);

    // Ala (triángulo) del lado derecho; la izquierda se espeja.
    const alaGeo = new THREE.BufferGeometry();
    alaGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
        0, 0, 0.28,   0, 0, -0.28,   1.0, 0, -0.18
    ]), 3));
    alaGeo.computeVertexNormals();

    const aves = [];
    const ease = k => k * k * (3 - 2 * k);
    const clamp01 = v => Math.min(Math.max(v, 0), 1);

    for (let i = 0; i < cantidad; i++) {
        const ave = new THREE.Group();
        ave.rotation.order = "YXZ";

        ave.add(new THREE.Mesh(cuerpoGeo, blanco));

        const cabeza = new THREE.Mesh(cabezaGeo, blanco);
        cabeza.position.set(0, 0.1, 0.5);
        ave.add(cabeza);

        const pico = new THREE.Mesh(picoGeo, picoMat);
        pico.position.set(0, 0.09, 0.64);
        ave.add(pico);

        const cola = new THREE.Mesh(colaGeo, blanco);
        cola.position.set(0, 0.02, -0.6);
        ave.add(cola);

        const alaD = new THREE.Mesh(alaGeo, blanco);
        alaD.position.set(0.1, 0.08, 0);
        const alaI = new THREE.Mesh(alaGeo, blanco);
        alaI.position.set(-0.1, 0.08, 0);
        alaI.scale.x = -1;
        ave.add(alaD, alaI);

        ave.scale.setScalar(unidad * (0.9 + Math.random() * 0.25));
        group.add(ave);

        aves.push({
            obj: ave, alaD, alaI,
            radio: base * (0.8 + Math.random() * 0.9),
            alto: churchSize.y * (0.45 + Math.random() * 0.8),
            w: (0.2 + Math.random() * 0.15) * (Math.random() < 0.8 ? 1 : -1),
            fase: Math.random() * Math.PI * 2,
            ciclo: 45 + Math.random() * 30,       // segundos entre "partidas"
            desfase: Math.random() * 60,
            aleteo: 7 + Math.random() * 3,
            bob: 0.6 + Math.random() * 0.6
        });
    }

    let tiempo = 0;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();

    function posicion(a, t, out) {
        // c = momento dentro del ciclo: sale de la iglesia, vuela, y vuelve a acercarse.
        const c = (t + a.desfase) % a.ciclo;
        const sale = ease(clamp01(c / 7));
        const vuelve = ease(clamp01((c - (a.ciclo - 7)) / 7));
        const k = 0.6 + 0.4 * (sale - vuelve);                 // 0.6 = cerca de la iglesia
        const h = THREE.MathUtils.lerp(churchSize.y * 0.9, a.alto, sale - vuelve);

        const ang = a.fase + a.w * t;
        out.set(
            Math.cos(ang) * a.radio * k,
            h + Math.sin(t * a.bob + a.fase) * churchSize.y * 0.04,
            Math.sin(ang) * a.radio * k * 0.85
        );
        return out;
    }

    function update(dt) {
        tiempo += dt;

        for (const a of aves) {
            posicion(a, tiempo, p1);
            posicion(a, tiempo + 0.08, p2);

            const vx = p2.x - p1.x;
            const vy = p2.y - p1.y;
            const vz = p2.z - p1.z;
            const vh = Math.hypot(vx, vz) || 1e-4;

            a.obj.position.copy(p1);
            a.obj.rotation.y = Math.atan2(vx, vz);
            a.obj.rotation.x = -Math.atan2(vy, vh) * 0.6;
            a.obj.rotation.z = -Math.sign(a.w) * 0.25; // se inclina al girar

            // Aleteo con ratos de planeo.
            const planea = Math.sin(tiempo * 0.35 + a.fase) < -0.35;
            const amp = planea ? 0.12 : 0.55 + 0.3 * Math.sin(tiempo * 0.5 + a.fase);
            const flap = Math.sin(tiempo * a.aleteo + a.fase) * amp;
            a.alaD.rotation.z = flap;
            a.alaI.rotation.z = -flap;
        }
    }

    update(0);
    return { group, update };
}