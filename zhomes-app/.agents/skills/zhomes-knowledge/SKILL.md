---
name: zhomes-knowledge
description: >
  Conocimiento completo de la aplicación ZHomes Real Estate.
  Contiene arquitectura, stack técnico, reglas de negocio, integraciones,
  base de datos, y patrones de desarrollo establecidos.
  SIEMPRE leer este skill antes de hacer cualquier cambio al proyecto.
---

# ZHomes Real Estate App — Knowledge Base Completo

## 🏠 ¿Qué es ZHomes?

ZHomes Real Estate es una agencia inmobiliaria real ubicada en **Louisville, Kentucky**.
Esta app es su plataforma digital completa: portal público para compradores, CRM interno para el broker, y portal para los agentes/realtors.

**Modelo de negocio:**
- La app muestra propiedades del **MLS de Greater Louisville** (IDX feed via Spark MLS)
- ZHomes tiene sus propias propiedades exclusivas (`is_zhomes = true`) que SIEMPRE aparecen primero
- Los clientes pueden buscar, guardar favoritos, hacer swipe (como Tinder), ver videos (Vibe Feed), agendar citas y calcular su hipoteca
- El broker y los agentes tienen dashboards internos separados
- **No se muestran comisiones** — eliminadas por requerimientos legales de la industria

---

## 🗂️ Estructura de Directorios

```
zhomes-app/
├── api/                        # Vercel Serverless Functions (producción)
│   ├── spark.js               # Proxy → Spark MLS API
│   ├── walkscore.js           # Proxy → WalkScore API
│   ├── zhomes-ai.js           # Proxy → OpenAI (GPT-4o-mini)
│   └── sync.js                # Cron job: sync Spark → Supabase (2x/day)
├── src/
│   ├── lib/
│   │   └── supabaseClient.js  # Instancia singleton de Supabase
│   ├── context/
│   │   ├── PropertyContext.jsx # Estado global: propiedades, agentes, office
│   │   └── ThemeContext.jsx    # Modo claro/oscuro
│   ├── services/
│   │   ├── supabasePropertyService.js  # Queries a mls_properties en Supabase
│   │   ├── sparkService.js             # Queries directas a Spark MLS (fallback/admin)
│   │   ├── walkScoreService.js         # Walk/Transit/Bike scores
│   │   ├── mortgageService.js          # Cálculos hipotecarios locales
│   │   ├── homeScoreService.js         # Score de propiedades (puntuación ZHomes)
│   │   ├── schedulingService.js        # Reserva de citas en Supabase
│   │   └── firebaseService.js          # Push notifications (FCM)
│   ├── pages/
│   │   ├── mobile/
│   │   │   ├── public/        # Landing, Propiedades, Detalle, Realtors, Mapa, Vibe, Swipe, etc.
│   │   │   ├── auth/          # Login, Registro, Recover, UpdatePassword, CompleteProfile
│   │   │   └── dashboard/     # Dashboard Broker + Portal Realtor (todos los módulos)
│   │   ├── dashboard/         # Versiones legacy desktop (no usar para nuevas features)
│   │   ├── realtor/           # RealtorProfile, CreatePropertyPage
│   │   └── admin/             # SuperAdminKeysMobile
│   ├── components/            # Componentes reutilizables
│   │   └── layout/
│   │       └── mobile/        # PublicLayoutMobile, DashboardLayoutMobile, RealtorLayoutMobile
│   ├── hooks/                 # Custom hooks
│   ├── data/                  # mockData.js (datos de fallback/demo)
│   └── locales/               # i18n (es/en)
├── supabase/
│   ├── functions/zhomes-ai/   # Edge Function (alternativa al Serverless de Vercel)
│   └── migrations/            # Schema SQL de todas las tablas
├── scripts/                   # Scripts Node.js para sync/mantenimiento manual
├── .agent/workflows/          # Workflows de desarrollo
└── .agents/skills/            # Skills del agente ← AQUÍ ESTAMOS
```

---

