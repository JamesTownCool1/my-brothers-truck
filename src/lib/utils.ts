/**
 * Small helpers used across the app.
 */
import { clsx, type ClassValue } from 'clsx';

/** Tailwind-friendly class merger. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format cents to a locale currency string. */
export function formatPrice(cents: number | null | undefined, currency = 'USD') {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Format meters into a human-readable distance. */
export function formatDistance(meters: number) {
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters)} m`;
  return `${miles.toFixed(1)} mi`;
}

/** Format a Date into a friendly "in 3 hours" / "yesterday" style string. */
export function formatRelative(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const absMin = Math.abs(diffMs) / 60000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMin < 60) return rtf.format(Math.round(diffMs / 60000), 'minute');
  if (absMin < 60 * 24) return rtf.format(Math.round(diffMs / 3600000), 'hour');
  if (absMin < 60 * 24 * 7) return rtf.format(Math.round(diffMs / 86400000), 'day');

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

/**
 * Haversine distance between two lat/lng points, in meters.
 * Used everywhere: price estimates, nearby helper matching, sorting jobs.
 *
 * Formula: a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *          c = 2 · atan2(√a, √(1−a))
 *          d = R · c    (R = earth radius in meters)
 */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Pricing heuristic — a real MVP would use a proper routing API for
 * driving distance. This gives a sensible estimate based on:
 *   - base fee (covers showing up)
 *   - per-mile rate (fuel + time)
 *   - size multiplier (bigger trucks / harder loads cost more)
 *
 * All output is in cents (integers) to avoid floating-point pricing bugs.
 */
export function estimatePriceCents(params: {
  distanceMeters: number;
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
}) {
  const BASE_FEE_CENTS = 1500;          // $15 base fee
  const PER_MILE_CENTS = 200;            // $2.00/mile
  const sizeMultiplier = {
    SMALL:  1.0,
    MEDIUM: 1.3,
    LARGE:  1.7,
    XLARGE: 2.2,
  }[params.size];

  const miles = params.distanceMeters / 1609.344;
  const variable = Math.round(miles * PER_MILE_CENTS);
  return Math.round((BASE_FEE_CENTS + variable) * sizeMultiplier);
}
