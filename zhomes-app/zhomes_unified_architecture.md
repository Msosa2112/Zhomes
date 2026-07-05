# 🏗️ Especificación Técnica y Arquitectura Unificada — ZHomes
### Base de Datos, Algoritmos de Valuación, Frontend Móvil y Pipelines de IA

Este documento describe la especificación técnica unificada del backend, la base de datos de Supabase, los componentes de interfaz móvil reactivos y la integración del pipeline de auditoría automática con OpenAI para la plataforma inmobiliaria **ZHomes**. 

*Nota: Se han omitido de forma estricta todos los módulos y lógicas relacionados con la gamificación de agentes (XP, rachas o medallas).*

---

## 1. Configuración de Base de Datos, Almacenamiento y RLS (SQL)

El siguiente script en PostgreSQL inicializa todas las extensiones, tablas, enums, índices espaciales, políticas RLS y disparadores de eliminación de archivos físicos.

```sql
-- ============================================================================
-- 0. INSTALAR EXTENSIONES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- 1. ENUMS Y TIPOS
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'realtor', 'broker');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        CREATE TYPE property_status AS ENUM ('active', 'inactive', 'pending', 'sold');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('listed', 'under_contract', 'inspection', 'pre_close', 'closed');
    END IF;
END$$;

-- ============================================================================
-- 2. TABLAS CORE
-- ============================================================================

-- Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Propiedades (PostGIS)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mls_id VARCHAR(100) UNIQUE,
    address TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    beds INTEGER,
    baths NUMERIC(3, 1),
    gla INTEGER NOT NULL, -- Gross Living Area (sq ft)
    status property_status NOT NULL DEFAULT 'active',
    sold_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS properties_location_gist ON public.properties USING gist(location);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);

-- Tabla de Multimedia de Propiedades (TikTok Mode)
CREATE TABLE IF NOT EXISTS public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('video', 'image')),
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS property_media_order_idx ON public.property_media (property_id, display_order ASC);

-- Tabla de Deslizamientos (Tinder Mode)
CREATE TABLE IF NOT EXISTS public.user_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    interaction_type VARCHAR(10) NOT NULL CHECK (interaction_type IN ('like', 'nope')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (client_id, property_id)
);

-- Tabla de Transacciones (Deal Room)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    realtor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    status transaction_status NOT NULL DEFAULT 'listed',
    contingencies_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Documentos
CREATE TABLE IF NOT EXISTS public.tc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'approved', 'reviewing')),
    docuseal_envelope_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Eventos de Auditoría
CREATE TABLE IF NOT EXISTS public.tc_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Mensajes (Chat Room)
CREATE TABLE IF NOT EXISTS public.tc_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    is_system_notification BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    realtor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 3. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER para evitar recursividad en lectura de Roles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql;

-- POLÍTICAS: PROFILES
CREATE POLICY "Broker: Acceso Global" ON public.profiles FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Acceso propio" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Client: Modificar propio" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Realtor: Ver clientes asignados" ON public.profiles FOR SELECT USING (
    public.get_auth_role() = 'realtor' AND (
        EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = public.profiles.id AND l.realtor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.transactions t WHERE t.client_id = public.profiles.id AND t.realtor_id = auth.uid())
    )
);

-- POLÍTICAS: PROPERTIES & MEDIA (Lectura Pública)
CREATE POLICY "Properties: Lectura Pública" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Properties: Escritura Broker" ON public.properties FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Media: Lectura Pública" ON public.property_media FOR SELECT USING (true);
CREATE POLICY "Media: Escritura Broker" ON public.property_media FOR ALL USING (public.get_auth_role() = 'broker');

-- POLÍTICAS: USER_SWIPES
CREATE POLICY "Broker: Swipes lectura global" ON public.user_swipes FOR SELECT USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Gestionar swipes propios" ON public.user_swipes FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Realtor: Ver swipes de clientes asignados" ON public.user_swipes FOR SELECT USING (
    public.get_auth_role() = 'realtor' AND (
        EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = public.user_swipes.client_id AND l.realtor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.transactions t WHERE t.client_id = public.user_swipes.client_id AND t.realtor_id = auth.uid())
    )
);

-- POLÍTICAS: TRANSACTIONS
CREATE POLICY "Broker: Transacciones acceso global" ON public.transactions FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Ver transacciones propias" ON public.transactions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Realtor: Gestionar transacciones asignadas" ON public.transactions FOR ALL USING (
    public.get_auth_role() = 'realtor' AND realtor_id = auth.uid()
);

-- POLÍTICAS: TC_DOCUMENTS
CREATE POLICY "Broker: Documentos acceso global" ON public.tc_documents FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Ver documentos propios" ON public.tc_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.client_id = auth.uid())
);
CREATE POLICY "Realtor: Gestionar documentos de transacciones asignadas" ON public.tc_documents FOR ALL USING (
    public.get_auth_role() = 'realtor' AND EXISTS (
        SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.realtor_id = auth.uid()
    )
);

-- POLÍTICAS: TC_EVENTS
CREATE POLICY "Broker: Eventos acceso global" ON public.tc_events FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Staff: Lectura de logs de transacciones" ON public.tc_events FOR SELECT USING (
    public.get_auth_role() = 'realtor' AND EXISTS (
        SELECT 1 FROM public.transactions t WHERE t.id = public.tc_events.transaction_id AND t.realtor_id = auth.uid()
    )
);

-- POLÍTICAS: TC_MESSAGES
CREATE POLICY "Broker: Mensajes acceso global" ON public.tc_messages FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Chat en sus transacciones" ON public.tc_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.client_id = auth.uid())
);
CREATE POLICY "Realtor: Chat en transacciones asignadas" ON public.tc_messages FOR ALL USING (
    public.get_auth_role() = 'realtor' AND EXISTS (
        SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.realtor_id = auth.uid()
    )
);

-- POLÍTICAS: LEADS
CREATE POLICY "Broker: Leads acceso global" ON public.leads FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Client: Ver leads propios" ON public.leads FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Realtor: Gestionar leads asignados" ON public.leads FOR ALL USING (
    public.get_auth_role() = 'realtor' AND realtor_id = auth.uid()
);

-- ============================================================================
-- 4. TRIGGER: LIMPIEZA AUTOMÁTICA DE ARCHIVOS EN SUPABASE STORAGE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_physical_storage_file()
RETURNS TRIGGER AS $$
DECLARE
    file_path TEXT;
BEGIN
    IF OLD.document_url IS NOT NULL THEN
        -- El path relativo al bucket está después de 'transaction-documents/'
        file_path := substring(OLD.document_url from 'transaction-documents/(.*)');
        
        IF file_path IS NOT NULL THEN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'transaction-documents' 
              AND name = file_path;
        END IF;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_delete_document_physical_file
AFTER DELETE ON public.tc_documents
FOR EACH ROW EXECUTE FUNCTION public.delete_physical_storage_file();
```