## 🧰 Stack Técnico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend Framework | React 19 + Vite 7 | `npm run dev` (--host para red local) |
| Routing | React Router v6 | Rutas en `AppRoutes.jsx` |
| Mobile | Capacitor 8 (iOS + Android) | `android/` e `ios/` presentes |
| Database | Supabase (PostgreSQL) | Proyecto: `elhqcwpqbnxafaepmswl` |
| Auth | Supabase Auth | Email/password + demo bypass |
| MLS Data | Spark MLS (RESO Web API v3) | OfficeKey ZHomes: `20141212170001416260000000` |
| AI | OpenAI GPT-4o-mini | Via serverless `/api/zhomes-ai` |
| Maps | Leaflet + react-leaflet | + Google Maps API key |
| Scores | WalkScore API | Via serverless `/api/walkscore` |
| Animaciones | Motion (framer-motion fork) | `motion` package |
| Gráficos | Recharts | Para analytics/dashboard |
| E-Signatures | DocuSeal React | Para firma de documentos |
| Carousel | Embla Carousel | Para galería de fotos |
| Deploy | Vercel | Con cron jobs para sync MLS |
| Iconos | Lucide React + IonIcons | |
| i18n | i18next | es/en |

---

## 🗄️ Base de Datos Supabase

**URL:** `https://bnbvzcllyfmzuhnjltxg.supabase.co`
**Proyecto:** Controlado por ZHomes (proyecto activo, migrado en Marzo 2026)

### Tablas principales

#### `mls_properties` — Propiedades del MLS
```sql
id TEXT PRIMARY KEY              -- ListingKey de Spark
address TEXT
city TEXT
state TEXT DEFAULT 'KY'
zip TEXT
price NUMERIC
close_price NUMERIC
beds INTEGER
baths NUMERIC
sqft INTEGER
property_subtype TEXT            -- 'Single Family', 'Condominium', etc.
status TEXT                      -- 'Active', 'Active Under Contract', 'Pending', 'Closed', 'Cancelled', 'Expired', 'Exclusiva'
is_zhomes BOOLEAN DEFAULT false  -- TRUE = propiedad exclusiva de ZHomes
description TEXT
primary_photo TEXT               -- URL foto principal
photos JSONB                     -- Array de URLs
lat NUMERIC
lng NUMERIC
list_agent_name TEXT
list_agent_key TEXT
list_date DATE
close_date DATE
year_built INTEGER
subdivision TEXT
lot_size NUMERIC
garage_yn BOOLEAN
pool_features JSONB
basement JSONB
fireplace_yn BOOLEAN
spark_source TEXT                -- 'spark' | 'app' (subida manualmente)
sync_timestamp TIMESTAMPTZ
```

**RLS:** Lectura pública (`FOR SELECT USING (true)`). Sin escritura desde cliente.
**Estrategia de queries:** ZHomes SIEMPRE primero, luego fill con MLS.

#### `zhomes_agents` — Agentes de ZHomes
```sql
id TEXT PRIMARY KEY              -- MemberKey de Spark
full_name TEXT
first_name TEXT / last_name TEXT
email TEXT / phone TEXT
mls_id TEXT / status TEXT / license TEXT
member_type TEXT / office_name TEXT / office_key TEXT
bio TEXT / address TEXT / city TEXT / state TEXT / zip TEXT
total_closed INTEGER / total_volume BIGINT / avg_price INTEGER
last_close_date DATE / recent_deals JSONB
sync_timestamp TIMESTAMPTZ
-- CAMPOS EXTRA (no en schema original, pueden diferir):
photo_url TEXT                   -- URL foto de perfil en Supabase Storage
full_body_photo_url TEXT         -- URL foto cuerpo completo
```

#### `zhomes_office` — Datos de la oficina
```sql
id TEXT PRIMARY KEY              -- OfficeKey de Spark
name TEXT / phone TEXT / fax TEXT / email TEXT
address TEXT / city TEXT / state TEXT / zip TEXT
license TEXT / broker_key TEXT / mls_id TEXT / status TEXT
sync_timestamp TIMESTAMPTZ
```

#### `user_favorites` — Favoritos del usuario
```sql
id UUID PRIMARY KEY
user_id UUID → auth.users
property_id TEXT
property_data JSONB
collection_name TEXT DEFAULT 'default'
created_at TIMESTAMPTZ
UNIQUE(user_id, property_id)
```

#### `bookings` — Citas agendadas
```sql
id UUID PRIMARY KEY
realtor_id UUID → auth.users
property_id TEXT
client_user_id UUID → auth.users
client_name TEXT / client_phone TEXT / client_email TEXT
booking_date DATE / time_slot TIME
notes TEXT
status TEXT -- 'confirmed', 'cancelled', 'completed', 'no_show'
```

