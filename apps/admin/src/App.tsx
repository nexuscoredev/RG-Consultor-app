import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  apiBaseLabel,
  fetchMasterAlertsLive,
  fetchMasterDashboardLive,
  type MasterDashboard,
  type MgmtAlert,
} from './api';
import './App.css';

const DEMO_TEAM = [
  { id: '1', name: 'Ana R.', status: 'em_visita', lat: -23.561414, lng: -46.655881 },
  { id: '2', name: 'Consultor Demo', status: 'em_rota', lat: -23.55, lng: -46.64 },
  { id: '3', name: 'Carlos M.', status: 'offline', lat: -23.454315, lng: -46.533477 },
];

const statusLabel: Record<string, string> = {
  em_visita: 'Em visita',
  em_rota: 'Em rota',
  sync_ok: 'Sincronizado',
  offline: 'Offline',
};

function statusColor(s: string) {
  if (s === 'em_visita') return '#008D4C';
  if (s === 'em_rota' || s === 'sync_ok') return '#8DC63F';
  return '#6b7280';
}

const MAP_COORDS: Record<string, [number, number]> = {
  '22222222-2222-2222-2222-222222222222': [-23.55, -46.64],
  '44444444-4444-4444-4444-444444444444': [-23.561414, -46.655881],
  '55555555-5555-5555-5555-555555555555': [-23.454315, -46.533477],
};

export default function App() {
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [dash, setDash] = useState<MasterDashboard | null>(null);
  const [alerts, setAlerts] = useState<MgmtAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, a] = await Promise.all([fetchMasterDashboardLive(), fetchMasterAlertsLive()]);
        if (cancelled) return;
        setDash(d);
        setAlerts(a);
        setSource('live');
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setSource('demo');
        setDash(null);
        setAlerts([]);
        setError(e instanceof Error ? e.message : 'API indisponível');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const team = dash?.team ?? DEMO_TEAM.map((m) => ({
    ...m,
    profile: 'Consultor',
    region: '—',
    xp: 0,
    coins: 0,
    visitsWeek: 0,
    proposalsWeek: 0,
    contractsMonth: 0,
    lastSyncLabel: '—',
  }));

  const kpis = dash
    ? [
        { label: 'Visitas na semana', value: String(dash.kpis.visitsWeek) },
        { label: 'Contratos no mês', value: String(dash.kpis.contractsMonth) },
        { label: 'XP médio equipa', value: String(dash.kpis.avgXp) },
        { label: 'Pipeline aberto', value: String(dash.pipelineOpen) },
      ]
    : [
        { label: 'Visitas realizadas / planejadas', value: '18 / 22' },
        { label: 'Check-in válido', value: '92%' },
        { label: 'SLA resposta lead', value: '6h média' },
        { label: 'Missões cumpridas', value: '76%' },
      ];

  return (
    <div className="shell">
      <header className="header">
        <h1>RG Consultor — Executive</h1>
        <p className="sub">
          {source === 'live'
            ? `Dados da API (${apiBaseLabel()}) — equipa e alertas em tempo real.`
            : `Modo demonstração — ${error ?? 'ligue a API com npm run api'} e defina VITE_API_BASE_URL.`}
        </p>
      </header>

      <section className="kpiRow">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <div className="kpiLabel">{k.label}</div>
            <div className="kpiValue">{k.value}</div>
          </div>
        ))}
      </section>

      {alerts.length > 0 ? (
        <section className="heatmapSection">
          <h2 className="heatmapTitle">Alertas gestão</h2>
          <ul className="alertList">
            {alerts.slice(0, 8).map((a) => (
              <li key={a.id} className={`alertItem alert-${a.severity}`}>
                <strong>{a.title}</strong>
                <span>{a.body}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mapSection">
        <MapContainer center={[-23.55, -46.63]} zoom={11} className="map" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {team.map((m, i) => {
            const fallback = DEMO_TEAM[i % DEMO_TEAM.length];
            const center: [number, number] = MAP_COORDS[m.id] ?? [fallback.lat, fallback.lng];
            return (
              <CircleMarker
                key={m.id}
                center={center}
                radius={10}
                pathOptions={{ color: statusColor(m.status), fillColor: statusColor(m.status), fillOpacity: 0.85 }}>
                <Popup>
                  <strong>{m.name}</strong>
                  <br />
                  {statusLabel[m.status] ?? m.status}
                  <br />
                  Visitas: {m.visitsWeek} · Propostas: {m.proposalsWeek}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        <aside className="list">
          <h2>Equipe</h2>
          <ul>
            {team.map((m) => (
              <li key={m.id} style={{ borderLeftColor: statusColor(m.status) }}>
                <strong>{m.name}</strong>
                <span>
                  {statusLabel[m.status]} · {m.lastSyncLabel}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
