import * as Updates from 'expo-updates';

/** OTA da Expo só aplica em build release embutido (EAS/loja), não no Expo Go nem `expo start`. */
export function isOtaRuntimeSupported(): boolean {
  return !__DEV__ && Updates.isEmbeddedLaunch;
}

export async function checkOtaUpdateAvailable(): Promise<boolean> {
  if (!isOtaRuntimeSupported()) return false;
  const result = await Updates.checkForUpdateAsync();
  return result.isAvailable;
}

export async function fetchOtaAndReload(): Promise<void> {
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
}