#### `realtor_availability` — Disponibilidad del realtor
```sql
id UUID / realtor_id UUID → auth.users
day_of_week INT (0=Sun, 6=Sat)
start_time TIME / end_time TIME
UNIQUE(realtor_id, day_of_week)
```

#### `esign_documents` — Firma de documentos
```sql
id UUID / title TEXT / template_type TEXT
client_name TEXT / client_email TEXT
agent_id UUID → auth.users
status TEXT -- 'draft', 'pending', 'signed', 'expired'
signature_data TEXT (Base64 PNG) / pdf_url TEXT
sent_date TIMESTAMPTZ / signed_date TIMESTAMPTZ
```

#### `push_tokens` — Tokens FCM para notificaciones push
```sql
id UUID / user_id UUID → auth.users (UNIQUE)
token TEXT / platform TEXT -- 'web', 'ios', 'android'
```

#### `prequal_estimates` — Pre-calificación hipotecaria
```sql
id UUID / user_id UUID → auth.users (UNIQUE)
gross_monthly NUMERIC / existing_debts NUMERIC / down_payment NUMERIC
credit_tier_index INTEGER / credit_tier_label TEXT / loan_term INTEGER
result JSONB                    -- Snapshot del resultado calculado
```

#### `vibe_videos` — Videos del Vibe Feed
```sql
id UUID / user_id UUID → auth.users
property_id TEXT / video_url TEXT / thumbnail_url TEXT
caption TEXT / likes INT / views INT
```

---

## 🔌 Integraciones Externas

### Spark MLS (RESO Web API v3)
- **URL base producción:** `https://replication.sparkapi.com/Version/3/Reso/OData/`
- **Proxy local (dev):** Vite proxy en `/api/spark` → rewrita paths automáticamente
- **Proxy producción:** `api/spark.js` (Vercel Serverless)
- **Auth:** Bearer token (API Key hardcodeado con fallback)
- **OfficeKey ZHomes:** `20141212170001416260000000`
- **Endpoints usados:**
  - `Property` — Listados (con `$expand=Media` para fotos)
  - `Member` — Agentes
  - `Office` — Datos de oficina
  - `OpenHouse` — Open Houses
- **Paginación:** Auto-paginación via `@odata.nextLink` + `$skiptoken`
- **Sync automático:** Cron en Vercel 2x/day (10:00 AM y 10:00 PM UTC) via `/api/sync`

### OpenAI (GPT-4o-mini)
- **Proxy:** `api/zhomes-ai.js` (Vercel) y también disponible en `vite.config.js` localmente
- **Acciones soportadas:**
  - `broker_compliance` — Verifica documentos contra reglas de compliance
  - `legal_translator` — Resume documentos legales para compradores
  - `vibe_creator` — Genera descripción MLS + script TikTok para propiedades
  - `smart_followup` — Genera mensaje WhatsApp de seguimiento para clientes del CRM

### WalkScore API
- **Proxy:** `api/walkscore.js` (Vercel) / Vite proxy local
- **Retorna:** Walk Score, Transit Score, Bike Score
- **Cache:** 24h (`s-maxage=86400`)
- **Limit:** 5,000 calls/day (free tier)

### Firebase (FCM)
- **Uso:** Push notifications (token guardado en `push_tokens`)
- **Config:** Variables `VITE_FIREBASE_*` en `.env`

---

## 🛣️ Rutas de la App (`AppRoutes.jsx`)

### Públicas (sin auth)
| Path | Componente |
|------|-----------|
| `/` | `LandingPageMobile` |
| `/propiedades` | `PropertiesPageMobile` |
| `/propiedades/:id` | `PropertyDetailPageMobile` |
| `/mapa` | `MapPageMobile` |
| `/realtors` | `RealtorsPageMobile` |
| `/calculadora` | `MortgageCalculatorPageMobile` |
| `/vibe` | `VibeFeedMobile` |
| `/login` | `LoginPageMobile` |
| `/registro` | `RegisterPageMobile` |
| `/completar-perfil` | `CompleteProfileMobile` |
| `/recuperar` | `RecoverPasswordMobile` |
| `/actualizar-password` | `UpdatePasswordMobile` |
| `/coleccion/:userId` | `SharedCollectionPageMobile` |

