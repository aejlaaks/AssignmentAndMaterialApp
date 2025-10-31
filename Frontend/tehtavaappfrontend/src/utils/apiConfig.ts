/**
 * API-konfiguraatio
 * Keskitetty paikka API-osoitteille ja asetuksille
 */

import { API_BASE_URL as CONFIG_API_BASE_URL } from '../config';

// API:n perusosoite - käytetään config.ts:n määrittelemää osoitetta
export const API_BASE_URL = CONFIG_API_BASE_URL;

// API:n täydellinen osoite
export const API_URL = `${API_BASE_URL}/api`;

// Debug: Näytetään käytettävä API-osoite konsolissa
console.log('API Configuration:');
console.log('- import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('- API_BASE_URL:', API_BASE_URL);
console.log('- API_URL:', API_URL);

// API:n versio
export const API_VERSION = 'v1';

// API:n timeout millisekunteina
export const API_TIMEOUT = 30000;

// Määrittää, käytetäänkö HTTPS-yhteyttä
export const USE_HTTPS = true;

// Määrittää, näytetäänkö debug-viestit konsolissa
export const DEBUG_MODE = true;

// Logitoiminto API-kutsujen debuggausta varten
export const logApiCall = (method: string, endpoint: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`API ${method}: ${endpoint}`, data || '');
  }
}; 