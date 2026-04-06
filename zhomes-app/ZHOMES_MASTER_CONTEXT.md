# 🏠 ZHOMES — MASTER PROJECT CONTEXT
*Usa este archivo para recuperar todo el contexto del proyecto si la memoria / contexto falla.*
*Última actualización: 05 de Abril de 2026*

---

## 1. LA IDEA DEL PROYECTO (VISIÓN GENERAL)
ZHomes es una **plataforma inmobiliaria hiper-localizada para la comunidad hispana en Louisville, KY**, liderada por los brokers Gilbert y Ernesto Cougil. 
No es una web tradicional, el objetivo final es una **App Móvil Nativa (iOS/Android)** que moderniza la experiencia de comprar/vender casas:
1. **Para el Cliente:** Experiencia tipo TikTok (**Vibe Feed**), detalles inmersivos (*Neighborhood Intel*, *Commute Intel*), calculadoras, y agendamiento con 1 click. 100% en español.
2. **Para el Realtor:** Un dashboard móvil en su bolsillo para gestionar sus propios leads (`realtor_leads`), agendar visitas (`bookings`), y generar reportes CMA sobre la marcha.
3. **Para el Broker:** Un "Torre de Control" (CRM compartido, `crm_leads`) donde ven el pipeline del equipo y pueden asignar leads a agentes específicos.

---

## 2. STACK TECNOLÓGICO (TECH STACK)
### **Backend & Infraestructura:**
- **Supabase:** Base de datos principal (PostgreSQL), Auth (Apple, Google, Email), Storage, y Edge Functions.
- **PostGIS:** Extensión en Postgres para búsquedas geoespaciales (radios de búsqueda para el motor CMA).
### **Servicios Externos & APIs (Integraciones Clave):**
- **N8N (Alojado en Railway):** Motor principal de automatización para disparar comunicaciones, SMS (Customer Journey), y orquestar webhooks desde Supabase. (URL: `https://n8n-production-cfe9c.up.railway.app`)
- **DocuSeal (Alojado en Railway):** Plataforma self-hosted para firmas electrónicas digitales y gestión segura de documentos para contratos y ofertas.
- **Camino API:** Integración para extraer datos de permisos de construcción, insights de propiedades y cumplimiento normativo.
- **OpenAI API (GPT-4 / Vision):** Motor de inteligencia artificial integrado para lectura y procesamiento automático de documentos subidos por agentes, generación automática de reportes, y asistentes internos.
- **Spark MLS API / RESO Web API:** Fuente de verdad para propiedades. Se sincroniza con nuestra DB usando Supabase Edge Functions (`sync_spark_properties`).

### **Frontend:**
- **Estado Actual (Staging):** React.js + Vite + PWA (Vanilla CSS / Modules). Desplegado en Vercel (zhomesapp.com) sirviendo para estructurar lógica y flujos OAuth.
- **Destino Final (Producción):** **Expo (React Native)**. Convertiremos la lógica actual en una verdadera app móvil para App Store y Google Play.

---

## 3. PIPELINE DE LO QUE HEMOS HECHO (HASTA HOY)

### **A. Base de Datos / Supabase / Backend**
- [x] Sincronización de Spark MLS exitosa (`mls_properties` poblada con +4,700 propiedades).
- [x] Estructura de BD completa: Tablas para `crm_leads` (Brokers), `realtor_leads` (privados), `bookings`, `zhomes_agents` y `vibe_videos`.
- [x] Políticas RLS (Row Level Security): Restricción por JWT email para asegurar aislamiento de datos entre agentes.
- [x] Autenticación: Apple Sign-In (configurado con Developer Account y llaves `.p8`), Google Auth, Email y entorno de Test. Todo funcional en vivo.

### **B. Servicios / Algoritmos (JS)**
- [x] `cmaService.js`: Motor de Análisis Comparativo de Mercado (CMA) que evalúa precios por radio geográfico, pies cuadrados y baños en base a data real de la MLS.
- [x] `commuteService.js` & `homeScoreService.js`: Lógica de inteligencia de vecindario a partir de coordenadas.
- [x] `supabasePropertyService.js`: Conexión de CRUDs directos para la UI.

