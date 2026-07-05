# 🏗️ ZHomes — Extensión de Arquitectura del Backend, Esquemas SQL y Sincronizaciones

Este documento complementa el diseño inicial resolviendo las brechas identificadas en el ecosistema técnico de **ZHomes**. Incluye la especificación de tablas transaccionales de soporte, persistencia para la experiencia interactiva de cliente, motor de video, algoritmo de CMA resiliente y triggers para gamificación.

---

## 1. Resolución de Tablas Incoherentes y Firmas (SQL)

El siguiente script crea las tablas auxiliares de auditoría y chat en Supabase requeridas por el workflow transaccional y detalla el almacenamiento en Storage.

```sql
-- =========================================================================
-- 1. TABLAS COMPLEMENTARIAS DE LA TRANSACCIÓN (DEAL ROOM)
-- =========================================================================

-- Tabla de documentos del checklist de cumplimiento
CREATE TABLE public.tc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_url TEXT, -- URL de acceso al PDF en Supabase Storage
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'reviewing', 'signed', 'approved', 'rejected')),
    docuseal_envelope_id VARCHAR(100), -- ID único de firma en DocuSeal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de bitácora y auditoría de eventos de transacción
CREATE TABLE public.tc_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- ej. 'document_signed', 'deadline_approaching'
    description TEXT NOT NULL,
    raw_payload JSONB, -- Datos completos de auditoría del webhook
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de mensajes y notificaciones de chat de la transacción
CREATE TABLE public.tc_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL si es notificación de sistema
    message_text TEXT NOT NULL,
    is_system_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.tc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_messages ENABLE ROW LEVEL SECURITY;

-- ----------------- Políticas RLS -----------------
-- tc_documents
CREATE POLICY "TC_Docs: Broker acceso total" ON public.tc_documents FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "TC_Docs: Realtor acceso total a su deal" ON public.tc_documents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.realtor_id = auth.uid())
);
CREATE POLICY "TC_Docs: Clientes ven sus propios documentos" ON public.tc_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.client_id = auth.uid())
);

-- tc_events
CREATE POLICY "TC_Events: Lectura del staff" ON public.tc_events FOR SELECT USING (public.get_auth_role() IN ('realtor', 'broker'));

-- tc_messages
CREATE POLICY "TC_Messages: Clientes leen y escriben en su chat" ON public.tc_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.client_id = auth.uid())
);
CREATE POLICY "TC_Messages: Realtors leen y escriben en sus chats" ON public.tc_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.realtor_id = auth.uid())
);
```

### Asociación de Almacenamiento en Supabase Storage
Para registrar el bucket de almacenamiento de documentos firmados:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('transaction-documents', 'transaction-documents', false, 15728640, ARRAY['application/pdf']);
```
*   **Flujo de Asociación:**
    1.  Cuando DocuSeal notifica la firma de un contrato, el webhook descarga el PDF firmado.
    2.  Se sube a Supabase Storage con la ruta estructurada: `transaction-documents/{transaction_id}/{document_id}.pdf`.
    3.  Se genera una URL firmada de lectura temporal (para cumplir regulaciones de privacidad) y se actualiza el registro en `tc_documents` apuntando `document_url` a dicho endpoint, cambiando el `status` a `'signed'`.

---

## 2. Persistencia para el "Tinder Mode" (SQL)

La tabla de deslizamientos evita duplicar propiedades mostradas al cliente y permite al agente mapear los gustos de su cliente.

```sql
CREATE TABLE public.user_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    interaction_type VARCHAR(10) NOT NULL CHECK (interaction_type IN ('like', 'nope')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Clave compuesta única implícita mediante restricción única
    UNIQUE (client_id, property_id)
);

ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;

-- ----------------- Políticas RLS -----------------
CREATE POLICY "Swipes: Clientes gestionan sus deslizamientos"
    ON public.user_swipes FOR ALL
    USING (client_id = auth.uid());

