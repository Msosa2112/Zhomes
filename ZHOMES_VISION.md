# 🏠 ZHOMES COMMAND CENTER
## La Plataforma de Gestión para Brokerajes que NO Existe

---

## 🎯 EL PROBLEMA

Los brokers inmobiliarios latinos manejan su negocio con:
- WhatsApp groups caóticos
- Emails perdidos con documentos adjuntos
- Excel sheets para comisiones
- Llamadas telefónicas para saber el estatus de un cierre
- Carpetas de Google Drive desordenadas
- Cero visibilidad en tiempo real de su operación

**ZHOMES Command Center** resuelve TODO esto en una sola plataforma.

---

## 🚀 CONCEPTO: "Mission Control para Brokerajes"

Imagina el centro de control de la NASA, pero para un broker inmobiliario.
Desde UNA pantalla, el broker puede ver:
- ¿Cuántas transacciones están activas?
- ¿Quién le debe documentos?
- ¿A quién le debe pagar comisiones?
- ¿Qué realtors están produciendo más?
- ¿Cuánto dinero entra y sale este mes?

---

## 📱 PANTALLAS Y FUNCIONALIDADES

### 1. 🎛️ DASHBOARD DEL BROKER (Mission Control)
Centro de mando en tiempo real con:

- **Pipeline Visual** — Kanban board con todas las transacciones activas
  - Columnas: `Listada` → `Bajo Contrato` → `Inspección` → `Tasación` → `Pre-Cierre` → `Cerrada` → `Comisión Pagada`
  - Drag & drop para mover transacciones entre etapas
  
- **Alertas Inteligentes** — Cards de alerta tipo:
  - 🔴 "María subió documentos del cierre de 8708 Denise Dr — PENDIENTE REVISIÓN"
  - 🟡 "Faltan 3 documentos para cerrar 4411 Lambert Rd"
  - 🟢 "Comisión de $4,500 lista para pagar a Carlos"
  
- **KPIs en Tiempo Real**:
  - Volumen de ventas del mes/trimestre/año
  - Comisiones pendientes por pagar
  - Documentos pendientes de revisión
  - Número de transacciones activas vs cerradas
  - Top realtors por producción
  
- **Gráficos Dinámicos**:
  - Revenue timeline
  - Comisiones por realtor
  - Distribución geográfica de ventas

### 2. 📋 TRANSACTION CENTER (Centro de Transacciones)
Cada transacción/listing tiene su propio "workspace":

- **Header**: Dirección, foto de la propiedad, precio, status, realtor asignado
- **Document Vault** (Bóveda de Documentos):
  - Checklist automático de documentos requeridos por tipo de transacción:
    - ✅ Contrato de compra-venta
    - ✅ Disclosure del vendedor
    - ⬜ Inspección de la propiedad
    - ⬜ Tasación
    - ⬜ HUD Statement / Closing Disclosure
    - ⬜ Commission Disbursement Authorization
    - ⬜ Title Insurance
  - Upload con drag & drop
  - Preview de documentos inline (PDF viewer)
  - Historial de versiones
  
- **Timeline de Actividad**: Log automático de todo lo que pasa:
  - "María subió Contrato de Compra-Venta — hace 2 horas"
  - "Broker aprobó documentos — hace 1 día"
  - "Se envió comisión de $3,200 — hace 3 días"
  
- **Chat de Transacción**: Mensajes en contexto (como Slack channels pero por transacción)
- **Notas**: Espacio para notas privadas del broker

### 3. 💰 COMMISSION TRACKER (Control de Comisiones)
Panel financiero completo:

- **Por Transacción**:
  - Precio de venta
  - % de comisión total
  - Split Broker/Realtor (configurable por realtor)
  - Fees y deducciones
  - Monto neto a pagar al realtor
  - Status: Pendiente → Documentos completos → Aprobada → Pagada
  
- **Vista Global**:
  - Total comisiones del mes/año
  - Comisiones pendientes (tabla con filtros)
  - Historial de pagos
  - Exportar a CSV/PDF para contabilidad
  
- **Aprobación de Pagos**:
  - Flujo: Realtor sube docs → Broker revisa → Broker aprueba pago → Se marca como pagada
  - Notificación automática al realtor cuando se aprueba/paga

### 4. 👥 TEAM HUB (Centro del Equipo)
Gestión del equipo de realtors:

- **Perfil de cada Realtor**:
  - Foto, nombre, licencia, contacto
  - Métricas de rendimiento (ventas, volumen, velocidad de cierre)
  - Transacciones activas y cerradas
  - Documentos pendientes (compliance score)
  - Historial de comisiones recibidas
  
- **Ranking Board**: Leaderboard gamificado
  - Top producers del mes
  - Racha de cierres
  - Compliance score (quién entrega docs a tiempo)
  
- **Directorio**: Acceso rápido a todos los realtors

### 5. 💬 COMUNICACIÓN INTERNA
Sistema de mensajería integrado:

- **Chat Directo**: Mensajes 1-a-1 entre broker y realtors
- **Canales por Transacción**: Cada listing tiene su chat contextual
- **Anuncios**: Broadcast messages del broker a todo el equipo
- **Notificaciones Push**: 
  - WhatsApp (vía Twilio API)
  - Email
  - In-app notifications
  
