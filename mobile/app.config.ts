import type { ExpoConfig } from 'expo/config';

/**
 * Config dinâmica (EAS injeta variáveis na avaliação deste arquivo no build).
 * Chaves: defina `GOOGLE_MAPS_ANDROID_API_KEY` (e opcionalmente `GOOGLE_MAPS_IOS_API_KEY`) nos secrets do EAS.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { expo: base } = require('./app.json') as { expo: ExpoConfig };

const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';
const iosMapsKey = process.env.GOOGLE_MAPS_IOS_API_KEY ?? '';

const config: ExpoConfig = {
  ...base,
  android: {
    ...base.android,
    config: {
      ...base.android?.config,
      ...(androidMapsKey
        ? {
            googleMaps: {
              apiKey: androidMapsKey,
            },
          }
        : {}),
    },
  },
  ios: {
    ...base.ios,
    config: {
      ...base.ios?.config,
      ...(iosMapsKey ? { googleMapsApiKey: iosMapsKey } : {}),
    },
  },
  extra: {
    ...base.extra,
    mapsAndroidEnabled: Boolean(androidMapsKey),
    mapsIosEnabled: Boolean(iosMapsKey),
  },
};

export default config;
