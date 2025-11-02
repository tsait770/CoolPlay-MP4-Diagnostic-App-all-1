import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@device_id';

export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = await generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return generateFallbackDeviceId();
  }
}

async function generateDeviceId(): Promise<string> {
  try {
    const parts: string[] = [];
    
    if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      if (iosId) parts.push(iosId);
    } else if (Platform.OS === 'android') {
      const androidId = Application.getAndroidId();
      if (androidId) parts.push(androidId);
    }
    
    if (parts.length === 0) {
      return generateFallbackDeviceId();
    }
    
    return parts.join('-');
  } catch (error) {
    console.error('Error generating device ID:', error);
    return generateFallbackDeviceId();
  }
}

function generateFallbackDeviceId(): string {
  return `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function getDeviceInfo() {
  const deviceId = await getDeviceId();
  
  return {
    deviceId,
    deviceName: await getDeviceName(),
    platform: Platform.OS,
    version: Platform.Version,
  };
}

async function getDeviceName(): Promise<string> {
  try {
    if (Platform.OS === 'ios') {
      return await Application.getIosIdForVendorAsync() || 'iOS Device';
    } else if (Platform.OS === 'android') {
      const brand = await Application.applicationName;
      return brand || 'Android Device';
    }
    return 'Web Browser';
  } catch {
    return 'Unknown Device';
  }
}
