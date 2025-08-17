import React, { useEffect, useMemo, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
function parseHeartRate(value) { const dv = value instanceof DataView ? value : new DataView(value.buffer); let o=0; const flags=dv.getUint8(o++); const hr16=(flags&1)!==0; const contactSup=(flags&0x06)!==0; const contact=(flags&0x06)===0x06; const energy=(flags&0x08)!==0; const rr=(flags&0x10)!==0; const hr=hr16?dv.getUint16(o,true):dv.getUint8(o); o+=hr16?2:1; if(energy){o+=2} const rrs=[]; if(rr){while(o+1<dv.byteLength){rrs.push(dv.getUint16(o,true));o+=2}} return {heartRate:hr, sensorContactSupported:contactSup, sensorContactDetected:contact, rr:rrs}; }
function zoneColor(p){ if(p<0.6) return "bg-emerald-500"; if(p<0.7) return "bg-amber-500"; if(p<0.8) return "bg-orange-500"; if(p<0.9) return "bg-rose-500"; return "bg-red-600"; }
export default function LiveHeartRate({ edad=24 }){ const [supported]=useState(!!navigator.bluetooth); const [connecting,setConnecting]=useState(false); const [name,setName]=useState(""); const [hr,setHr]=useState(null); const [contact,setContact]=useState(null); const [rrMs,setRrMs]=useState([]); const [series,setSeries]=useState([]); const serverRef=useRef(null); const charRef=useRef(null);
  const FCM=useMemo(()=>Math.max(100,220-Number(edad||0)),[edad]); const pct=hr?hr/FCM:0;
  async function connect(){ if(!navigator.bluetooth) return; try{ setConnecting(true); const device=await navigator.bluetooth.requestDevice({filters:[{services:["heart_rate"]}], optionalServices:["battery_service","device_information"]}); setName(device.name||"Polar H10"); const server=await device.gatt.connect(); serverRef.current=server; const svc=await server.getPrimaryService("heart_rate"); const ch=await svc.getCharacteristic("heart_rate_measurement"); charRef.current=ch; await ch.startNotifications(); ch.addEventListener("characteristicvaluechanged", onMeas); device.addEventListener("gattserverdisconnected", cleanup); } catch(e){ console.error(e); } finally { setConnecting(false); } }
  function cleanup(){ try{ if(charRef.current){ charRef.current.removeEventListener("characteristicvaluechanged", onMeas); charRef.current.stopNotifications?.(); } }catch{} try{ serverRef.current?.device?.gatt?.disconnect?.(); }catch{} serverRef.current=null; charRef.current=null; }
  useEffect(()=>()=>cleanup(),[]);
  function onMeas(e){ const d=parseHeartRate(e.target.value); setHr(d.heartRate||null); if(d.sensorContactSupported) setContact(!!d.sensorContactDetected); if(d.rr?.length){ const ms=d.rr.map(x=>Math.round((x/1024)*1000)); setRrMs(prev=>[...prev, ...ms].slice(-10)); } setSeries(prev=>[...prev, {t:Date.now(), hr:d.heartRate||null}].slice(-180)); }
  const chartData = React.useMemo(()=>{ if(!series.length) return []; const t0=series[0].t; return series.map(d=>({x:Math.round((d.t - t0)/1000), hr:d.hr})) },[series]);
  return (<div className="rounded-2xl border p-4 dark:border-zinc-800"><h2 className="text-lg font-semibold mb-2">Frecuencia cardiaca en vivo (Polar H10)</h2>
    {!supported && (<div className="rounded-xl border border-rose-300 bg-rose-100 text-rose-800 px-3 py-2 text-sm mb-3">Tu navegador no soporta Web Bluetooth (Chrome/Edge sí).</div>)}
    <div className="grid sm:grid-cols-3 gap-3 mb-4">
      <button disabled={!supported||connecting} onClick={connect} className="px-3 py-2 rounded-xl text-sm border dark:border-zinc-700 disabled:opacity-60">{connecting?"Conectando...":"Conectar banda"}</button>
      <div className="rounded-xl border px-3 py-2 dark:border-zinc-700"><p className="text-xs text-gray-500 dark:text-zinc-400">Dispositivo</p><p className="font-medium">{name||"—"}</p></div>
      <div className="rounded-xl border px-3 py-2 dark:border-zinc-700"><p className="text-xs text-gray-500 dark:text-zinc-400">FCM (220−edad)</p><p className="font-medium">{FCM} lpm</p></div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <p className="text-sm text-gray-500 dark:text-zinc-400">Frecuencia actual</p>
        <p className="text-3xl font-semibold">{hr ?? "—"} <span className="text-base font-normal">lpm</span></p>
        <p className="text-xs mt-1">Contacto sensor: {contact == null ? "—" : (contact ? "OK" : "No detectado")}</p>
        <div className="mt-3 h-3 w-full rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
          <div className={`${zoneColor(pct)} h-3`} style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} title={`${Math.round(pct * 100)}% FCM`} />
        </div>
        <p className="text-xs mt-1">Zona ~ {Math.round(pct * 100)}% FCM</p>
      </div>
      <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900"><p className="text-sm text-gray-500 dark:text-zinc-400">RR-intervals (ms)</p><div className="text-sm">{rrMs.length ? rrMs.join(", ") : "—"}</div></div>
      <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900"><p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Gráfico (últimos segundos)</p><div className="h-40">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="x" tick={{ fontSize: 12 }} /><YAxis domain={['auto','auto']} /><Tooltip /><Line type="monotone" dataKey="hr" dot={false} /></LineChart></ResponsiveContainer></div></div>
    </div>
    <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">Nota: iOS/Safari no soporta Web Bluetooth nativo. Requiere HTTPS y gesto del usuario.</p>
  </div>) }