import { Inject, Injectable, Logger } from '@nestjs/common';
import { GEOCODING_PROVIDER, type GeocodingProvider } from './geocoding.tokens';

@Injectable()
export class GeocodingService {
  private readonly log = new Logger(GeocodingService.name);

  constructor(@Inject(GEOCODING_PROVIDER) private readonly provider: GeocodingProvider) {
    this.log.log(`Geocoding provider: ${provider.name}`);
  }

  reverseGeocode(lat: number, lng: number) {
    return this.provider.reverseGeocode(lat, lng);
  }

  forwardGeocode(query: string, citySlug?: string) {
    return this.provider.forwardGeocode(query, citySlug);
  }
}
