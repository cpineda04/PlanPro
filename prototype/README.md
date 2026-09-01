# PlanPro — Prototipo

Prototipo de diseño y flujo (panel del coach + portal del cliente). No tiene base de datos real — los datos viven en memoria mientras el navegador está abierto.

## Abrir en VSCode

1. Descomprime esta carpeta en tu computadora.
2. Abre VSCode → **File → Open Folder...** → selecciona la carpeta `planpro-app`.
3. Abre una terminal dentro de VSCode: **Terminal → New Terminal**.

## Correrlo en tu computadora (necesitas Node.js instalado)

Si no tienes Node.js, descárgalo primero desde [nodejs.org](https://nodejs.org) (versión LTS).

En la terminal de VSCode:

```bash
npm install
npm run dev
```

Esto te da un link tipo `http://localhost:5173` — ábrelo en tu navegador para verlo funcionando localmente.

## Desplegarlo para conseguir un link público

### Opción recomendada: GitHub + Vercel (no necesitas instalar nada más)

1. Crea un repositorio nuevo en [github.com](https://github.com) y sube esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "PlanPro prototipo"
   git branch -M main
   git remote add origin TU_URL_DE_GITHUB
   git push -u origin main
   ```
2. Entra a [vercel.com](https://vercel.com) → **Add New Project** → conecta tu cuenta de GitHub → selecciona este repositorio.
3. Vercel detecta automáticamente que es un proyecto Vite. Dale a **Deploy**.
4. En un par de minutos te da un link público (`tuproyecto.vercel.app`) — cada vez que hagas `git push`, se actualiza solo.

### Alternativa: Netlify Drop (necesitas correr el build tú primero)

```bash
npm run build
```

Esto genera una carpeta `dist/`. Arrastra **esa carpeta** (no el proyecto completo) a [app.netlify.com/drop](https://app.netlify.com/drop).

## Estructura del proyecto

```
planpro-app/
├── index.html          ← punto de entrada HTML
├── src/
│   ├── main.jsx         ← monta React en la página
│   ├── App.jsx           ← todo el prototipo (paneles, portal, lógica)
│   └── index.css         ← Tailwind
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

Todo el código del producto vive en `src/App.jsx` — es el mismo archivo que hemos ido construyendo.
