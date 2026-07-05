import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
      }
    }
  });
  return env;
}

// Cargar variables de ambos archivos (priorizando env.local)
const env = {
  ...loadEnvFile(path.resolve('.env')),
  ...loadEnvFile(path.resolve('.env.local'))
};

async function testOpenAI() {
  const key = env.OPENAI_API_KEY;
  if (!key) return { name: 'OpenAI', status: 'SKIPPED', error: 'No key in env files' };
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (res.ok) {
      const data = await res.json();
      return { name: 'OpenAI', status: 'ACTIVE', info: `Modelos disponibles: ${data.data.length}` };
    } else {
      const errText = await res.text();
      return { name: 'OpenAI', status: 'FAILED_AUTH', error: `HTTP ${res.status}: ${errText.substring(0, 100)}` };
    }
  } catch (e) {
    return { name: 'OpenAI', status: 'UNREACHABLE', error: e.message };
  }
}

async function testResend() {
  const key = env.RESEND_API_KEY;
  if (!key) return { name: 'Resend', status: 'SKIPPED', error: 'No key in env files' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (res.status === 401) {
      return { name: 'Resend', status: 'FAILED_AUTH', error: 'Token no válido (401)' };
    }
    return { name: 'Resend', status: 'ACTIVE', info: `API responde con código HTTP: ${res.status}` };
  } catch (e) {
    return { name: 'Resend', status: 'UNREACHABLE', error: e.message };
  }
}

async function testUpstashRedis() {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { name: 'Upstash Redis', status: 'SKIPPED', error: 'Missing config' };
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const text = await res.text();
      return { name: 'Upstash Redis', status: 'ACTIVE', info: `Respuesta: ${text}` };
    } else {
      return { name: 'Upstash Redis', status: 'FAILED_AUTH', error: `HTTP ${res.status}` };
    }
  } catch (e) {
    return { name: 'Upstash Redis', status: 'UNREACHABLE', error: e.message };
  }
}

async function testSparkMLS() {
  const token = env.SPARK_IDX_TOKEN;
  if (!token) return { name: 'Spark MLS IDX', status: 'SKIPPED', error: 'No token in env files' };
  try {
    const res = await fetch('https://sparkapi.com/v1/properties', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      return { name: 'Spark MLS IDX', status: 'FAILED_AUTH', error: 'Token no válido o expirado (401)' };
    }
    return { name: 'Spark MLS IDX', status: 'ACTIVE', info: `API responde con código HTTP: ${res.status}` };
  } catch (e) {
    return { name: 'Spark MLS IDX', status: 'UNREACHABLE', error: e.message };
  }
}

async function testGoogleMaps() {
  const key = env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return { name: 'Google Maps API', status: 'SKIPPED', error: 'No key in env files' };
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Louisville,KY&key=${key}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK') {
        return { name: 'Google Maps API', status: 'ACTIVE', info: `Geocodificación exitosa para Louisville, KY: ${data.results[0].formatted_address}` };
      } else {
        return { name: 'Google Maps API', status: 'FAILED_AUTH', error: `Google API Error: ${data.status} - ${data.error_message || 'Sin mensaje'}` };
      }
    } else {
      return { name: 'Google Maps API', status: 'FAILED_AUTH', error: `HTTP ${res.status}` };
    }
  } catch (e) {
    return { name: 'Google Maps API', status: 'UNREACHABLE', error: e.message };
  }
}

async function testWalkScore() {
  const key = env.VITE_WALKSCORE_API_KEY;
  if (!key) return { name: 'Walk Score API', status: 'SKIPPED', error: 'No key in env files' };
  try {
    const res = await fetch(`https://api.walkscore.com/score?format=json&lat=38.2300&lon=-85.7000&wsapikey=${key}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 || data.walkscore !== undefined) {
        return { name: 'Walk Score API', status: 'ACTIVE', info: `Score obtenido exitosamente: Walk Score = ${data.walkscore}` };
      } else {
        return { name: 'Walk Score API', status: 'FAILED_AUTH', error: `Walk Score Error: ${data.description || 'Token inválido'}` };
      }
    } else {
      return { name: 'Walk Score API', status: 'FAILED_AUTH', error: `HTTP ${res.status}` };
    }
  } catch (e) {
    return { name: 'Walk Score API', status: 'UNREACHABLE', error: e.message };
  }
}

async function run() {
  console.log('==================================================');
  console.log(' DIAGNÓSTICO COMPLETO DE CONEXIONES Y APIS — ZHOMES');
  console.log('==================================================\n');
  
  const results = await Promise.all([
    testOpenAI(),
    testResend(),
    testUpstashRedis(),
    testSparkMLS(),
    testGoogleMaps(),
    testWalkScore()
  ]);
  
  results.forEach(r => {
    if (r.status === 'ACTIVE') {
      console.log(`✅ [${r.name}] -> Estado: ACTIVO. ${r.info}`);
    } else if (r.status === 'FAILED_AUTH') {
      console.log(`❌ [${r.name}] -> Estado: ERROR DE AUTENTICACIÓN/CONFIGURACIÓN. Detalles: ${r.error}`);
    } else if (r.status === 'UNREACHABLE') {
      console.log(`⚠️ [${r.name}] -> Estado: INALCANZABLE (Red/Timeout). Detalles: ${r.error}`);
    } else {
      console.log(`➖ [${r.name}] -> Estado: SALTEADO. Detalles: ${r.error}`);
    }
  });
  
  console.log('\n==================================================');
}

run();