---

## 2. Motor de Valuación "CMA Pro" con Fallback en Cascada

Esta función evalúa científicamente el valor sugerido ajustando diferencias físicas y geográficas con PostGIS y una cascada de fallback (Tier 1 ➔ Tier 2 ➔ ZIP Fallback).

```sql
CREATE OR REPLACE FUNCTION public.calculate_cma_pro_v2(
    target_property_id UUID,
    target_max_distance_miles DOUBLE PRECISION DEFAULT 1.0,
    target_gla_variance_percent DOUBLE PRECISION DEFAULT 20.0
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
    target_zip VARCHAR(20);
    
    comps_found INTEGER := 0;
    
    -- Valores monetarios asignados a ajustes físicos
    ADJ_SQFT_VAL NUMERIC := 80.00;   -- Valor por pie cuadrado de diferencia
    ADJ_BED_VAL NUMERIC := 8000.00;  -- Ajuste por habitación faltante/sobrante
    ADJ_BATH_VAL NUMERIC := 6000.00; -- Ajuste por baño completo de diferencia
BEGIN
    -- 1. Obtener los atributos físicos de la propiedad sujeto
    SELECT location, gla, beds, baths, 
           COALESCE(SUBSTRING(address FROM '\y\d{5}\y'), '40204')
    INTO target_geom, target_gla, target_beds, target_baths, target_zip
    FROM public.properties
    WHERE id = target_property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Propiedad sujeto no encontrada.';
    END IF;

    -- TIER 1: BÚSQUEDA ESTRICTA (1 milla, 6 meses, ±20% GLA)
    CREATE TEMP TABLE temp_comps ON COMMIT DROP AS
    SELECT 
        p.id, p.price as sold_price, p.gla, p.beds, p.baths,
        (p.price 
            + ((target_gla - p.gla) * ADJ_SQFT_VAL)
            + ((target_beds - COALESCE(p.beds, 0)) * ADJ_BED_VAL)
            + ((target_baths - COALESCE(p.baths, 0)) * ADJ_BATH_VAL)
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

    DROP TABLE temp_comps;

    -- TIER 2: BÚSQUEDA MODERADA (3 millas, 12 meses, ±30% GLA)
    CREATE TEMP TABLE temp_comps_t2 ON COMMIT DROP AS
    SELECT 
        p.id, p.price as sold_price, p.gla, p.beds, p.baths,
        (p.price 
            + ((target_gla - p.gla) * ADJ_SQFT_VAL)
            + ((target_beds - COALESCE(p.beds, 0)) * ADJ_BED_VAL)
            + ((target_baths - COALESCE(p.baths, 0)) * ADJ_BATH_VAL)
        ) as adjusted_price
    FROM public.properties p
    WHERE 
        p.id <> target_property_id
        AND p.status = 'sold'
        AND ST_DWithin(p.location::geography, target_geom::geography, 4828.02)
        AND p.sold_date >= (CURRENT_DATE - INTERVAL '12 months')
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

    -- TIER 3: FALLBACK POR CÓDIGO POSTAL (Con penalización del 15% por incertidumbre)
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
            AND SUBSTRING(p.address FROM '\y\d{5}\y') = target_zip
    )
    SELECT 
        ROUND(target_gla * avg_sqft_price, 2)::NUMERIC(12,2) as suggested_price,
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

## 3. Componentes React para Rendimiento Móvil

### A. Swipe de Propiedades (`ZHomesMatchCard.tsx`)
Implementa `LazyMotion` para animar fluidamente el gesto de Tinder Swipe sin sobrecargar el bundle principal de JavaScript.

```tsx
import React from 'react';
import { LazyMotion, domAnimation, m, useMotionValue, useTransform } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const cardVariants = cva(
  "relative w-full max-w-sm aspect-[3/4] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl select-none touch-none transition-shadow duration-300",
  {
    variants: {
      intent: {
        default: "shadow-slate-950/40",
        highlighted: "border-amber-500/50 shadow-amber-950/20",
      }
    },
    defaultVariants: {
      intent: "default",
    }
  }
);

