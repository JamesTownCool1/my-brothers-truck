'use client';

import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';

/** Same stable libraries array as JobMap — avoids double-loading. */
const LIBRARIES: ('places')[] = ['places'];

export interface AddressValue {
  address: string;
  lat: number;
  lng: number;
}

/**
 * AddressAutocomplete — wraps Google Places Autocomplete.
 *
 * Falls back to a plain text input + a geocode-on-blur stub when no
 * API key is configured, so we can still accept addresses in dev.
 * In no-key mode we pick fake but stable coordinates so the distance
 * calculation and map don't break (lat/lng ~ San Antonio center).
 */
export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder?: string;
  value?: AddressValue;
  onChange: (v: AddressValue) => void;
  error?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? '',
    libraries: LIBRARIES,
  });
  const [text, setText] = useState(value?.address ?? '');
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  function handlePlace() {
    const place = acRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    onChange({
      address: place.formatted_address ?? place.name ?? text,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    });
    setText(place.formatted_address ?? place.name ?? text);
  }

  // No-key dev fallback
  if (!apiKey || !isLoaded) {
    return (
      <Input
        label={label}
        placeholder={placeholder}
        value={text}
        error={error}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          // Fake geocode — stable per-address pseudo-coordinates around SA
          if (!text) return;
          let h = 0;
          for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
          const lat = 29.4241 + ((h % 100) / 1000);
          const lng = -98.4936 + (((h >> 7) % 100) / 1000);
          onChange({ address: text, lat, lng });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-800">{label}</label>
      <Autocomplete
        onLoad={(ac) => (acRef.current = ac)}
        onPlaceChanged={handlePlace}
        options={{ fields: ['formatted_address', 'geometry', 'name'] }}
      >
        <input
          className="h-11 w-full rounded-lg border-2 border-ink-200 bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Autocomplete>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
