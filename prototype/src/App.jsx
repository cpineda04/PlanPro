import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Plus, ChevronRight, Check, TrendingUp, LogOut, Search,
  Utensils, Dumbbell, Sparkles, BookOpen, CreditCard,
  Smile, Flame, Camera, X, MessageCircle, ClipboardList,
  Download, ArrowLeft, FileText, Home, Palette
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ---------------------------------------------------------------------------
// Datos de muestra (en memoria — este es un prototipo de diseño y flujo,
// no una app conectada a una base de datos real).
// ---------------------------------------------------------------------------

const ACTIVITY_FACTORS = [
  { label: "Sedentario", value: 1.2 },
  { label: "Ligero (1-3 días/sem)", value: 1.375 },
  { label: "Moderado (3-5 días/sem)", value: 1.55 },
  { label: "Activo (6-7 días/sem)", value: 1.725 },
];

const CLIENT_TABS = [
  { id: "hoy", label: "Hoy", Icon: Home },
  { id: "comidas", label: "Comidas", Icon: Utensils },
  { id: "entreno", label: "Entreno", Icon: Dumbbell },
  { id: "progreso", label: "Progreso", Icon: TrendingUp },
];

const MOOD_OPTIONS = [
  { value: "baja", emoji: "😞", label: "Baja" },
  { value: "regular", emoji: "😐", label: "Regular" },
  { value: "bien", emoji: "🙂", label: "Bien" },
  { value: "genial", emoji: "😄", label: "Genial" },
];

const FEELING_OPTIONS = ["Difícil", "Normal", "Bien"];

const CHECKIN_LEVEL_META = {
  alto: { emoji: "🟢", label: "Buen día", color: "#0f766e" },
  medio: { emoji: "🟡", label: "Día normal", color: "#c99a3e" },
  bajo: { emoji: "🔴", label: "Día difícil", color: "#dc2626" },
};

// Combina ánimo, energía, y cómo se sintió con comida/entreno en un solo
// indicador — bajo/medio/alto. Si el check-in no está completo, retorna null.
function computeCheckinLevel(checkin, hasWorkoutToday) {
  if (!checkin.mood || !checkin.energy || !checkin.foodFeeling) return null;
  if (hasWorkoutToday && !checkin.workoutFeeling) return null;

  const moodScore = ({ baja: 1, regular: 2, bien: 3, genial: 4 }[checkin.mood] || 2) / 4;
  const energyScore = checkin.energy / 5;
  const feelingScore = (f) => ({ "Difícil": 1, "Normal": 2, "Bien": 3 }[f] || 2) / 3;

  const scores = [moodScore, energyScore, feelingScore(checkin.foodFeeling)];
  if (hasWorkoutToday) scores.push(feelingScore(checkin.workoutFeeling));

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 0.7) return "alto";
  if (avg >= 0.45) return "medio";
  return "bajo";
}


const moodEmoji = (value) => MOOD_OPTIONS.find((m) => m.value === value)?.emoji || "—";
const moodLabel = (value) => MOOD_OPTIONS.find((m) => m.value === value)?.label || "Sin registrar";

const MOTIVATIONAL_PHRASES = [
  { id: "p1", text: "La disciplina de hoy es el resultado de mañana." },
  { id: "p2", text: "No busques motivación, busca constancia." },
  { id: "p3", text: "Un día a la vez — así se construye todo lo que dura." },
  { id: "p4", text: "Nadie ve el proceso, todos ven el resultado. Confía en el proceso." },
  { id: "p5", text: "Progreso, no perfección." },
  { id: "p6", text: "Tu único límite eres tú mismo hace un mes." },
  { id: "p7", text: "Lo que decides hoy, lo agradeces en 90 días." },
  { id: "p8", text: "Presencia hoy > perfección algún día." },
  { id: "p9", text: "Cada repetición cuenta, aunque no la sientas." },
  { id: "p10", text: "No se trata de tener tiempo, se trata de hacerlo prioridad." },
  { id: "p11", text: "El cuerpo logra lo que la mente cree posible." },
  { id: "p12", text: "Compárate solo con quien eras ayer." },
];

function getBadges(client) {
  const badges = [];
  if (client.streak >= 3) badges.push({ id: "streak3", emoji: "🔥", label: "3 días seguidos" });
  if (client.streak >= 7) badges.push({ id: "streak7", emoji: "🔥", label: "7 días seguidos" });
  if (client.streak >= 30) badges.push({ id: "streak30", emoji: "🏆", label: "30 días seguidos" });
  if (client.evaluations.length >= 1) badges.push({ id: "eval1", emoji: "📸", label: "Primera evaluación" });
  if (client.evaluations.length >= 3) badges.push({ id: "eval3", emoji: "📈", label: "3 evaluaciones" });
  if (client.progressPhotos.length >= 1) badges.push({ id: "photo1", emoji: "🖼️", label: "Primera foto" });

  const n = client.evaluations.length;
  if (n >= 2 && client.evaluations[n - 1].score > client.evaluations[n - 2].score) {
    badges.push({ id: "improved", emoji: "⬆️", label: "Mejoró su puntuación" });
  }

  return badges;
}

function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function calcTdee({ weight, height, age, sex, activity }) {
  const base =
    sex === "female"
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
  return Math.round(base * activity);
}

const INITIAL_CLIENTS = [
  {
    id: "c1",
    name: "Miguel Torres",
    age: 29,
    sex: "male",
    weight: 82,
    height: 178,
    activity: 1.55,
    usesApp: true,
    macros: { kcal: 2450, protein: 180, carbs: 240, fats: 70 },
    meals: [
      {
        id: "m1", name: "Desayuno",
        items: [
          { id: "i1", foodId: "f1", name: "Avena", qty: 80, unit: "g", protein: 10.4, carbs: 54.4, fats: 5.6 },
          { id: "i2", foodId: "f2", name: "Claras de huevo", qty: 4, unit: "unidad", protein: 16, carbs: 0, fats: 0 },
          { id: "i3", foodId: "f3", name: "Banana", qty: 1, unit: "unidad", protein: 1, carbs: 27, fats: 0 },
        ],
      },
      {
        id: "m2", name: "Almuerzo",
        items: [
          { id: "i4", foodId: "f4", name: "Pollo (pechuga)", qty: 200, unit: "g", protein: 62, carbs: 0, fats: 8 },
          { id: "i5", foodId: "f5", name: "Arroz blanco", qty: 150, unit: "g", protein: 4.5, carbs: 42, fats: 0 },
          { id: "i6", foodId: "f6", name: "Aguacate", qty: 1, unit: "unidad", protein: 2, carbs: 12, fats: 20 },
        ],
      },
      {
        id: "m3", name: "Snack",
        items: [
          { id: "i7", foodId: "f7", name: "Yogur griego", qty: 150, unit: "g", protein: 15, carbs: 6, fats: 7.5 },
          { id: "i8", foodId: "f8", name: "Almendras", qty: 30, unit: "g", protein: 6, carbs: 6, fats: 15 },
        ],
      },
      {
        id: "m4", name: "Cena",
        items: [
          { id: "i9", foodId: "f9", name: "Salmón", qty: 180, unit: "g", protein: 45, carbs: 0, fats: 23.4 },
          { id: "i10", foodId: "f10", name: "Batata", qty: 200, unit: "g", protein: 4, carbs: 40, fats: 0 },
          { id: "i11", foodId: "f11", name: "Brócoli", qty: 150, unit: "g", protein: 4.5, carbs: 10.5, fats: 0 },
        ],
      },
    ],
    workoutDays: [
      {
        id: "d1",
        name: "Día de empuje",
        weekdays: ["Lunes", "Jueves"],
        muscleGroups: ["Pecho", "Hombros"],
        exercises: [
          { id: "w1", name: "Press de banca", detail: "4 x 8-10" },
          { id: "w2", name: "Press militar", detail: "3 x 10" },
          { id: "w3", name: "Fondos en paralelas", detail: "3 x fallo" },
        ],
      },
      {
        id: "d2",
        name: "Día de tirón",
        weekdays: ["Martes", "Viernes"],
        muscleGroups: ["Espalda", "Brazos"],
        exercises: [
          { id: "w4", name: "Jalón al pecho", detail: "3 x 10" },
          { id: "w5", name: "Remo con mancuerna", detail: "3 x 10" },
          { id: "w6", name: "Curl de bíceps", detail: "3 x 12" },
        ],
      },
      {
        id: "d3",
        name: "Día de pierna",
        weekdays: ["Miércoles", "Sábado"],
        muscleGroups: ["Piernas", "Glúteos"],
        exercises: [
          { id: "w7", name: "Sentadilla goblet", detail: "4 x 12" },
          { id: "w8", name: "Peso muerto rumano", detail: "3 x 10" },
          { id: "w9", name: "Zancadas caminando", detail: "3 x 12 c/lado" },
        ],
      },
    ],
    weightLog: [
      { date: "1 ago", weight: 85.2 },
      { date: "8 ago", weight: 84.4 },
      { date: "15 ago", weight: 83.6 },
      { date: "22 ago", weight: 83.0 },
      { date: "29 ago", weight: 82.4 },
    ],
    streak: 5,
    progressPhotos: [],
    extraMeals: [
      { id: "x1", description: "Un pedazo de pastel de cumpleaños", photo: null, time: "16:20" },
    ],
    supplements: [
      { id: "s1", name: "Creatina", dose: "5g", timing: "Post-entreno" },
      { id: "s2", name: "Multivitamínico", dose: "1 tableta", timing: "Mañana" },
      { id: "s3", name: "Omega 3", dose: "2 cápsulas", timing: "Con comidas" },
    ],
    supplementLog: { s1: true },
    billing: { amount: 100, currency: "USD", dueDate: isoOffset(-2), status: "pendiente_revision", history: [] },
    pendingReceipt: { dataUrl: null, date: "Hoy" },
    mealLogs: {
      m1: { items: { 0: true, 1: true, 2: true }, other: "", photo: null },
      m2: { items: { 0: true, 1: false, 2: false }, other: "", photo: null },
    },
    workoutLog: { d1: { w1: true } },
    checkin: { mood: null, energy: 0, foodFeeling: null, workoutFeeling: null, savedToday: false },
    checkinHistory: [
      { date: "15 ago", mood: "regular", energy: 3, foodFeeling: "Normal", workoutFeeling: "Normal" },
      { date: "17 ago", mood: "bien", energy: 4, foodFeeling: "Bien", workoutFeeling: "Bien" },
      { date: "18 ago", mood: "bien", energy: 3, foodFeeling: "Normal", workoutFeeling: "Normal" },
      { date: "20 ago", mood: "genial", energy: 5, foodFeeling: "Bien", workoutFeeling: "Bien" },
      { date: "21 ago", mood: "bien", energy: 4, foodFeeling: "Bien", workoutFeeling: "Bien" },
      { date: "23 ago", mood: "regular", energy: 2, foodFeeling: "Difícil", workoutFeeling: "Difícil" },
      { date: "24 ago", mood: "bien", energy: 3, foodFeeling: "Normal", workoutFeeling: "Normal" },
      { date: "26 ago", mood: "bien", energy: 4, foodFeeling: "Bien", workoutFeeling: "Normal" },
      { date: "27 ago", mood: "genial", energy: 5, foodFeeling: "Bien", workoutFeeling: "Bien" },
      { date: "28 ago", mood: "genial", energy: 5, foodFeeling: "Bien", workoutFeeling: "Bien" },
      { date: "29 ago", mood: "bien", energy: 4, foodFeeling: "Bien", workoutFeeling: "Normal" },
    ],
    evaluations: [
      { id: "e0", date: "1 jul", photoUrl: null, weight: 88.4, score: 6 },
      { id: "e1", date: "1 ago", photoUrl: null, weight: 85.2, score: 7 },
    ],
    pendingEvaluation: null,
    nextEvaluationDate: isoOffset(-1),
    nextGoal: "Aumentar a 4 sesiones de entrenamiento por semana.",
    seenPhraseIds: [],
    todayPhrase: null,
  },
  {
    id: "c2",
    name: "Ana Gómez",
    age: 34,
    sex: "female",
    weight: 63,
    height: 165,
    activity: 1.375,
    usesApp: false,
    macros: { kcal: 1780, protein: 130, carbs: 165, fats: 55 },
    meals: [
      {
        id: "m1", name: "Desayuno",
        items: [
          { id: "i1", foodId: "f12", name: "Huevos", qty: 3, unit: "unidad", protein: 18, carbs: 3, fats: 15 },
          { id: "i2", foodId: "f13", name: "Tostada integral", qty: 2, unit: "unidad", protein: 6, carbs: 24, fats: 2 },
        ],
      },
      {
        id: "m2", name: "Almuerzo",
        items: [
          { id: "i3", foodId: "f14", name: "Pescado blanco", qty: 200, unit: "g", protein: 44, carbs: 0, fats: 4 },
          { id: "i4", foodId: "f15", name: "Quinoa", qty: 120, unit: "g", protein: 4.8, carbs: 25.2, fats: 2.4 },
          { id: "i5", foodId: "f16", name: "Ensalada mixta", qty: 200, unit: "g", protein: 2, carbs: 8, fats: 0 },
        ],
      },
      {
        id: "m3", name: "Cena",
        items: [
          { id: "i6", foodId: "f4", name: "Pollo (pechuga)", qty: 200, unit: "g", protein: 62, carbs: 0, fats: 8 },
          { id: "i7", foodId: "f17", name: "Vegetales al vapor", qty: 250, unit: "g", protein: 5, carbs: 15, fats: 0 },
        ],
      },
    ],
    workoutDays: [
      {
        id: "d1",
        name: "Tren inferior",
        weekdays: ["Lunes", "Jueves"],
        muscleGroups: ["Piernas", "Glúteos"],
        exercises: [
          { id: "w1", name: "Sentadilla goblet", detail: "4 x 12" },
          { id: "w2", name: "Peso muerto rumano", detail: "3 x 10" },
          { id: "w3", name: "Zancadas caminando", detail: "3 x 12 c/lado" },
        ],
      },
      {
        id: "d2",
        name: "Tren superior",
        weekdays: ["Martes", "Viernes"],
        muscleGroups: ["Espalda", "Hombros", "Core"],
        exercises: [
          { id: "w4", name: "Jalón al pecho", detail: "3 x 10" },
          { id: "w5", name: "Elevaciones laterales", detail: "3 x 15" },
          { id: "w6", name: "Plancha", detail: "3 x 30s" },
        ],
      },
    ],
    weightLog: [
      { date: "1 ago", weight: 65.1 },
      { date: "8 ago", weight: 64.5 },
      { date: "15 ago", weight: 64.0 },
      { date: "22 ago", weight: 63.4 },
      { date: "29 ago", weight: 63.0 },
    ],
    streak: 2,
    progressPhotos: [],
    extraMeals: [],
    supplements: [
      { id: "s1", name: "Vitamina D", dose: "1 tableta", timing: "Mañana" },
      { id: "s2", name: "Magnesio", dose: "1 cápsula", timing: "Noche" },
    ],
    supplementLog: {},
    billing: {
      amount: 100,
      currency: "USD",
      dueDate: isoOffset(25),
      status: "al_dia",
      history: [{ id: "pay1", date: "1 ago", amount: 100, status: "confirmado" }],
    },
    pendingReceipt: null,
    mealLogs: {},
    workoutLog: {},
    checkin: { mood: null, energy: 0, foodFeeling: null, workoutFeeling: null, savedToday: false },
    checkinHistory: [
      { date: "16 ago", mood: "baja", energy: 2, foodFeeling: "Difícil", workoutFeeling: "Difícil" },
      { date: "18 ago", mood: "regular", energy: 2, foodFeeling: "Normal", workoutFeeling: "Difícil" },
      { date: "21 ago", mood: "regular", energy: 3, foodFeeling: "Normal", workoutFeeling: "Normal" },
      { date: "24 ago", mood: "bien", energy: 3, foodFeeling: "Bien", workoutFeeling: "Normal" },
      { date: "27 ago", mood: "bien", energy: 3, foodFeeling: "Normal", workoutFeeling: "Normal" },
      { date: "29 ago", mood: "regular", energy: 3, foodFeeling: "Normal", workoutFeeling: "Difícil" },
    ],
    evaluations: [],
    pendingEvaluation: null,
    nextEvaluationDate: isoOffset(20),
    nextGoal: "",
    seenPhraseIds: [],
    todayPhrase: null,
  },
];

const INITIAL_FOOD_LIBRARY = [
  { id: "f1", name: "Avena", unit: "g", base: 100, protein: 13, carbs: 68, fats: 7 },
  { id: "f2", name: "Claras de huevo", unit: "unidad", base: 1, protein: 4, carbs: 0, fats: 0 },
  { id: "f3", name: "Banana", unit: "unidad", base: 1, protein: 1, carbs: 27, fats: 0 },
  { id: "f4", name: "Pollo (pechuga)", unit: "g", base: 100, protein: 31, carbs: 0, fats: 4 },
  { id: "f5", name: "Arroz blanco", unit: "g", base: 100, protein: 3, carbs: 28, fats: 0 },
  { id: "f6", name: "Aguacate", unit: "unidad", base: 0.5, protein: 1, carbs: 6, fats: 10 },
  { id: "f7", name: "Yogur griego", unit: "g", base: 100, protein: 10, carbs: 4, fats: 5 },
  { id: "f8", name: "Almendras", unit: "g", base: 30, protein: 6, carbs: 6, fats: 15 },
  { id: "f9", name: "Salmón", unit: "g", base: 100, protein: 25, carbs: 0, fats: 13 },
  { id: "f10", name: "Batata", unit: "g", base: 100, protein: 2, carbs: 20, fats: 0 },
  { id: "f11", name: "Brócoli", unit: "g", base: 100, protein: 3, carbs: 7, fats: 0 },
  { id: "f12", name: "Huevos", unit: "unidad", base: 1, protein: 6, carbs: 1, fats: 5 },
  { id: "f13", name: "Tostada integral", unit: "unidad", base: 1, protein: 3, carbs: 12, fats: 1 },
  { id: "f14", name: "Pescado blanco", unit: "g", base: 100, protein: 22, carbs: 0, fats: 2 },
  { id: "f15", name: "Quinoa", unit: "g", base: 100, protein: 4, carbs: 21, fats: 2 },
  { id: "f16", name: "Ensalada mixta", unit: "g", base: 100, protein: 1, carbs: 4, fats: 0 },
  { id: "f17", name: "Vegetales al vapor", unit: "g", base: 100, protein: 2, carbs: 6, fats: 0 },
];

