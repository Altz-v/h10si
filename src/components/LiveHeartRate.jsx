// src/components/LiveHeartRate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

function parseHeartRate(value) {
  const dv = value instanceof DataView ? value : new DataView(value.buffer);
  let o = 0;
  const flags = dv.getUint8(o++);
  const hr16 = (flags & 0x01) !== 0;
  const contactSup = (flags & 0x06) !== 0;
  const contact = (flags & 0x06) === 0x06;
  const energy = (flags & 0x08) !== 0;
  const rr = (flags & 0x10) !== 0;

  const hr = hr16 ? dv.getUint16(o, true) : dv.getUint8(o);
  o += hr16 ? 2 : 1;
  if (energy) o += 2;

  const rrs = [];
  if (rr) {
    while (o + 1 < dv.byteLength) {
      rrs.push(dv.getUint16(o, true));
      o += 2;
    }
  }
  return { heartRate: hr, sensorContactSupported: contactSup, sensorContactDetected: contact, rr: rrs };
}

const ZONAS = [
  { key: "R1", lo: 0.5, hi: 0.6, name: "Recuperación", color: "rgba(16,185,129,0.18)" },  // emerald
  { key: "R2", lo: 0.6, hi: 0.7, name: "Fondo",         color: "rgba(245,158,11,0.18)" },  // amber
  { key: "R3", lo: 0.7, hi: 0.8, name: "Aeróbico",      color: "rgba(249,115,22,0.18)" },  // orange
  { key: "R3+",lo: 0.8, hi: 0.9, name: "Umbral",        color: "rgba(244,63,94,0.18)"  },  // rose
  { key: "MAX",lo: 0.9, hi: 1.0, name: "Máxima",        color: "rgba(220,38,38,0.18)"  },  // red
];

function zoneFromPct(p) {
  if (p < 0.5) return { key: "Bajo", colorBar: "bg-gray-400" };
  if (p < 0.6) return { key: "R1", colorBar: "bg-emerald-500" };
  if (p < 0.7) return { key: "R2", colorBar: "bg-amber-500" };
  if (p < 0.8) return { key: "R3", colorBar: "bg-orange-500" };
  if (p < 0.9) return { key: "R3+", colorBar: "bg-rose-500" };
  return { key: "MAX", colorBar: "bg-red-600" };
}