CREATE POLICY "Swipes: Realtors leen deslizamientos de sus clientes"
    ON public.user_swipes FOR SELECT
    USING (
        public.get_auth_role() = 'realtor' AND (
            EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = public.user_swipes.client_id AND l.realtor_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.transactions t WHERE t.client_id = public.user_swipes.client_id AND t.realtor_id = auth.uid())
        )
    );

CREATE POLICY "Swipes: Broker lectura global"
    ON public.user_swipes FOR SELECT
    USING (public.get_auth_role() = 'broker');
```

---

## 3. Soporte Multimedia para el "TikTok Mode" (SQL)

El feed tipo TikTok requiere almacenar múltiples tipos de multimedia indexados por orden de visualización.

```sql
CREATE TABLE public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('video', 'image')),
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX property_media_order_idx ON public.property_media (property_id, display_order ASC);
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media: Lectura pública" ON public.property_media FOR SELECT USING (true);
CREATE POLICY "Media: Broker modifica" ON public.property_media FOR ALL USING (public.get_auth_role() = 'broker');

-- =========================================================================
-- VISTA OPTIMIZADA PARA EL FEED VERTICAL (TIKTOK VIBE FEED)
-- =========================================================================
CREATE OR REPLACE VIEW public.vibe_feed_view AS
SELECT 
    p.id as property_id,
    p.address,
    p.price,
    p.beds,
    p.baths,
    p.gla,
    p.status,
    -- Primer video indexado
    (
        SELECT vm.url 
        FROM public.property_media vm 
        WHERE vm.property_id = p.id AND vm.media_type = 'video' 
        ORDER BY vm.display_order ASC 
        LIMIT 1
    ) as video_url,
    -- Array JSON de URLs de imágenes ordenadas
    COALESCE(
        (
            SELECT json_agg(im.url ORDER BY im.display_order ASC) 
            FROM public.property_media im 
            WHERE im.property_id = p.id AND im.media_type = 'image'
        ),
        '[]'::json
    ) as image_urls
FROM public.properties p
WHERE p.status = 'active'
  -- Filtramos para el feed solo propiedades que contengan video promocional
  AND EXISTS (
      SELECT 1 FROM public.property_media m 
      WHERE m.property_id = p.id AND m.media_type = 'video'
  );
```

---

## 4. Algoritmo CMA Pro con Mecanismo de Fallback (SQL)

La siguiente versión mejorada del CMA implementa una estructura de ejecución por cascada (Tier 1 ➔ Tier 2 ➔ ZIP Fallback con penalización) para asegurar que el tasador inteligente siempre devuelva un valor de mercado realista.

```sql
CREATE OR REPLACE FUNCTION public.calculate_cma_pro_v2(
    target_property_id UUID,
    target_max_distance_miles DOUBLE PRECISION DEFAULT 1.0,
    target_gla_variance_percent DOUBLE PRECISION DEFAULT 15.0
)
RETURNS TABLE (
    suggested_price NUMERIC(12, 2),
    min_range NUMERIC(12, 2),
    max_range NUMERIC(12, 2),
    comparables_count INTEGER,
    average_price_per_sqft NUMERIC(8, 2),
    cma_tier VARCHAR(30),
    uncertainty_penalty_applied BOOLEAN
) SECURITY DEFINER AS $$
DECLARE
    target_geom GEOMETRY;
    target_gla INTEGER;
    target_beds INTEGER;
    target_baths NUMERIC(3,1);
    target_garage INTEGER;
    target_year INTEGER;
    target_price NUMERIC(12, 2);
    target_zip VARCHAR(20);
    
    -- Variables para el control de la cascada
    comps_found INTEGER := 0;
    
    -- Constantes de Ajuste
    ADJ_SQFT_VAL NUMERIC := 75.00;
    ADJ_BED_VAL NUMERIC := 7500.00;
    ADJ_BATH_VAL NUMERIC := 5000.00;
    ADJ_GARAGE_VAL NUMERIC := 12000.00;
    ADJ_YEAR_STEP_VAL NUMERIC := 300.00;
