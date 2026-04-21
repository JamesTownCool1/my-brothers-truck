'use client';

import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useMemo } from 'react';

const containerStyle = { width: '100%', height: '100%' };

/** Libraries array must be stable (not re-created) or the loader thrashes */
const LIBRARIES: ('places')[] = ['places'];

/**
 * JobMap — displays pickup + dropoff markers with a line between them.
 * Gracefully falls back to a styled placeholder when no API key is set
 * so the app still runs end-to-end in dev without Google Maps.
 */
export function JobMap({
  pickup,
  dropoff,
  height = 320,
}: {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  height?: number;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: LIBRARIES,
  });

  const center = useMemo(
    () => ({
      lat: (pickup.lat + dropoff.lat) / 2,
      lng: (pickup.lng + dropoff.lng) / 2,
    }),
    [pickup, dropoff]
  );

  if (!apiKey) {
    return (
      <div
        className="rounded-xl border-2 border-dashed border-ink-300 bg-ink-50 grid place-items-center text-center p-6"
        style={{ height }}
      >
        <div>
          <div className="text-sm font-semibold text-ink-700">Map unavailable</div>
          <div className="text-xs text-ink-500 mt-1">
            Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="rounded-xl bg-ink-100 animate-pulse"
        style={{ height }}
      />
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border-2 border-ink-200" style={{ height }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: MAP_STYLE,
        }}
      >
        <Marker
          position={pickup}
          label={{ text: 'A', color: 'white', fontWeight: 'bold' }}
        />
        <Marker
          position={dropoff}
          label={{ text: 'B', color: 'white', fontWeight: 'bold' }}
        />
        <Polyline
          path={[pickup, dropoff]}
          options={{
            strokeColor: '#ff7a11',
            strokeOpacity: 0.9,
            strokeWeight: 3,
            geodesic: true,
          }}
        />
      </GoogleMap>
    </div>
  );
}

/** Soft, editorial map style — muted greys and warm water tones. */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f3efe9' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b534a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#fbf9f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d8e2e6' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];