### Protegidas — Cliente
| Path | Componente |
|------|-----------|
| `/perfil` | `UserProfileMobile` |
| `/swipe` | `SwipeModePageMobile` |
| `/pareja` | `CoShoppingMobile` |

### Protegidas — Broker Dashboard
| Path | Componente |
|------|-----------|
| `/dashboard` | `DashboardPageMobile` |
| `/transacciones` | `TransactionsPageMobile` |
| `/documentos` | `BrokerDocumentsMobile` |
| `/equipo` | `TeamPageMobile` |
| `/dashboard/deal` | `DealRoomMobile` |
| `/deal/:id` | `DealRoomMobile` |
| `/mensajes` | `BrokerMessagesMobile` |
| `/terminal` | `BrokerTerminal` |
| `/crm` | `CRMPageMobile` |
| `/visitas` | `ShowingScheduleMobile` |
| `/firmas` | `ESignaturesMobile` |
| `/cma` | `CMAPageMobile` |
| `/mercado` | `MarketReportsMobile` |
| `/admin/config` | `SuperAdminKeysMobile` |

### Protegidas — Portal Realtor
| Path | Componente |
|------|-----------|
| `/realtor` | `RealtorDashboardMobile` |
| `/realtor/transacciones` | `RealtorTransactionsMobile` |
| `/realtor/documentos` | `RealtorDocumentsMobile` |
| `/realtor/mensajes` | `RealtorMessagesMobile` |
| `/realtor/perfil` | `RealtorProfile` |
| `/realtor/crear-propiedad` | `CreatePropertyPage` |
| `/realtor/citas` | `RealtorShowingsMobile` |
| `/realtor/leads` | `RealtorLeadsMobile` |
| `/realtor/open-houses` | `RealtorOpenHousesMobile` |
| `/realtor/tareas` | `RealtorTasksMobile` |
| `/realtor/clientes` | `RealtorClientsMobile` |
| `/realtor/subir-vibe` | `UploadVibeMobile` |

---

## 🌐 Variables de Entorno

### `.env` (local dev)
```bash
VITE_SUPABASE_URL=https://elhqcwpqbnxafaepmswl.supabase.co
VITE_SUPABASE_ANON_KEY=...          # Anon key de Supabase
VITE_SPARK_API_KEY=6ojczz7todkepnsvryhw7m8ka  # Bearer token Spark
VITE_GOOGLE_MAPS_KEY=...            # Google Maps
VITE_WALKSCORE_API_KEY=...          # WalkScore
VITE_FIREBASE_API_KEY=...           # Firebase FCM
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
OPENAI_API_KEY=...                  # Para el AI middleware local
```

### Vercel (producción) — Variables requeridas
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SPARK_API_KEY
VITE_WALKSCORE_API_KEY
OPENAI_API_KEY
VITE_GOOGLE_MAPS_KEY
```

---

## 🚀 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (Vite, con host para móviles en red)
npm run build        # Build de producción
npm run sync         # Sync manual Spark → Supabase
npm run sync:status  # Ver estado actual de Supabase (propiedades, agentes, office)
```

### Scripts manuales (`/scripts/`)
| Script | Propósito |
|--------|----------|
| `sync-mls.mjs` | Sync completo de propiedades Spark → Supabase |
| `sync-properties-final.mjs` | Versión refinada del sync de propiedades |
| `sync-agents-final.mjs` | Sync de agentes Spark → Supabase |
| `sync-agents-only.mjs` | Sync solo agentes (sin propiedades) |
| `upload-agent-photos.mjs` | Sube fotos de agentes a Supabase Storage |
| `update-agent-photo-urls.mjs` | Actualiza URLs de fotos en tabla zhomes_agents |
| `query-property.mjs` | Consulta directa a Spark para debug de propiedades |
| `find-scholar.ps1` | (PowerShell) Busca propiedad específica Scholar St |
| `refresh-status.mjs` | Refresca status de propiedades desde MLS |

---

## ⚙️ Cron Jobs (Vercel)

Definidos en `vercel.json`:
```json
"crons": [
  { "path": "/api/sync", "schedule": "0 10 * * *" },  // 10:00 AM UTC todos los dias
  { "path": "/api/sync", "schedule": "0 22 * * *" }   // 10:00 PM UTC todos los dias
]
```