### 6. 📊 REPORTES Y ANALYTICS
Business intelligence para el broker:

- Producción por realtor (ranking, tendencias)
- Revenue por mes/trimestre/año
- Tiempo promedio de cierre
- Documentos: compliance rate por realtor
- Distribución geográfica de ventas
- Comparativa año vs año

### 7. 🔔 CENTRO DE NOTIFICACIONES
Hub inteligente de alertas:

- Notificaciones in-app con badge counter
- Resumen diario por email al broker
- Alertas urgentes por WhatsApp:
  - Nuevos documentos subidos
  - Transacciones que necesitan atención
  - Pagos pendientes de aprobación

---

## 🎨 DISEÑO Y EXPERIENCIA

### Estética: "Tech Premium meets Real Estate"
- **Dark mode** como base (modo claro disponible)
- **Glassmorphism** con blur effects
- **Gradientes sutiles** en tonos de la marca ZHOMES
- **Animaciones fluidas** en transiciones y micro-interacciones
- **Cards con hover effects** y profundidad (sombras dinámicas)
- **Tipografía moderna**: Inter o Outfit desde Google Fonts
- **Paleta de colores**:
  - Primary: Deep navy (#0F1729) con acentos dorados (#F5A623)
  - Cards: Glassmorphic con rgba(255,255,255,0.05)
  - Status colors: Emerald/Amber/Rose para estados
  - Gradientes: Navy → Slate blue

### Responsive Design
- **Desktop**: Dashboard completo con sidebar navigation
- **Tablet**: Layout adaptado 
- **Mobile**: Bottom navigation, PWA installable

### Micro-animaciones
- Cards que flotan al hover
- Counters que animan al cargar
- Pipeline drag & drop con física suave
- Notifications que desligan desde arriba
- Progress bars animados en checklists
- Skeleton loading screens

---

## 🛠️ STACK TECNOLÓGICO

| Componente | Tecnología |
|-----------|------------|
| Frontend | React (Vite) |
| Estilos | Vanilla CSS con variables custom |
| Backend | Supabase (ya lo conoces) |
| Auth | Supabase Auth |
| Base de datos | Supabase PostgreSQL |
| Storage | Supabase Storage (para documentos) |
| Real-time | Supabase Realtime (para chat y notificaciones) |
| Edge Functions | Supabase Edge Functions (para emails/WhatsApp) |
| PWA | Service Workers + Web App Manifest |
| Notificaciones | Twilio (WhatsApp), Resend (Email) |

---

## 🗃️ MODELO DE DATOS (Simplificado)

```
users
  ├── id, email, name, phone, role (broker/realtor), avatar
  ├── license_number, commission_split_percentage
  └── created_at, updated_at

transactions
  ├── id, property_address, property_photo
  ├── listing_price, sale_price, status (pipeline stage)
  ├── realtor_id (FK), broker_notes
  ├── commission_total, commission_broker, commission_realtor
  ├── payment_status (pending/approved/paid)
  └── created_at, closed_at

documents
  ├── id, transaction_id (FK), uploaded_by (FK)
  ├── document_type (enum), file_url, file_name
  ├── status (pending/reviewed/approved/rejected)
  └── uploaded_at, reviewed_at

messages
  ├── id, transaction_id (FK, nullable), sender_id (FK)
  ├── content, type (direct/channel/announcement)
  ├── recipient_id (FK, nullable)
  └── created_at, read_at

notifications
  ├── id, user_id (FK), type, title, body
  ├── related_transaction_id, related_document_id
  ├── is_read, delivery_channel (in_app/email/whatsapp)
  └── created_at

activity_log
  ├── id, transaction_id (FK), user_id (FK)
  ├── action_type, description
  └── created_at
```

---

## 📅 FASES DE DESARROLLO

### FASE 1: Foundation (Lo que podemos hacer AHORA)
1. ✅ Setup proyecto (Vite + React + Supabase)
2. ✅ Sistema de autenticación (Broker vs Realtor roles)
3. ✅ Dashboard del Broker con KPIs
4. ✅ Transaction pipeline (Kanban)
5. ✅ Document upload por transacción
6. ✅ Commission tracker básico

### FASE 2: Communication
7. Chat interno (mensajes directos + canales por transacción)
8. Notificaciones in-app
9. Email notifications (Supabase Edge Functions)

### FASE 3: Advanced
10. WhatsApp integration
11. Analytics y reportes
12. PWA + push notifications
13. Team leaderboard

---

## 💡 LO QUE LO HACE ÚNICO

1. **Diseñado para brokers latinos** — Bilingüe, culturalmente relevante
2. **Pipeline visual** — Ninguna herramienta de brokerage tiene un Kanban tan intuitivo
3. **Document compliance tracking** — El broker ve al instante quién le debe docs
4. **Commission workflow** — Docs → Revisión → Aprobación → Pago, todo trazable
5. **Mobile-first PWA** — No necesita app store, se instala desde el browser
6. **Real-time** — Todo actualiza al instante, sin refresh
7. **Comunicación EN CONTEXTO** — Chat por transacción, no por persona
8. **Precio** — GRATIS (es su propia herramienta) vs $200-500/mes de competidores
