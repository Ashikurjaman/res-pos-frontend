import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: 30000,
});

export default api;