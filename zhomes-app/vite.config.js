import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import url from 'url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno (incluso las que no empiezan con VITE_)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        // Simular la Serverless Function de Vercel localmente
        '/api/spark': {
          target: 'https://api.sparkapi.com/v1',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Extraer el endpoint de los query params
              const reqUrl = new url.URL(req.url, 'http://localhost');
              const endpoint = reqUrl.searchParams.get('endpoint');
              reqUrl.searchParams.delete('endpoint');
              
              // Reescribir la ruta para Spark API
              const searchString = reqUrl.searchParams.toString();
              proxyReq.path = `/${endpoint}${searchString ? '?' + searchString : ''}`;
              
              // Inyectar Headers de Autenticación
              proxyReq.setHeader('Authorization', `Bearer ${env.SPARK_API_KEY}`);
              proxyReq.setHeader('X-SparkApi-User-Agent', 'ZhomesApp/1.0');
            });
          }
        }
      }
    },
  }
})
