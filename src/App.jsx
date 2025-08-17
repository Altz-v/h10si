import React, { useEffect, useMemo, useState } from "react";
import TdeeCalculator from "./components/TdeeCalculator.jsx";
import IntaPlanner from "./components/IntaPlanner.jsx";
import ReportePreview from "./components/ReportePreview.jsx";
import Ejercicios from "./components/Ejercicios.jsx";
import Progreso from "./components/Progreso.jsx";
import GuiaINTA from "./components/GuiaINTA.jsx";
import ZonasFC from "./components/ZonasFC.jsx";
import LiveHeartRate from "./components/LiveHeartRate.jsx";
import RoutineGenerator from "./components/RoutineGenerator.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

const STORAGE_KEY = "fitcoach_store_admin_v1";
const cls = (...x) => x.filter(Boolean).join(" ");

function useLocalStore(defaultValue) {
  const [store, setStore] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : defaultValue; }
    catch { return defaultValue; }
  });
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {} }, [store]);
  return [store, setStore];
}

const INTA_KCAL_PDF = {
  "Panes, cereales, tubérculos y leguminosas frescas": 140,
  "Leguminosas secas": 170,
  "Verduras (consumo general)": 30,
  "Verduras (libre consumo)": 10,
  "Frutas": 60,
  "Lácteos descremados": 70,
  "Lácteos semidescremados": 85,
  "Lácteos enteros": 110,
  "Carnes bajas en grasa": 65,
  "Carnes altas en grasa": 120,
  "Grasas / aceites": 180,
  "Alimentos ricos en lípidos (frutos secos/palta)": 175,
  "Azúcares": 20
};

const DEFAULT_STATE = {
  preferencias: { estilo: "oscuro", rol: "usuario" }, // usuario | admin
  tdee: { sexo: "hombre", edad: 24, peso: 75, estatura: 169, factor: 1.55, formula: "mifflin", deficit: 0, superavit: 0 },
  inta: {
    kcalObjetivo: 2200,
    porciones: {
      "Panes, cereales, tubérculos y leguminosas frescas": { kcal: 140, porciones: 6 },
      "Leguminosas secas": { kcal: 170, porciones: 1 },
      "Verduras (consumo general)": { kcal: 30, porciones: 3 },
      "Verduras (libre consumo)": { kcal: 10, porciones: 0 },
      "Frutas": { kcal: 60, porciones: 3 },
      "Lácteos descremados": { kcal: 70, porciones: 2 },
      "Lácteos semidescremados": { kcal: 85, porciones: 0 },
      "Lácteos enteros": { kcal: 110, porciones: 0 },
      "Carnes bajas en grasa": { kcal: 65, porciones: 2 },
      "Carnes altas en grasa": { kcal: 120, porciones: 0 },
      "Grasas / aceites": { kcal: 180, porciones: 3 },
      "Alimentos ricos en lípidos (frutos secos/palta)": { kcal: 175, porciones: 1 },
      "Azúcares": { kcal: 20, porciones: 2 }
    }
  },
  ejercicios: [
    { id: crypto.randomUUID(), nombre: "Sentadilla con barra", grupo: "Piernas", img: "/images/squat.png", notas: "Espalda neutra" },
    { id: crypto.randomUUID(), nombre: "Flexiones", grupo: "Pecho", img: "/images/pushup.png", notas: "Hombros abajo" },
    { id: crypto.randomUUID(), nombre: "Remo con mancuerna", grupo: "Espalda", img: "/images/row.png", notas: "Codo pegado" },
  ],
  progresos: [],
  rutinas: [], // generado por RoutineGenerator
};

function calcularBMR({ sexo, edad, peso, estatura, formula }) {
  if (formula === "mifflin") {
    const s = sexo === "hombre" ? 5 : -161;
    return Math.round(10*peso + 6.25*estatura - 5*edad + s);
  }
  if (sexo === "hombre") return Math.round(88.362 + 13.397*peso + 4.799*estatura - 5.677*edad);
  return Math.round(447.593 + 9.247*peso + 3.098*estatura - 4.330*edad);
}
function calcularTDEE(state) { return Math.round(calcularBMR(state) * (state.factor || 1.2)); }
function aplicarObjetivo(kcal, { deficit=0, superavit=0 }) {
  if (deficit>0) return Math.round(kcal * (1 - deficit/100));
  if (superavit>0) return Math.round(kcal * (1 + superavit/100));
  return kcal;
}

