/** Generate a 4-digit ride PIN for passenger verification. */
export function generateRidePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Rough ETA in minutes from distance (km). */
export function estimateEtaMinutes(distanceKm: number, speedKmh = 28): number {
  return Math.max(2, Math.ceil((distanceKm / speedKmh) * 60));
}