const MUSCLE_GROUPS = ["Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Glúteos", "Cardio"];

const MACRO_COLORS = { protein: "#2563eb", carbs: "#c99a3e", fats: "#db2777" };

// Calcula los macros de un alimento de la biblioteca escalados a una cantidad
// específica (ej. 150g de algo cuya base es 100g).
function scaledMacros(food, qty) {
  const factor = food.base ? qty / food.base : 0;
  return {
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fats: Math.round(food.fats * factor * 10) / 10,
  };
}


const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// new Date().getDay(): 0 = domingo ... 6 = sábado. Reordenamos para que empiece en lunes.
const JS_DAY_TO_WEEKDAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function getTodayWeekday() {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}

// El día de entrenamiento que le corresponde al cliente hoy, según los días
// de la semana asignados a cada día de su rutina. null = día de descanso.
function getTodaysWorkoutDay(client) {
  const todayWeekday = getTodayWeekday();
  return client.workoutDays.find((d) => d.weekdays?.includes(todayWeekday)) || null;
}

// Cumplimiento del cliente para HOY — comidas siempre cuentan, entrenamiento
// solo cuenta si el día de hoy tiene una rutina asignada (si no, es descanso
// y no debe penalizar ni sumar al total).
function computeClientDailyStats(c) {
  const mealLogs = c.mealLogs || {};
  const workoutLog = c.workoutLog || {};
  const supplementLog = c.supplementLog || {};
  const mealsLogged = c.meals.filter((m) => {
    const log = mealLogs[m.id];
    return log && (Object.values(log.items || {}).some(Boolean) || !!log.other);
  }).length;
  const todaysDay = getTodaysWorkoutDay(c);
  const totalExercises = todaysDay ? todaysDay.exercises.length : 0;
  const exLogged = todaysDay ? todaysDay.exercises.filter((w) => workoutLog[todaysDay.id]?.[w.id]).length : 0;
  const totalSupplements = (c.supplements || []).length;
  const supplementsLogged = (c.supplements || []).filter((s) => supplementLog[s.id]).length;
  const totalItems = c.meals.length + totalExercises + totalSupplements;
  const doneItems = mealsLogged + exLogged + supplementsLogged;
  const pct = totalItems ? doneItems / totalItems : 1;
  return {
    mealsLogged, totalMeals: c.meals.length, todaysDay, totalExercises, exLogged,
    totalSupplements, supplementsLogged, totalItems, doneItems, pct,
  };
}

const SUPPLEMENT_PRESETS = ["Creatina", "Multivitamínico", "Omega 3", "Vitamina D", "Magnesio", "Proteína en polvo"];

const INITIAL_COACH_PROFILE = {
  name: "La Tribu Fit de César",
  accent: "#c1834e",
  initials: "CP",
  logo: null,
  paymentMethods: [
    { id: "pm1", label: "Transferencia bancaria", details: "Banco Popular · Cuenta 123-456789-0 · César Pineda" },
  ],
};

function BrandAvatar({ coachProfile, size = 36 }) {
  return coachProfile.logo ? (
    <img
      src={coachProfile.logo}
      alt={coachProfile.name}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center text-xs font-bold rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: coachProfile.accent, color: "#0a0a0a" }}
    >
      {coachProfile.initials || "—"}
    </span>
  );
}


const BRAND_COLOR_PRESETS = ["#c1834e", "#0f766e", "#7c3aed", "#db2777", "#2563eb", "#b45309"];

