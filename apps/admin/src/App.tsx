import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import './App.css';

const team = [
  { id: '1', name: 'Ana R.', status: 'em_visita', lat: -23.561414, lng: -46.655881 },
  { id: '2', name: 'Você (demo)', status: 'em_rota', lat: -23.55, lng: -46.64 },
  { id: '3', name: 'Carlos M.', status: 'offline', lat: -23.454315, lng: -46.533477 },
];

const kpis = [
  { label: 'Visitas realizadas / planejadas', value: '18 / 22' },
  { label: 'Check-in válido', value: '92%' },
  { label: 'SLA resposta lead', value: '6h média' },
  { label: 'Missões cumpridas', value: '76%' },
];

const statusLabel: Record<string, string> = {
  em_visita: 'Em visita',
  em_rota: 'Em rota',
  offline: 'Offline',
};

function statusColor(s: string) {
  if (s === 'em_visita') return '#008D4C';
  if (s === 'em_rota') return '#8DC63F';
  return '#6b7280';
}

export default function App() {
  return (
    <div className="shell">
      <header className="header">
        <h1>RG Consultor — Executive</h1>
        <p className="sub">Mapa ao vivo (simulado) + KPIs de campo para o usuário master. Conecte WebSocket ao backend.</p>
      </header>

      <section className="kpiRow">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <div className="kpiLabel">{k.label}</div>
            <div className="kpiValue">{k.value}</div>
          </div>
        ))}
      </section>

      <section className="heatmapSection">
        <h2 className="heatmapTitle">Cobertura e desempenho (heatmap simulado)</h2>
        <p className="heatmapSub">Intensidade por região — conecte dados reais para substituir esta grade demo.</p>
        <div className="heatmapGrid" aria-hidden>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={String(i)}
              className="heatmapCell"
              style={{
                opacity: 0.35 + ((i * 13) % 65) / 100,
              }}
            />
          ))}
        </div>
      </section>

      <section className="mapSection">
        <MapContainer center={[-23.55, -46.63]} zoom={11} className="map" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {team.map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.lat, m.lng]}
              radius={10}
              pathOptions={{ color: statusColor(m.status), fillColor: statusColor(m.status), fillOpacity: 0.85 }}>
              <Popup>
                <strong>{m.name}</strong>
                <br />
                {statusLabel[m.status] ?? m.status}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <aside className="list">
          <h2>Equipe</h2>
          <ul>
            {team.map((m) => (
              <li key={m.id} style={{ borderLeftColor: statusColor(m.status) }}>
                <strong>{m.name}</strong>
                <span>{statusLabel[m.status]}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
