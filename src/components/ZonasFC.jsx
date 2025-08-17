import React, { useMemo, useState } from "react";
function rango(fcm,a,b){ const lo=Math.round(fcm*a); const hi=Math.round(fcm*b); return `${lo}–${hi} lpm`; }
export default function ZonasFC(){ const [edad,setEdad]=useState(24); const fcm=useMemo(()=>Math.max(100,220-Number(edad||0)),[edad]);
  const zonas=[
    { key:"R1", nombre:"Recuperación", pct:"50–60%", a:0.50,b:0.60, color:"bg-emerald-500/20 text-emerald-300 border-emerald-700", desc:"Base aeróbica ligera, circulación, recuperación." },
    { key:"R2", nombre:"Fondo aeróbico", pct:"60–70%", a:0.60,b:0.70, color:"bg-amber-500/20 text-amber-300 border-amber-700", desc:"Mejora aeróbica, uso predominante de grasas." },
    { key:"R3", nombre:"Aeróbico intenso", pct:"70–80%", a:0.70,b:0.80, color:"bg-orange-500/20 text-orange-300 border-orange-700", desc:"Resistencia y eficiencia cardiovascular." },
    { key:"R3+", nombre:"Umbral/anaer.", pct:"80–90%", a:0.80,b:0.90, color:"bg-rose-500/20 text-rose-300 border-rose-700", desc:"VO₂max, tolerancia al lactato, velocidad." },
    { key:"MAX", nombre:"Máxima", pct:"90–100%", a:0.90,b:1.00, color:"bg-red-600/20 text-red-300 border-red-700", desc:"Esfuerzos muy cortos y controlados." },
  ];
  return (<div className="rounded-2xl border p-4 dark:border-zinc-800">
    <h2 className="text-lg font-semibold mb-3">Zonas de Entrenamiento (Frecuencia Cardíaca)</h2>
    <div className="grid sm:grid-cols-3 gap-3 mb-4">
      <label className="text-sm">Edad
        <input className="w-full rounded-xl border px-3 py-2 dark:bg-zinc-900 dark:border-zinc-700" type="number" min="5" max="100" value={edad} onChange={e=>setEdad(e.target.value)}/>
      </label>
      <div className="rounded-xl border px-3 py-2 dark:border-zinc-700"><p className="text-xs text-gray-500 dark:text-zinc-400">Fórmula</p><p className="font-medium">FCM = 220 − edad</p></div>
      <div className="rounded-xl border px-3 py-2 dark:border-zinc-700"><p className="text-xs text-gray-500 dark:text-zinc-400">FC Máxima estimada</p><p className="font-semibold">{fcm} lpm</p></div>
    </div>
    <div className="grid md:grid-cols-2 gap-3">{zonas.map(z=>(<div key={z.key} className={`rounded-xl border ${z.color} p-3`}>
      <div className="flex items-baseline justify-between"><p className="font-semibold">{z.key} — {z.nombre}</p><p className="text-sm">{z.pct} • {rango(fcm,z.a,z.b)}</p></div>
      <p className="text-sm mt-1">{z.desc}</p></div>))}</div>
  </div>) }