const INITIAL_EXERCISE_LIBRARY = [
  // Pecho
  { id: "ex1", name: "Press de banca", muscleGroup: "Pecho", equipment: "Barra", defaultSets: 4, defaultReps: "8-10" },
  { id: "ex11", name: "Press inclinado con mancuernas", muscleGroup: "Pecho", equipment: "Mancuernas", defaultSets: 3, defaultReps: "10" },
  { id: "ex12", name: "Aperturas con mancuerna", muscleGroup: "Pecho", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12" },
  { id: "ex3", name: "Fondos en paralelas", muscleGroup: "Pecho", equipment: "Peso corporal", defaultSets: 3, defaultReps: "Fallo" },
  // Espalda
  { id: "ex8", name: "Remo con mancuerna", muscleGroup: "Espalda", equipment: "Mancuerna", defaultSets: 3, defaultReps: "10" },
  { id: "ex10", name: "Jalón al pecho", muscleGroup: "Espalda", equipment: "Polea", defaultSets: 3, defaultReps: "10" },
  { id: "ex13", name: "Remo en polea baja", muscleGroup: "Espalda", equipment: "Polea", defaultSets: 3, defaultReps: "10" },
  { id: "ex14", name: "Peso muerto convencional", muscleGroup: "Espalda", equipment: "Barra", defaultSets: 4, defaultReps: "6-8" },
  // Piernas
  { id: "ex4", name: "Sentadilla goblet", muscleGroup: "Piernas", equipment: "Mancuerna", defaultSets: 4, defaultReps: "12" },
  { id: "ex5", name: "Peso muerto rumano", muscleGroup: "Piernas", equipment: "Barra", defaultSets: 3, defaultReps: "10" },
  { id: "ex6", name: "Zancadas caminando", muscleGroup: "Piernas", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12 c/lado" },
  { id: "ex15", name: "Prensa de piernas", muscleGroup: "Piernas", equipment: "Máquina", defaultSets: 4, defaultReps: "12" },
  { id: "ex16", name: "Extensión de cuádriceps", muscleGroup: "Piernas", equipment: "Máquina", defaultSets: 3, defaultReps: "12-15" },
  // Hombros
  { id: "ex2", name: "Press militar", muscleGroup: "Hombros", equipment: "Barra", defaultSets: 3, defaultReps: "10" },
  { id: "ex17", name: "Elevaciones laterales", muscleGroup: "Hombros", equipment: "Mancuernas", defaultSets: 3, defaultReps: "15" },
  { id: "ex18", name: "Elevaciones frontales", muscleGroup: "Hombros", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12" },
  { id: "ex19", name: "Face pull", muscleGroup: "Hombros", equipment: "Polea", defaultSets: 3, defaultReps: "15" },
  // Brazos
  { id: "ex7", name: "Curl de bíceps", muscleGroup: "Brazos", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12" },
  { id: "ex20", name: "Curl martillo", muscleGroup: "Brazos", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12" },
  { id: "ex21", name: "Extensión de tríceps en polea", muscleGroup: "Brazos", equipment: "Polea", defaultSets: 3, defaultReps: "12-15" },
  { id: "ex22", name: "Fondos en banco", muscleGroup: "Brazos", equipment: "Peso corporal", defaultSets: 3, defaultReps: "12" },
  // Core
  { id: "ex9", name: "Plancha", muscleGroup: "Core", equipment: "Peso corporal", defaultSets: 3, defaultReps: "30s" },
  { id: "ex23", name: "Crunch abdominal", muscleGroup: "Core", equipment: "Peso corporal", defaultSets: 3, defaultReps: "20" },
  { id: "ex24", name: "Elevación de piernas colgado", muscleGroup: "Core", equipment: "Barra de dominadas", defaultSets: 3, defaultReps: "12" },
  { id: "ex25", name: "Russian twist", muscleGroup: "Core", equipment: "Peso corporal", defaultSets: 3, defaultReps: "20" },
  // Glúteos
  { id: "ex26", name: "Hip thrust", muscleGroup: "Glúteos", equipment: "Barra", defaultSets: 4, defaultReps: "10-12" },
  { id: "ex27", name: "Patada de glúteo en polea", muscleGroup: "Glúteos", equipment: "Polea", defaultSets: 3, defaultReps: "15 c/lado" },
  // Cardio
  { id: "ex28", name: "Cinta / trote", muscleGroup: "Cardio", equipment: "Cinta", defaultSets: 1, defaultReps: "20 min" },
  { id: "ex29", name: "Bicicleta estática", muscleGroup: "Cardio", equipment: "Bicicleta", defaultSets: 1, defaultReps: "15 min" },
  { id: "ex30", name: "Escaladora", muscleGroup: "Cardio", equipment: "Escaladora", defaultSets: 1, defaultReps: "10 min" },
];

// ---------------------------------------------------------------------------
// Estilos compartidos
// ---------------------------------------------------------------------------

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    .pp-display { font-family: 'Fraunces', serif; }
    .pp-body { font-family: 'IBM Plex Sans', sans-serif; }
    .pp-ruled {
      background-image: repeating-linear-gradient(
        to bottom, transparent 0px, transparent 34px, rgba(120,113,108,0.09) 35px
      );
    }
    .pp-card { position: relative; }
  `}</style>
);

function IndexCard({ accent = "#0f766e", className = "", children }) {
  return (
    <div
      className={`pp-card bg-white border border-stone-200 shadow-sm ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PANEL DEL COACH
// ---------------------------------------------------------------------------

function NewClientForm({ onCreate, onCancel }) {
  const [form, setForm] = useState({
    name: "", age: 28, sex: "male", weight: 75, height: 175, activity: 1.2,
  });
  const tdee = calcTdee(form);

  return (
    <IndexCard accent="#0f766e" className="p-6 mb-6">
      <h3 className="pp-display text-lg text-stone-900 mb-4">Nuevo cliente</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2 text-sm text-stone-600">
          Nombre
          <input
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre del cliente"
          />
        </label>
        <label className="text-sm text-stone-600">
          Edad
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Sexo
          <select
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </label>
        <label className="text-sm text-stone-600">
          Peso (kg)
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Estatura (cm)
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
          />
        </label>
        <label className="col-span-2 text-sm text-stone-600">
          Nivel de actividad
          <select
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.activity}
            onChange={(e) => setForm({ ...form, activity: Number(e.target.value) })}
          >
            {ACTIVITY_FACTORS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between bg-stone-50 border border-stone-200 px-4 py-3">
        <span className="text-sm text-stone-500">Calorías base estimadas</span>
        <span className="pp-display text-xl text-teal-800">{tdee} kcal</span>
      </div>

      <div className="mt-5 flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!form.name.trim()) return;
            onCreate({
              id: `c${Date.now()}`,
              ...form,
              usesApp: true,
              macros: {
                kcal: tdee,
                protein: Math.round((tdee * 0.3) / 4),
                carbs: Math.round((tdee * 0.4) / 4),
                fats: Math.round((tdee * 0.3) / 9),
              },
              meals: [
                { id: "m1", name: "Desayuno", items: [] },
                { id: "m2", name: "Almuerzo", items: [] },
                { id: "m3", name: "Cena", items: [] },
              ],
              workoutDays: [
                { id: "d1", name: "Día 1", weekdays: [], muscleGroups: [], exercises: [{ id: "w1", name: "Por definir", detail: "—" }] },
              ],
              weightLog: [{ date: "Hoy", weight: form.weight }],
              streak: 0,
              progressPhotos: [],
              extraMeals: [],
              supplements: [],
              supplementLog: {},
              billing: { amount: 0, currency: "USD", dueDate: "", status: "al_dia", history: [] },
              pendingReceipt: null,
              mealLogs: {},
              workoutLog: {},
              checkin: { mood: null, energy: 0, foodFeeling: null, workoutFeeling: null, savedToday: false },
              checkinHistory: [],
              evaluations: [],
              pendingEvaluation: null,
              nextEvaluationDate: "",
              nextGoal: "",
              seenPhraseIds: [],
              todayPhrase: null,
            });
          }}
          className="px-5 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
        >
          Crear cliente
        </button>
      </div>
    </IndexCard>
  );
}

function TrendsPanel({ client }) {
  const MOOD_VALUE = { baja: 1, regular: 2, bien: 3, genial: 4 };
  const history = client.checkinHistory || [];
  const checkinData = history.slice(-14).map((h) => ({ date: h.date, energy: h.energy, mood: MOOD_VALUE[h.mood] || 0 }));
  const weightData = client.weightLog.slice(-8);
  const evalData = client.evaluations.slice(-6).map((e) => ({ date: e.date, score: e.score }));
  const avgEnergy = checkinData.length
    ? (checkinData.reduce((s, d) => s + d.energy, 0) / checkinData.length).toFixed(1)
    : null;

  return (
    <IndexCard accent="#0f766e" className="p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-1">
        <TrendingUp size={15} className="text-teal-700" /> Tendencias (últimas 4 semanas)
      </h3>
      <p className="text-xs text-stone-500 mb-4">
        Según los check-ins, peso y evaluaciones que el cliente ha registrado.
      </p>

      {history.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {history.slice(-12).map((h, i) => (
            <span key={i} className="text-base" title={h.date}>{moodEmoji(h.mood)}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
          <p className="text-[11px] text-stone-500">Check-ins registrados</p>
          <p className="pp-display text-lg text-stone-900">{history.length}</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
          <p className="text-[11px] text-stone-500">Energía promedio</p>
          <p className="pp-display text-lg text-stone-900">{avgEnergy ? `${avgEnergy}/5` : "—"}</p>
        </div>
      </div>

      {checkinData.length > 1 ? (
        <div className="mb-5">
          <p className="text-xs font-medium text-stone-600 mb-2">Energía por check-in</p>
          <div style={{ width: "100%", height: 130 }}>
            <ResponsiveContainer>
              <LineChart data={checkinData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="energy" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400 mb-5">Aún no hay suficientes check-ins para ver una tendencia.</p>
      )}

      {weightData.length > 1 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-stone-600 mb-2">Peso</p>
          <div style={{ width: "100%", height: 130 }}>
            <ResponsiveContainer>
              <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#c1834e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {evalData.length > 1 ? (
        <div>
          <p className="text-xs font-medium text-stone-600 mb-2">Puntuación de evaluaciones</p>
          <div style={{ width: "100%", height: 130 }}>
            <ResponsiveContainer>
              <LineChart data={evalData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-xs text-stone-400">Se necesitan al menos 2 evaluaciones para ver esa tendencia.</p>
      )}
    </IndexCard>
  );
}

const BILLING_STATUS_META = {
  al_dia: { label: "Al día", color: "#0f766e" },
  pendiente_revision: { label: "Comprobante pendiente de revisión", color: "#c99a3e" },
  vencido: { label: "Pago vencido", color: "#dc2626" },
};

function BillingPanel({ client, updateClient }) {
  const billing = client.billing || { amount: 0, currency: "USD", dueDate: "", status: "al_dia", history: [] };
  const [amount, setAmount] = useState(billing.amount);
  const [dueDate, setDueDate] = useState(billing.dueDate || "");
  const meta = BILLING_STATUS_META[billing.status] || BILLING_STATUS_META.al_dia;

  const saveTerms = () => {
    updateClient(client.id, { billing: { ...billing, amount, dueDate } });
  };

  const confirmPayment = () => {
    const newDue = new Date(dueDate || Date.now());
    newDue.setDate(newDue.getDate() + 30);
    updateClient(client.id, {
      pendingReceipt: null,
      billing: {
        ...billing,
        status: "al_dia",
        dueDate: newDue.toISOString().slice(0, 10),
        history: [...(billing.history || []), { id: `pay${Date.now()}`, date: "Hoy", amount, status: "confirmado" }],
      },
    });
  };

  const rejectReceipt = () => {
    updateClient(client.id, { pendingReceipt: null, billing: { ...billing, status: "vencido" } });
  };

  return (
    <IndexCard accent={meta.color} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <CreditCard size={15} style={{ color: meta.color }} /> Pagos
        </h3>
        <span className="text-[10px] font-medium px-2 py-1" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {client.pendingReceipt ? (
        <div className="mb-5">
          <p className="text-xs text-stone-500 mb-3">El cliente subió un comprobante de pago. Revísalo y confírmalo.</p>
          {client.pendingReceipt.dataUrl ? (
            <img src={client.pendingReceipt.dataUrl} alt="Comprobante" className="w-full max-w-xs border border-stone-200 mb-3" />
          ) : (
            <div className="border border-dashed border-stone-300 py-6 text-center mb-3">
              <p className="text-xs text-stone-400">Comprobante recibido (sin imagen de ejemplo en este demo).</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={rejectReceipt} className="flex-1 py-2 text-xs font-medium border border-stone-300 text-stone-600">
              Rechazar
            </button>
            <button
              onClick={confirmPayment}
              className="flex-1 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: "#0f766e" }}
            >
              Confirmar pago
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-400 mb-5">Sin comprobante pendiente de revisión.</p>
      )}

      <div className="pt-5 border-t border-stone-100">
        <p className="text-xs font-medium text-stone-600 mb-2">Términos de pago</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label className="text-[11px] text-stone-500">
            Monto (USD)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full border border-stone-300 px-2.5 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>
          <label className="text-[11px] text-stone-500">
            Próximo vencimiento
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full border border-stone-300 px-2.5 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>
        </div>
        <button onClick={saveTerms} className="w-full py-2 text-xs font-medium bg-stone-900 text-white hover:bg-stone-800">
          Guardar términos
        </button>
      </div>

      {billing.history?.length > 0 && (
        <div className="mt-5 pt-5 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-600 mb-2">Historial de pagos</p>
          <div className="flex flex-col gap-1.5">
            {[...billing.history].reverse().map((p) => (
              <div key={p.id} className="flex justify-between text-xs bg-stone-50 border border-stone-200 px-3 py-2">
                <span className="text-stone-600">{p.date}</span>
                <span className="font-medium text-stone-800">${p.amount} {billing.currency}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </IndexCard>
  );
}

function EvaluationPanel({ client, updateClient }) {
  const [weight, setWeight] = useState(client.weight);
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [score, setScore] = useState(0);
  const [coachNote, setCoachNote] = useState("");
  const [nextGoal, setNextGoal] = useState(client.nextGoal || "");
  const [nextDate, setNextDate] = useState(client.nextEvaluationDate || "");

  const lastEval = client.evaluations[client.evaluations.length - 1];
  const pending = client.pendingEvaluation;

  const saveEvaluation = () => {
    if (!pending || score === 0) return;
    const newEval = {
      id: `e${Date.now()}`,
      date: "Hoy",
      photoUrl: pending.dataUrl,
      weight,
      score,
      waist, hip, chest, arm, bodyFat,
      coachNote,
      reflection: { whatWasHard: pending.whatWasHard, whatWasGood: pending.whatWasGood },
    };
    updateClient(client.id, {
      evaluations: [...client.evaluations, newEval],
      pendingEvaluation: null,
      weight,
      weightLog: [...client.weightLog, { date: "Hoy", weight }],
      nextGoal,
    });
    setScore(0);
    setCoachNote("");
    setWaist(""); setHip(""); setChest(""); setArm(""); setBodyFat("");
  };

  const scoreHistory = client.evaluations.map((ev) => ({ date: ev.date, score: ev.score }));

  return (
    <IndexCard accent="#c1834e" className="p-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-4">
        <Camera size={15} style={{ color: "#c1834e" }} /> Evaluación mensual
      </h3>

      {pending ? (
        <div>
          <p className="text-xs text-stone-500 mb-3">
            El cliente envió su foto para la evaluación de este mes. Compárala, registra sus datos y califica su cumplimiento.
          </p>

          <p className="text-[11px] text-stone-500 mb-1.5">Comparación</p>
          <BeforeAfterSlider before={lastEval?.photoUrl || null} after={pending.dataUrl} accent="#c1834e" />

          {(pending.whatWasHard || pending.whatWasGood) && (
            <div className="mt-4 bg-stone-50 border border-stone-200 px-3 py-3 text-xs text-stone-600 space-y-1.5">
              {pending.whatWasGood && <p><span className="font-medium">Lo que le gustó:</span> {pending.whatWasGood}</p>}
              {pending.whatWasHard && <p><span className="font-medium">Lo que le costó:</span> {pending.whatWasHard}</p>}
            </div>
          )}

          <label className="text-xs font-medium text-stone-600 block mt-4 mb-3">
            Peso registrado (kg)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <p className="text-xs font-medium text-stone-600 mb-2">Medidas corporales (cm, opcional)</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              ["Cintura", waist, setWaist],
              ["Cadera", hip, setHip],
              ["Pecho", chest, setChest],
              ["Brazo", arm, setArm],
            ].map(([lbl, val, setter]) => (
              <label key={lbl} className="text-[10px] text-stone-500">
                {lbl}
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  className="mt-1 w-full border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:border-teal-700"
                />
              </label>
            ))}
          </div>

          <label className="text-xs font-medium text-stone-600 block mb-3">
            % de grasa corporal (opcional)
            <input
              type="number"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <p className="text-xs font-medium text-stone-600 mb-2">
            Puntuación de cumplimiento del plan <span className="text-stone-400">({score || "—"}/10)</span>
          </p>
          <BarSelector value={score} onChange={setScore} accent="#c1834e" max={10} label="Puntuación" />

          <label className="text-xs font-medium text-stone-600 block mt-4 mb-3">
            Feedback para el cliente
            <textarea
              value={coachNote}
              onChange={(e) => setCoachNote(e.target.value)}
              rows={2}
              placeholder="Ej: bajaste bien de peso, necesitamos subir proteína el próximo mes."
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <label className="text-xs font-medium text-stone-600 block mb-4">
            Meta para el próximo mes
            <input
              value={nextGoal}
              onChange={(e) => setNextGoal(e.target.value)}
              placeholder="Ej: llegar a 3 entrenamientos de fuerza por semana"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <button
            disabled={score === 0}
            onClick={saveEvaluation}
            className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#c1834e" }}
          >
            Guardar evaluación
          </button>
        </div>
      ) : (
        <p className="text-sm text-stone-400 mb-4">Esperando la foto del cliente para hacer la evaluación de este mes.</p>
      )}

      <div className="mt-5 pt-5 border-t border-stone-100">
        <p className="text-xs font-medium text-stone-600 mb-1">Próxima evaluación</p>
        <p className="text-[11px] text-stone-400 mb-2">
          El cliente solo verá el apartado de evaluación en su portal a partir de esta fecha.
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
          />
          <button
            onClick={() => updateClient(client.id, { nextEvaluationDate: nextDate })}
            className="px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800"
          >
            Guardar fecha
          </button>
        </div>
        {client.nextEvaluationDate && (
          <p className="text-[11px] text-stone-400 mt-2">
            Fecha actual guardada: {formatDate(client.nextEvaluationDate)}
          </p>
        )}
      </div>

      {scoreHistory.length > 1 && (
        <div className="mt-5 pt-5 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-600 mb-2">Evolución de cumplimiento</p>
          <div style={{ width: "100%", height: 130 }}>
            <ResponsiveContainer>
              <LineChart data={scoreHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#c1834e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {client.evaluations.length > 0 && (
        <div className="mt-5 pt-5 border-t border-stone-100">
          <p className="text-xs font-medium text-stone-600 mb-2">Historial de evaluaciones</p>
          <div className="flex flex-col gap-2">
            {[...client.evaluations].reverse().map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-2">
                {ev.photoUrl ? (
                  <img src={ev.photoUrl} alt="" className="w-9 h-9 object-cover" />
                ) : (
                  <div className="w-9 h-9 bg-stone-200" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-medium text-stone-800">{ev.date}</p>
                  <p className="text-[11px] text-stone-500">
                    {ev.weight} kg{ev.bodyFat ? ` · ${ev.bodyFat}% grasa` : ""}
                  </p>
                </div>
                <span className="pp-display text-base" style={{ color: "#c1834e" }}>{ev.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </IndexCard>
  );
}

function PrintPlanView({ client, coachProfile, onClose }) {
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const waMessage = encodeURIComponent(
    `Hola ${client.name}, aquí tienes tu plan de alimentación y entrenamiento actualizado de ${coachProfile.name}. Cualquier duda me escribes.`
  );

  return (
    <div className="min-h-screen bg-stone-200 pp-body">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-stone-900 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-stone-300 hover:text-white">
          <ArrowLeft size={15} /> Volver al panel
        </button>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${waMessage}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white/10 hover:bg-white/20"
          >
            <MessageCircle size={14} /> Enviar por WhatsApp
          </a>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white"
            style={{ backgroundColor: "#c1834e" }}
          >
            <Download size={14} /> Descargar / Imprimir PDF
          </button>
        </div>
      </div>
      <p className="no-print text-center text-[11px] text-stone-500 py-2 px-4">
        El PDF se genera desde el diálogo de impresión del navegador — elige "Guardar como PDF" como destino.
      </p>

      <div className="print-area max-w-2xl mx-auto bg-white my-6 shadow-sm overflow-hidden">
        {/* Franja de marca */}
        <div className="h-2" style={{ backgroundColor: coachProfile.accent }} />

        <div className="p-10">
          {/* Encabezado */}
          <div className="flex items-start justify-between border-b border-stone-200 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <BrandAvatar coachProfile={coachProfile} size={48} />
              <div>
                <p className="pp-display text-2xl text-stone-900 leading-tight">{coachProfile.name}</p>
                <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: coachProfile.accent }}>
                  Plan de alimentación y entrenamiento
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">Preparado para</p>
              <p className="text-sm font-semibold text-stone-800">{client.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">{today}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-10">
            {[
              ["Calorías", client.macros.kcal],
              ["Proteína", `${client.macros.protein}g`],
              ["Carbos", `${client.macros.carbs}g`],
              ["Grasas", `${client.macros.fats}g`],
            ].map(([l, v]) => (
              <div key={l} className="border border-stone-200 text-center py-3 bg-stone-50">
                <p className="text-[10px] text-stone-500 uppercase tracking-wide mb-0.5">{l}</p>
                <p className="pp-display text-xl text-stone-900">{v}</p>
              </div>
            ))}
          </div>

          {/* Nutrición */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-5" style={{ backgroundColor: "#c99a3e" }} />
            <h2 className="pp-display text-lg text-stone-900 uppercase tracking-wide">Plan de alimentación</h2>
          </div>
          <div className="h-px bg-stone-100 mb-4" />
          <div className="mb-10 flex flex-col gap-3">
            {client.meals.map((m) => (
              <div key={m.id} className="avoid-break border border-stone-200">
                <div className="px-4 py-2 border-b border-stone-100" style={{ backgroundColor: "#fdf8ef" }}>
                  <p className="text-sm font-semibold text-stone-800">{m.name}</p>
                </div>
                <ul className="px-4 py-3">
                  {m.items.length > 0 ? (
                    m.items.map((it, i) => (
                      <li key={it.id || i} className="text-sm text-stone-600 py-0.5 flex items-baseline gap-2">
                        <span className="w-1 h-1 rounded-full bg-stone-400 shrink-0" style={{ marginTop: "0.45em" }} />
                        {it.name} — {formatQty(it.qty, it.unit)}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-stone-400">Sin alimentos definidos.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          {/* Entrenamiento */}
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-5" style={{ backgroundColor: "#7c3aed" }} />
            <h2 className="pp-display text-lg text-stone-900 uppercase tracking-wide">Plan de entrenamiento</h2>
          </div>
          <div className="h-px bg-stone-100 mb-4" />
          <div className="flex flex-col gap-3 mb-10">
            {client.workoutDays.map((day) => (
              <div key={day.id} className="avoid-break border border-stone-200">
                <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between flex-wrap gap-1" style={{ backgroundColor: "#f8f6fd" }}>
                  <p className="text-sm font-semibold text-stone-800">{day.name}</p>
                  {day.weekdays?.length > 0 && (
                    <span className="text-[10px] font-medium text-violet-700">
                      {day.weekdays.join(" · ")}
                    </span>
                  )}
                </div>
                {day.muscleGroups?.length > 0 && (
                  <p className="px-4 pt-2 text-[11px] text-stone-400">{day.muscleGroups.join(" · ")}</p>
                )}
                <div className="px-4 py-2">
                  {day.exercises.length > 0 ? (
                    day.exercises.map((w) => (
                      <div key={w.id} className="flex justify-between gap-4 py-1.5 border-b border-stone-50 last:border-0 text-sm">
                        <span className="font-medium text-stone-700">{w.name}</span>
                        <span className="text-stone-500">{w.detail}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-400 py-1.5">Sin ejercicios definidos.</p>
                  )}
                </div>
              </div>
            ))}
            {client.workoutDays.length === 0 && (
              <p className="text-sm text-stone-400">Sin días de entrenamiento definidos.</p>
            )}
          </div>

          {/* Suplementación */}
          {(client.supplements || []).length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-5" style={{ backgroundColor: "#db2777" }} />
                <h2 className="pp-display text-lg text-stone-900 uppercase tracking-wide">Suplementación</h2>
              </div>
              <div className="h-px bg-stone-100 mb-4" />
              <div className="avoid-break border border-stone-200 mb-4">
                <div className="px-4 py-2 border-b border-stone-100" style={{ backgroundColor: "#fdf2f8" }}>
                  <p className="text-sm font-semibold text-stone-800">Suplementos recomendados</p>
                </div>
                <div className="px-4 py-2">
                  {client.supplements.map((s) => (
                    <div key={s.id} className="flex justify-between gap-4 py-1.5 border-b border-stone-50 last:border-0 text-sm">
                      <span className="font-medium text-stone-700">{s.name}</span>
                      <span className="text-stone-500">
                        {s.dose ? `${s.dose} · ` : ""}{s.timing}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mb-4">
                Consulta con un profesional de la salud antes de iniciar cualquier suplementación.
              </p>
            </>
          )}

          {/* Pie de página */}
          <div className="mt-10 pt-4 flex items-center justify-between border-t-2" style={{ borderColor: coachProfile.accent }}>
            <p className="text-[10px] text-stone-400">
              Generado con PlanPro para {coachProfile.name}.
            </p>
            <p className="text-[10px] text-stone-400">{today}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ pct, color, size = 36 }) {
  const inner = size - 8;
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${pct * 360}deg, #e7e5e4 0deg)` }}
    >
      <div
        className="rounded-full bg-white flex items-center justify-center font-semibold text-stone-700"
        style={{ width: inner, height: inner, fontSize: 9 }}
      >
        {Math.round(pct * 100)}
      </div>
    </div>
  );
}

function ClientReportRow({ c, onSelectClient }) {
  const [isOpen, setIsOpen] = useState(false);
  const mealLogs = c.mealLogs || {};
  const workoutLog = c.workoutLog || {};
  const supplementLog = c.supplementLog || {};
  const stats = computeClientDailyStats(c);
  const { mealsLogged, totalMeals, todaysDay, totalExercises, exLogged, totalSupplements, supplementsLogged, pct } = stats;
  const ringColor = pct === 1 ? "#0f766e" : pct > 0 ? "#c99a3e" : "#dc2626";

  return (
    <IndexCard accent="#0f766e" className="p-5">
      <div className="flex items-center gap-3">
        <ProgressRing pct={pct} color={ringColor} />
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex-1 flex items-center justify-between text-left min-w-0"
        >
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm truncate">{c.name}</p>
            <p className="text-xs text-stone-500 mt-0.5">
              Comidas {mealsLogged}/{totalMeals} ·{" "}
              {todaysDay ? `Entrenamiento ${exLogged}/${totalExercises}` : "Descanso"}
              {totalSupplements > 0 && <> · Suplementos {supplementsLogged}/{totalSupplements}</>}
              {c.checkin?.savedToday ? (
                <> · {moodEmoji(c.checkin.mood)} Energía {c.checkin.energy}/5</>
              ) : (
                " · Sin check-in hoy"
              )}
            </p>
          </div>
          <ChevronRight size={16} className={`text-stone-400 transition shrink-0 ml-2 ${isOpen ? "rotate-90" : ""}`} />
        </button>
      </div>

      <button
        onClick={() => onSelectClient(c.id)}
        className="text-xs font-medium mt-3 text-teal-800 hover:underline"
      >
        Ver ficha completa →
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-medium text-stone-500 mb-2 uppercase tracking-wide">Comidas</p>
            <div className="flex flex-col gap-1.5">
              {c.meals.map((m) => {
                const log = mealLogs[m.id];
                const checkedCount = log ? Object.values(log.items || {}).filter(Boolean).length : 0;
                const status = checkedCount === m.items.length && !log?.other
                  ? "#0f766e"
                  : checkedCount > 0 || log?.other
                  ? "#c99a3e"
                  : "#d6d3d1";
                return (
                  <div key={m.id} className="flex items-start gap-2.5 text-xs py-1">
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: status }} />
                    <div className="flex-1">
                      <p className="font-medium text-stone-700">
                        {m.name} <span className="text-stone-400 font-normal">({checkedCount}/{m.items.length})</span>
                      </p>
                      {log?.other && <p className="text-stone-500 mt-0.5">Otro: {log.other}</p>}
                    </div>
                    {log?.photo && <img src={log.photo} alt="" className="w-8 h-8 object-cover" />}
                  </div>
                );
              })}
              {(c.extraMeals || []).map((x) => (
                <div key={x.id} className="flex items-start gap-2.5 text-xs py-1">
                  <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: "#c99a3e" }} />
                  <div className="flex-1">
                    <p className="font-medium text-stone-700">
                      Extra <span className="text-stone-400 font-normal">({x.time})</span>
                    </p>
                    <p className="text-stone-500 mt-0.5">{x.description}</p>
                  </div>
                  {x.photo && <img src={x.photo} alt="" className="w-8 h-8 object-cover" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium text-stone-500 mb-2 uppercase tracking-wide">
              Entrenamiento · {getTodayWeekday()}
            </p>
            {todaysDay ? (
              <div>
                <p className="text-[11px] font-medium text-stone-600 mb-1">{todaysDay.name}</p>
                <div className="flex flex-col gap-1">
                  {todaysDay.exercises.map((w) => (
                    <div key={w.id} className="flex items-center gap-2.5 text-xs py-0.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: workoutLog[todaysDay.id]?.[w.id] ? "#7c3aed" : "#d6d3d1" }}
                      />
                      <span className="text-stone-700">{w.name}</span>
                    </div>
                  ))}
                  {todaysDay.exercises.length === 0 && (
                    <p className="text-xs text-stone-400">Sin ejercicios definidos para este día.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400">Hoy es día de descanso — no tiene rutina asignada.</p>
            )}
          </div>

          {totalSupplements > 0 && (
            <div>
              <p className="text-[11px] font-medium text-stone-500 mb-2 uppercase tracking-wide">Suplementación</p>
              <div className="flex flex-col gap-1">
                {c.supplements.map((s) => (
                  <div key={s.id} className="flex items-center gap-2.5 text-xs py-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: supplementLog[s.id] ? "#db2777" : "#d6d3d1" }}
                    />
                    <span className="text-stone-700">{s.name}</span>
                    <span className="text-stone-400">{s.timing}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </IndexCard>
  );
}

function PaymentMethodsEditor({ coachProfile, setCoachProfile }) {
  const [label, setLabel] = useState("Transferencia bancaria");
  const [details, setDetails] = useState("");

  const addMethod = () => {
    if (!details.trim()) return;
    setCoachProfile({
      ...coachProfile,
      paymentMethods: [...(coachProfile.paymentMethods || []), { id: `pm${Date.now()}`, label, details: details.trim() }],
    });
    setDetails("");
  };

  const removeMethod = (id) => {
    setCoachProfile({ ...coachProfile, paymentMethods: (coachProfile.paymentMethods || []).filter((m) => m.id !== id) });
  };

  return (
    <IndexCard accent="#0f766e" className="p-6 mb-6">
      <h3 className="text-sm font-semibold text-stone-900 mb-1">Mis métodos de pago</h3>
      <p className="text-xs text-stone-500 mb-4">Así los va a ver el cliente cuando le toque transferir.</p>

      <div className="flex flex-col gap-2 mb-3">
        {(coachProfile.paymentMethods || []).map((m) => (
          <div key={m.id} className="flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs">
            <span className="font-medium text-stone-700 w-40 shrink-0">{m.label}</span>
            <span className="flex-1 text-stone-500">{m.details}</span>
            <button onClick={() => removeMethod(m.id)} className="text-stone-400 hover:text-red-600"><X size={12} /></button>
          </div>
        ))}
        {(coachProfile.paymentMethods || []).length === 0 && (
          <span className="text-xs text-stone-400">Sin métodos de pago todavía.</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border border-stone-300 px-2 py-2 text-xs focus:outline-none focus:border-teal-700"
        >
          <option>Transferencia bancaria</option>
          <option>Zelle</option>
          <option>PayPal</option>
          <option>Otro</option>
        </select>
        <input
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ej: Banco, cuenta y titular"
          className="col-span-2 border border-stone-300 px-2.5 py-2 text-xs focus:outline-none focus:border-teal-700"
        />
      </div>
      <button
        onClick={addMethod}
        disabled={!details.trim()}
        className="w-full mt-2 py-2 text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-stone-400 disabled:opacity-40"
      >
        + Agregar método de pago
      </button>
    </IndexCard>
  );
}

function PaymentsView({ clients, coachProfile, setCoachProfile, onSelectClient }) {
  const pendingClients = clients.filter((c) => c.pendingReceipt);

  return (
    <div>
      <div className="mb-6">
        <h1 className="pp-display text-2xl text-stone-900">Pagos</h1>
        <p className="text-sm text-stone-500 mt-1">Cómo va cada cliente con su pago, y comprobantes por revisar.</p>
      </div>

      <PaymentMethodsEditor coachProfile={coachProfile} setCoachProfile={setCoachProfile} />

      {pendingClients.length > 0 && (
        <div className="flex items-start gap-3 border px-4 py-3 mb-4" style={{ borderColor: "#0f766e", backgroundColor: "#f0fdfa" }}>
          <CreditCard size={16} style={{ color: "#0f766e" }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {pendingClients.length} comprobante{pendingClients.length > 1 ? "s" : ""} por revisar
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pendingClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectClient(c.id)}
                  className="text-xs font-medium px-2.5 py-1 bg-white border"
                  style={{ borderColor: "#0f766e", color: "#0f766e" }}
                >
                  {c.name} →
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {clients.map((c) => {
          const billing = c.billing || { amount: 0, currency: "USD", dueDate: "", status: "al_dia" };
          const meta = BILLING_STATUS_META[billing.status] || BILLING_STATUS_META.al_dia;
          return (
            <IndexCard key={c.id} accent={meta.color} className="p-5">
              <button onClick={() => onSelectClient(c.id)} className="w-full flex items-center justify-between text-left">
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{c.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ${billing.amount} {billing.currency} · Vence {billing.dueDate ? formatDate(billing.dueDate) : "sin definir"}
                  </p>
                </div>
                <span className="text-[10px] font-medium px-2 py-1" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                  {meta.label}
                </span>
              </button>
            </IndexCard>
          );
        })}
        {clients.length === 0 && <p className="text-sm text-stone-400 text-center py-8">No hay clientes todavía.</p>}
      </div>
    </div>
  );
}

function DailyReportView({ clients, onSelectClient }) {
  const checkedInToday = clients.filter((c) => c.checkin?.savedToday).length;
  const lowEnergyClients = clients.filter((c) => c.checkin?.savedToday && c.checkin.energy > 0 && c.checkin.energy <= 2);
  const pendingEvalClients = clients.filter((c) => c.pendingEvaluation);

  const classify = (c) => {
    const { doneItems, totalItems } = computeClientDailyStats(c);
    const lowEnergy = c.checkin?.savedToday && c.checkin.energy > 0 && c.checkin.energy <= 2;

    if (c.pendingEvaluation || doneItems === 0 || lowEnergy) return "attention";
    if (totalItems > 0 && doneItems === totalItems && c.checkin?.savedToday) return "ok";
    return "progress";
  };

  const zeroProgressCount = clients.filter((c) => classify(c) === "attention" && !c.pendingEvaluation).length;

  const attention = clients.filter((c) => classify(c) === "attention");
  const progress = clients.filter((c) => classify(c) === "progress");
  const ok = clients.filter((c) => classify(c) === "ok");

  const SECTIONS = [
    { key: "attention", label: "Necesitan atención", emoji: "🔴", list: attention },
    { key: "progress", label: "En progreso", emoji: "🟡", list: progress },
    { key: "ok", label: "Al día", emoji: "🟢", list: ok },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="pp-display text-2xl text-stone-900">Reporte diario</h1>
        <p className="text-sm text-stone-500 mt-1">Cómo va cada cliente con el plan de hoy.</p>
      </div>

      {pendingEvalClients.length > 0 && (
        <div className="flex items-start gap-3 border px-4 py-3 mb-4" style={{ borderColor: "#7c3aed", backgroundColor: "#f8f6fd" }}>
          <Camera size={16} style={{ color: "#7c3aed" }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-stone-800">
              {pendingEvalClients.length} evaluación{pendingEvalClients.length > 1 ? "es" : ""} pendiente{pendingEvalClients.length > 1 ? "s" : ""} por revisar
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Estos clientes ya enviaron su foto y están esperando tu evaluación.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pendingEvalClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectClient(c.id)}
                  className="text-xs font-medium px-2.5 py-1 bg-white border"
                  style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                >
                  {c.name} →
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-stone-200 bg-white px-3 py-3 text-center">
          <p className="pp-display text-xl text-stone-900">{checkedInToday}/{clients.length}</p>
          <p className="text-[10px] text-stone-500 mt-0.5 uppercase tracking-wide">Check-in hecho</p>
        </div>
        <div className="border border-stone-200 bg-white px-3 py-3 text-center">
          <p className="pp-display text-xl" style={{ color: lowEnergyClients.length > 0 ? "#dc2626" : "#1c1917" }}>
            {lowEnergyClients.length}
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5 uppercase tracking-wide">Energía baja</p>
        </div>
        <div className="border border-stone-200 bg-white px-3 py-3 text-center">
          <p className="pp-display text-xl" style={{ color: zeroProgressCount > 0 ? "#dc2626" : "#1c1917" }}>
            {zeroProgressCount}
          </p>
          <p className="text-[10px] text-stone-500 mt-0.5 uppercase tracking-wide">Sin avance hoy</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-8">No hay clientes todavía.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {SECTIONS.filter((s) => s.list.length > 0).map((s) => (
            <div key={s.key}>
              <p className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">
                {s.emoji} {s.label} ({s.list.length})
              </p>
              <div className="flex flex-col gap-3">
                {s.list.map((c) => (
                  <ClientReportRow key={c.id} c={c} onSelectClient={onSelectClient} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryPicker({ options, placeholder, onSelect, groupFilter }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const base = groupFilter ? options.filter((o) => o.muscleGroup === groupFilter) : options;
  const filtered = (query ? base.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())) : base).slice(0, 8);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:border-teal-700"
      />
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 max-h-40 overflow-y-auto shadow-md">
          {filtered.length === 0 && <div className="px-3 py-2 text-xs text-stone-400">Sin resultados</div>}
          {filtered.map((o) => (
            <button
              key={o.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(o); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 border-b border-stone-50 last:border-0 flex items-center justify-between gap-2"
            >
              <span>{o.name}</span>
              {o.muscleGroup && <span className="text-[10px] text-stone-400 shrink-0">{o.muscleGroup}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const MEAL_SPLIT = [
  { name: "Desayuno", pct: 0.25 },
  { name: "Almuerzo", pct: 0.35 },
  { name: "Merienda", pct: 0.15 },
  { name: "Cena", pct: 0.25 },
];

function classifyFood(f) {
  const pCal = f.protein * 4, cCal = f.carbs * 4, fCal = f.fats * 9;
  const max = Math.max(pCal, cCal, fCal);
  if (max === pCal) return "protein";
  if (max === cCal) return "carb";
  return "fat";
}

function roundQty(value, unit) {
  if (!isFinite(value) || value <= 0) return unit === "unidad" ? 1 : 10;
  if (unit === "unidad") return Math.max(0.5, Math.round(value * 2) / 2);
  return Math.max(5, Math.round(value / 5) * 5);
}

function formatQty(qty, unit) {
  return unit === "unidad" ? `${qty} unidad${qty !== 1 ? "es" : ""}` : `${qty}${unit}`;
}

function pickRandom(arr, exclude) {
  const pool = arr.filter((f) => !exclude.includes(f.id));
  const list = pool.length ? pool : arr;
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

// Genera un plan de alimentación completo distribuyendo los macros objetivo
// entre comidas, usando la biblioteca de alimentos del coach. No es una
// llamada a un modelo de IA externo — es un algoritmo determinístico que
// corre 100% en el navegador, así que funciona igual desplegado en Vercel.
function generateMealPlanOption(macros, foodLibrary) {
  const buckets = { protein: [], carb: [], fat: [] };
  foodLibrary.forEach((f) => buckets[classifyFood(f)].push(f));

  const usedProtein = [];
  const totals = { protein: 0, carbs: 0, fats: 0 };

  const meals = MEAL_SPLIT.map((slot, i) => {
    const mealProtein = macros.protein * slot.pct;
    const mealCarbs = macros.carbs * slot.pct;
    const items = [];

    const addFood = (food, qty) => {
      const factor = qty / food.base;
      totals.protein += food.protein * factor;
      totals.carbs += food.carbs * factor;
      totals.fats += food.fats * factor;
      const macros = scaledMacros(food, qty);
      items.push({
        id: `it${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        foodId: food.id,
        name: food.name,
        qty,
        unit: food.unit,
        ...macros,
      });
    };

    const proteinFood = buckets.protein.length ? pickRandom(buckets.protein, usedProtein) : null;
    if (proteinFood) {
      usedProtein.push(proteinFood.id);
      addFood(proteinFood, roundQty((mealProtein / proteinFood.protein) * proteinFood.base, proteinFood.unit));
    }
    const carbFood = buckets.carb.length ? pickRandom(buckets.carb, []) : null;
    if (carbFood) {
      addFood(carbFood, roundQty((mealCarbs / carbFood.carbs) * carbFood.base, carbFood.unit));
    }
    const fatFood = buckets.fat.length ? pickRandom(buckets.fat, []) : null;
    if (fatFood) {
      addFood(fatFood, roundQty(fatFood.base, fatFood.unit));
    }

    return { id: `m${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: slot.name, items };
  });

  const kcal = Math.round(totals.protein * 4 + totals.carbs * 4 + totals.fats * 9);
  return {
    meals,
    totals: { kcal, protein: Math.round(totals.protein), carbs: Math.round(totals.carbs), fats: Math.round(totals.fats) },
  };
}

function MealPlanGenerator({ client, updateClient, foodLibrary }) {
  const [options, setOptions] = useState(null);

  const generate = () => {
    const opts = [1, 2, 3].map(() => generateMealPlanOption(client.macros, foodLibrary));
    setOptions(opts);
  };

  const useOption = (opt) => {
    updateClient(client.id, { meals: opt.meals });
    setOptions(null);
  };

  return (
    <div className="mb-4">
      <button
        onClick={generate}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white mb-3"
        style={{ backgroundColor: "#c99a3e" }}
      >
        <Sparkles size={13} /> {options ? "Generar otras opciones" : "Generar opciones según macros"}
      </button>
      <p className="text-[11px] text-stone-400 mb-3">
        Objetivo: {client.macros.kcal} kcal · P {client.macros.protein}g · C {client.macros.carbs}g · G {client.macros.fats}g
      </p>

      {options && (
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          {options.map((opt, idx) => (
            <div key={idx} className="border border-stone-200 p-3 bg-white">
              <p className="text-xs font-semibold text-stone-800 mb-1">Opción {idx + 1}</p>
              <p className="text-[11px] text-stone-500 mb-2">
                {opt.totals.kcal} kcal · P {opt.totals.protein}g · C {opt.totals.carbs}g · G {opt.totals.fats}g
              </p>
              <div className="flex flex-col gap-1.5 mb-3">
                {opt.meals.map((m) => (
                  <div key={m.id} className="text-[11px]">
                    <span className="font-medium text-stone-700">{m.name}:</span>{" "}
                    <span className="text-stone-500">
                      {m.items.map((it) => `${it.name} ${formatQty(it.qty, it.unit)}`).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => useOption(opt)}
                className="w-full py-1.5 text-[11px] font-medium text-white bg-stone-900 hover:bg-stone-800"
              >
                Usar esta opción
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupplementEditor({ client, updateClient }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [timing, setTiming] = useState("Mañana");

  const addSupplement = () => {
    if (!name.trim()) return;
    updateClient(client.id, {
      supplements: [...(client.supplements || []), { id: `s${Date.now()}`, name: name.trim(), dose, timing }],
    });
    setName("");
    setDose("");
  };

  const removeSupplement = (id) => {
    updateClient(client.id, { supplements: (client.supplements || []).filter((s) => s.id !== id) });
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-3">
        {(client.supplements || []).map((s) => (
          <div key={s.id} className="flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs">
            <span className="flex-1 font-medium text-stone-700">{s.name}</span>
            <span className="text-stone-500 w-20 text-right">{s.dose || "—"}</span>
            <span className="text-stone-400 w-24 text-right">{s.timing}</span>
            <button onClick={() => removeSupplement(s.id)} className="text-stone-400 hover:text-red-600"><X size={12} /></button>
          </div>
        ))}
        {(client.supplements || []).length === 0 && <span className="text-xs text-stone-400">Sin suplementos todavía</span>}
      </div>

      <p className="text-[10px] font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Atajos rápidos</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUPPLEMENT_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setName(p)}
            className="text-[10px] font-medium px-2 py-1 border border-stone-200 text-stone-500 hover:border-stone-400"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="border border-stone-300 px-2.5 py-2 text-xs focus:outline-none focus:border-teal-700"
        />
        <input
          value={dose}
          onChange={(e) => setDose(e.target.value)}
          placeholder="Dosis (ej. 5g)"
          className="border border-stone-300 px-2.5 py-2 text-xs focus:outline-none focus:border-teal-700"
        />
        <select
          value={timing}
          onChange={(e) => setTiming(e.target.value)}
          className="border border-stone-300 px-2 py-2 text-xs focus:outline-none focus:border-teal-700"
        >
          <option>Mañana</option>
          <option>Antes de entrenar</option>
          <option>Post-entreno</option>
          <option>Con comidas</option>
          <option>Noche</option>
        </select>
      </div>
      <button
        onClick={addSupplement}
        disabled={!name.trim()}
        className="w-full mt-2 py-2 text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-stone-400 disabled:opacity-40"
      >
        + Agregar suplemento
      </button>
    </div>
  );
}

function MealPlanEditor({ client, updateClient, foodLibrary }) {
  const addMeal = () => {
    updateClient(client.id, { meals: [...client.meals, { id: `m${Date.now()}`, name: "Nueva comida", items: [] }] });
  };
  const removeMeal = (mealId) => {
    updateClient(client.id, { meals: client.meals.filter((m) => m.id !== mealId) });
  };
  const renameMeal = (mealId, name) => {
    updateClient(client.id, { meals: client.meals.map((m) => (m.id === mealId ? { ...m, name } : m)) });
  };
  const addItem = (mealId, food) => {
    const qty = food.base;
    const macros = scaledMacros(food, qty);
    const newItem = { id: `i${Date.now()}`, foodId: food.id, name: food.name, qty, unit: food.unit, ...macros };
    updateClient(client.id, {
      meals: client.meals.map((m) => (m.id === mealId ? { ...m, items: [...m.items, newItem] } : m)),
    });
  };
  const removeItem = (mealId, index) => {
    updateClient(client.id, {
      meals: client.meals.map((m) => (m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== index) } : m)),
    });
  };
  const updateItemQty = (mealId, index, qty) => {
    updateClient(client.id, {
      meals: client.meals.map((m) => {
        if (m.id !== mealId) return m;
        const items = m.items.map((it, i) => {
          if (i !== index) return it;
          const food = foodLibrary.find((f) => f.id === it.foodId);
          const macros = food ? scaledMacros(food, qty) : { protein: it.protein, carbs: it.carbs, fats: it.fats };
          return { ...it, qty, ...macros };
        });
        return { ...m, items };
      }),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {client.meals.map((m) => (
        <div key={m.id} className="border border-stone-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              value={m.name}
              onChange={(e) => renameMeal(m.id, e.target.value)}
              className="text-sm font-medium border-b border-transparent focus:border-stone-300 focus:outline-none bg-transparent flex-1"
            />
            <button onClick={() => removeMeal(m.id)} className="text-stone-400 hover:text-red-600"><X size={14} /></button>
          </div>
          <div className="flex flex-col gap-1.5 mb-2">
            {m.items.map((it, i) => (
              <div key={it.id || i} className="flex items-center gap-2 text-xs bg-stone-50 border border-stone-100 px-2 py-1.5">
                <span className="flex-1 text-stone-700">{it.name}</span>
                <input
                  type="number"
                  value={it.qty}
                  onChange={(e) => updateItemQty(m.id, i, Number(e.target.value))}
                  className="w-14 border border-stone-200 px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-teal-700"
                />
                <span className="text-stone-400 w-10">{it.unit}</span>
                <span className="text-[10px] font-medium" style={{ color: MACRO_COLORS.protein }}>{it.protein}P</span>
                <span className="text-[10px] font-medium" style={{ color: MACRO_COLORS.carbs }}>{it.carbs}C</span>
                <span className="text-[10px] font-medium" style={{ color: MACRO_COLORS.fats }}>{it.fats}G</span>
                <button onClick={() => removeItem(m.id, i)} className="text-stone-400 hover:text-red-600"><X size={11} /></button>
              </div>
            ))}
            {m.items.length === 0 && <span className="text-xs text-stone-400">Sin alimentos todavía</span>}
          </div>
          <LibraryPicker options={foodLibrary} placeholder="Buscar alimento en la biblioteca..." onSelect={(f) => addItem(m.id, f)} />
        </div>
      ))}
      <button
        onClick={addMeal}
        className="flex items-center justify-center gap-2 py-2 text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-stone-400"
      >
        <Plus size={13} /> Agregar comida
      </button>
    </div>
  );
}

function WorkoutPlanEditor({ client, updateClient, exerciseLibrary }) {
  const days = client.workoutDays;

  const patchDays = (newDays) => updateClient(client.id, { workoutDays: newDays });

  const addDay = () => {
    patchDays([...days, { id: `d${Date.now()}`, name: `Día ${days.length + 1}`, weekdays: [], muscleGroups: [], exercises: [] }]);
  };
  const removeDay = (dayId) => patchDays(days.filter((d) => d.id !== dayId));
  const renameDay = (dayId, name) => patchDays(days.map((d) => (d.id === dayId ? { ...d, name } : d)));
  const toggleWeekday = (dayId, weekday) => {
    patchDays(
      days.map((d) => {
        if (d.id !== dayId) return d;
        const has = d.weekdays.includes(weekday);
        return { ...d, weekdays: has ? d.weekdays.filter((w) => w !== weekday) : [...d.weekdays, weekday] };
      })
    );
  };
  const toggleMuscleGroup = (dayId, group) => {
    patchDays(
      days.map((d) => {
        if (d.id !== dayId) return d;
        const has = d.muscleGroups.includes(group);
        return { ...d, muscleGroups: has ? d.muscleGroups.filter((g) => g !== group) : [...d.muscleGroups, group] };
      })
    );
  };
  const addExercise = (dayId, ex) => {
    const newEx = { id: `w${Date.now()}`, name: ex.name, detail: `${ex.defaultSets} x ${ex.defaultReps}` };
    patchDays(days.map((d) => (d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d)));
  };
  const removeExercise = (dayId, exId) => {
    patchDays(days.map((d) => (d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d)));
  };
  const updateDetail = (dayId, exId, detail) => {
    patchDays(
      days.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, detail } : e)) } : d
      )
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {days.map((day) => (
        <div key={day.id} className="border border-stone-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              value={day.name}
              onChange={(e) => renameDay(day.id, e.target.value)}
              className="text-sm font-medium border-b border-transparent focus:border-stone-300 focus:outline-none bg-transparent flex-1"
            />
            <button onClick={() => removeDay(day.id)} className="text-stone-400 hover:text-red-600"><X size={14} /></button>
          </div>

          <p className="text-[10px] font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Días de la semana</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {WEEKDAYS.map((wd) => {
              const takenByOther = days.find((d) => d.id !== day.id && d.weekdays.includes(wd));
              return (
                <button
                  key={wd}
                  onClick={() => toggleWeekday(day.id, wd)}
                  title={takenByOther ? `También asignado a "${takenByOther.name}"` : undefined}
                  className={`text-[10px] font-medium px-2 py-1 border ${
                    day.weekdays.includes(wd)
                      ? "text-white border-teal-700"
                      : takenByOther
                      ? "text-stone-300 border-stone-100"
                      : "text-stone-500 border-stone-200"
                  }`}
                  style={day.weekdays.includes(wd) ? { backgroundColor: "#0f766e" } : {}}
                >
                  {wd.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-medium text-stone-500 mb-1.5 uppercase tracking-wide">Grupo muscular</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => toggleMuscleGroup(day.id, g)}
                className={`text-[10px] font-medium px-2 py-1 border ${
                  day.muscleGroups.includes(g) ? "text-white border-violet-700" : "text-stone-500 border-stone-200"
                }`}
                style={day.muscleGroups.includes(g) ? { backgroundColor: "#7c3aed" } : {}}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-3">
            {day.exercises.map((w) => (
              <div key={w.id} className="flex items-center gap-2 border border-stone-200 px-3 py-2">
                <span className="flex-1 text-xs font-medium text-stone-700">{w.name}</span>
                <input
                  value={w.detail}
                  onChange={(e) => updateDetail(day.id, w.id, e.target.value)}
                  className="w-24 text-xs border border-stone-200 px-2 py-1 focus:outline-none focus:border-teal-700"
                />
                <button onClick={() => removeExercise(day.id, w.id)} className="text-stone-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ))}
            {day.exercises.length === 0 && <span className="text-xs text-stone-400">Sin ejercicios todavía</span>}
          </div>

          <LibraryPicker
            options={exerciseLibrary}
            placeholder={
              day.muscleGroups.length === 1
                ? `Buscar ejercicio de ${day.muscleGroups[0]}...`
                : "Buscar ejercicio en la biblioteca..."
            }
            groupFilter={day.muscleGroups.length === 1 ? day.muscleGroups[0] : null}
            onSelect={(ex) => addExercise(day.id, ex)}
          />
        </div>
      ))}

      <button
        onClick={addDay}
        className="flex items-center justify-center gap-2 py-2 text-xs font-medium border border-dashed border-stone-300 text-stone-500 hover:border-stone-400"
      >
        <Plus size={13} /> Agregar día
      </button>
    </div>
  );
}

function NewFoodForm({ onCancel, onCreate }) {
  const [form, setForm] = useState({ name: "", unit: "g", base: 100, protein: 0, carbs: 0, fats: 0 });
  return (
    <IndexCard accent="#c99a3e" className="p-6 mb-6">
      <h3 className="pp-display text-lg text-stone-900 mb-4">Nuevo alimento</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2 text-sm text-stone-600">
          Nombre
          <input
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Cantidad base
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.base}
            onChange={(e) => setForm({ ...form, base: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Unidad
          <select
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="unidad">unidad</option>
          </select>
        </label>
        <label className="text-sm text-stone-600">
          Proteína (g)
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Carbohidratos (g)
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Grasas (g)
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.fats}
            onChange={(e) => setForm({ ...form, fats: Number(e.target.value) })}
          />
        </label>
      </div>
      <div className="mt-5 flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancelar</button>
        <button
          onClick={() => { if (!form.name.trim()) return; onCreate({ id: `f${Date.now()}`, ...form }); }}
          className="px-5 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
        >
          Crear alimento
        </button>
      </div>
    </IndexCard>
  );
}

function FoodLibraryTab({ library, setLibrary, showForm, setShowForm }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
        >
          <Plus size={15} /> Crear alimento
        </button>
      </div>
      {showForm && (
        <NewFoodForm onCancel={() => setShowForm(false)} onCreate={(f) => { setLibrary([f, ...library]); setShowForm(false); }} />
      )}
      <IndexCard accent="#c99a3e" className="p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Porción</th>
              <th className="px-4 py-2.5 font-medium">Proteína</th>
              <th className="px-4 py-2.5 font-medium">Carbos</th>
              <th className="px-4 py-2.5 font-medium">Grasas</th>
              <th className="px-4 py-2.5 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {library.map((f) => (
              <tr key={f.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-800">{f.name}</td>
                <td className="px-4 py-2.5 text-stone-500">{f.base} {f.unit}</td>
                <td className="px-4 py-2.5 text-stone-500">{f.protein}g</td>
                <td className="px-4 py-2.5 text-stone-500">{f.carbs}g</td>
                <td className="px-4 py-2.5 text-stone-500">{f.fats}g</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => setLibrary(library.filter((x) => x.id !== f.id))} className="text-stone-300 hover:text-red-600">
                    <X size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {library.length === 0 && <p className="text-xs text-stone-400 text-center py-8">Aún no hay alimentos en tu biblioteca.</p>}
      </IndexCard>
    </div>
  );
}

function NewExerciseForm({ onCancel, onCreate }) {
  const [form, setForm] = useState({ name: "", muscleGroup: MUSCLE_GROUPS[0], equipment: "", defaultSets: 3, defaultReps: "10" });
  return (
    <IndexCard accent="#7c3aed" className="p-6 mb-6">
      <h3 className="pp-display text-lg text-stone-900 mb-4">Nuevo ejercicio</h3>
      <div className="grid grid-cols-2 gap-4">
        <label className="col-span-2 text-sm text-stone-600">
          Nombre
          <input
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Grupo muscular
          <select
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.muscleGroup}
            onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-stone-600">
          Equipo requerido
          <input
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.equipment}
            onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            placeholder="Ej: Mancuernas"
          />
        </label>
        <label className="text-sm text-stone-600">
          Series por defecto
          <input
            type="number"
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.defaultSets}
            onChange={(e) => setForm({ ...form, defaultSets: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm text-stone-600">
          Repeticiones por defecto
          <input
            className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            value={form.defaultReps}
            onChange={(e) => setForm({ ...form, defaultReps: e.target.value })}
            placeholder="Ej: 8-10"
          />
        </label>
      </div>
      <div className="mt-5 flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900">Cancelar</button>
        <button
          onClick={() => { if (!form.name.trim()) return; onCreate({ id: `ex${Date.now()}`, ...form }); }}
          className="px-5 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
        >
          Crear ejercicio
        </button>
      </div>
    </IndexCard>
  );
}

function ExerciseLibraryTab({ library, setLibrary, showForm, setShowForm }) {
  const [groupFilter, setGroupFilter] = useState("Todos");
  const filtered = groupFilter === "Todos" ? library : library.filter((ex) => ex.muscleGroup === groupFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["Todos", ...MUSCLE_GROUPS].map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`text-[11px] font-medium px-2.5 py-1.5 border ${
                groupFilter === g ? "text-white border-violet-700" : "text-stone-500 border-stone-200 bg-white"
              }`}
              style={groupFilter === g ? { backgroundColor: "#7c3aed" } : {}}
            >
              {g}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
        >
          <Plus size={15} /> Crear ejercicio
        </button>
      </div>
      {showForm && (
        <NewExerciseForm onCancel={() => setShowForm(false)} onCreate={(ex) => { setLibrary([ex, ...library]); setShowForm(false); }} />
      )}
      <IndexCard accent="#7c3aed" className="p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-stone-50 text-stone-500 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Grupo</th>
              <th className="px-4 py-2.5 font-medium">Equipo</th>
              <th className="px-4 py-2.5 font-medium">Series x reps</th>
              <th className="px-4 py-2.5 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ex) => (
              <tr key={ex.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-800">{ex.name}</td>
                <td className="px-4 py-2.5 text-stone-500">{ex.muscleGroup || "—"}</td>
                <td className="px-4 py-2.5 text-stone-500">{ex.equipment || "—"}</td>
                <td className="px-4 py-2.5 text-stone-500">{ex.defaultSets} x {ex.defaultReps}</td>
                <td className="px-4 py-2.5">
                  <button onClick={() => setLibrary(library.filter((x) => x.id !== ex.id))} className="text-stone-300 hover:text-red-600">
                    <X size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-xs text-stone-400 text-center py-8">No hay ejercicios en este grupo todavía.</p>}
      </IndexCard>
    </div>
  );
}

function LibraryView({ foodLibrary, setFoodLibrary, exerciseLibrary, setExerciseLibrary }) {
  const [tab, setTab] = useState("alimentos");
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [showExForm, setShowExForm] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h1 className="pp-display text-2xl text-stone-900">Biblioteca</h1>
        <p className="text-sm text-stone-500 mt-1">Alimentos y ejercicios reutilizables para armar los planes de tus clientes.</p>
      </div>

      <div className="flex gap-1 bg-white border border-stone-300 p-0.5 w-fit mb-6">
        <button
          onClick={() => setTab("alimentos")}
          className={`px-4 py-1.5 text-xs font-medium ${tab === "alimentos" ? "bg-stone-900 text-white" : "text-stone-500"}`}
        >
          Alimentos
        </button>
        <button
          onClick={() => setTab("ejercicios")}
          className={`px-4 py-1.5 text-xs font-medium ${tab === "ejercicios" ? "bg-stone-900 text-white" : "text-stone-500"}`}
        >
          Ejercicios
        </button>
      </div>

      {tab === "alimentos" ? (
        <FoodLibraryTab library={foodLibrary} setLibrary={setFoodLibrary} showForm={showFoodForm} setShowForm={setShowFoodForm} />
      ) : (
        <ExerciseLibraryTab library={exerciseLibrary} setLibrary={setExerciseLibrary} showForm={showExForm} setShowForm={setShowExForm} />
      )}
    </div>
  );
}

function BrandSettingsView({ coachProfile, setCoachProfile }) {
  const update = (patch) => setCoachProfile({ ...coachProfile, ...patch });

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ logo: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="pp-display text-2xl text-stone-900">Mi marca</h1>
        <p className="text-sm text-stone-500 mt-1">
          Así es como te ven tus clientes en su portal, en los PDFs y en los mensajes de WhatsApp.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <IndexCard accent={coachProfile.accent} className="p-6">
          <p className="text-sm text-stone-600 mb-2">Logo</p>
          <div className="flex items-center gap-4 mb-5">
            <BrandAvatar coachProfile={coachProfile} size={56} />
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium px-3 py-1.5 border border-stone-300 cursor-pointer text-stone-600 hover:border-stone-400 w-fit"
              >
                {coachProfile.logo ? "Cambiar logo" : "Subir logo"}
                <input type="file" accept="image/*" className="hidden" onChange={pickLogo} />
              </label>
              {coachProfile.logo && (
                <button
                  onClick={() => update({ logo: null })}
                  className="text-xs text-stone-400 hover:text-red-600 text-left"
                >
                  Quitar logo y usar iniciales
                </button>
              )}
            </div>
          </div>

          <label className="text-sm text-stone-600 block mb-4">
            Nombre de marca
            <input
              value={coachProfile.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Ej: La Tribu Fit de César"
              className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <label className="text-sm text-stone-600 block mb-4">
            Iniciales (respaldo si no subes logo)
            <input
              value={coachProfile.initials}
              onChange={(e) => update({ initials: e.target.value.slice(0, 3).toUpperCase() })}
              placeholder="Ej: CP"
              className="mt-1 w-24 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
            />
          </label>

          <p className="text-sm text-stone-600 mb-2">Color de acento</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              value={coachProfile.accent}
              onChange={(e) => update({ accent: e.target.value })}
              className="w-28 border border-stone-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-700"
            />
            <span className="w-9 h-9 border border-stone-200" style={{ backgroundColor: coachProfile.accent }} />
          </div>
          <div className="flex gap-2">
            {BRAND_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update({ accent: c })}
                className="w-7 h-7 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: coachProfile.accent === c ? "#1c1917" : "transparent" }}
                aria-label={c}
              />
            ))}
          </div>
        </IndexCard>

        <div>
          <p className="text-xs font-medium text-stone-500 mb-3 uppercase tracking-wide">Vista previa del portal</p>
          <div className="border border-stone-200 overflow-hidden">
            <div className="px-5 py-4" style={{ backgroundColor: "#0a0a0a" }}>
              <div className="flex items-center gap-3">
                <BrandAvatar coachProfile={coachProfile} size={36} />
                <div>
                  <p className="text-sm font-semibold text-white">{coachProfile.name || "Nombre de marca"}</p>
                  <p className="text-xs" style={{ color: coachProfile.accent }}>{getGreeting()}, Cliente</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-stone-50">
              <div className="bg-white border-l-4 p-4" style={{ borderColor: coachProfile.accent }}>
                <p className="text-xs text-stone-500 mb-1">Ejemplo de tarjeta</p>
                <p className="text-sm font-medium text-stone-800">Así se ve tu color en el resto del portal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachApp({ clients, setClients, selectedId, setSelectedId, goToClientPortal, updateClient, openPdf, foodLibrary, setFoodLibrary, exerciseLibrary, setExerciseLibrary, coachProfile, setCoachProfile }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nav, setNav] = useState("clientes");
  const [editMeals, setEditMeals] = useState(false);
  const [editWorkout, setEditWorkout] = useState(false);
  const [editSupplements, setEditSupplements] = useState(false);
  const [detailTab, setDetailTab] = useState("plan");

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  const selected = clients.find((c) => c.id === selectedId) || null;

  return (
    <div className="flex min-h-[640px] pp-body">
      {/* Rail de navegación */}
      <div className="w-56 bg-stone-900 text-stone-300 flex flex-col py-6 shrink-0">
        <div className="px-5 mb-8">
          <span className="pp-display text-xl text-white">PlanPro</span>
          <p className="text-xs text-stone-500 mt-0.5">Panel del coach</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <button
            onClick={() => setNav("clientes")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-r-full text-sm text-left transition ${
              nav === "clientes" ? "bg-teal-800 text-white" : "hover:bg-stone-800"
            }`}
          >
            <Users size={16} /> Clientes
          </button>
          <button
            onClick={() => setNav("reporte")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-r-full text-sm text-left transition ${
              nav === "reporte" ? "bg-teal-800 text-white" : "hover:bg-stone-800"
            }`}
          >
            <ClipboardList size={16} /> Reporte diario
          </button>
          <button
            onClick={() => setNav("biblioteca")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-r-full text-sm text-left transition ${
              nav === "biblioteca" ? "bg-teal-800 text-white" : "hover:bg-stone-800"
            }`}
          >
            <BookOpen size={16} /> Biblioteca
          </button>
          <button
            onClick={() => setNav("marca")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-r-full text-sm text-left transition ${
              nav === "marca" ? "bg-teal-800 text-white" : "hover:bg-stone-800"
            }`}
          >
            <Palette size={16} /> Mi marca
          </button>
          <button
            onClick={() => setNav("pagos")}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-r-full text-sm text-left transition ${
              nav === "pagos" ? "bg-teal-800 text-white" : "hover:bg-stone-800"
            }`}
          >
            <CreditCard size={16} /> Pagos
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 pp-ruled bg-stone-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {nav === "reporte" ? (
            <DailyReportView
              clients={clients}
              onSelectClient={(id) => { setSelectedId(id); setNav("clientes"); }}
            />
          ) : nav === "biblioteca" ? (
            <LibraryView
              foodLibrary={foodLibrary}
              setFoodLibrary={setFoodLibrary}
              exerciseLibrary={exerciseLibrary}
              setExerciseLibrary={setExerciseLibrary}
            />
          ) : nav === "marca" ? (
            <BrandSettingsView coachProfile={coachProfile} setCoachProfile={setCoachProfile} />
          ) : nav === "pagos" ? (
            <PaymentsView
              clients={clients}
              coachProfile={coachProfile}
              setCoachProfile={setCoachProfile}
              onSelectClient={(id) => { setSelectedId(id); setNav("clientes"); }}
            />
          ) : (
          <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="pp-display text-2xl text-stone-900">Clientes</h1>
              <p className="text-sm text-stone-500 mt-1">
                {clients.length} cliente{clients.length !== 1 ? "s" : ""} activo{clients.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900"
            >
              <Plus size={16} /> Nuevo cliente
            </button>
          </div>

          {showForm && (
            <NewClientForm
              onCancel={() => setShowForm(false)}
              onCreate={(c) => {
                setClients([c, ...clients]);
                setShowForm(false);
              }}
            />
          )}

          <div className="mb-4 relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-teal-700 bg-white"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
            {/* Lista */}
            <div className="flex flex-col gap-3">
              {filtered.map((c) => (
                <IndexCard
                  key={c.id}
                  accent={c.id === selectedId ? "#0f766e" : "#d6d3d1"}
                  className={`p-4 cursor-pointer transition ${c.id === selectedId ? "ring-1 ring-teal-700" : "hover:border-stone-300"}`}
                >
                  <button onClick={() => setSelectedId(c.id)} className="w-full text-left flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900 text-sm">{c.name}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {c.age} años · {c.weight} kg · {c.height} cm
                      </p>
                      <p className="text-xs text-teal-800 mt-1 font-medium">{c.macros.kcal} kcal/día</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {!c.usesApp && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-stone-100 border border-stone-200 px-1.5 py-0.5">
                            <FileText size={10} /> Solo PDF
                          </span>
                        )}
                        {c.pendingEvaluation && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                            <Camera size={10} /> Evaluación pendiente
                          </span>
                        )}
                        {c.pendingReceipt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5">
                            <CreditCard size={10} /> Pago por revisar
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-stone-400" />
                  </button>
                </IndexCard>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-stone-400 py-6 text-center">No se encontraron clientes.</p>
              )}
            </div>

            {/* Detalle */}
            <div>
              {!selected ? (
                <IndexCard accent="#d6d3d1" className="p-10 text-center text-stone-400 text-sm">
                  Selecciona un cliente para ver su plan.
                </IndexCard>
              ) : (
                <div className="flex flex-col gap-5">
                  <IndexCard accent="#0f766e" className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="pp-display text-xl text-stone-900">{selected.name}</h2>
                        <p className="text-sm text-stone-500 mt-1">
                          {selected.age} años · {selected.sex === "male" ? "Masculino" : "Femenino"} · {selected.weight} kg · {selected.height} cm
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => openPdf(selected.id)}
                          className="flex items-center gap-2 text-xs font-medium px-3 py-2 border border-stone-300 hover:border-stone-900"
                        >
                          <FileText size={14} /> Plan en PDF
                        </button>
                        <button
                          onClick={() => goToClientPortal(selected.id)}
                          className="flex items-center gap-2 text-xs font-medium px-3 py-2 border border-stone-300 hover:border-teal-700 hover:text-teal-800"
                        >
                          <Sparkles size={14} /> Vista previa del portal
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 mt-4 text-xs text-stone-500 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={!selected.usesApp}
                        onChange={() => updateClient(selected.id, { usesApp: !selected.usesApp })}
                        className="w-3.5 h-3.5"
                      />
                      Este cliente no usa la app — gestionar su plan solo por PDF
                    </label>

                    <div className="grid grid-cols-4 gap-3 mt-5">
                      {[
                        ["Calorías", `${selected.macros.kcal}`],
                        ["Proteína", `${selected.macros.protein}g`],
                        ["Carbos", `${selected.macros.carbs}g`],
                        ["Grasas", `${selected.macros.fats}g`],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
                          <p className="text-[11px] text-stone-500">{label}</p>
                          <p className="pp-display text-lg text-stone-900">{val}</p>
                        </div>
                      ))}
                    </div>
                  </IndexCard>

                  <div className="flex gap-1 bg-white border border-stone-200 p-1 w-fit">
                    {[
                      { id: "plan", label: "Plan" },
                      { id: "seguimiento", label: "Seguimiento" },
                      { id: "pagos", label: "Pagos" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setDetailTab(t.id)}
                        className={`px-4 py-1.5 text-xs font-medium ${
                          detailTab === t.id ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-800"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {detailTab === "plan" && (
                  <>
                  <IndexCard accent="#c99a3e" className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                        <Utensils size={15} className="text-amber-600" /> Plan de alimentación
                      </h3>
                      <button
                        onClick={() => setEditMeals((v) => !v)}
                        className="text-xs font-medium"
                        style={{ color: "#c99a3e" }}
                      >
                        {editMeals ? "Listo" : "Editar"}
                      </button>
                    </div>
                    {editMeals ? (
                      <>
                        <MealPlanGenerator client={selected} updateClient={updateClient} foodLibrary={foodLibrary} />
                        <MealPlanEditor client={selected} updateClient={updateClient} foodLibrary={foodLibrary} />
                      </>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {selected.meals.map((m) => (
                          <div key={m.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                            <span className="text-stone-700 font-medium shrink-0">{m.name}</span>
                            <span className="text-stone-500 text-right">
                              {m.items.length > 0
                                ? m.items.map((it) => `${it.name} (${formatQty(it.qty, it.unit)})`).join(", ")
                                : "Sin alimentos"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </IndexCard>

                  <IndexCard accent="#7c3aed" className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                        <Dumbbell size={15} className="text-violet-600" /> Plan de entrenamiento
                      </h3>
                      <button
                        onClick={() => setEditWorkout((v) => !v)}
                        className="text-xs font-medium"
                        style={{ color: "#7c3aed" }}
                      >
                        {editWorkout ? "Listo" : "Editar"}
                      </button>
                    </div>
                    {editWorkout ? (
                      <WorkoutPlanEditor client={selected} updateClient={updateClient} exerciseLibrary={exerciseLibrary} />
                    ) : (
                      <div className="flex flex-col gap-4">
                        {selected.workoutDays.map((day) => (
                          <div key={day.id}>
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-xs font-semibold text-stone-800">{day.name}</p>
                              {day.weekdays?.length > 0 && (
                                <span className="text-[10px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5">
                                  {day.weekdays.map((w) => w.slice(0, 3)).join(", ")}
                                </span>
                              )}
                            </div>
                            {day.muscleGroups?.length > 0 && (
                              <p className="text-[11px] text-stone-400 mb-1.5">{day.muscleGroups.join(" · ")}</p>
                            )}
                            <div className="divide-y divide-stone-100">
                              {day.exercises.map((w) => (
                                <div key={w.id} className="flex justify-between py-1.5 text-sm">
                                  <span className="text-stone-700 font-medium">{w.name}</span>
                                  <span className="text-stone-500">{w.detail}</span>
                                </div>
                              ))}
                              {day.exercises.length === 0 && (
                                <p className="text-xs text-stone-400 py-1.5">Sin ejercicios todavía.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </IndexCard>

                  <IndexCard accent="#db2777" className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                        <Plus size={15} style={{ color: "#db2777" }} /> Suplementación
                      </h3>
                      <button
                        onClick={() => setEditSupplements((v) => !v)}
                        className="text-xs font-medium"
                        style={{ color: "#db2777" }}
                      >
                        {editSupplements ? "Listo" : "Editar"}
                      </button>
                    </div>
                    {editSupplements ? (
                      <SupplementEditor client={selected} updateClient={updateClient} />
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {(selected.supplements || []).map((s) => (
                          <div key={s.id} className="flex justify-between py-2 text-sm">
                            <span className="text-stone-700 font-medium">{s.name}</span>
                            <span className="text-stone-500">{s.dose ? `${s.dose} · ` : ""}{s.timing}</span>
                          </div>
                        ))}
                        {(selected.supplements || []).length === 0 && (
                          <p className="text-sm text-stone-400 py-2">Sin suplementos asignados.</p>
                        )}
                      </div>
                    )}
                  </IndexCard>
                  </>
                  )}

                  {detailTab === "seguimiento" && (
                  <>
                  <IndexCard accent="#0ea5a5" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                        <Smile size={15} className="text-teal-600" /> Check-in del cliente
                      </h3>
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                        <Flame size={13} /> {selected.streak} días seguidos
                      </span>
                    </div>

                    {selected.checkin?.savedToday ? (
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
                          <p className="text-[11px] text-stone-500 mb-1">Ánimo</p>
                          <p className="text-xl">{moodEmoji(selected.checkin.mood)}</p>
                        </div>
                        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
                          <p className="text-[11px] text-stone-500 mb-1">Energía</p>
                          <p className="pp-display text-lg text-stone-900">{selected.checkin.energy}/5</p>
                        </div>
                        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
                          <p className="text-[11px] text-stone-500 mb-1">Comida</p>
                          <p className="text-xs font-medium text-stone-800 mt-1.5">{selected.checkin.foodFeeling}</p>
                        </div>
                        <div className="bg-stone-50 border border-stone-200 px-3 py-2 text-center">
                          <p className="text-[11px] text-stone-500 mb-1">Entreno</p>
                          <p className="text-xs font-medium text-stone-800 mt-1.5">{selected.checkin.workoutFeeling}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400">El cliente aún no ha hecho su check-in de hoy.</p>
                    )}

                    {selected.checkinHistory?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        <p className="text-[11px] text-stone-500 mb-2">Historial reciente</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {selected.checkinHistory.slice(-8).map((h, i) => (
                            <div key={i} className="shrink-0 w-14 bg-stone-50 border border-stone-200 px-2 py-2 text-center">
                              <p className="text-base">{moodEmoji(h.mood)}</p>
                              <p className="text-[9px] text-stone-500 mt-0.5">{h.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </IndexCard>

                  <TrendsPanel client={selected} />

                  <EvaluationPanel key={selected.id} client={selected} updateClient={updateClient} />

                  <IndexCard accent="#c1834e" className="p-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-4">
                      <Camera size={15} style={{ color: "#c1834e" }} /> Fotos de progreso (libres)
                    </h3>
                    {selected.progressPhotos?.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {selected.progressPhotos.map((p) => (
                          <div key={p.id} className="aspect-square bg-stone-100 overflow-hidden">
                            <img src={p.dataUrl} alt="Progreso" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400">El cliente todavía no ha subido fotos de progreso.</p>
                    )}
                  </IndexCard>
                  </>
                  )}

                  {detailTab === "pagos" && (
                    <BillingPanel key={`bp-${selected.id}`} client={selected} updateClient={updateClient} />
                  )}
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PORTAL DEL CLIENTE
// ---------------------------------------------------------------------------

function BarSelector({ value, onChange, accent, max = 5, label = "Nivel" }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          aria-label={`${label} ${level}`}
          className="flex-1 h-7 border border-stone-300"
          style={{
            backgroundColor: value >= level ? accent : "transparent",
            opacity: value >= level ? 0.35 + level * (0.6 / max) : 1,
          }}
        />
      ))}
    </div>
  );
}

function BeforeAfterSlider({ before, after, accent = "#c1834e" }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative w-full aspect-square overflow-hidden select-none border border-stone-200">
      {before ? (
        <img src={before} alt="Antes" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-[11px] text-stone-400 text-center px-3">
          Sin evaluación anterior
        </div>
      )}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={after} alt="Ahora" className="w-full h-full object-cover" style={{ width: `${10000 / pos}%`, maxWidth: "none" }} />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5"
        style={{ left: `${pos}%`, backgroundColor: accent }}
      />
      <span className="absolute top-2 left-2 text-[9px] font-medium text-white bg-black/50 px-1.5 py-0.5">ANTES</span>
      <span className="absolute top-2 right-2 text-[9px] font-medium text-white bg-black/50 px-1.5 py-0.5">AHORA</span>
      <input
        type="range"
        min={1}
        max={99}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="absolute inset-x-0 bottom-2 w-[90%] mx-[5%]"
      />
    </div>
  );
}

function MacroSummary({ consumed, target }) {
  const rows = [
    { key: "protein", label: "Proteína", color: MACRO_COLORS.protein },
    { key: "carbs", label: "Carbohidratos", color: MACRO_COLORS.carbs },
    { key: "fats", label: "Grasas", color: MACRO_COLORS.fats },
  ];

  return (
    <IndexCard accent="#0f766e" className="p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[11px] text-stone-500 uppercase tracking-wide">Calorías de hoy</p>
          <p className="pp-display text-2xl text-stone-900">
            {consumed.kcal} <span className="text-sm text-stone-400 font-normal">/ {target.kcal} kcal</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const t = target[r.key] || 0;
          const c = consumed[r.key] || 0;
          const pct = t ? Math.min(100, (c / t) * 100) : 0;
          return (
            <div key={r.key}>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="font-medium" style={{ color: r.color }}>{r.label}</span>
                <span className="text-stone-500">{c}g <span className="text-stone-400">/ {t}g</span></span>
              </div>
              <div className="w-full h-2 bg-stone-100">
                <div className="h-2 transition-all" style={{ width: `${pct}%`, backgroundColor: r.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </IndexCard>
  );
}

function MealLogItem({ meal, log, onToggleItem, onOtherChange, onPhoto, onRemovePhoto, accent }) {
  const items = log?.items || {};
  const other = log?.other || "";
  const photo = log?.photo || null;
  const [showOther, setShowOther] = useState(!!other);
  const checkedCount = Object.values(items).filter(Boolean).length;
  const isLogged = checkedCount > 0 || !!other;

  return (
    <div className="border border-stone-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-stone-800">{meal.name}</p>
        <span
          className="text-[10px] font-medium px-2 py-0.5"
          style={isLogged ? { backgroundColor: accent, color: "#fff" } : { color: "#a8a29e" }}
        >
          {isLogged ? "Registrado" : `${checkedCount}/${meal.items.length}`}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 mb-2">
        {meal.items.map((food, i) => (
          <button
            key={food.id || i}
            onClick={() => onToggleItem(i)}
            className="w-full flex items-center justify-between gap-2 py-1 text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span
                className="flex items-center justify-center w-4 h-4 shrink-0 border"
                style={items[i] ? { backgroundColor: accent, borderColor: accent } : { borderColor: "#d6d3d1" }}
              >
                {items[i] && <Check size={11} className="text-white" />}
              </span>
              <span className={`text-xs truncate ${items[i] ? "text-stone-700" : "text-stone-500"}`}>
                {food.name} <span className="text-stone-400">· {formatQty(food.qty, food.unit)}</span>
              </span>
            </span>
            <span className="flex gap-1.5 shrink-0">
              {food.protein > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: MACRO_COLORS.protein }}>{food.protein}P</span>
              )}
              {food.carbs > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: MACRO_COLORS.carbs }}>{food.carbs}C</span>
              )}
              {food.fats > 0 && (
                <span className="text-[9px] font-semibold" style={{ color: MACRO_COLORS.fats }}>{food.fats}G</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setShowOther((v) => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium border transition"
          style={
            other
              ? { backgroundColor: accent, borderColor: accent, color: "#fff" }
              : { borderColor: "#e7e5e4", color: "#78716c" }
          }
        >
          <Utensils size={11} />
          {other ? "Comida diferente" : "¿Comiste otra cosa?"}
        </button>
        <label
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium border cursor-pointer transition"
          style={
            photo
              ? { backgroundColor: accent, borderColor: accent, color: "#fff" }
              : { borderColor: "#e7e5e4", color: "#78716c" }
          }
        >
          <Camera size={11} />
          {photo ? "Foto agregada" : "Agregar foto"}
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
      </div>

      {showOther && (
        <input
          value={other}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="¿Qué comiste en su lugar?"
          autoFocus
          className="w-full border px-3 py-2 text-xs mt-2 focus:outline-none"
          style={{ borderColor: accent }}
        />
      )}

      {photo && (
        <div className="flex items-center gap-2.5 mt-2">
          <img src={photo} alt="Comida" className="w-12 h-12 object-cover border border-stone-200" />
          <button
            onClick={onRemovePhoto}
            className="text-[11px] text-stone-400 hover:text-red-600 underline decoration-dotted"
          >
            Quitar foto
          </button>
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ label, detail, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 py-3 text-left border-b border-stone-100 last:border-0"
    >
      <span
        className={`flex items-center justify-center w-5 h-5 shrink-0 border ${
          checked ? "bg-emerald-600 border-emerald-600" : "border-stone-300"
        }`}
      >
        {checked && <Check size={13} className="text-white" />}
      </span>
      <span className="flex-1">
        <span className={`text-sm font-medium block ${checked ? "text-stone-400 line-through" : "text-stone-800"}`}>
          {label}
        </span>
        <span className="text-xs text-stone-500">{detail}</span>
      </span>
    </button>
  );
}

function PaymentCard({ client, coachProfile, accent, receiptPreview, pickReceipt, submitReceipt }) {
  const billing = client.billing || { amount: 0, currency: "USD", dueDate: "", status: "al_dia" };
  const meta = BILLING_STATUS_META[billing.status] || BILLING_STATUS_META.al_dia;

  return (
    <IndexCard accent={meta.color} className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
          <CreditCard size={15} style={{ color: meta.color }} /> Pago
        </h3>
        <span className="text-[10px] font-medium px-2 py-1" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {billing.amount > 0 && (
        <p className="text-xs text-stone-500 mb-3">
          ${billing.amount} {billing.currency}
          {billing.dueDate ? ` · vence ${formatDate(billing.dueDate)}` : ""}
        </p>
      )}

      {client.pendingReceipt ? (
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-3">
          {client.pendingReceipt.dataUrl && (
            <img src={client.pendingReceipt.dataUrl} alt="" className="w-12 h-12 object-cover" />
          )}
          <p className="text-xs text-stone-600">Comprobante enviado — tu coach lo va a revisar pronto.</p>
        </div>
      ) : billing.status === "al_dia" ? (
        <div className="flex items-center gap-2 text-xs text-emerald-700">
          <Check size={13} /> Estás al día con tu pago.
        </div>
      ) : (
        <div>
          <p className="text-xs text-stone-500 mb-2">Transfiere el monto a alguno de estos métodos y sube tu comprobante:</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {(coachProfile.paymentMethods || []).map((m) => (
              <div key={m.id} className="bg-stone-50 border border-stone-200 px-3 py-2">
                <p className="text-[11px] font-medium text-stone-700">{m.label}</p>
                <p className="text-xs text-stone-500">{m.details}</p>
              </div>
            ))}
          </div>

          {receiptPreview ? (
            <div className="flex items-center gap-3 mb-2">
              <img src={receiptPreview} alt="" className="w-14 h-14 object-cover border border-stone-200" />
              <label className="text-xs font-medium cursor-pointer" style={{ color: accent }}>
                Cambiar
                <input type="file" accept="image/*" className="hidden" onChange={pickReceipt} />
              </label>
            </div>
          ) : (
            <label
              className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium border border-dashed cursor-pointer mb-2"
              style={{ borderColor: accent, color: accent }}
            >
              <Plus size={15} /> Subir comprobante de pago
              <input type="file" accept="image/*" className="hidden" onChange={pickReceipt} />
            </label>
          )}
          <button
            disabled={!receiptPreview}
            onClick={submitReceipt}
            className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: accent }}
          >
            Enviar comprobante
          </button>
        </div>
      )}
    </IndexCard>
  );
}

function ClientApp({ client, coachProfile, onUpdate, backToCoach }) {
  const accent = coachProfile.accent;
  const mealLogs = client.mealLogs || {};
  const workoutLog = client.workoutLog || {};
  const [weightLog, setWeightLog] = useState(client.weightLog);
  const [newWeight, setNewWeight] = useState("");
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [activeTab, setActiveTab] = useState("hoy");
  const todayWeekday = getTodayWeekday();
  const [selectedWeekday, setSelectedWeekday] = useState(todayWeekday);
  const activeDay = client.workoutDays.find((d) => d.weekdays?.includes(selectedWeekday)) || null;
  const isRestDay = !activeDay;

  const toggleMealItem = (mealId, itemIndex) => {
    const current = mealLogs[mealId] || { items: {}, other: "", photo: null };
    const items = { ...current.items, [itemIndex]: !current.items[itemIndex] };
    onUpdate({ mealLogs: { ...mealLogs, [mealId]: { ...current, items } } });
  };

  const setMealOther = (mealId, text) => {
    const current = mealLogs[mealId] || { items: {}, other: "", photo: null };
    onUpdate({ mealLogs: { ...mealLogs, [mealId]: { ...current, other: text } } });
  };

  const setMealPhoto = (mealId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const current = mealLogs[mealId] || { items: {}, other: "", photo: null };
      onUpdate({ mealLogs: { ...mealLogs, [mealId]: { ...current, photo: reader.result } } });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeMealPhoto = (mealId) => {
    const current = mealLogs[mealId] || { items: {}, other: "", photo: null };
    onUpdate({ mealLogs: { ...mealLogs, [mealId]: { ...current, photo: null } } });
  };

  const toggleExercise = (dayId, exId) => {
    const dayLog = workoutLog[dayId] || {};
    onUpdate({ workoutLog: { ...workoutLog, [dayId]: { ...dayLog, [exId]: !dayLog[exId] } } });
  };

  const supplementLog = client.supplementLog || {};
  const toggleSupplement = (id) => {
    onUpdate({ supplementLog: { ...supplementLog, [id]: !supplementLog[id] } });
  };

  const isMealLogged = (mealId) => {
    const log = mealLogs[mealId];
    if (!log) return false;
    return Object.values(log.items || {}).some(Boolean) || !!log.other;
  };

  const consumedMacros = useMemo(() => {
    let protein = 0, carbs = 0, fats = 0;
    client.meals.forEach((m) => {
      const log = mealLogs[m.id];
      if (!log) return;
      m.items.forEach((it, i) => {
        if (log.items?.[i]) {
          protein += it.protein || 0;
          carbs += it.carbs || 0;
          fats += it.fats || 0;
        }
      });
    });
    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
      kcal: Math.round(protein * 4 + carbs * 4 + fats * 9),
    };
  }, [client.meals, mealLogs]);

  const checkin = client.checkin;
  const todaysWorkoutDay = getTodaysWorkoutDay(client);
  const hasWorkoutToday = !!todaysWorkoutDay;

  const CHECKIN_STEPS = [
    { id: "mood", label: "¿Cómo está tu ánimo?" },
    { id: "energy", label: "Nivel de energía" },
    { id: "foodFeeling", label: "¿Cómo te sentiste con la comida?" },
    ...(hasWorkoutToday ? [{ id: "workoutFeeling", label: "¿Cómo te sentiste con el entrenamiento?" }] : []),
  ];
  const [checkinStep, setCheckinStep] = useState(0);
  const [editingCheckin, setEditingCheckin] = useState(false);
  const currentStepIndex = Math.min(checkinStep, CHECKIN_STEPS.length - 1);
  const isLastStep = currentStepIndex === CHECKIN_STEPS.length - 1;

  const setCheckinField = (field, value, advance) => {
    onUpdate({ checkin: { ...checkin, [field]: value, savedToday: false } });
    if (advance && !isLastStep) setCheckinStep((i) => Math.min(i + 1, CHECKIN_STEPS.length - 1));
  };

  const checkinComplete =
    checkin.mood && checkin.energy > 0 && checkin.foodFeeling && (!hasWorkoutToday || checkin.workoutFeeling);

  const saveCheckin = () => {
    const firstTimeToday = !checkin.savedToday;
    onUpdate({
      checkin: { ...checkin, savedToday: true },
      ...(firstTimeToday
        ? {
            streak: client.streak + 1,
            checkinHistory: [
              ...(client.checkinHistory || []),
              { date: "Hoy", mood: checkin.mood, energy: checkin.energy, foodFeeling: checkin.foodFeeling, workoutFeeling: checkin.workoutFeeling },
            ],
          }
        : {}),
    });
    setEditingCheckin(false);
    setCheckinStep(0);
  };

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({
        progressPhotos: [
          ...client.progressPhotos,
          { id: `p${Date.now()}`, dataUrl: reader.result, date: "Hoy" },
        ],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removePhoto = (id) => {
    onUpdate({ progressPhotos: client.progressPhotos.filter((p) => p.id !== id) });
  };

  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraDesc, setExtraDesc] = useState("");
  const [extraPhotoPreview, setExtraPhotoPreview] = useState(null);

  const pickExtraPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setExtraPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submitExtraMeal = () => {
    if (!extraDesc.trim()) return;
    onUpdate({
      extraMeals: [
        ...(client.extraMeals || []),
        {
          id: `x${Date.now()}`,
          description: extraDesc.trim(),
          photo: extraPhotoPreview,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    });
    setExtraDesc("");
    setExtraPhotoPreview(null);
    setShowExtraForm(false);
  };

  const removeExtraMeal = (id) => {
    onUpdate({ extraMeals: (client.extraMeals || []).filter((x) => x.id !== id) });
  };

  const [evalPhotoPreview, setEvalPhotoPreview] = useState(null);
  const [evalWhatGood, setEvalWhatGood] = useState("");
  const [evalWhatHard, setEvalWhatHard] = useState("");

  const pickEvalPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEvalPhotoPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const submitEvaluation = () => {
    if (!evalPhotoPreview) return;
    onUpdate({
      pendingEvaluation: {
        dataUrl: evalPhotoPreview,
        date: "Hoy",
        whatWasGood: evalWhatGood,
        whatWasHard: evalWhatHard,
      },
    });
    setEvalPhotoPreview(null);
    setEvalWhatGood("");
    setEvalWhatHard("");
  };

  const [receiptPreview, setReceiptPreview] = useState(null);
  const pickReceipt = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const submitReceipt = () => {
    if (!receiptPreview) return;
    onUpdate({
      pendingReceipt: { dataUrl: receiptPreview, date: "Hoy" },
      billing: { ...client.billing, status: "pendiente_revision" },
    });
    setReceiptPreview(null);
  };

  // Frase motivacional del día — se asigna una sola vez y no se repite
  // hasta agotar el banco de frases para este cliente.
  useEffect(() => {
    if (!client.todayPhrase) {
      const seen = client.seenPhraseIds || [];
      let pool = MOTIVATIONAL_PHRASES.filter((p) => !seen.includes(p.id));
      if (pool.length === 0) pool = MOTIVATIONAL_PHRASES;
      const phrase = pool[Math.floor(Math.random() * pool.length)];
      onUpdate({ todayPhrase: phrase.text, seenPhraseIds: [...seen, phrase.id] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const badges = getBadges(client);
  const lastEval = client.evaluations[client.evaluations.length - 1];

  const today = new Date().toISOString().slice(0, 10);
  const isEvalDue = !!client.nextEvaluationDate && client.nextEvaluationDate <= today;
  const daysUntilEval = client.nextEvaluationDate
    ? Math.ceil((new Date(client.nextEvaluationDate) - new Date(today)) / 86400000)
    : null;
  const isEvalSoon = !isEvalDue && daysUntilEval !== null && daysUntilEval <= 5;

  const totalTasks = client.meals.length + (activeDay?.exercises.length || 0) + (client.supplements || []).length;
  const doneTasks =
    client.meals.filter((m) => isMealLogged(m.id)).length +
    (activeDay ? activeDay.exercises.filter((w) => workoutLog[activeDay.id]?.[w.id]).length : 0) +
    (client.supplements || []).filter((s) => supplementLog[s.id]).length;

  const evalNotify = isEvalDue && !client.pendingEvaluation;

  return (
    <div className="min-h-screen pp-body bg-stone-50 flex flex-col">
      <div className="text-white px-6 py-5" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandAvatar coachProfile={coachProfile} size={36} />
            <div>
              <p className="text-sm font-semibold">{coachProfile.name}</p>
              <p className="text-xs" style={{ color: accent }}>{getGreeting()}, {client.name.split(" ")[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button title="Escribirle a tu coach" className="text-stone-300 hover:text-white">
              <MessageCircle size={16} />
            </button>
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
              <Flame size={13} /> {client.streak}
            </span>
            <button onClick={backToCoach} className="flex items-center gap-1 text-xs text-stone-400 hover:text-white">
              <LogOut size={13} /> Panel coach
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full p-5 flex flex-col gap-5 flex-1" style={{ paddingBottom: "88px" }}>
        {activeTab === "hoy" && (
          <>
            {client.todayPhrase && (
              <div className="border-l-4 pl-4 py-1" style={{ borderColor: accent }}>
                <p className="pp-display text-base italic text-stone-800 leading-snug">
                  "{client.todayPhrase}"
                </p>
              </div>
            )}

            {badges.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {badges.map((b) => (
                  <span
                    key={b.id}
                    className="flex items-center gap-1.5 shrink-0 text-xs font-medium bg-white border border-stone-200 px-3 py-1.5"
                  >
                    <span>{b.emoji}</span> {b.label}
                  </span>
                ))}
              </div>
            )}

            <IndexCard accent={accent} className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="pp-display text-lg text-stone-900">Plan de hoy</h2>
                <span className="text-xs font-medium text-stone-500">{doneTasks}/{totalTasks} completado</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 mt-2 mb-1">
                <div
                  className="h-1.5 transition-all"
                  style={{ width: `${totalTasks ? (doneTasks / totalTasks) * 100 : 0}%`, backgroundColor: accent }}
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab("comidas")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-stone-200 text-stone-600"
                >
                  <Utensils size={13} /> Ver comidas
                </button>
                <button
                  onClick={() => setActiveTab("entreno")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-stone-200 text-stone-600"
                >
                  <Dumbbell size={13} /> Ver entreno
                </button>
              </div>
            </IndexCard>

            <IndexCard accent="#0ea5a5" className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="pp-display text-lg text-stone-900">Check-in</h3>
                {checkin.savedToday && !editingCheckin && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check size={13} /> Guardado
                  </span>
                )}
              </div>

              {client.checkinHistory?.length > 0 && (
                <div className="flex gap-1.5 mb-4 mt-2">
                  {client.checkinHistory.slice(-6).map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span className="text-base leading-none">{moodEmoji(h.mood)}</span>
                      <span
                        className="text-[9px]"
                        style={h.date === "Hoy" ? { color: accent, fontWeight: 600 } : { color: "#a8a29e" }}
                      >
                        {h.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {checkin.savedToday && !editingCheckin ? (
                <div>
                  {(() => {
                    const level = computeCheckinLevel(checkin, hasWorkoutToday);
                    const meta = level ? CHECKIN_LEVEL_META[level] : null;
                    return meta ? (
                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 mb-3"
                        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                      >
                        <span>{meta.emoji}</span> {meta.label}
                      </div>
                    ) : null;
                  })()}
                  <p className="text-xs text-stone-500 mb-3">
                    Energía {checkin.energy}/5 · Comida: {checkin.foodFeeling}
                    {hasWorkoutToday && checkin.workoutFeeling ? ` · Entreno: ${checkin.workoutFeeling}` : ""}
                  </p>
                  <button
                    onClick={() => { setEditingCheckin(true); setCheckinStep(0); }}
                    className="text-xs font-medium"
                    style={{ color: accent }}
                  >
                    Editar respuestas
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-stone-500 mb-3">
                    Cuéntale a tu coach cómo te sentiste hoy — no necesitas pesarte para esto.
                  </p>

                  <div className="flex gap-1 mb-4">
                    {CHECKIN_STEPS.map((s, i) => (
                      <div
                        key={s.id}
                        className="flex-1 h-1"
                        style={{ backgroundColor: i <= currentStepIndex ? accent : "#e7e5e4" }}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-medium text-stone-600 mb-3">
                    {CHECKIN_STEPS[currentStepIndex].label}
                  </p>

                  {CHECKIN_STEPS[currentStepIndex].id === "mood" && (
                    <div className="flex gap-2 mb-2">
                      {MOOD_OPTIONS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setCheckinField("mood", m.value, true)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2 border ${
                            checkin.mood === m.value ? "border-stone-900 bg-stone-50" : "border-stone-200"
                          }`}
                        >
                          <span className="text-xl leading-none">{m.emoji}</span>
                          <span className="text-[10px] text-stone-500">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {CHECKIN_STEPS[currentStepIndex].id === "energy" && (
                    <div className="mb-2">
                      <BarSelector
                        value={checkin.energy}
                        onChange={(v) => setCheckinField("energy", v, true)}
                        accent={accent}
                        max={5}
                        label="Energía"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                        <span>Baja</span><span>Alta</span>
                      </div>
                    </div>
                  )}

                  {CHECKIN_STEPS[currentStepIndex].id === "foodFeeling" && (
                    <div className="flex gap-2 mb-2">
                      {FEELING_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setCheckinField("foodFeeling", f, true)}
                          className={`flex-1 py-2 text-xs font-medium border ${
                            checkin.foodFeeling === f ? "text-white" : "border-stone-200 text-stone-600"
                          }`}
                          style={checkin.foodFeeling === f ? { backgroundColor: accent, borderColor: accent } : {}}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  {CHECKIN_STEPS[currentStepIndex].id === "workoutFeeling" && (
                    <div className="flex gap-2 mb-2">
                      {FEELING_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setCheckinField("workoutFeeling", f, true)}
                          className={`flex-1 py-2 text-xs font-medium border ${
                            checkin.workoutFeeling === f ? "text-white" : "border-stone-200 text-stone-600"
                          }`}
                          style={checkin.workoutFeeling === f ? { backgroundColor: accent, borderColor: accent } : {}}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => setCheckinStep((i) => Math.max(0, i - 1))}
                      disabled={currentStepIndex === 0}
                      className="text-xs font-medium text-stone-400 disabled:opacity-0"
                    >
                      ← Atrás
                    </button>
                    {isLastStep && (
                      <button
                        disabled={!checkinComplete}
                        onClick={saveCheckin}
                        className="px-5 py-2 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ backgroundColor: accent }}
                      >
                        Guardar check-in
                      </button>
                    )}
                  </div>
                </div>
              )}
            </IndexCard>
          </>
        )}

        {activeTab === "comidas" && (
          <>
            <MacroSummary consumed={consumedMacros} target={client.macros} />
            <IndexCard accent="#c99a3e" className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-3">
                <Utensils size={15} className="text-amber-600" /> Comidas de hoy
              </h3>
              <div className="flex flex-col gap-3">
                {client.meals.map((m) => (
                  <MealLogItem
                    key={m.id}
                    meal={m}
                    log={mealLogs[m.id]}
                    onToggleItem={(i) => toggleMealItem(m.id, i)}
                    onOtherChange={(text) => setMealOther(m.id, text)}
                    onPhoto={(e) => setMealPhoto(m.id, e)}
                    onRemovePhoto={() => removeMealPhoto(m.id)}
                    accent="#c99a3e"
                  />
                ))}
              </div>
            </IndexCard>

            <IndexCard accent="#c99a3e" className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-1">
                <Plus size={15} className="text-amber-600" /> Comida extra
              </h3>
              <p className="text-xs text-stone-500 mb-3">¿Comiste algo que no estaba en tu plan? Regístralo aquí.</p>

              {(client.extraMeals || []).length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {client.extraMeals.map((x) => (
                    <div key={x.id} className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-2">
                      {x.photo && <img src={x.photo} alt="" className="w-10 h-10 object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-stone-700 truncate">{x.description}</p>
                        <p className="text-[10px] text-stone-400">{x.time}</p>
                      </div>
                      <button onClick={() => removeExtraMeal(x.id)} className="text-stone-400 hover:text-red-600 shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showExtraForm ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={extraDesc}
                    onChange={(e) => setExtraDesc(e.target.value)}
                    placeholder="Ej: Un pedazo de pastel de cumpleaños"
                    className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
                  />
                  {extraPhotoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={extraPhotoPreview} alt="" className="w-12 h-12 object-cover border border-stone-200" />
                      <label className="text-xs font-medium cursor-pointer text-amber-700">
                        Cambiar foto
                        <input type="file" accept="image/*" className="hidden" onChange={pickExtraPhoto} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-amber-700">
                      <Camera size={13} /> Agregar foto (opcional)
                      <input type="file" accept="image/*" className="hidden" onChange={pickExtraPhoto} />
                    </label>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => { setShowExtraForm(false); setExtraDesc(""); setExtraPhotoPreview(null); }}
                      className="flex-1 py-2 text-xs font-medium text-stone-500 border border-stone-200"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={!extraDesc.trim()}
                      onClick={submitExtraMeal}
                      className="flex-1 py-2 text-xs font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed bg-amber-600"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowExtraForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium border border-dashed border-amber-300 text-amber-700"
                >
                  <Plus size={13} /> Agregar comida extra
                </button>
              )}
            </IndexCard>

            {(client.supplements || []).length > 0 && (
              <IndexCard accent="#db2777" className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-3">
                  <Plus size={15} style={{ color: "#db2777" }} /> Suplementación
                </h3>
                <div>
                  {client.supplements.map((s) => (
                    <ChecklistRow
                      key={s.id}
                      label={s.name}
                      detail={`${s.dose ? s.dose + " · " : ""}${s.timing}`}
                      checked={!!supplementLog[s.id]}
                      onToggle={() => toggleSupplement(s.id)}
                    />
                  ))}
                </div>
              </IndexCard>
            )}
          </>
        )}

        {activeTab === "entreno" && (
          <IndexCard accent="#7c3aed" className="p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                <Dumbbell size={15} className="text-violet-600" /> Entrenamiento
              </h3>
              <span className="text-[11px] font-medium text-stone-400">
                {selectedWeekday === todayWeekday ? "Hoy" : ""}
              </span>
            </div>

            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {WEEKDAYS.map((wd) => {
                const hasRoutine = client.workoutDays.some((d) => d.weekdays?.includes(wd));
                const isActiveTab = wd === selectedWeekday;
                const isToday = wd === todayWeekday;
                return (
                  <button
                    key={wd}
                    onClick={() => setSelectedWeekday(wd)}
                    className={`shrink-0 flex flex-col items-center gap-0.5 w-11 py-1.5 border text-[10px] font-medium ${
                      isActiveTab ? "text-white" : hasRoutine ? "text-stone-500 border-stone-200" : "text-stone-300 border-stone-100"
                    }`}
                    style={isActiveTab ? { backgroundColor: "#7c3aed", borderColor: "#7c3aed" } : {}}
                  >
                    <span>{wd.slice(0, 3)}</span>
                    {isToday && (
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isActiveTab ? "#fff" : "#7c3aed" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {isRestDay ? (
              <div className="border border-dashed border-stone-300 py-6 text-center">
                <p className="text-sm font-medium text-stone-600">Día de descanso</p>
                <p className="text-xs text-stone-400 mt-1">No tienes rutina asignada este día.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-stone-800 mb-1">{activeDay.name}</p>
                {activeDay.muscleGroups?.length > 0 && (
                  <p className="text-[11px] text-stone-400 mb-2">{activeDay.muscleGroups.join(" · ")}</p>
                )}
                <div>
                  {activeDay.exercises.map((w) => (
                    <ChecklistRow
                      key={w.id}
                      label={w.name}
                      detail={w.detail}
                      checked={!!workoutLog[activeDay.id]?.[w.id]}
                      onToggle={() => toggleExercise(activeDay.id, w.id)}
                    />
                  ))}
                  {activeDay.exercises.length === 0 && (
                    <p className="text-sm text-stone-400 py-2">Sin ejercicios para este día.</p>
                  )}
                </div>
              </>
            )}
          </IndexCard>
        )}

        {activeTab === "progreso" && (
          <>
            <PaymentCard client={client} coachProfile={coachProfile} onUpdate={onUpdate} accent={accent} receiptPreview={receiptPreview} pickReceipt={pickReceipt} submitReceipt={submitReceipt} />

            <IndexCard accent="#0f766e" className="p-5">
              <button
                onClick={() => setShowWeightForm((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <TrendingUp size={15} className="text-teal-700" /> Progreso de peso
                </h3>
                <span className="text-xs text-stone-400">{showWeightForm ? "Ocultar" : "Opcional — mostrar"}</span>
              </button>

              {showWeightForm && (
                <div className="mt-4">
                  <p className="text-xs text-stone-500 mb-3">
                    Pésate cuando quieras — una vez por semana suele ser suficiente, no hace falta todos los días.
                  </p>
                  <div style={{ width: "100%", height: 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={weightLog} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#a8a29e" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#a8a29e" domain={["dataMin - 1", "dataMax + 1"]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke={accent} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Peso de hoy (kg)"
                      className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-teal-700"
                    />
                    <button
                      onClick={() => {
                        if (!newWeight) return;
                        setWeightLog([...weightLog, { date: "Hoy", weight: Number(newWeight) }]);
                        setNewWeight("");
                      }}
                      className="px-4 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: accent }}
                    >
                      Registrar
                    </button>
                  </div>
                </div>
              )}
            </IndexCard>

            <IndexCard accent="#c1834e" className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                  <Camera size={15} style={{ color: "#c1834e" }} /> Fotos de progreso (libres)
                </h3>
                <label className="flex items-center gap-1 text-xs font-medium cursor-pointer" style={{ color: accent }}>
                  <Plus size={13} /> Agregar
                  <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
                </label>
              </div>
              <p className="text-xs text-stone-500 mb-4">
                Súbelas cuando quieras — te ayudan a ti y a tu coach a ver cambios que la balanza no muestra.
              </p>

              {client.progressPhotos.length === 0 ? (
                <div className="border border-dashed border-stone-300 py-8 text-center">
                  <Camera size={20} className="mx-auto text-stone-300 mb-2" />
                  <p className="text-xs text-stone-400">Aún no has subido ninguna foto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {client.progressPhotos.map((p) => (
                    <div key={p.id} className="relative aspect-square bg-stone-100 overflow-hidden group">
                      <img src={p.dataUrl} alt="Progreso" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={12} />
                      </button>
                      <span className="absolute bottom-1 left-1 text-[9px] text-white bg-black/50 px-1">{p.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </IndexCard>

            {isEvalDue ? (
              <IndexCard accent="#7c3aed" className="p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-1">
                  <Camera size={15} className="text-violet-600" /> Evaluación mensual
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Es hoy tu evaluación con tu coach — cuéntale cómo te fue y sube tu foto.
                </p>

                {client.pendingEvaluation ? (
                  <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3 py-3 mb-2">
                    <img src={client.pendingEvaluation.dataUrl} alt="" className="w-12 h-12 object-cover" />
                    <p className="text-xs text-stone-600">Enviada — tu coach hará tu evaluación pronto.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mb-2">
                    <label className="text-xs font-medium text-stone-600 block">
                      ¿Qué te gustó de este mes?
                      <input
                        value={evalWhatGood}
                        onChange={(e) => setEvalWhatGood(e.target.value)}
                        placeholder="Ej: mantuve el ritmo de entrenamiento"
                        className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-violet-600"
                      />
                    </label>
                    <label className="text-xs font-medium text-stone-600 block">
                      ¿Qué te costó más?
                      <input
                        value={evalWhatHard}
                        onChange={(e) => setEvalWhatHard(e.target.value)}
                        placeholder="Ej: comer suficiente proteína los fines de semana"
                        className="mt-1 w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-violet-600"
                      />
                    </label>

                    {evalPhotoPreview ? (
                      <div className="flex items-center gap-3">
                        <img src={evalPhotoPreview} alt="" className="w-14 h-14 object-cover border border-stone-200" />
                        <label className="text-xs font-medium cursor-pointer" style={{ color: "#7c3aed" }}>
                          Cambiar foto
                          <input type="file" accept="image/*" className="hidden" onChange={pickEvalPhoto} />
                        </label>
                      </div>
                    ) : (
                      <label
                        className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium border border-dashed cursor-pointer"
                        style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                      >
                        <Plus size={15} /> Subir foto para tu evaluación
                        <input type="file" accept="image/*" className="hidden" onChange={pickEvalPhoto} />
                      </label>
                    )}

                    <button
                      disabled={!evalPhotoPreview}
                      onClick={submitEvaluation}
                      className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#7c3aed" }}
                    >
                      Enviar evaluación
                    </button>
                  </div>
                )}

                {lastEval && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-stone-500">Última evaluación · {lastEval.date}</p>
                      <p className="text-xs text-stone-600">{lastEval.weight} kg</p>
                    </div>
                    <span className="pp-display text-lg" style={{ color: "#7c3aed" }}>{lastEval.score}/10</span>
                  </div>
                )}
              </IndexCard>
            ) : (
              <>
                {lastEval && (
                  <IndexCard accent="#0f766e" className="p-5">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 mb-3"
                      style={{ backgroundColor: "#0f766e15", color: "#0f766e" }}
                    >
                      <Check size={12} /> Evaluación realizada
                    </span>
                    <div className="flex items-center gap-3">
                      {lastEval.photoUrl && (
                        <img src={lastEval.photoUrl} alt="" className="w-14 h-14 object-cover border border-stone-200" />
                      )}
                      <div className="flex-1">
                        <p className="text-[11px] text-stone-500">{lastEval.date}</p>
                        <p className="text-sm font-medium text-stone-800">{lastEval.weight} kg</p>
                      </div>
                      <span className="pp-display text-2xl" style={{ color: "#0f766e" }}>{lastEval.score}/10</span>
                    </div>
                    {(lastEval.waist || lastEval.hip || lastEval.chest || lastEval.arm) && (
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-stone-100">
                        {[
                          ["Cintura", lastEval.waist],
                          ["Cadera", lastEval.hip],
                          ["Pecho", lastEval.chest],
                          ["Brazo", lastEval.arm],
                        ].filter(([, v]) => v).map(([l, v]) => (
                          <div key={l} className="text-center">
                            <p className="text-[9px] text-stone-400 uppercase">{l}</p>
                            <p className="text-xs font-medium text-stone-700">{v}cm</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </IndexCard>
                )}
                {client.nextEvaluationDate && (
                  <p className={`text-xs px-1 ${isEvalSoon ? "font-medium" : "text-stone-400"}`} style={isEvalSoon ? { color: "#7c3aed" } : {}}>
                    {isEvalSoon
                      ? `Tu evaluación es en ${daysUntilEval} día${daysUntilEval === 1 ? "" : "s"} — prepara tu foto.`
                      : <>Tu próxima evaluación con tu coach es el{" "}
                          <span className="font-medium text-stone-600">{formatDate(client.nextEvaluationDate)}</span>.</>
                    }
                  </p>
                )}
              </>
            )}

            {(lastEval?.coachNote || client.nextGoal) && (
              <IndexCard accent="#7c3aed" className="p-5">
                <h3 className="text-sm font-semibold text-stone-900 mb-3">De tu coach</h3>
                {lastEval?.coachNote && (
                  <p className="text-sm text-stone-600 mb-3">{lastEval.coachNote}</p>
                )}
                {client.nextGoal && (
                  <div className="bg-stone-50 border border-stone-200 px-3 py-2.5">
                    <p className="text-[11px] text-stone-500 mb-0.5">Meta de este mes</p>
                    <p className="text-sm font-medium text-stone-800">{client.nextGoal}</p>
                  </div>
                )}
              </IndexCard>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-30">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {CLIENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex flex-col items-center gap-1 py-2.5"
              >
                <tab.Icon size={18} style={{ color: isActive ? accent : "#a8a29e" }} />
                {tab.id === "progreso" && evalNotify && (
                  <span
                    className="absolute top-1.5 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-red-500"
                  />
                )}
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? accent : "#a8a29e" }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RAÍZ DEL PROTOTIPO
// ---------------------------------------------------------------------------

export default function PlanProPrototype() {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [selectedId, setSelectedId] = useState(INITIAL_CLIENTS[0].id);
  const [mode, setMode] = useState("coach");
  const [pdfPreviewId, setPdfPreviewId] = useState(null);
  const [foodLibrary, setFoodLibrary] = useState(INITIAL_FOOD_LIBRARY);
  const [exerciseLibrary, setExerciseLibrary] = useState(INITIAL_EXERCISE_LIBRARY);
  const [coachProfile, setCoachProfile] = useState(INITIAL_COACH_PROFILE);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === selectedId) || clients[0],
    [clients, selectedId]
  );

  const updateClient = (id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  if (pdfPreviewId) {
    const pdfClient = clients.find((c) => c.id === pdfPreviewId);
    return <PrintPlanView client={pdfClient} coachProfile={coachProfile} onClose={() => setPdfPreviewId(null)} />;
  }

  return (
    <div className="pp-body">
      <FontStyles />

      {/* Barra de demostración — no forma parte del producto real */}
      <div className="bg-stone-100 border-b border-stone-200 px-5 py-2.5 flex items-center justify-between text-xs">
        <span className="text-stone-500">
          Modo de demostración — en el producto real, coach y cliente inician sesión por separado.
        </span>
        <div className="flex gap-1 bg-white border border-stone-300 p-0.5">
          <button
            onClick={() => setMode("coach")}
            className={`px-3 py-1.5 font-medium ${mode === "coach" ? "bg-stone-900 text-white" : "text-stone-500"}`}
          >
            Panel del coach
          </button>
          <button
            onClick={() => setMode("client")}
            className={`px-3 py-1.5 font-medium ${mode === "client" ? "bg-stone-900 text-white" : "text-stone-500"}`}
          >
            Portal del cliente
          </button>
        </div>
      </div>

      {mode === "coach" ? (
        <CoachApp
          clients={clients}
          setClients={setClients}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          goToClientPortal={(id) => { setSelectedId(id); setMode("client"); }}
          updateClient={updateClient}
          openPdf={(id) => setPdfPreviewId(id)}
          foodLibrary={foodLibrary}
          setFoodLibrary={setFoodLibrary}
          exerciseLibrary={exerciseLibrary}
          setExerciseLibrary={setExerciseLibrary}
          coachProfile={coachProfile}
          setCoachProfile={setCoachProfile}
        />
      ) : (
        <ClientApp
          client={activeClient}
          coachProfile={coachProfile}
          onUpdate={(patch) => updateClient(activeClient.id, patch)}
          backToCoach={() => setMode("coach")}
        />
      )}
    </div>
  );
}
