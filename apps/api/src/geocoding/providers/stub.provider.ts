import { Injectable, Logger } from '@nestjs/common';
import type { GeocodingProvider, GeocodingResult } from '../geocoding.tokens';

/**
 * Stub provider. Returns deterministic synthetic data so the wire format and
 * client wiring can be verified end-to-end before 2GIS keys arrive.
 */
@Injectable()
export class StubGeocodingProvider implements GeocodingProvider {
  readonly name = 'stub';
  private readonly log = new Logger('StubGeocoding');

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    this.log.debug(`[STUB] reverseGeocode(${lat}, ${lng})`);
    return {
      citySlug: 'astana',
      formatted: `ул. Республики 24, Астана (lat ${lat.toFixed(4)}, lng ${lng.toFixed(4)})`,
      street: 'ул. Республики',
      building: '24',
      lat,
      lng,
    };
  }

  async forwardGeocode(query: string, citySlug?: string): Promise<GeocodingResult[]> {
    this.log.debug(`[STUB] forwardGeocode(${query}, ${citySlug ?? '-'})`);
    if (!query.trim()) return [];
    // Two synthetic suggestions so paginated UIs can render.
    return [
      {
        citySlug: citySlug ?? 'astana',
        formatted: `${query}, Астана`,
        street: query,
        building: '1',
        lat: 51.1605,
        lng: 71.4704,
      },
      {
        citySlug: citySlug ?? 'astana',
        formatted: `${query}, Астана (вариант 2)`,
        street: query,
        building: '17А',
        lat: 51.1701,
        lng: 71.4458,
      },
    ];
  }
}