BEGIN
    -- Obtener atributos del sujeto a valuar
    SELECT location, gla, beds, baths, garage, year_built, price, 
           -- Extraemos el código postal formateando la dirección si es necesario, asumimos columna o helper
           COALESCE(SUBSTRING(address FROM '\y\d{5}\y'), '40201')
    INTO target_geom, target_gla, target_beds, target_baths, target_garage, target_year, target_price, target_zip
    FROM public.properties
    WHERE id = target_property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Propiedad sujeto no encontrada.';
    END IF;

    -- =========================================================================
    -- PASO 1: CRITERIO ESTRICTO (TIER 1)
    -- =========================================================================
    CREATE TEMP TABLE temp_comps ON COMMIT DROP AS
    SELECT 
        p.id, p.price as sold_price, p.gla, p.beds, p.baths, p.garage, p.year_built,
        (p.price 
            + ((target_gla - p.gla) * ADJ_SQFT_VAL)
            + ((target_beds - COALESCE(p.beds, 0)) * ADJ_BED_VAL)
            + ((target_baths - COALESCE(p.baths, 0)) * ADJ_BATH_VAL)
            + ((target_garage - COALESCE(p.garage, 0)) * ADJ_GARAGE_VAL)
            + ((target_year - COALESCE(p.year_built, target_year)) * ADJ_YEAR_STEP_VAL)
        ) as adjusted_price
    FROM public.properties p
    WHERE 
        p.id <> target_property_id
        AND p.status = 'sold'
        AND ST_DWithin(p.location::geography, target_geom::geography, target_max_distance_miles * 1609.34)
        AND p.sold_date >= (CURRENT_DATE - INTERVAL '6 months')
        AND p.gla BETWEEN (target_gla * (1 - target_gla_variance_percent / 100)) 
                      AND (target_gla * (1 + target_gla_variance_percent / 100));

    SELECT COUNT(*)::INTEGER INTO comps_found FROM temp_comps;

    IF comps_found >= 3 THEN
        RETURN QUERY
        SELECT 
            ROUND(AVG(adjusted_price), 2)::NUMERIC(12,2) as suggested_price,
            ROUND(AVG(adjusted_price) * 0.95, 2)::NUMERIC(12,2) as min_range,
            ROUND(AVG(adjusted_price) * 1.05, 2)::NUMERIC(12,2) as max_range,
            comps_found as comparables_count,
            ROUND(AVG(sold_price / gla), 2)::NUMERIC(8,2) as average_price_per_sqft,
            'Tier_1_Strict'::VARCHAR(30) as cma_tier,
            false as uncertainty_penalty_applied
        FROM temp_comps;
        
        DROP TABLE temp_comps;
        RETURN;
    END IF;

    -- Limpiamos tabla temporal estricta
    DROP TABLE temp_comps;

    -- =========================================================================
    -- PASO 2: CRITERIO EXPANDIDO (TIER 2)
    -- =========================================================================
    CREATE TEMP TABLE temp_comps_t2 ON COMMIT DROP AS
    SELECT 
        p.id, p.price as sold_price, p.gla, p.beds, p.baths, p.garage, p.year_built,
        (p.price 
            + ((target_gla - p.gla) * ADJ_SQFT_VAL)
            + ((target_beds - COALESCE(p.beds, 0)) * ADJ_BED_VAL)
            + ((target_baths - COALESCE(p.baths, 0)) * ADJ_BATH_VAL)
            + ((target_garage - COALESCE(p.garage, 0)) * ADJ_GARAGE_VAL)
            + ((target_year - COALESCE(p.year_built, target_year)) * ADJ_YEAR_STEP_VAL)
        ) as adjusted_price
    FROM public.properties p
    WHERE 
        p.id <> target_property_id
        AND p.status = 'sold'
        -- Radio expandido a 3 millas (4828.02 metros)
        AND ST_DWithin(p.location::geography, target_geom::geography, 4828.02)
        -- Tiempo expandido a 12 meses
        AND p.sold_date >= (CURRENT_DATE - INTERVAL '12 months')
        -- Varianza GLA al 30%
        AND p.gla BETWEEN (target_gla * 0.70) AND (target_gla * 1.30);

    SELECT COUNT(*)::INTEGER INTO comps_found FROM temp_comps_t2;

    IF comps_found >= 3 THEN
        RETURN QUERY
        SELECT 
            ROUND(AVG(adjusted_price), 2)::NUMERIC(12,2) as suggested_price,
            ROUND(AVG(adjusted_price) * 0.95, 2)::NUMERIC(12,2) as min_range,
            ROUND(AVG(adjusted_price) * 1.05, 2)::NUMERIC(12,2) as max_range,
            comps_found as comparables_count,
            ROUND(AVG(sold_price / gla), 2)::NUMERIC(8,2) as average_price_per_sqft,
            'Tier_2_Expanded'::VARCHAR(30) as cma_tier,
            false as uncertainty_penalty_applied
        FROM temp_comps_t2;

        DROP TABLE temp_comps_t2;
        RETURN;
    END IF;

    DROP TABLE temp_comps_t2;

    -- =========================================================================
    -- PASO 3: FALLBACK POR CÓDIGO POSTAL Y PENALIZACIÓN DE INCERTIDUMBRE
    -- =========================================================================
    RETURN QUERY
    WITH zip_stats AS (
        SELECT 
            COUNT(*)::INTEGER as zip_count,
            AVG(p.price / p.gla) as avg_sqft_price
        FROM public.properties p
        WHERE 
            p.id <> target_property_id
            AND p.status = 'sold'
            AND p.sold_date >= (CURRENT_DATE - INTERVAL '18 months')
            -- Mismo código postal
            AND SUBSTRING(p.address FROM '\y\d{5}\y') = target_zip
    )
    SELECT 
        -- Valor sugerido basado en precio promedio por sqft del código postal
        ROUND(target_gla * avg_sqft_price, 2)::NUMERIC(12,2) as suggested_price,
        -- Penalización por incertidumbre (rango ampliado al +-15% por falta de comparables directos)
        ROUND((target_gla * avg_sqft_price) * 0.85, 2)::NUMERIC(12,2) as min_range,
        ROUND((target_gla * avg_sqft_price) * 1.15, 2)::NUMERIC(12,2) as max_range,
        zip_count as comparables_count,
        ROUND(avg_sqft_price, 2)::NUMERIC(8,2) as average_price_per_sqft,
        'ZIP_Code_Fallback'::VARCHAR(30) as cma_tier,
        true as uncertainty_penalty_applied
    FROM zip_stats;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Esquema de Gamificación para Realtors (SQL)

