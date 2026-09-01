# Fase 0 — Validación

Estado del proyecto PlanPro antes de construir el backend real.

---

## ✅ Hecho

- **Propuesta de producto** completa: funcionalidades, diferenciadores frente a Macro y otros competidores (Trainerize, ProCoach, My PT Hub), modelo de precios sugerido, stack técnico, roadmap por fases. Ver `docs/propuesta-producto.md`.
- **Nombre decidido:** PlanPro (verificado que no choca con ninguna marca existente en el espacio de coaching/fitness).
- **Prototipo interactivo completo** (panel del coach + portal del cliente), incluyendo:
  - Gestión de clientes con cálculo automático de calorías (TDEE)
  - Planes de alimentación y entrenamiento editables, con biblioteca reutilizable de alimentos y ejercicios
  - Portal del cliente: checklist diario de comidas y entrenamiento (con selección de alimentos, opción "comí algo diferente", foto por comida), check-in de ánimo/energía, frase motivacional diaria (sin repetir), fotos de progreso libres
  - Evaluación mensual: comparador de fotos antes/ahora, medidas corporales, feedback del coach, meta del mes, recordatorio automático según fecha
  - Insignias/logros automáticos
  - Reporte diario para el coach (vista consolidada de todos los clientes)
  - Exportación de plan a PDF + envío por WhatsApp, para clientes que no quieran usar la app
- **Proyecto técnico listo** para desplegar (Vite + React + Tailwind), en `prototype/`.

## ⏳ Pendiente — esto es lo que falta para cerrar Fase 0

1. **Desplegar el prototipo en un link público** (Vercel vía GitHub, ver instrucciones en `prototype/README.md`).
2. **Grabar un video corto (3-4 min)** mostrando el flujo completo, para no depender de que cada coach navegue el link sin guía.
3. **Validar con 5-10 coaches reales** (fuera de tu propio criterio) — guion de preguntas pendiente de crear.
4. **Probar precio** — preguntar directamente si pagarían los montos sugeridos ($19/$49/$99).
5. **Asegurar el dominio y redes** de "PlanPro".
6. **Borrador de política de privacidad** — el producto maneja fotos, peso y medidas corporales de personas reales; esto hay que resolverlo antes de que cualquier coach externo lo use con datos reales de sus clientes.

## Criterio para pasar a Fase 1

No conviene empezar a construir el backend real hasta tener:
- Al menos 5 conversaciones de validación completadas
- Claridad de si hay disposición a pagar, y a qué precio
- Ningún hallazgo que obligue a rediseñar el producto desde cero