export default function App() {
  const [store, setStore] = useLocalStore(DEFAULT_STATE);
  const [tab, setTab] = useState("dashboard");

  const dark = store.preferencias.estilo === "oscuro";
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const BMR = useMemo(() => calcularBMR(store.tdee), [store.tdee]);
  const TDEE = useMemo(() => calcularTDEE(store.tdee), [store.tdee]);
  const objetivoKcal = useMemo(() => aplicarObjetivo(TDEE, store.tdee), [TDEE, store.tdee]);

  const isAdmin = store.preferencias.rol === "admin";
  const update = (path, value) => {
    setStore((prev) => {
      const clone = structuredClone(prev);
      const keys = path.split(".");
      let ref = clone;
      for (let i=0;i<keys.length-1;i++) ref = ref[keys[i]];
      ref[keys[keys.length-1]] = value;
      return clone;
    });
  };
  const clearAll = () => { if (!confirm("¿Seguro?")) return; localStorage.removeItem(STORAGE_KEY); location.reload(); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-950 text-gray-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-zinc-950/70 border-b border-gray-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-indigo-600" />
            <div>
              <h1 className="text-lg font-semibold">FitCoach CL</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Preparación física • INTA • Progreso</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={store.preferencias.estilo} onChange={(e)=>update("preferencias.estilo", e.target.value)} className="rounded-xl border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700">
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
            </select>
            <select value={store.preferencias.rol} onChange={(e)=>update("preferencias.rol", e.target.value)} className="rounded-xl border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700">
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <button className="px-3 py-2 rounded-xl text-sm border dark:border-zinc-700" onClick={clearAll}>Borrar todo</button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {[["dashboard","Inicio"],
              ["tdee","Gasto Energético"],
              ["inta","Plan INTA"],
              ["rutinas","Rutinas"],
              ["progreso","Progreso"],
              ["ejercicios","Ejercicios"],
              ["guia","Guía INTA"],
              ["zonas","Zonas FC"],
              ["live","Frecuencia en vivo"],
              ["reporte","Reporte"],
              isAdmin ? ["admin","Admin"] : null].filter(Boolean).map(([key,label]) => (
              <button key={key} className={cls("px-3 py-2 rounded-xl text-sm border dark:border-zinc-700", tab===key && "bg-indigo-600 text-white")} onClick={()=>setTab(key)}>{label}</button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {tab === "dashboard" && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border p-4 dark:border-zinc-800">
              <p className="text-sm text-gray-500">BMR</p>
              <p className="text-xl font-semibold">{BMR} kcal</p>
            </div>
            <div className="rounded-2xl border p-4 dark:border-zinc-800">
              <p className="text-sm text-gray-500">TDEE</p>
              <p className="text-xl font-semibold">{TDEE} kcal</p>
            </div>
            <div className="rounded-2xl border p-4 dark:border-zinc-800">
              <p className="text-sm text-gray-500">Objetivo</p>
              <p className="text-xl font-semibold">{objetivoKcal} kcal</p>
            </div>
          </div>
        )}

        {tab === "tdee" && <TdeeCalculator store={store} update={(k,v)=>update(`tdee.${k}`, v)} />}
        {tab === "inta" && <IntaPlanner store={store} update={update} objetivoKcal={objetivoKcal} INTA_KCAL_PDF={INTA_KCAL_PDF} />}
        {tab === "rutinas" && <RoutineGenerator store={store} setStore={setStore} />}
        {tab === "progreso" && <Progreso list={store.progresos} onAdd={(row)=>setStore(s=>({...s, progresos:[...s.progresos, row]}))} />}
        {tab === "ejercicios" && <Ejercicios items={store.ejercicios} />}
        {tab === "guia" && <GuiaINTA />}
        {tab === "zonas" && <ZonasFC />}
        {tab === "live" && <LiveHeartRate edad={store.tdee.edad} />}
        {tab === "reporte" && <ReportePreview plan={store.inta.porciones} objetivoKcal={store.inta.kcalObjetivo} />}
        {tab === "admin" && isAdmin && <AdminPanel store={store} setStore={setStore} />}
      </main>
    </div>
  );
}