La gamificación fomenta el cumplimiento y seguimiento de los agentes comerciales mediante recompensas estructuradas e historial de actividad consecutiva.

```sql
-- Tabla de gamificación de agentes
CREATE TABLE public.realtor_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    realtor_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_points INTEGER DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    last_active_date DATE,
    badges_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.realtor_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gamification: Realtors ven su propio score" ON public.realtor_gamification FOR SELECT USING (realtor_id = auth.uid());
CREATE POLICY "Gamification: Broker lectura total" ON public.realtor_gamification FOR SELECT USING (public.get_auth_role() = 'broker');

-- =========================================================================
-- FUNCIÓN CENTRALIZADA DE REGISTRO DE ACTIVIDAD Y RACHAS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.record_realtor_activity(
    realtor_uuid UUID,
    xp_to_add INTEGER
)
RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    today DATE := CURRENT_DATE;
    record_exists BOOLEAN;
    last_date DATE;
    streak INTEGER;
BEGIN
    -- Comprobar si el registro existe
    SELECT EXISTS(SELECT 1 FROM public.realtor_gamification WHERE realtor_id = realtor_uuid) INTO record_exists;

    IF NOT record_exists THEN
        -- Inicializar registro
        INSERT INTO public.realtor_gamification (realtor_id, xp_points, current_streak, last_active_date)
        VALUES (realtor_uuid, xp_to_add, 1, today);
        RETURN;
    END IF;

    -- Obtener valores actuales
    SELECT last_active_date, current_streak INTO last_date, streak
    FROM public.realtor_gamification
    WHERE realtor_id = realtor_uuid;

    -- Lógica de rachas (días consecutivos)
    IF last_date IS NULL THEN
        streak := 1;
    ELSIF last_date = today - 1 THEN
        -- Actividad consecutiva: suma racha
        streak := streak + 1;
    ELSIF last_date < today - 1 THEN
        -- Se rompió la racha: reinicia a 1
        streak := 1;
    END IF;

    -- Actualizar XP, racha y fecha de actividad
    UPDATE public.realtor_gamification
    SET 
        xp_points = xp_points + xp_to_add,
        current_streak = streak,
        last_active_date = today
    WHERE realtor_id = realtor_uuid;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- TRIGGERS DE CONTROL AUTOMÁTICO DE RECOMPENSAS
-- =========================================================================

-- 1. Trigger al asignar Leads (+50 XP)
CREATE OR REPLACE FUNCTION public.trg_lead_assigned_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.realtor_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.realtor_id IS DISTINCT FROM NEW.realtor_id) THEN
        PERFORM public.record_realtor_activity(NEW.realtor_id, 50);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_lead_assigned_xp
AFTER INSERT OR UPDATE OF realtor_id ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_lead_assigned_xp();

-- 2. Trigger al Cerrar una Transacción (+500 XP)
CREATE OR REPLACE FUNCTION public.trg_transaction_closed_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
        PERFORM public.record_realtor_activity(NEW.realtor_id, 500);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_transaction_closed_xp
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_transaction_closed_xp();
```

