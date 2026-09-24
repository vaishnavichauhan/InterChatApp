import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { getDeviceId } from '../utils/device';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const deviceId = await getDeviceId();
      if (deviceId) {
        config.headers['x-device-id'] = deviceId;
        config.headers['device-id'] = deviceId;
      }
    } catch (err) {
      console.warn('Error reading auth headers for request:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Optional: signal logout or expired token
      console.warn('Unauthorized request - session may be expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
