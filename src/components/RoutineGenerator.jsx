import React, { useMemo, useState } from 'react'
const PLANTILLAS = {
  fuerza: [
    { dia: "Lunes", foco: "Fuerza Tren Inferior", bloques: ["Sentadilla 5x5", "Peso muerto 5x3", "Zancadas 3x8", "Core 3x12"] },
    { dia: "Miércoles", foco: "Fuerza Tren Superior", bloques: ["Press banca 5x5", "Remo 5x5", "Press militar 5x5", "Dominadas 3xAMRAP"] },
    { dia: "Viernes", foco: "Fuerza Mixto", bloques: ["Front squat 5x3", "Peso muerto rumano 4x6", "Press inclinado 4x6", "Remo con barra 4x6"] },
  ],
  hipertrofia: [
    { dia: "Lunes", foco: "Pecho/Espalda", bloques: ["Press banca 4x8–12", "Aperturas 3x12–15", "Remo 4x8–12", "Jalón 3x12–15"] },
    { dia: "Miércoles", foco: "Piernas", bloques: ["Sentadilla 4x8–12", "Prensa 4x10–12", "Peso muerto rumano 3x10", "Gemelos 4x12–15"] },
    { dia: "Viernes", foco: "Hombro/Brazo", bloques: ["Press militar 4x8–12", "Elevaciones laterales 3x15", "Curl 3x12–15", "Tríceps polea 3x12–15"] },
  ],
  resistencia: [
    { dia: "Martes", foco: "R2 continuo", bloques: ["Trote 30–45' zona R2", "Movilidad 10'"] },
    { dia: "Jueves", foco: "Intervalos R3", bloques: ["10' R1 + 6x(2' R3 / 2' R1) + 10' R1"] },
    { dia: "Sábado", foco: "Fondo R2", bloques: ["60–90' en R2", "Fuerza básica 15'"] },
  ],
  recomposicion: [
    { dia: "Lunes", foco: "FBW 1", bloques: ["Sentadilla 3x8–10", "Press banca 3x8–10", "Remo 3x8–10", "Plancha 3x30–40s"] },
    { dia: "Miércoles", foco: "FBW 2", bloques: ["Peso muerto 3x5–6", "Press militar 3x8–10", "Jalón 3x10–12", "Elevación de cadera 3x12"] },
    { dia: "Viernes", foco: "FBW 3", bloques: ["Prensa 3x10–12", "Dominadas 3xAMRAP", "Fondos 3xAMRAP", "Farmer walk 3x30–40m"] },
  ]
};
export default function RoutineGenerator({ store, setStore }){
  const [objetivo, setObjetivo] = useState('recomposicion');
  const [nivel, setNivel] = useState('intermedio');
  const [equipo, setEquipo] = useState('gimnasio');
  const base = PLANTILLAS[objetivo] || [];
  const rutina = useMemo(()=> base.map(r => ({ ...r, nivel, equipo })), [base, nivel, equipo]);
  const guardar = () => setStore(s => ({ ...s, rutinas: rutina }));
  return (<div className="rounded-2xl border p-4 dark:border-zinc-800">
    <h2 className="text-lg font-semibold mb-3">Generador de Rutinas</h2>
    <div className="grid sm:grid-cols-3 gap-3 mb-3">
      <label className="text-sm">Objetivo
        <select className="w-full rounded-xl border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700" value={objetivo} onChange={e=>setObjetivo(e.target.value)}>
          <option value="fuerza">Fuerza</option><option value="hipertrofia">Hipertrofia</option><option value="resistencia">Resistencia</option><option value="recomposicion">Recomposición</option>
        </select></label>
      <label className="text-sm">Nivel
        <select className="w-full rounded-xl border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700" value={nivel} onChange={e=>setNivel(e.target.value)}>
          <option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
        </select></label>
      <label className="text-sm">Equipamiento
        <select className="w-full rounded-xl border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700" value={equipo} onChange={e=>setEquipo(e.target.value)}>
          <option value="casa">Casa</option><option value="gimnasio">Gimnasio</option>
        </select></label>
    </div>
    <div className="grid md:grid-cols-2 gap-3">
      {rutina.map((r,i)=>(<div key={i} className="rounded-xl border p-3 dark:border-zinc-800">
        <div className="flex items-baseline justify-between"><p className="font-semibold">{r.dia} — {r.foco}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{r.nivel} • {r.equipo}</p></div>
        <ul className="mt-2 list-disc pl-5 text-sm">{r.bloques.map((b,idx)=>(<li key={idx}>{b}</li>))}</ul>
      </div>))}
    </div>
    <button className="mt-3 px-3 py-2 rounded-xl text-sm border dark:border-zinc-700" onClick={guardar}>Guardar rutina en mi cuenta</button>
  </div>) }