---

## 6. Refinamientos de Sincronización MLS (Diseño Lógico)

La infraestructura de importación e inactividad en la PWA se rige por las siguientes especificaciones:

### A. Sincronización OData Incremental
Para evitar consumir ancho de banda descargando 15,000 propiedades de Kentucky diariamente, la sincronización en N8N se re-estructura utilizando filtros temporales del estándar **RESO (Real Estate Standards Organization)**:

1.  **Cursor en la Base de Datos:** Guardamos el último timestamp de sincronización exitosa (`last_successful_sync`) en una tabla de metadatos del sistema.
2.  **Filtro Incremental OData:** Al ejecutar el trigger diario, consultamos el cursor y construimos la consulta HTTP a Spark MLS inyectando el filtro de fecha de modificación:
    `GET /Version/3/Reso/OData/Property?$filter=ModificationTimestamp gt 2026-07-04T00:00:00Z`
3.  **Procesamiento:** La API solo retornará propiedades creadas, modificadas o cerradas en las últimas 24 horas (usualmente de 50 a 200 propiedades).
4.  **Actualización del Cursor:** Al terminar de procesar con éxito, el workflow actualiza `last_successful_sync` con la fecha de la consulta actual.

### B. Gestión de Soft-Deletes y Alertas a Favoritos
Cuando el feed de Spark MLS indica que una propiedad ha sido retirada del mercado (soft-delete):

1.  **Cambio de Estado:** La propiedad se marca con `status = 'inactive'` en la tabla `properties`.
2.  **Identificación de Clientes:** Un proceso automático corre para buscar clientes que tenían dicha propiedad guardada en favoritos:
    ```sql
    SELECT client_id, p.address 
    FROM public.user_swipes us
    JOIN public.properties p ON p.id = us.property_id
    WHERE us.property_id = 'ID_PROPIEDAD_INACTIVADA' 
      AND us.interaction_type = 'like';
    ```
3.  **Acción In-App / Notificación Push:** Por cada registro encontrado, el sistema inserta un mensaje de alerta en la base de datos de notificaciones (`push_tokens` / chat) y envía un correo vía Resend con el siguiente mensaje estructurado:
    > *"¡Hola! Queremos informarte que la propiedad ubicada en **{{address}}** que habías guardado en tus favoritos en ZHomes ya no está disponible en el mercado. ¡Pero no te preocupes! Tenemos nuevas opciones similares esperando por ti en tu feed."*
