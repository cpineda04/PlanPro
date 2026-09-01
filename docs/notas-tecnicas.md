# Notas para retomar el desarrollo

Si estás abriendo esto en Claude Code (VSCode) o cualquier otra sesión nueva, esto es lo que necesitas saber que no está en el código mismo.

## Qué es esto

Prototipo de diseño y flujo — no una app conectada a base de datos. Todo el estado vive en memoria de React (`useState`), se pierde al recargar la página. El objetivo actual es **validar el producto con coaches reales**, no construir el backend todavía (ver `docs/fase-0-roadmap.md`).

## Decisiones de diseño (por qué se ve como se ve)

- **Tipografía:** Fraunces (títulos/display) + IBM Plex Sans (cuerpo/UI) — evita el look genérico de Inter+system-font que usa la mayoría de dashboards SaaS.
- **Paleta:** base "stone" (neutro cálido, no gris frío) + acento teal-800 para el panel del coach en general; colores distintos por sección (ámbar = comidas/alimentos, violeta = entrenamiento/evaluación, bronce `#c1834e` = marca del coach específico en el portal del cliente, para simular cómo se vería el white-label).
- **Concepto visual:** tarjetas estilo "ficha/índice" (borde de color a la izquierda) en vez de las típicas tarjetas con sombra uniforme — es intencional, parte de diferenciarse visualmente de otros dashboards.

## Modelo de datos (todo vive en `src/App.jsx`)

Cada cliente (`client`) tiene, entre otros:
- `meals` / `workout` — el plan asignado por el coach
- `mealLogs` / `workoutLog` — lo que el cliente realmente registró cada día
- `checkin` / `checkinHistory` — ánimo, energía, cómo se sintió con comida/entrenamiento
- `evaluations` / `pendingEvaluation` / `nextEvaluationDate` — evaluación mensual con fotos, medidas, puntuación del coach
- `progressPhotos` — fotos libres del cliente (separadas de las de evaluación)
- `usesApp` — si es `false`, el coach gestiona a ese cliente solo por PDF

Las bibliotecas de alimentos y ejercicios (`foodLibrary`, `exerciseLibrary`) son globales, compartidas entre todos los clientes — viven en el componente raíz `PlanProPrototype`, no por cliente.

## Lo que falta técnicamente (más allá de validación)

- No hay backend real ni autenticación — cuando se valide la idea, esto se reconstruye con base de datos real (ver stack sugerido en `docs/propuesta-producto.md`).
- El botón "Enviar por WhatsApp" del PDF no adjunta el archivo automáticamente — limitación real de los links `wa.me`, no del código.
- Los gráficos usan Recharts (import normal de npm en este proyecto — evita el problema que tuvimos con la versión de un solo archivo HTML que cargaba Recharts desde CDN).