export default function LiveHeartRate({ edad = 24 }) {
  const [supported] = useState(!!navigator.bluetooth);
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [hr, setHr] = useState(null);
  const [contact, setContact] = useState(null);
  const [rrMs, setRrMs] = useState([]);
  const [series, setSeries] = useState([]);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [zoneTimeMs, setZoneTimeMs] = useState({ R1: 0, R2: 0, R3: 0, "R3+": 0, MAX: 0 });

  const serverRef = useRef(null);
  const charRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  const FCM = useMemo(() => Math.max(100, 220 - Number(edad || 0)), [edad]);
  const pct = hr ? hr / FCM : 0;
  const zone = zoneFromPct(pct);

  // === Conectar ===
  async function connect() {
    if (!navigator.bluetooth) return;
    try {
      setConnecting(true);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
        optionalServices: ["battery_service", "device_information"],
      });
      setDeviceName(device.name || "Polar H10");
      const server = await device.gatt.connect();
      serverRef.current = server;

      const svc = await server.getPrimaryService("heart_rate");
      const ch = await svc.getCharacteristic("heart_rate_measurement");
      charRef.current = ch;
      await ch.startNotifications();
      ch.addEventListener("characteristicvaluechanged", onMeas);

      device.addEventListener("gattserverdisconnected", cleanup);

      // iniciar sesión
      setRunning(true);
      setStartedAt(Date.now());
      lastTickRef.current = Date.now();
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  }

  function stop() {
    setRunning(false);
    cleanup();
  }

  function cleanup() {
    try {
      if (charRef.current) {
        charRef.current.removeEventListener("characteristicvaluechanged", onMeas);
        charRef.current.stopNotifications?.();
      }
    } catch {}
    try {
      serverRef.current?.device?.gatt?.disconnect?.();
    } catch {}
    serverRef.current = null;
    charRef.current = null;
  }

  useEffect(() => () => cleanup(), []);

  // === Datos entrantes ===
  function onMeas(e) {
    const d = parseHeartRate(e.target.value);
    const now = Date.now();

    setHr(d.heartRate || null);
    if (d.sensorContactSupported) setContact(!!d.sensorContactDetected);
    if (d.rr?.length) {
      const ms = d.rr.map((x) => Math.round((x / 1024) * 1000));
      setRrMs((prev) => [...prev, ...ms].slice(-12));
    }
    setSeries((prev) => {
      const t = now;
      const next = [...prev, { t, hr: d.heartRate || null }];
      return next.slice(-240); // ~4 min si llega ~1/s
    });

    // acumular tiempo por zona
    const dt = Math.max(0, now - (lastTickRef.current || now));
    lastTickRef.current = now;
    if (running && d.heartRate) {
      const p = d.heartRate / FCM;
      let key = null;
      if (p >= 0.5 && p < 0.6) key = "R1";
      else if (p < 0.7) key = "R2";
      else if (p < 0.8) key = "R3";
      else if (p < 0.9) key = "R3+";
      else if (p >= 0.9) key = "MAX";
      if (key) setZoneTimeMs((z) => ({ ...z, [key]: z[key] + dt }));
    }
  }

  const chartData = useMemo(() => {
    if (!series.length) return [];
    const t0 = series[0].t;
    return series.map((d) => ({ x: Math.round((d.t - t0) / 1000), hr: d.hr }));
  }, [series]);

  const elapsed = useMemo(() => {
    if (!running || !startedAt) return "00:00";
    const sec = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [running, startedAt, series]); // se actualiza al llegar datos

  const zonePct = (ms) => {
    const total = Object.values(zoneTimeMs).reduce((s, v) => s + v, 0) || 1;
    return Math.round((ms / total) * 100);
  };

  return (
    <div className="rounded-2xl border p-4 dark:border-zinc-800 space-y-4">
      {/* TOP BAR */}
      <div className="grid lg:grid-cols-4 gap-3">
        <div className="rounded-xl border px-3 py-3 dark:border-zinc-700">
          <button
            disabled={!supported || connecting}
            onClick={running ? stop : connect}
            className="w-full px-3 py-2 rounded-xl text-sm border dark:border-zinc-700 disabled:opacity-60"
          >
            {running ? "Detener sesión" : connecting ? "Conectando…" : "Conectar banda"}
          </button>
          {!supported && (
            <p className="mt-2 text-xs text-rose-400">
              Tu navegador no soporta Web Bluetooth (Chrome/Edge sí).
            </p>
          )}
        </div>

        <div className="rounded-xl border px-3 py-3 dark:border-zinc-700">
          <p className="text-xs text-gray-500 dark:text-zinc-400">Dispositivo</p>
          <p className="font-medium truncate">{deviceName || "—"}</p>
          <p className="text-xs mt-1">Sesión: {running ? elapsed : "—"}</p>
        </div>

        <div className="rounded-xl border px-3 py-3 dark:border-zinc-700">
          <p className="text-xs text-gray-500 dark:text-zinc-400">FCM (220−edad)</p>
          <p className="font-semibold">{FCM} lpm</p>
        </div>

        <div className="rounded-xl border px-3 py-3 dark:border-zinc-700">
          <p className="text-xs text-gray-500 dark:text-zinc-400">Zona actual</p>
          <p className="font-medium">
            {hr ? `${Math.round((hr / FCM) * 100)}% FCM` : "—"}
          </p>
        </div>
      </div>

      {/* MARCADOR + RR + CHART */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* marcador */}
        <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Frecuencia actual</p>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-semibold leading-none">
              {hr ?? "—"}<span className="text-lg font-normal ml-1">lpm</span>
            </p>
          </div>
          <p className="text-xs mt-1">Contacto sensor: {contact == null ? "—" : (contact ? "OK" : "No detectado")}</p>

          <div className="mt-4 h-3 w-full rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`${zone.colorBar} h-3 transition-all`}
              style={{ width: `${Math.min(100, Math.max(0, (hr ? hr / FCM : 0) * 100))}%` }}
            />
          </div>
          <p className="text-xs mt-1">Zona ~ {hr ? Math.round((hr / FCM) * 100) : 0}% FCM ({zone.key})</p>

          {/* tiempo por zona */}
          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {ZONAS.map((z) => (
              <div key={z.key} className="rounded-lg border px-2 py-2 dark:border-zinc-800">
                <p className="text-xs text-gray-500 dark:text-zinc-400">{z.key}</p>
                <p className="text-sm font-medium">{zonePct(zoneTimeMs[z.key])}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* rr-intervals */}
        <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-zinc-400">RR-intervals (ms)</p>
          <div className="text-sm mt-2 whitespace-pre-wrap">
            {rrMs.length ? rrMs.join(", ") : "—"}
          </div>
        </div>

        {/* gráfico con bandas */}
        <div className="rounded-2xl border p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Gráfico (últimos segundos)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fontSize: 12 }} />
                <YAxis domain={[Math.round(FCM * 0.5) - 5, Math.round(FCM * 1.0) + 5]} />
                <Tooltip />
                {/* bandas por zona */}
                {ZONAS.map((z, i) => (
                  <ReferenceArea
                    key={z.key}
                    y1={Math.round(FCM * z.lo)}
                    y2={Math.round(FCM * z.hi)}
                    fill={z.color}
                    stroke="none"
                  />
                ))}
                <Line type="monotone" dataKey="hr" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-400">
        Nota: iOS/Safari no soporta Web Bluetooth. En desktop/Android usa Chrome o Edge.
        Requiere HTTPS y gesto del usuario para conectar.
      </p>
    </div>
  );
}
