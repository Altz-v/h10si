import React from 'react'
export default function AdminPanel({ store, setStore }){
  const r = store.rutinas || [];
  const p = store.inta.porciones || {};
  const setPorcion = (k, field, val) => {
    setStore(s => ({ ...s, inta: { ...s.inta, porciones: { ...s.inta.porciones, [k]: { ...s.inta.porciones[k], [field]: val } } } }));
  };
  const limpiarRutinas = () => setStore(s => ({ ...s, rutinas: [] }));
  return (<div className="rounded-2xl border p-4 dark:border-zinc-800 space-y-4">
    <h2 className="text-lg font-semibold">Panel de Admin</h2>
    <div className="rounded-xl border p-3 dark:border-zinc-800">
      <p className="font-medium mb-2">Rutinas guardadas ({r.length} días)</p>
      {r.length===0 ? <p className="text-sm text-gray-500">No hay rutinas guardadas aún.</p> :
        <ul className="list-disc pl-5 text-sm">{r.map((d,i)=>(<li key={i}><b>{d.dia}:</b> {d.foco} — {d.bloques.join('; ')}</li>))}</ul>}
      <button className="mt-2 px-3 py-2 rounded-xl text-sm border dark:border-zinc-700" onClick={limpiarRutinas}>Eliminar rutinas</button>
    </div>
    <div className="rounded-xl border p-3 dark:border-zinc-800 overflow-x-auto">
      <p className="font-medium mb-2">Editar porciones INTA</p>
      <table className="min-w-full text-sm"><thead><tr className="text-left border-b dark:border-zinc-800">
        <th className="py-2 pr-2">Grupo</th><th className="py-2 pr-2">kcal/porción</th><th className="py-2 pr-2">Porciones</th></tr></thead>
        <tbody>{Object.keys(p).map(k=>{ const row=p[k]; return (<tr key={k} className="border-b last:border-0 dark:border-zinc-800">
          <td className="py-2 pr-2">{k}</td>
          <td className="py-2 pr-2"><input type="number" className="w-28 rounded-xl border px-2 py-1 dark:bg-zinc-900 dark:border-zinc-700" value={row.kcal||0} onChange={e=>setPorcion(k,'kcal', Number(e.target.value))}/></td>
          <td className="py-2 pr-2"><input type="number" className="w-20 rounded-xl border px-2 py-1 dark:bg-zinc-900 dark:border-zinc-700" value={row.porciones||0} onChange={e=>setPorcion(k,'porciones', Number(e.target.value))}/></td>
        </tr>)})}</tbody></table>
    </div>
    <p className="text-xs text-gray-500">* El modo Admin es local (usa localStorage). Para multiusuario necesitaríamos un backend (Supabase, Firebase, etc.).</p>
  </div>) }