El cron hace sync automático de propiedades activas de Spark → Supabase.

---

## 📐 Reglas de Desarrollo

### Mobile-First OBLIGATORIO
- **TODO el desarrollo es mobile-first**. No existe versión desktop activa.
- Los layouts del directorio `src/pages/dashboard/` son LEGACY — no usar para features nuevas.
- Usar siempre los layouts de `src/pages/mobile/`

### Bottom Sheets / Modales
Siempre incluir padding inferior para cubrir el nav bar:
```css
.modal-body {
    overflow-y: auto;
    flex: 1;
    padding: 20px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
}
```

### Prioridad de ZHomes
Las propiedades de ZHomes (`is_zhomes = true`) SIEMPRE aparecen primero en cualquier lista.
Implementado en `SupabasePropertyService.getProperties()`.

### Sin comisiones
NO agregar nunca referencias a comisiones (commission) en ningún lugar de la app.
Eliminadas por requerimientos legales/industria.

### Estado global (`PropertyContext`)
El `PropertyContext` carga al inicio:
1. Propiedades activas del MLS (hasta 1000)
2. Propiedades exclusivas (`status='Exclusiva'`)
3. Agentes de `zhomes_agents` (fallback a Spark si vacío)
4. Datos de oficina de `zhomes_office`

Usar `useProperties()` hook para acceder a:
- `properties` — todas las activas del MLS
- `zhomesListings` — solo ZHomes (filtrado)
- `mlsListings` — solo MLS (filtrado)
- `offMarketListings` — propiedades subidas desde la app
- `zhomesAgents` — agentes
- `zhomesOffice` — datos de la oficina
- `agentStats` — stats de cierre por agente
- `loading` — boolean
- `addProperty(data)` — añade propiedad off-market

### Depende de i18n
La app tiene soporte bilingüe (es/en). Los textos de UI deben usar `useTranslation`.

---

## 🔑 Datos Importantes

- **Supabase Project ID:** `bnbvzcllyfmzuhnjltxg`
- **ZHomes OfficeKey (Spark):** `20141212170001416260000000`
- **Ciudad principal:** Louisville, KY
- **MLS:** Greater Louisville Association of Realtors (GLAR)
- **API Spark:** Replication feed (no producción directa), IDX license

---

## 🧩 Flujo de Datos (Producción)

```
Spark MLS API
    ↓ (2x/day vía /api/sync cron)
Supabase PostgreSQL
    ↓ (queries filtradas)
PropertyContext (en memoria)
    ↓
Páginas y componentes React
```

**Para datos en tiempo real o que no están en caché:**
```
React Component
    → SparkService.method()
    → /api/spark (Vercel proxy)
    → Spark MLS API
    ← data JSON
```

---

## ⚠️ Issues Conocidos y Gotchas

1. **API Key hardcodeada en vite.config.js** — La Spark API key aparece en texto plano como fallback. Esto está "aceptado" por ahora pero es una deuda técnica.

2. **`mls_properties` schema viejo en migración** — La migración `20260328_core_tables.sql` crea `mls_properties` con solo `id, data, updated_at`. La tabla REAL en Supabase tiene muchas más columnas (price, beds, baths, lat, etc.). La migración está desincronizada del schema real.

3. **Supabase `mls_properties` RLS** — La política solo permite `SELECT`. Los scripts de sync usan la `service_role` key (server-side, no expuesta al cliente).

4. **WalkScore proxy — variable name inconsistencia** — En `api/walkscore.js` usa `process.env.VITE_WALKSCORE_API_KEY` (prefijo VITE_ en serverless). Vercel acepta variables con cualquier nombre pero hay que asegurarse de que esté configurada.

5. **`vibe_videos` tabla** — Existe en schema pero el Vibe Feed actualmente puede estar usando mock data. Verificar.

6. **Photos de agentes** — Las fotos están en Supabase Storage. Los campos `photo_url` y `full_body_photo_url` se añadieron post-migración (no están en el schema inicial).

7. **`zhomes_agents` photo fields** — No están en la migración `20260328_zhomes_agent_tables.sql`. Se añadieron via scripts/manual en el Supabase SQL Editor.

8. **OpenAI key en vite.config.js** — La key de OpenAI está hardcodeada en el middleware local de Vite. **En producción usa correctamente `process.env.OPENAI_API_KEY`** (sin exponer al cliente).
