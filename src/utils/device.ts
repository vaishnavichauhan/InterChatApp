import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'interchat_device_id';

const generateUUID = (): string => {
  const chars = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    uuid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uuid;
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    const newId = `rn_${generateUUID()}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.warn('Failed to read deviceId from AsyncStorage', error);
    return 'rn_device_fallback';
  }
};