### **C. Interfaces (Versión Móvil PWA lista para migrar)**
- [x] **Cliente:** El `Vibe Feed`, lista dinámica de Propiedades, Vista de Detalles de Propiedad completa.
- [x] **Broker Dashboard:** Vista panorámica, transferencia de Leads a Realtors, gestión de equipo.
- [x] **Realtor Dashboard:** Mis Leads (seccionados por status), Mi Agenda (calendario de showings), mis transacciones.

---

## 4. IMPLEMENTACIONES FUTURAS (A NO OLVIDAR)

> **⚠️ ESTAS SON LAS TAREAS CORE PENDIENTES:**

1. **La Migración a EXPO (React Native):**
   - El código frontend actual servirá como base de lógica (Services / Contexts), pero la UI se re-escribirá usando Expo Router para distribución nativa (`com.zhomesre.app`).
   - Requiere crear la tabla `device_tokens` en Supabase para habilitar Notificaciones Push.

2. **Customer Journey Automation (El Motor N8N):**
   - Conectar un webhook de Supabase hacia N8N para automatizar SMS vía Twilio/Vonage:
     - Cuando cliente agenda ➔ SMS de confirmación y alerta al Realtor.
     - 24 horas antes del showing ➔ SMS recordatorio automático.
     - Post-showing ➔ SMS de follow-up preguntando feedback.
     - "Ghosting" de 7 días ➔ SMS de re-engagement automático.
   - *(Referencia: El plan detallado de SMS está guardado en el documento "customer_journey.md").*

3. **ZHomes "TrueCost", Plaid & Title Agencies (Fases 3 y 4 - ON HOLD):**
   - *Ver detalle exacto en `ROADMAP_FASES_FUTURAS.md`.*
   - Integración con **Plaid API** para verificación de fondos ("Paquete de Pre-Calificación" a través de n8n).
   - Integración con **Earnnest/ZOCCAM** (Digital Earnest Money) y **Qualia API** para estatus de Title Company.
   - **Closing Disclosure AI Translator** usando Vertex AI / Gemma para traducir el "Cash to Close" al cliente.
   - Integración con **ATTOM Data Solutions / Taxee API** para calcular el costo real de propiedad (incluyendo impuestos históricos, HOA reales, etc.).

4. **Integración con Agencias de Título y E-Signatures (DocuSeal):**
   - Conexión del *Tracker Mi Progreso Inmobiliario* directo con el estatus de las agencias de Título, eliminando la ansiedad del "Limbo de Cierre".
   - Integrar la firma de contratos directamente con nuestra instancia self-hosted de **DocuSeal**.

5. **AI DocuReader (Gemini / OpenAI):**
   - Un botón en los documentos pesados (HOA, Disclosures, Inspecciones) llamado *"Z-Resumen: Léelo en 1 minuto"*. La IA extrae banderas rojas y costos ocultos automáticamente para el comprador.

6. **Puntuación de Riesgo Climático (First Street / FEMA API):**
   - Mostrar una puntuación de riesgo junto a la propiedad desde el día 1 (Riesgo de Inundación, Incendio, Vientos), ayudando al comprador educado a predecir costos de aseguranza.

7. **Módulo "Rent-to-Own" (RentCast / Mashvisor API):**
   - Analítica para calcular si una casa es viable para que inversores de ZHomes la compren al contado y la renten al cliente con opción a compra, mostrando la proyección de capital (Equity) ganado mes a mes.

8. **La Vista de Co-Shopping:**
   - Funcionalidad para que una pareja / familia comparta favoritos y reaccione a casas en conjunto dentro de la app.

9. **Hub de Post-Cierre (Thumbtack / Yelp API):**
   - Ampliar el Tracker para la fase "Nos Mudamos". Conectar servicios locales para cotizaciones de internet, pintura o servicios directo en la app.

10. **Publicación y Accounts:**
    - Terminar el upload a App Store Connect (usando la cuenta de dev activa) y Google Play. Firmado del binario con Expo EAS.
