import Constants from 'expo-constants';
import { Platform } from 'react-native';

type MapsExtra = {
  mapsAndroidEnabled?: boolean;
  mapsIosEnabled?: boolean;
};

function readMapsExtra(): MapsExtra {
  return (Constants.expoConfig?.extra ?? {}) as MapsExtra;
}

/** Mapa embutido na Agenda — Android exige chave Google (EAS secret). */
export function isNativeMapsEnabled(): boolean {
  const extra = readMapsExtra();
  if (Platform.OS === 'android') return extra.mapsAndroidEnabled === true;
  if (Platform.OS === 'ios') return extra.mapsIosEnabled !== false;
  return false;
}
