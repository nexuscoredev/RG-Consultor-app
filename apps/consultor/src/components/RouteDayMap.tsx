import type { Parada } from '@rg-ambiental/shared';

type Props = {
  stops: Parada[];
};

export function RouteDayMap({ stops }: Props) {
  if (stops.length === 0) return null;

  const markers = stops
    .filter((s) => s.geo?.coordinates?.length === 2)
    .map((s) => {
      const [lng, lat] = s.geo!.coordinates;
      return `${lat},${lng}`;
    });

  const center = stops[0].geo?.coordinates;
  const lat = center ? center[1] : -23.55;
  const lng = center ? center[0] : -46.63;
  const markerParam = markers.map((m) => `markers=${m}`).join('&');
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.15},${lat - 0.1},${lng + 0.15},${lat + 0.1}&layer=mapnik&${markerParam}`;

  return (
    <div className="route-map">
      <iframe
        title="Mapa da rota"
        src={src}
        className="route-map__frame"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <ol className="route-map__legend">
        {stops.map((s, i) => (
          <li key={s.id}>
            <span className="timeline__dot">{i + 1}</span>
            {s.accountName}
          </li>
        ))}
      </ol>
    </div>
  );
}
