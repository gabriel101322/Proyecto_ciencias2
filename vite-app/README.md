# Búsquedas — Ciencias de la Computación 2

Interfaz con barra lateral colapsable y pestañas dinámicas para algoritmos de
búsqueda interna, externa y grafos. Construida con **Vite** (vanilla JS + CSS).

## Requisitos

- Node.js 18 o superior

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto http://localhost:5173).

## Compilar para producción

```bash
npm run build     # genera la carpeta dist/
npm run preview   # sirve dist/ localmente para probar
```

## Estructura

```
.
├── index.html        # entrypoint de Vite
├── src/
│   ├── main.js       # lógica (secciones, pestañas, colapsar barra)
│   └── style.css     # estilos
├── vercel.json       # configuración de despliegue en Vercel
└── package.json
```

Para agregar o cambiar opciones, edita el arreglo `SECTIONS` al inicio de
`src/main.js`.

## Despliegue en Vercel

Importa el repositorio en [vercel.com](https://vercel.com); detecta Vite
automáticamente. O desde la terminal:

```bash
npm install -g vercel
vercel --prod
```
