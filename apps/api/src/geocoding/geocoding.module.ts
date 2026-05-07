import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';
import { StubGeocodingProvider } from './providers/stub.provider';
import { GEOCODING_PROVIDER } from './geocoding.tokens';

/**
 * Adapter pattern, mirrors SmsModule. When 2GIS API keys arrive, add a
 * `Provider2GIS` impl and select via `GEOCODING_PROVIDER=2gis` env var.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    StubGeocodingProvider,
    {
      provide: GEOCODING_PROVIDER,
      inject: [ConfigService, StubGeocodingProvider],
      useFactory: (config: ConfigService, stub: StubGeocodingProvider) => {
        const choice = config.get<string>('GEOCODING_PROVIDER') ?? 'stub';
        // future: if (choice === '2gis') return twoGis;
        return stub;
      },
    },
    GeocodingService,
  ],
  exports: [GeocodingService],
})
export class GeocodingModule {}
