# Iglesia de Catavi · Recorrido Virtual 3D

Sitio web interactivo para conocer la **Iglesia de Nuestra Señora del Buen Consejo**
en Catavi (norte de Potosí, Bolivia): su historia, su galería y un recorrido 3D por
el exterior y el interior del templo.

🌐 **Sitio en línea:** <https://iglesia-de-catavi.github.io/>

Proyecto académico de **Programación Gráfica** · Ingeniería Informática ·
Universidad Nacional Siglo XX · Gestión 2026.

- **Desarrollado por:** Jhoana Mery Montan Garcia
- **Docente:** Dr. Juan Pablo Luna

## Páginas

| Página | Descripción |
|---|---|
| `index.html` | Inicio con vitral 3D animado y resumen histórico |
| `historia.html` | Relato, curiosidades y línea de tiempo |
| `galeria.html` | Galería filtrable con visor y zoom |
| `modelo3d.html` | Virgen del Buen Consejo y recorrido por el interior |
| `coleccion.html` | Santo, vitral y Virgen en 3D con fichas informativas |

## Estructura

```
├── index.html · historia.html · galeria.html · modelo3d.html · coleccion.html
├── css/      # estilos de cada página, sol.css, puntos.css, extras.css
├── js/       # iglesia.js, interior.js, ambiente.js, puntos*.js, aves.js, musica.js...
└── assets/
    ├── img/      # portada, exterior, interior, detalles
    ├── models/   # archivos .glb (Virgen, interior, cura, santo, vitral)
    └── musica/   # mus_todo.mp3, mus_3d.mp3
```

## Funciones principales

- **Exterior:** Virgen con halo luminoso, ciclo Día/Atardecer/Noche, palomas, modo caminar, recorrido guiado y captura de pantalla.
- **Interior (primera persona):** colisiones, cura que camina, luz encendible y puntos dorados con fichas informativas.
- **Entrada:** punto dorado "Pasar adentro", doble clic en la Virgen o botón "Ver iglesia por dentro".

| Tecla | Acción |
|---|---|
| `W A S D` | Caminar (`Shift` corre) |
| Arrastrar | Mirar |
| `E` / `Q` | Subir / bajar cámara |
| `C` | Controlar al cura |
| `V` | Cambiar cámara |
| `L` | Luz |

## Ejecutar en local

Requiere un servidor HTTP (no abrir con doble clic):

```bash
python3 -m http.server 8000
```

Abrir <http://localhost:8000/>. Necesita internet (Three.js y fuentes por CDN).

## Publicación

Alojado en **GitHub Pages**: repositorio `iglesia-de-catavi.github.io`, rama `main`.
Cada `git push` actualiza el sitio en unos minutos.

## Fuentes

La información proviene de quienes atienden la Iglesia de Catavi. Las fechas de la
línea de tiempo son de historia regional o referencias documentales, **no fechas
confirmadas de construcción del templo**.

## Tecnologías

Three.js 0.160 · three-mesh-bvh · HTML5 · CSS3 · JavaScript (módulos ES)

---

© 2026 Iglesia de Catavi · Universidad Nacional Siglo XX