export interface ZHomesMatchCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  imageUrl: string;
  hasPromoBadge?: boolean;
}

export const ZHomesMatchCard: React.FC<ZHomesMatchCardProps> = ({
  className,
  intent,
  asChild = false,
  onSwipeLeft,
  onSwipeRight,
  imageUrl,
  hasPromoBadge = false,
  children,
  ...props
}) => {
  const Component = asChild ? Slot : "div";
  
  // Motion values para el drag físico
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Rotación y opacidad ligadas a la distancia x recorrida
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_event: any, info: any) => {
    const swipeThreshold = 120;
    if (info.offset.x < -swipeThreshold) {
      onSwipeLeft?.();
    } else if (info.offset.x > swipeThreshold) {
      onSwipeRight?.();
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        style={{ x, y, rotate, opacity }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        className={cn(cardVariants({ intent }), className)}
        data-state={hasPromoBadge ? "promo-featured" : "standard"}
      >
        <Component {...props}>
          <div className="absolute inset-0 z-0">
            <img 
              src={imageUrl} 
              alt="Louisville Property View" 
              className="w-full h-full object-cover pointer-events-none" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          </div>
          
          {/* El selector css :has() en Tailwind maneja el padding si existe el badge de promo */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6 flex flex-col gap-2 [&:has(.promo-badge)]:pb-8">
            {hasPromoBadge && (
              <span className="promo-badge self-start px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-slate-950 uppercase tracking-wider">
                Vibe Featured
              </span>
            )}
            {children}
          </div>
        </Component>
      </m.div>
    </LazyMotion>
  );
};
```

---

### B. Vibe Feed Virtualizado (`VibeFeed.tsx` - TikTok Mode)
Renderizado de videos de propiedades a 60 FPS estables virtualizando los reproductores para mitigar el consumo de memoria del navegador en dispositivos móviles.

```tsx
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface PropertyVideo {
  id: string;
  url: string;
  address: string;
  price: number;
}

interface VibeFeedProps {
  videos: PropertyVideo[];
}

export const VibeFeed: React.FC<VibeFeedProps> = ({ videos }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Inicializar virtualizador de altura completa (Viewport Height)
  const rowVirtualizer = useVirtualizer({
    count: videos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 1, // Renderiza exactamente: el actual, el anterior y el siguiente
  });

  return (
    <div
      ref={parentRef}
      className="w-full h-screen overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-none"
      style={{ contentVisibility: 'auto' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const video = videos[virtualRow.index];
          // Validar si es el elemento actualmente visible (o en overscan inmediato)
          const isCurrentlyRendering = virtualRow.index >= rowVirtualizer.getVirtualItems()[0].index;

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full h-full snap-start flex items-center justify-center"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isCurrentlyRendering ? (
                <div className="relative w-full h-full flex flex-col justify-end">
                  <video
                    src={video.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                    autoPlay={virtualRow.index === rowVirtualizer.getVirtualItems()[0].index}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70 pointer-events-none" />
                  
                  {/* Superposición de Datos de Propiedad */}
                  <div className="relative z-10 p-8 text-white flex flex-col gap-1">
                    <h3 className="text-2xl font-bold font-display">${video.price.toLocaleString()}</h3>
                    <p className="text-sm text-slate-200">{video.address}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                  <span className="text-xs text-slate-800">Cargando video...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## 4. Supabase Edge Function para Auditoría de IA Nativa

Esta función (`docuseal-webhook`) corre en Deno dentro del perímetro de Supabase, validando firmas SHA256 HMAC de DocuSeal y usando Structured Outputs con OpenAI:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import OpenAI from "https://esm.sh/openai@4.28.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-docuseal-signature',
}

// Validación de firma criptográfica HMAC SHA-256 de DocuSeal
async function verifyDocuSealSignature(
  bodyText: string, 
  headerSignature: string, 
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  // Transformar la firma hexadecimal en Uint8Array
  const cleanSig = headerSignature.trim();
  const signatureBytes = new Uint8Array(
    cleanSig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const data = encoder.encode(bodyText);
  return await crypto.subtle.verify("HMAC", key, signatureBytes, data);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
    const DOCUSEAL_WEBHOOK_SECRET = Deno.env.get('DOCUSEAL_WEBHOOK_SECRET')!;

    const bodyText = await req.text();
    const signature = req.headers.get('x-docuseal-signature');

    // 1. Verificación criptográfica estricta de DocuSeal
    if (!signature || !(await verifyDocuSealSignature(bodyText, signature, DOCUSEAL_WEBHOOK_SECRET))) {
      return new Response(JSON.stringify({ error: 'Criptografía no válida. Firma ausente o alterada.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const payload = JSON.parse(bodyText);
    if (payload.event !== 'envelope.completed') {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const envelopeData = payload.data;
    const documentName = envelopeData.name;
    const downloadUrl = envelopeData.documents[0].download_url;
    const envelopeId = envelopeData.id.toString();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // 2. Localizar transacción por correo del comprador
    const buyerEmail = envelopeData.submitters.find((s: any) => s.role === 'buyer')?.email;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', buyerEmail)
      .single();

    if (!profile) throw new Error(`No profile found for email ${buyerEmail}`);

    const { data: transaction } = await supabase
      .from('transactions')
      .select('id')
      .eq('client_id', profile.id)
      .eq('status', 'under_contract')
      .limit(1)
      .single();

    if (!transaction) throw new Error(`No active deal room transaction found for client.`);

    // 3. Descarga del binario a memoria
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) throw new Error('Error al descargar documento de DocuSeal.');
    const pdfBlob = await fileResponse.blob();

    // 4. Subida a Supabase Storage
    const storagePath = `deals/${transaction.id}/${envelopeId}_signed.pdf`;
    const { error: storageError } = await supabase.storage
      .from('transaction-documents')
      .upload(storagePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

    if (storageError) throw storageError;

    const documentUrl = `${SUPABASE_URL}/storage/v1/object/sign/transaction-documents/${storagePath}`;

    // 5. Preparar binario en Base64 para OpenAI
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const pdfBase64 = btoa(binary);

    // 6. Ejecución de análisis en OpenAI con Structured Outputs (Timeout local de 60s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let chatCompletion;
    try {
      chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an ultra-strict Real Estate Legal Auditor. Analyze the contract text and return exact fields. 
Strictly forbid hallucination. If a value is missing, return null or "not_found".`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Perform a full compliance audit on this Purchase Agreement PDF." },
              {
                type: "input_file",
                file_data: { data: pdfBase64, mime_type: "application/pdf" }
              }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "contract_audit_schema",
            strict: true,
            schema: {
              type: "object",
              properties: {
                document_type: { type: "string", enum: ["Purchase Agreement", "HUD-1", "Addendum", "Disclosure", "Other"] },
                signatures_validated: { type: "boolean" },
                missing_signatures: { type: "array", items: { type: "string" } },
                contingencies_found: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      contingency_type: { type: "string", enum: ["inspection", "financing", "appraisal", "home_sale", "other"] },
                      deadline_date: { type: ["string", "null"] },
                      clause_summary: { type: "string" }
                    },
                    required: ["contingency_type", "deadline_date", "clause_summary"],
                    additionalProperties: false
                  }
                },
                audit_pass: { type: "boolean" },
                audit_anomalies: { type: "array", items: { type: "string" } },
                summary_es: { type: "string" }
              },
              required: ["document_type", "signatures_validated", "missing_signatures", "contingencies_found", "audit_pass", "audit_anomalies", "summary_es"],
              additionalProperties: false
            }
          }
        }
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    const audit = JSON.parse(chatCompletion.choices[0].message.content!);
    const status = audit.audit_pass ? 'approved' : 'reviewing';

    // 7. Actualización transaccional y notificaciones Realtime
    const { data: doc } = await supabase
      .from('tc_documents')
      .insert({
        transaction_id: transaction.id,
        name: documentName,
        document_url: documentUrl,
        status: status,
        docuseal_envelope_id: envelopeId
      })
      .select('id')
      .single();

    // Auditoría
    await supabase.from('tc_events').insert({
      transaction_id: transaction.id,
      event_type: audit.audit_pass ? 'audit_success' : 'audit_failed',
      description: `Auditoría completada. Estado: ${status}.`,
      raw_payload: audit
    });

    // Chat Feed
    await supabase.from('tc_messages').insert({
      transaction_id: transaction.id,
      sender_id: null,
      message_text: `Sistema ZHomes: ${audit.summary_es}`,
      is_system_notification: true
    });

    // Envío en Tiempo Real mediante Supabase Realtime si requiere revisión del Broker
    if (!audit.audit_pass) {
      await supabase.channel('tc_events').send({
        type: 'broadcast',
        event: 'alert_broker',
        payload: {
          transaction_id: transaction.id,
          message: `El documento '${documentName}' requiere atención manual inmediata.`,
          anomalies: audit.audit_anomalies
        }
      });
    }

    return new Response(JSON.stringify({ status: 'processed', doc_id: doc?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
```

---

## 5. Especificación de Sincronización MLS Incremental (N8N)

El motor de sincronización de listados Spark MLS de Louisville se ejecuta de manera automatizada en una instancia de N8N con base en el estándar RESO Web API (OData):

### A. Extracción Incremental mediante OData y Cursores
1.  **Obtención del Cursor:** N8N realiza una consulta rápida a Postgres para obtener la fecha y hora de la última sincronización correcta (`last_successful_sync`) desde una tabla de parámetros.
2.  **Llamada RESO Web API:** Se envía una petición HTTP `GET` a la API de Spark MLS con los siguientes filtros OData inyectados:
    `$filter=ModificationTimestamp gt {{ $node["Get_Cursor"].json["last_successful_sync"] }} and PropertyType eq 'Residential'`
3.  **Procesamiento y Paginación:** N8N recorre el cursor de paginación de la API de Spark MLS (`@odata.nextLink`) hasta descargar el 100% de las casas creadas o modificadas en las últimas 24 horas.
4.  **Actualización del Cursor:** Al terminar con éxito la sincronización, N8N actualiza `last_successful_sync` con el valor del `ModificationTimestamp` más reciente procesado.

### B. Estrategia de Soft-Delete para Propiedades Retiradas
Para evitar renderizar propiedades inexistentes en la aplicación móvil ("Tinder Mode"):
*   Cuando Spark MLS reporta una propiedad con estado retirado (`'Withdrawn'`), cancelado (`'Cancelled'`) o vendido fuera de la app (`'Closed'`), el nodo de Postgres de N8N realiza un UPDATE de la propiedad objetivo en `public.properties` cambiando su estado a `status = 'inactive'`.
*   Esto remueve automáticamente la propiedad de la vista de feeds de los clientes de manera inmediata.

### C. Alertas Automatizadas de Favoritos inactivos (Resend + Swipes)
Cuando una propiedad cambia a `status = 'inactive'`, se ejecuta el siguiente subflujo de automatización en N8N para notificar a los compradores interesados:

1.  **Identificación de Afectados:** Se ejecuta una consulta SQL para mapear los swipes:
    ```sql
    SELECT s.client_id, p.full_name, p.email, prop.address, prop.price
    FROM public.user_swipes s
    JOIN public.profiles p ON s.client_id = p.id
    JOIN public.properties prop ON s.property_id = prop.id
    WHERE s.property_id = '{{ $node["Property_ID"].json["id"] }}' 
      AND s.interaction_type = 'like';
    ```
2.  **Inyección en Plantilla:** Por cada cliente afectado, N8N genera una plantilla de correo personalizada informando que una propiedad marcada como favorita ha cambiado de estado en el mercado (retirada o vendida).
3.  **Envío vía Resend:** N8N invoca el nodo de **Resend API** con un mensaje transaccional:
    *   *Asunto:* `Alerta ZHomes: Tu casa favorita en {{ $node["SQL"].json["address"] }} ya no está disponible`
    *   *Cuerpo (Español):*
        ```text
        Hola {{ $node["SQL"].json["full_name"] }},
        
        Te informamos que la propiedad ubicada en {{ $node["SQL"].json["address"] }}, la cual tenías guardada en tus favoritos, ha sido retirada o vendida en el Spark MLS de Louisville.
        
        Nuestro equipo de realtors ya está buscando opciones similares en la misma zona que se adapten a tu perfil. ¡Sigue deslizando en el Tinder Mode de ZHomes para encontrar tu nuevo hogar!
        ```
