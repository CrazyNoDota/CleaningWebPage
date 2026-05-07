export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');

export interface GeocodingResult {
  /** Slug of a known city if we could match it; otherwise null. */
  citySlug: string | null;
  /** Human-readable single-line address. */
  formatted: string;
  street: string;
  building: string;
  lat: number;
  lng: number;
  /** Provider-specific raw payload — opaque, not exposed to API consumers. */
  raw?: unknown;
}

export interface GeocodingProvider {
  readonly name: string;
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null>;
  forwardGeocode(query: string, citySlug?: string): Promise<GeocodingResult[]>;
}
