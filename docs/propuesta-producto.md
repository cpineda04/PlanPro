# Propuesta de producto: plataforma SaaS para entrenadores

**Preparado a partir del análisis del tutorial de Macro (competidor directo)**
31 de agosto de 2026

---

## 1. Resumen ejecutivo

Macro es una plataforma que permite a entrenadores personales y online coaches gestionar clientes, planes de alimentación, planes de entrenamiento y suplementación desde un solo panel. Es funcional pero tiene huecos claros de producto — sobre todo porque está construida **100% alrededor del coach** y no le da nada al cliente final.

La propuesta es construir una plataforma con el mismo núcleo funcional (gestión de clientes, nutrición, entrenamiento), pero resolviendo lo que Macro deja fuera: **una experiencia para el cliente del coach**, cobro de suscripciones integrado, seguimiento de progreso y un portal de marca propia para cada entrenador — que es exactamente lo que ya construimos para César.

---

## 2. Lo que hace Macro hoy (mapeado del tutorial)

| Módulo | Qué hace |
|---|---|
| Clientes | Lista de clientes, datos corporales, factor de actividad, calorías base, restricciones alimentarias |
| Mis alimentos | Biblioteca personal de alimentos reutilizables con macros |
| Planes de entrenamiento | Ejercicios, bloques de ejercicios (superseries/circuitos), días de entrenamiento, exportación a PDF |
| Suplementación | Editor de texto libre para armar una lista de suplementos y exportarla a PDF |
| Planes de alimentación | Calculadora de macros (por % o gramos), bloques de comida, selección de alimentos, distribución nutricional, exportación a PDF |
| Preferencias | Idioma y logo de la cuenta (branding básico en los PDFs) |

**Todo el producto vive del lado del coach.** El cliente final no tiene login, no ve su progreso en una app, no recibe notificaciones — solo recibe PDFs.

---

## 3. Vacíos de Macro = oportunidades de diferenciación

1. **No hay app ni portal para el cliente final.** El cliente no puede marcar comidas como completadas, subir fotos de progreso, ni ver su plan actualizado sin pedirle el PDF al coach.
2. **No hay cobro de suscripciones integrado.** El coach factura a sus propios clientes por fuera (efectivo, Zelle, etc.) — Macro no resuelve ese dolor.
3. **La suplementación es solo texto libre.** No hay catálogo de productos, dosis estructuradas, ni posibilidad de monetizar con enlaces de afiliado.
4. **No hay seguimiento de progreso** (peso, fotos, medidas) — el coach ajusta el plan "a ciegas" entre evaluaciones.
5. **No hay automatización de comunicación** — no hay recordatorios automáticos por WhatsApp/push cuando el cliente no reporta o cuando vence un plan.
6. **Branding limitado** — solo logo en el PDF, no una landing/portal con la cara del coach (lo que ya resolvimos para La Tribu Fit).
7. **No hay IA generativa** — cada plan se arma 100% manual, comida por comida, ejercicio por ejercicio.

---

## 4. Propuesta de producto

### Nombre
**PlanPro**

### Contexto competitivo (actualizado)
El mercado de software para coaches ya tiene jugadores establecidos: Trainerize (400,000+ coaches), My PT Hub, FitBudd, QuickCoach, FitPros.io y ProCoach (este último ya ofrece IA para generar programas y macros). Esto significa que "otro Macro más" no es suficiente — replicar únicamente nutrición + entrenamiento + branding + pagos no da ventaja, porque casi todos ya lo hacen.

**Ángulo de diferenciación recomendado: LATAM-first.** Ninguno de los competidores grandes ataca directamente este segmento con:
- Español y portugués nativos (no traducidos como opción secundaria)
- WhatsApp como canal principal de comunicación con el cliente (no solo push notifications, que en LATAM tienen menor apertura)
- Precios y método de pago pensados para la región (no solo tarjeta de crédito en USD)

Esto no reemplaza los diferenciadores de producto de la sección 3 (portal del cliente, cobro integrado, seguimiento de progreso) — los complementa con un posicionamiento de mercado más defendible que "hacer lo mismo que Macro pero mejor".

### Propuesta de valor
> "Todo lo que Macro hace por el coach, más una app real para sus clientes — para que el entrenador cobre, dé seguimiento y se vea profesional sin usar cinco herramientas distintas."

### Público objetivo
Entrenadores personales y online coaches independientes (1 a ~200 clientes) que hoy usan una mezcla de Excel, WhatsApp, Notion y PDFs sueltos para gestionar su negocio.

