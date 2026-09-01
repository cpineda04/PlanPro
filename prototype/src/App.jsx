import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Plus, ChevronRight, Check, TrendingUp, LogOut, Search,
  Utensils, Dumbbell, Sparkles, BookOpen, CreditCard,
  Smile, Flame, Camera, X, MessageCircle, ClipboardList,
  Download, ArrowLeft, FileText
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

const MOOD_OPTIONS = [
  { value: "baja", emoji: "😞", label: "Baja" },
  { value: "regular", emoji: "😐", label: "Regular" },
  { value: "bien", emoji: "🙂", label: "Bien" },
  { value: "genial", emoji: "😄", label: "Genial" },
];

const FEELING_OPTIONS = ["Difícil", "Normal", "Bien"];

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
    coachBrand: { name: "La Tribu Fit de César", accent: "#c1834e", initials: "CP" },
    usesApp: true,
    macros: { kcal: 2450, protein: 180, carbs: 240, fats: 70 },
    meals: [
      { id: "m1", name: "Desayuno", items: ["Avena", "Claras de huevo", "Banana"] },
      { id: "m2", name: "Almuerzo", items: ["Pollo", "Arroz", "Aguacate"] },
      { id: "m3", name: "Snack", items: ["Yogur griego", "Almendras"] },
      { id: "m4", name: "Cena", items: ["Salmón", "Batata", "Brócoli"] },
    ],
    workout: {
      day: "Día de empuje",
      exercises: [
        { id: "w1", name: "Press de banca", detail: "4 x 8-10" },
        { id: "w2", name: "Press militar", detail: "3 x 10" },
        { id: "w3", name: "Fondos en paralelas", detail: "3 x fallo" },
      ],
    },
    weightLog: [
      { date: "1 ago", weight: 85.2 },
      { date: "8 ago", weight: 84.4 },
      { date: "15 ago", weight: 83.6 },
      { date: "22 ago", weight: 83.0 },
      { date: "29 ago", weight: 82.4 },
    ],
    streak: 5,
    progressPhotos: [],
    mealLogs: {
      m1: { items: { 0: true, 1: true, 2: true }, other: "", photo: null },
      m2: { items: { 0: true, 1: false, 2: false }, other: "", photo: null },
    },
    workoutLog: { w1: true },
    checkin: { mood: null, energy: 0, foodFeeling: null, workoutFeeling: null, savedToday: false },
    checkinHistory: [
      { date: "29 ago", mood: "bien", energy: 4, foodFeeling: "Bien", workoutFeeling: "Normal" },
      { date: "28 ago", mood: "genial", energy: 5, foodFeeling: "Bien", workoutFeeling: "Bien" },
    ],
    evaluations: [
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
    coachBrand: { name: "La Tribu Fit de César", accent: "#c1834e", initials: "CP" },
    usesApp: false,
    macros: { kcal: 1780, protein: 130, carbs: 165, fats: 55 },
    meals: [
      { id: "m1", name: "Desayuno", items: ["Huevos", "Tostada integral"] },
      { id: "m2", name: "Almuerzo", items: ["Pescado", "Quinoa", "Ensalada"] },
      { id: "m3", name: "Cena", items: ["Pechuga de pollo", "Vegetales al vapor"] },
    ],
    workout: {
      day: "Tren inferior",
      exercises: [
        { id: "w1", name: "Sentadilla goblet", detail: "4 x 12" },
        { id: "w2", name: "Peso muerto rumano", detail: "3 x 10" },
        { id: "w3", name: "Zancadas caminando", detail: "3 x 12 c/lado" },
      ],
    },
    weightLog: [
      { date: "1 ago", weight: 65.1 },
      { date: "8 ago", weight: 64.5 },
      { date: "15 ago", weight: 64.0 },
      { date: "22 ago", weight: 63.4 },
      { date: "29 ago", weight: 63.0 },
    ],
    streak: 2,
    progressPhotos: [],
    mealLogs: {},
    workoutLog: {},
    checkin: { mood: null, energy: 0, foodFeeling: null, workoutFeeling: null, savedToday: false },
    checkinHistory: [
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

const INITIAL_EXERCISE_LIBRARY = [
  { id: "ex1", name: "Press de banca", equipment: "Barra", defaultSets: 4, defaultReps: "8-10" },
  { id: "ex2", name: "Press militar", equipment: "Barra", defaultSets: 3, defaultReps: "10" },
  { id: "ex3", name: "Fondos en paralelas", equipment: "Peso corporal", defaultSets: 3, defaultReps: "Fallo" },
  { id: "ex4", name: "Sentadilla goblet", equipment: "Mancuerna", defaultSets: 4, defaultReps: "12" },
  { id: "ex5", name: "Peso muerto rumano", equipment: "Barra", defaultSets: 3, defaultReps: "10" },
  { id: "ex6", name: "Zancadas caminando", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12 c/lado" },
  { id: "ex7", name: "Curl de bíceps", equipment: "Mancuernas", defaultSets: 3, defaultReps: "12" },
  { id: "ex8", name: "Remo con mancuerna", equipment: "Mancuerna", defaultSets: 3, defaultReps: "10" },
  { id: "ex9", name: "Plancha", equipment: "Peso corporal", defaultSets: 3, defaultReps: "30s" },
  { id: "ex10", name: "Jalón al pecho", equipment: "Polea", defaultSets: 3, defaultReps: "10" },
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
              coachBrand: { name: "La Tribu Fit de César", accent: "#c1834e", initials: "CP" },
              usesApp: true,
              macros: {
                kcal: tdee,
                protein: Math.round((tdee * 0.3) / 4),
                carbs: Math.round((tdee * 0.4) / 4),
                fats: Math.round((tdee * 0.3) / 9),
              },
              meals: [
                { id: "m1", name: "Desayuno", items: ["Por definir"] },
                { id: "m2", name: "Almuerzo", items: ["Por definir"] },
                { id: "m3", name: "Cena", items: ["Por definir"] },
              ],
              workout: { day: "Día 1", exercises: [{ id: "w1", name: "Por definir", detail: "—" }] },
              weightLog: [{ date: "Hoy", weight: form.weight }],
              streak: 0,
              progressPhotos: [],
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

function PrintPlanView({ client, onClose }) {
  const today = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const waMessage = encodeURIComponent(
    `Hola ${client.name}, aquí tienes tu plan de alimentación y entrenamiento actualizado de ${client.coachBrand.name}. Cualquier duda me escribes.`
  );

  return (
    <div className="min-h-screen bg-stone-200 pp-body">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
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

      <div className="print-area max-w-2xl mx-auto bg-white my-6 p-10 shadow-sm">
        <div className="flex items-start justify-between border-b border-stone-200 pb-6 mb-6">
          <div>
            <p className="pp-display text-2xl text-stone-900">{client.coachBrand.name}</p>
            <p className="text-xs text-stone-500 mt-1">Plan de alimentación y entrenamiento</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-stone-800">{client.name}</p>
            <p className="text-xs text-stone-500">{today}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            ["Calorías", client.macros.kcal],
            ["Proteína", `${client.macros.protein}g`],
            ["Carbos", `${client.macros.carbs}g`],
            ["Grasas", `${client.macros.fats}g`],
          ].map(([l, v]) => (
            <div key={l} className="border border-stone-200 text-center py-2">
              <p className="text-[10px] text-stone-500">{l}</p>
              <p className="pp-display text-lg text-stone-900">{v}</p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-stone-900 mb-3 uppercase tracking-wide">Plan de alimentación</h3>
        <div className="mb-8">
          {client.meals.map((m) => (
            <div key={m.id} className="flex justify-between gap-4 py-2.5 border-b border-stone-100 text-sm">
              <span className="font-medium text-stone-700 shrink-0">{m.name}</span>
              <span className="text-stone-500 text-right">{m.items.join(", ")}</span>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-stone-900 mb-3 uppercase tracking-wide">{client.workout.day}</h3>
        <div>
          {client.workout.exercises.map((w) => (
            <div key={w.id} className="flex justify-between gap-4 py-2.5 border-b border-stone-100 text-sm">
              <span className="font-medium text-stone-700">{w.name}</span>
              <span className="text-stone-500">{w.detail}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-stone-400 mt-10 pt-4 border-t border-stone-100">
          Generado con PlanPro para {client.coachBrand.name}.
        </p>
      </div>
    </div>
  );
}

function DailyReportView({ clients }) {
  const [expanded, setExpanded] = useState({});

  return (
    <div>
      <div className="mb-6">
        <h1 className="pp-display text-2xl text-stone-900">Reporte diario</h1>
        <p className="text-sm text-stone-500 mt-1">Cómo va cada cliente con el plan de hoy.</p>
      </div>

      <div className="flex flex-col gap-3">
        {clients.map((c) => {
          const mealLogs = c.mealLogs || {};
          const workoutLog = c.workoutLog || {};
          const mealsLogged = c.meals.filter((m) => {
            const log = mealLogs[m.id];
            return log && (Object.values(log.items || {}).some(Boolean) || !!log.other);
          }).length;
          const exLogged = c.workout.exercises.filter((w) => workoutLog[w.id]).length;
          const isOpen = expanded[c.id];

          return (
            <IndexCard key={c.id} accent="#0f766e" className="p-5">
              <button
                onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{c.name}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Comidas {mealsLogged}/{c.meals.length} · Entrenamiento {exLogged}/{c.workout.exercises.length}
                    {c.checkin?.savedToday ? (
                      <> · {moodEmoji(c.checkin.mood)} Energía {c.checkin.energy}/5</>
                    ) : (
                      " · Sin check-in hoy"
                    )}
                  </p>
                </div>
                <ChevronRight size={16} className={`text-stone-400 transition ${isOpen ? "rotate-90" : ""}`} />
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
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-stone-500 mb-2 uppercase tracking-wide">Entrenamiento</p>
                    <div className="flex flex-col gap-1.5">
                      {c.workout.exercises.map((w) => (
                        <div key={w.id} className="flex items-center gap-2.5 text-xs py-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: workoutLog[w.id] ? "#7c3aed" : "#d6d3d1" }}
                          />
                          <span className="text-stone-700">{w.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </IndexCard>
          );
        })}
        {clients.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-8">No hay clientes todavía.</p>
        )}
      </div>
    </div>
  );
}

function LibraryPicker({ options, placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = (query ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())) : options).slice(0, 8);

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
              className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 border-b border-stone-50 last:border-0"
            >
              {o.name}
            </button>
          ))}
        </div>
      )}
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
  const addItem = (mealId, foodName) => {
    updateClient(client.id, {
      meals: client.meals.map((m) => (m.id === mealId ? { ...m, items: [...m.items, foodName] } : m)),
    });
  };
  const removeItem = (mealId, index) => {
    updateClient(client.id, {
      meals: client.meals.map((m) => (m.id === mealId ? { ...m, items: m.items.filter((_, i) => i !== index) } : m)),
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
          <div className="flex flex-wrap gap-1.5 mb-2">
            {m.items.map((it, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-stone-100 px-2 py-1">
                {it}
                <button onClick={() => removeItem(m.id, i)} className="text-stone-400 hover:text-stone-700"><X size={10} /></button>
              </span>
            ))}
            {m.items.length === 0 && <span className="text-xs text-stone-400">Sin alimentos todavía</span>}
          </div>
          <LibraryPicker options={foodLibrary} placeholder="Buscar alimento en la biblioteca..." onSelect={(f) => addItem(m.id, f.name)} />
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
  const addExercise = (ex) => {
    const newEx = { id: `w${Date.now()}`, name: ex.name, detail: `${ex.defaultSets} x ${ex.defaultReps}` };
    updateClient(client.id, { workout: { ...client.workout, exercises: [...client.workout.exercises, newEx] } });
  };
  const removeExercise = (exId) => {
    updateClient(client.id, {
      workout: { ...client.workout, exercises: client.workout.exercises.filter((e) => e.id !== exId) },
    });
  };
  const updateDetail = (exId, detail) => {
    updateClient(client.id, {
      workout: { ...client.workout, exercises: client.workout.exercises.map((e) => (e.id === exId ? { ...e, detail } : e)) },
    });
  };
  const renameDay = (day) => updateClient(client.id, { workout: { ...client.workout, day } });

  return (
    <div>
      <input
        value={client.workout.day}
        onChange={(e) => renameDay(e.target.value)}
        className="text-sm font-medium mb-3 border-b border-stone-200 focus:border-stone-400 focus:outline-none bg-transparent w-full pb-1"
      />
      <div className="flex flex-col gap-2 mb-3">
        {client.workout.exercises.map((w) => (
          <div key={w.id} className="flex items-center gap-2 border border-stone-200 px-3 py-2">
            <span className="flex-1 text-xs font-medium text-stone-700">{w.name}</span>
            <input
              value={w.detail}
              onChange={(e) => updateDetail(w.id, e.target.value)}
              className="w-24 text-xs border border-stone-200 px-2 py-1 focus:outline-none focus:border-teal-700"
            />
            <button onClick={() => removeExercise(w.id)} className="text-stone-400 hover:text-red-600"><X size={14} /></button>
          </div>
        ))}
        {client.workout.exercises.length === 0 && <span className="text-xs text-stone-400">Sin ejercicios todavía</span>}
      </div>
      <LibraryPicker options={exerciseLibrary} placeholder="Buscar ejercicio en la biblioteca..." onSelect={addExercise} />
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
  const [form, setForm] = useState({ name: "", equipment: "", defaultSets: 3, defaultReps: "10" });
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
  return (
    <div>
      <div className="flex justify-end mb-4">
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
              <th className="px-4 py-2.5 font-medium">Equipo</th>
              <th className="px-4 py-2.5 font-medium">Series x reps</th>
              <th className="px-4 py-2.5 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {library.map((ex) => (
              <tr key={ex.id} className="border-t border-stone-100">
                <td className="px-4 py-2.5 font-medium text-stone-800">{ex.name}</td>
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
        {library.length === 0 && <p className="text-xs text-stone-400 text-center py-8">Aún no hay ejercicios en tu biblioteca.</p>}
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

function CoachApp({ clients, setClients, selectedId, setSelectedId, goToClientPortal, updateClient, openPdf, foodLibrary, setFoodLibrary, exerciseLibrary, setExerciseLibrary }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [nav, setNav] = useState("clientes");
  const [editMeals, setEditMeals] = useState(false);
  const [editWorkout, setEditWorkout] = useState(false);

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
          <button className="flex items-center justify-between px-3 py-2.5 text-sm text-left text-stone-500 cursor-default">
            <span className="flex items-center gap-2"><CreditCard size={16} /> Pagos</span>
            <span className="text-[10px] border border-stone-700 px-1.5 py-0.5 rounded-sm">Pronto</span>
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 pp-ruled bg-stone-50 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {nav === "reporte" ? (
            <DailyReportView clients={clients} />
          ) : nav === "biblioteca" ? (
            <LibraryView
              foodLibrary={foodLibrary}
              setFoodLibrary={setFoodLibrary}
              exerciseLibrary={exerciseLibrary}
              setExerciseLibrary={setExerciseLibrary}
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
                      <MealPlanEditor client={selected} updateClient={updateClient} foodLibrary={foodLibrary} />
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {selected.meals.map((m) => (
                          <div key={m.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                            <span className="text-stone-700 font-medium shrink-0">{m.name}</span>
                            <span className="text-stone-500 text-right">{m.items.join(", ") || "Sin alimentos"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </IndexCard>

                  <IndexCard accent="#7c3aed" className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                        <Dumbbell size={15} className="text-violet-600" /> {selected.workout.day}
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
                      <div className="divide-y divide-stone-100">
                        {selected.workout.exercises.map((w) => (
                          <div key={w.id} className="flex justify-between py-2 text-sm">
                            <span className="text-stone-700 font-medium">{w.name}</span>
                            <span className="text-stone-500">{w.detail}</span>
                          </div>
                        ))}
                        {selected.workout.exercises.length === 0 && (
                          <p className="text-sm text-stone-400 py-2">Sin ejercicios todavía.</p>
                        )}
                      </div>
                    )}
                  </IndexCard>

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
                        <div className="flex gap-2">
                          {selected.checkinHistory.map((h, i) => (
                            <div key={i} className="flex-1 bg-stone-50 border border-stone-200 px-2 py-2 text-center">
                              <p className="text-base">{moodEmoji(h.mood)}</p>
                              <p className="text-[10px] text-stone-500 mt-0.5">{h.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </IndexCard>

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
            key={i}
            onClick={() => onToggleItem(i)}
            className="w-full flex items-center gap-2.5 py-1 text-left"
          >
            <span
              className="flex items-center justify-center w-4 h-4 shrink-0 border"
              style={items[i] ? { backgroundColor: accent, borderColor: accent } : { borderColor: "#d6d3d1" }}
            >
              {items[i] && <Check size={11} className="text-white" />}
            </span>
            <span className={`text-xs ${items[i] ? "text-stone-700" : "text-stone-500"}`}>{food}</span>
          </button>
        ))}
      </div>

      {showOther ? (
        <input
          value={other}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="¿Qué comiste en su lugar?"
          className="w-full border border-stone-300 px-2.5 py-1.5 text-xs mb-2 focus:outline-none"
          style={{ borderColor: other ? accent : undefined }}
        />
      ) : (
        <button
          onClick={() => setShowOther(true)}
          className="text-xs text-stone-500 underline decoration-dotted mb-2"
        >
          Comí algo diferente
        </button>
      )}

      {photo ? (
        <div className="flex items-center gap-2">
          <img src={photo} alt="Comida" className="w-10 h-10 object-cover" />
          <button onClick={onRemovePhoto} className="text-xs text-stone-400 hover:text-stone-700">Quitar foto</button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: accent }}>
          <Camera size={13} /> Agregar foto de la comida
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
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

function ClientApp({ client, onUpdate, backToCoach }) {
  const accent = client.coachBrand.accent;
  const mealLogs = client.mealLogs || {};
  const workoutLog = client.workoutLog || {};
  const [weightLog, setWeightLog] = useState(client.weightLog);
  const [newWeight, setNewWeight] = useState("");
  const [showWeightForm, setShowWeightForm] = useState(false);

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

  const toggleExercise = (exId) => {
    onUpdate({ workoutLog: { ...workoutLog, [exId]: !workoutLog[exId] } });
  };

  const isMealLogged = (mealId) => {
    const log = mealLogs[mealId];
    if (!log) return false;
    return Object.values(log.items || {}).some(Boolean) || !!log.other;
  };

  const checkin = client.checkin;
  const setCheckinField = (field, value) =>
    onUpdate({ checkin: { ...checkin, [field]: value, savedToday: false } });

  const checkinComplete =
    checkin.mood && checkin.energy > 0 && checkin.foodFeeling && checkin.workoutFeeling;

  const saveCheckin = () => {
    onUpdate({
      checkin: { ...checkin, savedToday: true },
      streak: client.streak + 1,
    });
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

  const totalTasks = client.meals.length + client.workout.exercises.length;
  const doneTasks =
    client.meals.filter((m) => isMealLogged(m.id)).length +
    client.workout.exercises.filter((w) => workoutLog[w.id]).length;

  return (
    <div className="min-h-[640px] pp-body bg-stone-50">
      <div className="text-white px-6 py-5" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 flex items-center justify-center text-xs font-bold rounded-full"
              style={{ backgroundColor: accent, color: "#0a0a0a" }}
            >
              {client.coachBrand.initials}
            </span>
            <div>
              <p className="text-sm font-semibold">{client.coachBrand.name}</p>
              <p className="text-xs" style={{ color: accent }}>Portal de {client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
              <Flame size={13} /> {client.streak}
            </span>
            <button onClick={backToCoach} className="flex items-center gap-1 text-xs text-stone-400 hover:text-white">
              <LogOut size={13} /> Panel coach
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5 flex flex-col gap-5">
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
        </IndexCard>

        <IndexCard accent="#c99a3e" className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-3">
            <Utensils size={15} className="text-amber-600" /> Comidas
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

        <IndexCard accent="#7c3aed" className="p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900 mb-1">
            <Dumbbell size={15} className="text-violet-600" /> {client.workout.day}
          </h3>
          <div>
            {client.workout.exercises.map((w) => (
              <ChecklistRow
                key={w.id}
                label={w.name}
                detail={w.detail}
                checked={!!workoutLog[w.id]}
                onToggle={() => toggleExercise(w.id)}
              />
            ))}
          </div>
        </IndexCard>

        <IndexCard accent="#0ea5a5" className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="pp-display text-lg text-stone-900">Check-in de hoy</h3>
            {checkin.savedToday && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Check size={13} /> Guardado
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Cuéntale a tu coach cómo te sentiste hoy — no necesitas pesarte para esto.
          </p>

          <p className="text-xs font-medium text-stone-600 mb-2">¿Cómo está tu ánimo?</p>
          <div className="flex gap-2 mb-4">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setCheckinField("mood", m.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 border ${
                  checkin.mood === m.value ? "border-stone-900 bg-stone-50" : "border-stone-200"
                }`}
              >
                <span className="text-xl leading-none">{m.emoji}</span>
                <span className="text-[10px] text-stone-500">{m.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs font-medium text-stone-600 mb-2">Nivel de energía</p>
          <BarSelector value={checkin.energy} onChange={(v) => setCheckinField("energy", v)} accent={accent} max={5} label="Energía" />
          <div className="flex justify-between text-[10px] text-stone-400 mt-1 mb-4">
            <span>Baja</span><span>Alta</span>
          </div>

          <p className="text-xs font-medium text-stone-600 mb-2">¿Cómo te sentiste con la comida?</p>
          <div className="flex gap-2 mb-4">
            {FEELING_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setCheckinField("foodFeeling", f)}
                className={`flex-1 py-2 text-xs font-medium border ${
                  checkin.foodFeeling === f ? "text-white" : "border-stone-200 text-stone-600"
                }`}
                style={checkin.foodFeeling === f ? { backgroundColor: accent, borderColor: accent } : {}}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="text-xs font-medium text-stone-600 mb-2">¿Cómo te sentiste con el entrenamiento?</p>
          <div className="flex gap-2 mb-5">
            {FEELING_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setCheckinField("workoutFeeling", f)}
                className={`flex-1 py-2 text-xs font-medium border ${
                  checkin.workoutFeeling === f ? "text-white" : "border-stone-200 text-stone-600"
                }`}
                style={checkin.workoutFeeling === f ? { backgroundColor: accent, borderColor: accent } : {}}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            disabled={!checkinComplete}
            onClick={saveCheckin}
            className="w-full py-2.5 text-sm font-medium text-white disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: accent }}
          >
            Guardar check-in
          </button>
          <p className="text-xs text-stone-400 mt-3">Tu coach ve este check-in junto con tu plan del día.</p>
        </IndexCard>

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
          client.nextEvaluationDate && (
            <p className={`text-xs px-1 ${isEvalSoon ? "font-medium" : "text-stone-400"}`} style={isEvalSoon ? { color: "#7c3aed" } : {}}>
              {isEvalSoon
                ? `Tu evaluación es en ${daysUntilEval} día${daysUntilEval === 1 ? "" : "s"} — prepara tu foto.`
                : <>Tu próxima evaluación con tu coach es el{" "}
                    <span className="font-medium text-stone-600">{formatDate(client.nextEvaluationDate)}</span>.</>
              }
            </p>
          )
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

        <button
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border"
          style={{ borderColor: accent, color: accent }}
        >
          <MessageCircle size={15} /> Escribirle a tu coach
        </button>
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

  const activeClient = useMemo(
    () => clients.find((c) => c.id === selectedId) || clients[0],
    [clients, selectedId]
  );

  const updateClient = (id, patch) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  if (pdfPreviewId) {
    const pdfClient = clients.find((c) => c.id === pdfPreviewId);
    return <PrintPlanView client={pdfClient} onClose={() => setPdfPreviewId(null)} />;
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
        />
      ) : (
        <ClientApp
          client={activeClient}
          onUpdate={(patch) => updateClient(activeClient.id, patch)}
          backToCoach={() => setMode("coach")}
        />
      )}
    </div>
  );
}