---

## 5. Funcionalidades — MVP (Fase 1)

Esto es lo mínimo para competir de igual a igual con Macro y ya diferenciarse:

- **Gestión de clientes**: perfil, datos corporales, cálculo automático de TDEE/calorías base, restricciones alimentarias.
- **Planes de alimentación**: calculadora de macros por % o gramos, bloques de comida, biblioteca de alimentos reutilizable, exportación a PDF con marca del coach.
- **Planes de entrenamiento**: biblioteca de ejercicios (con video opcional), bloques reutilizables (superseries/circuitos), calendario de días de entrenamiento, exportación a PDF.
- **Portal del cliente (la pieza que Macro no tiene)**: el cliente recibe un link/login simple (sin fricción, sin contraseña compleja — magic link) donde ve su plan del día, marca comidas/entrenamientos como completados y sube una foto o peso semanal.
- **Branding por coach**: cada coach tiene su logo, colores y su propio subdominio (`cesar.kinetiq.app`) — conectado directo con el tipo de landing que ya hicimos para César.
- **Multi-idioma**: español, inglés, portugués (igual que Macro, mercado LATAM/US/BR).

## 6. Funcionalidades — Fase 2 (diferenciadores fuertes)

- **Cobro de suscripciones integrado** (Stripe): el coach define sus planes (ej. $55/mes, $100/2 meses) y el cliente paga directo desde el portal — recurrente, sin que el coach tenga que perseguir pagos.
- **Seguimiento de progreso**: gráficas de peso, fotos de antes/después organizadas por fecha, medidas corporales — visibles para el coach y el cliente.
- **Suplementación estructurada**: catálogo con dosis, frecuencia, momento del día, y opción de enlaces de afiliado (monetización extra para el coach).
- **Recordatorios automáticos**: WhatsApp/push cuando el cliente no ha marcado su plan del día, o cuando se acerca el vencimiento de su plan.
- **Asistencia con IA**: generar un borrador de plan de alimentación o entrenamiento a partir del perfil del cliente, que el coach edita y aprueba (no reemplaza al coach, le ahorra el trabajo repetitivo).
- **App móvil nativa** para el cliente (iOS/Android) además del portal web.

## 7. Modelo de negocio

SaaS por suscripción mensual, cobrado al **coach** (no al cliente final):

| Plan | Clientes activos | Precio sugerido |
|---|---|---|
| Starter | Hasta 10 | $19/mes |
| Pro | Hasta 50 | $49/mes |
| Studio | Ilimitado + cobro de suscripciones integrado | $99/mes + 2% por transacción |

---

## 8. Stack técnico propuesto

- **Frontend**: React + TypeScript + Tailwind (portal coach y portal cliente como una sola app, rutas separadas)
- **Backend**: Node.js/PostgreSQL o Supabase (auth, base de datos, storage de fotos/PDFs)
- **PDFs**: generación server-side (igual que Macro)
- **Pagos**: Stripe Connect (para que cada coach reciba directo a su cuenta)
- **Notificaciones**: WhatsApp Business API + push notifications (web push / Firebase)
- **Hosting**: Vercel o similar, con subdominios por coach

---

## 9. Roadmap sugerido

| Fase | Contenido | Duración estimada |
|---|---|---|
| 0 | Validación: entrevistar a 5-10 coaches (incluyéndote a ti) sobre qué les falta hoy | 1-2 semanas |
| 1 (MVP) | Clientes + planes de alimentación + planes de entrenamiento + portal cliente básico | 6-10 semanas |
| 2 | Branding por coach + multi-idioma + exportación PDF | 2-3 semanas |
| 3 | Cobro de suscripciones (Stripe) + seguimiento de progreso | 4-6 semanas |
| 4 | Recordatorios automáticos + suplementación estructurada | 3-4 semanas |
| 5 | IA para generación de planes + app móvil nativa | según validación de demanda |

---

## 10. Siguientes pasos

1. Confirmar o cambiar el nombre/branding del producto.
2. Definir qué construimos primero como prototipo navegable: ¿el panel del coach o el portal del cliente? (Recomendación: portal del cliente, porque es el diferenciador que Macro no tiene y el que más rápido se puede mostrar como demo.)
3. Empezar la construcción del MVP — puedo arrancar directamente con un prototipo funcional (HTML/React) de la pantalla más importante para validar la dirección antes de construir todo el sistema.

---

*Documento generado como punto de partida — todo aquí es editable: precios, nombre, orden de fases y alcance del MVP.*
