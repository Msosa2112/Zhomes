#!/usr/bin/env python3
"""
ZHomes Simulation & Testing Suite — Louisville, KY
===================================================
Este script en Python 3.12 genera datos de prueba altamente coherentes 
para validar el esquema de base de datos de Supabase, las políticas de RLS,
los triggers de gamificación y el algoritmo de valuación en cascada de CMA Pro.

Produce un archivo 'seed.sql' listo para ser ejecutado en el Editor SQL de Supabase
y opcionalmente ejecuta las pruebas de consulta directamente si se configuran
las credenciales de conexión.
"""

import math
import random
import uuid
import sys
from datetime import datetime, timedelta

# =========================================================================
# CONFIGURACIÓN GEOGRÁFICA Y CONSTANTES (Louisville, KY)
# =========================================================================
ORIGIN_LAT = 38.2300   # Highlands / St. Matthews
ORIGIN_LNG = -85.7000  # Centro geográfico de simulación
METERS_PER_DEGREE_LAT = 111139.0
METERS_PER_DEGREE_LNG = 111139.0 * math.cos(math.radians(ORIGIN_LAT))

# Códigos postales reales del área metropolitana de Louisville
LOUISVILLE_ZIPS = ['40204', '40205', '40207', '40218', '40220', '40245', '40299']

# UUIDs estáticos para mantener consistencia referencial en las pruebas
BROKER_ID = "b0000000-0000-4000-8000-000000000000"
REALTOR_IDS = [
    "d0000001-0000-4000-8000-000000000001",
    "d0000002-0000-4000-8000-000000000002",
    "d0000003-0000-4000-8000-000000000003"
]
CLIENT_IDS = [f"c{i:07d}-0000-4000-8000-00000000{i:04d}" for i in range(1, 11)]

# =========================================================================
# FUNCIONES DE AYUDA GEOGRÁFICA
# =========================================================================
def calculate_coords(lat, lng, dx_meters, dy_meters):
    """Calcula nuevas coordenadas geográficas basadas en desplazamientos en metros"""
    delta_lat = dy_meters / METERS_PER_DEGREE_LAT
    delta_lng = dx_meters / METERS_PER_DEGREE_LNG
    return lat + delta_lat, lng + delta_lng

def generate_point_in_zone(zone_type):
    """Genera coordenadas en 3 zonas de Louisville para validar la cascada del CMA"""
    if zone_type == 'A':
        # Dentro de 1 milla (0 a 1400 metros)
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(100, 1400)
    elif zone_type == 'B':
        # Entre 1 y 3 millas (1800 a 4500 metros)
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(1800, 4500)
    else:
        # Zona C: Más allá de 3 millas (5000 a 10000 metros)
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(5500, 10000)
        
    dx = distance * math.cos(angle)
    dy = distance * math.sin(angle)
    return calculate_coords(ORIGIN_LAT, ORIGIN_LNG, dx, dy)

# =========================================================================
# CLASE PRINCIPAL DE SIMULACIÓN
# =========================================================================
class ZHomesSimulation:
    def __init__(self):
        self.sql_lines = []
        self.properties = []
        self.swipes = []
        
    def add_line(self, query):
        self.sql_lines.append(query)

    def generate_ddl(self):
        self.add_line("\n-- 0. CREAR EXTENSIONES, ENUMS, TABLAS Y FUNCIONES")
        self.add_line('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        self.add_line('CREATE EXTENSION IF NOT EXISTS "postgis";')
        self.add_line("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'realtor', 'broker');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        CREATE TYPE property_status AS ENUM ('active', 'pending', 'sold', 'inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('listed', 'under_contract', 'inspection', 'appraisal', 'pre_close', 'closed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'preapproved', 'searching', 'offer', 'closing');
    END IF;
END$$;

DROP TABLE IF EXISTS public.user_swipes CASCADE;
DROP TABLE IF EXISTS public.property_media CASCADE;
DROP TABLE IF EXISTS public.tc_messages CASCADE;
DROP TABLE IF EXISTS public.tc_events CASCADE;
DROP TABLE IF EXISTS public.tc_documents CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.realtor_gamification CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mls_id VARCHAR(100) UNIQUE,
    address TEXT NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    beds INTEGER,
    baths NUMERIC(3, 1),
    gla INTEGER NOT NULL,
    garage INTEGER DEFAULT 0,
    year_built INTEGER,
    status property_status NOT NULL DEFAULT 'active',
    sold_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS properties_location_gist ON public.properties USING gist(location);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    realtor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    status transaction_status NOT NULL DEFAULT 'listed',
    documents JSONB DEFAULT '[]'::jsonb,
    contingencies_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    realtor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status lead_status NOT NULL DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'reviewing', 'signed', 'approved', 'rejected')),
    docuseal_envelope_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tc_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tc_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    is_system_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_swipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    interaction_type VARCHAR(10) NOT NULL CHECK (interaction_type IN ('like', 'nope')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (client_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.property_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('video', 'image')),
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS property_media_order_idx ON public.property_media (property_id, display_order ASC);

CREATE TABLE IF NOT EXISTS public.realtor_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    realtor_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    xp_points INTEGER DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    last_active_date DATE,
    badges_json JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtor_gamification ENABLE ROW LEVEL SECURITY;

-- Helper function get_auth_role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql;

-- DROP existing policies to avoid name collisions
DROP POLICY IF EXISTS "Profiles: Acceso de lectura para Broker" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Acceso de escritura para Broker" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Acceso de lectura propio" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Clientes y Realtors pueden editar sus propios datos" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Realtors pueden ver perfiles de sus clientes" ON public.profiles;
DROP POLICY IF EXISTS "Properties: Lectura pública" ON public.properties;
DROP POLICY IF EXISTS "Properties: Escritura restringida al Broker" ON public.properties;
DROP POLICY IF EXISTS "Transactions: Broker acceso total" ON public.transactions;
DROP POLICY IF EXISTS "Transactions: Clientes pueden ver sus propias transacciones" ON public.transactions;
DROP POLICY IF EXISTS "Transactions: Realtors pueden ver y actualizar sus transacciones asignadas" ON public.transactions;
DROP POLICY IF EXISTS "Leads: Broker acceso total" ON public.leads;
DROP POLICY IF EXISTS "Leads: Clientes pueden ver y actualizar sus propios leads" ON public.leads;
DROP POLICY IF EXISTS "Leads: Realtors pueden ver y actualizar sus leads asignados" ON public.leads;
DROP POLICY IF EXISTS "TC_Docs: Broker acceso total" ON public.tc_documents;
DROP POLICY IF EXISTS "TC_Docs: Realtor acceso total a su deal" ON public.tc_documents;
DROP POLICY IF EXISTS "TC_Docs: Clientes ven sus propios documentos" ON public.tc_documents;
DROP POLICY IF EXISTS "TC_Events: Lectura del staff" ON public.tc_events;
DROP POLICY IF EXISTS "TC_Messages: Clientes leen y escriben en su chat" ON public.tc_messages;
DROP POLICY IF EXISTS "TC_Messages: Realtors leen y escriben en sus chats" ON public.tc_messages;
DROP POLICY IF EXISTS "Swipes: Clientes gestionan sus deslizamientos" ON public.user_swipes;
DROP POLICY IF EXISTS "Swipes: Realtors leen deslizamientos de sus clientes" ON public.user_swipes;
DROP POLICY IF EXISTS "Swipes: Broker lectura global" ON public.user_swipes;
DROP POLICY IF EXISTS "Media: Lectura pública" ON public.property_media;
DROP POLICY IF EXISTS "Media: Broker modifica" ON public.property_media;
DROP POLICY IF EXISTS "Gamification: Realtors ven su propio score" ON public.realtor_gamification;
DROP POLICY IF EXISTS "Gamification: Broker lectura total" ON public.realtor_gamification;

-- Create policies
CREATE POLICY "Profiles: Acceso de lectura para Broker" ON public.profiles FOR SELECT USING (public.get_auth_role() = 'broker');
CREATE POLICY "Profiles: Acceso de escritura para Broker" ON public.profiles FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Profiles: Acceso de lectura propio" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Profiles: Clientes y Realtors pueden editar sus propios datos" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Profiles: Realtors pueden ver perfiles de sus clientes" ON public.profiles FOR SELECT USING (public.get_auth_role() = 'realtor' AND (id = auth.uid() OR EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = public.profiles.id AND l.realtor_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.transactions t WHERE t.client_id = public.profiles.id AND t.realtor_id = auth.uid())));

CREATE POLICY "Properties: Lectura pública" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Properties: Escritura restringida al Broker" ON public.properties FOR ALL USING (public.get_auth_role() = 'broker');

CREATE POLICY "Transactions: Broker acceso total" ON public.transactions FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Transactions: Clientes pueden ver sus propias transacciones" ON public.transactions FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Transactions: Realtors pueden ver y actualizar sus transacciones asignadas" ON public.transactions FOR ALL USING (public.get_auth_role() = 'realtor' AND realtor_id = auth.uid());

CREATE POLICY "Leads: Broker acceso total" ON public.leads FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "Leads: Clientes pueden ver y actualizar sus propios leads" ON public.leads FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Leads: Realtors pueden ver y actualizar sus leads asignados" ON public.leads FOR ALL USING (public.get_auth_role() = 'realtor' AND realtor_id = auth.uid());

CREATE POLICY "TC_Docs: Broker acceso total" ON public.tc_documents FOR ALL USING (public.get_auth_role() = 'broker');
CREATE POLICY "TC_Docs: Realtor acceso total a su deal" ON public.tc_documents FOR ALL USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.realtor_id = auth.uid()));
CREATE POLICY "TC_Docs: Clientes ven sus propios documentos" ON public.tc_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_documents.transaction_id AND t.client_id = auth.uid()));

CREATE POLICY "TC_Events: Lectura del staff" ON public.tc_events FOR SELECT USING (public.get_auth_role() IN ('realtor', 'broker'));

CREATE POLICY "TC_Messages: Clientes leen y escriben en su chat" ON public.tc_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.client_id = auth.uid()));
CREATE POLICY "TC_Messages: Realtors leen y escriben en sus chats" ON public.tc_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = public.tc_messages.transaction_id AND t.realtor_id = auth.uid()));

CREATE POLICY "Swipes: Clientes gestionan sus deslizamientos" ON public.user_swipes FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Swipes: Realtors leen deslizamientos de sus clientes" ON public.user_swipes FOR SELECT USING (public.get_auth_role() = 'realtor' AND (EXISTS (SELECT 1 FROM public.leads l WHERE l.client_id = public.user_swipes.client_id AND l.realtor_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.transactions t WHERE t.client_id = public.user_swipes.client_id AND t.realtor_id = auth.uid())));
CREATE POLICY "Swipes: Broker lectura global" ON public.user_swipes FOR SELECT USING (public.get_auth_role() = 'broker');

CREATE POLICY "Media: Lectura pública" ON public.property_media FOR SELECT USING (true);
CREATE POLICY "Media: Broker modifica" ON public.property_media FOR ALL USING (public.get_auth_role() = 'broker');

CREATE POLICY "Gamification: Realtors ven su propio score" ON public.realtor_gamification FOR SELECT USING (realtor_id = auth.uid());
CREATE POLICY "Gamification: Broker lectura total" ON public.realtor_gamification FOR SELECT USING (public.get_auth_role() = 'broker');

-- CMA Pro cascade function v2
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
           COALESCE(SUBSTRING(address FROM '\\y\\d{5}\\y'), '40201')
    INTO target_geom, target_gla, target_beds, target_baths, target_garage, target_year, target_price, target_zip
    FROM public.properties
    WHERE id = target_property_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Propiedad sujeto no encontrada.';
    END IF;

    -- PASO 1: CRITERIO ESTRICTO (TIER 1)
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

    DROP TABLE temp_comps;

    -- PASO 2: CRITERIO EXPANDIDO (TIER 2)
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

    -- PASO 3: FALLBACK
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
            AND SUBSTRING(p.address FROM '\\y\\d{5}\\y') = target_zip
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

-- Gamification record function
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
    SELECT EXISTS(SELECT 1 FROM public.realtor_gamification WHERE realtor_id = realtor_uuid) INTO record_exists;

    IF NOT record_exists THEN
        INSERT INTO public.realtor_gamification (realtor_id, xp_points, current_streak, last_active_date)
        VALUES (realtor_uuid, xp_to_add, 1, today);
        RETURN;
    END IF;

    SELECT last_active_date, current_streak INTO last_date, streak
    FROM public.realtor_gamification
    WHERE realtor_id = realtor_uuid;

    IF last_date IS NULL THEN
        streak := 1;
    ELSIF last_date = today - 1 THEN
        streak := streak + 1;
    ELSIF last_date < today - 1 THEN
        streak := 1;
    END IF;

    UPDATE public.realtor_gamification
    SET 
        xp_points = xp_points + xp_to_add,
        current_streak = streak,
        last_active_date = today
    WHERE realtor_id = realtor_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger functions and drop/create triggers
CREATE OR REPLACE FUNCTION public.trg_lead_assigned_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.realtor_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.realtor_id IS DISTINCT FROM NEW.realtor_id) THEN
        PERFORM public.record_realtor_activity(NEW.realtor_id, 50);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_lead_assigned_xp ON public.leads;
CREATE TRIGGER trg_on_lead_assigned_xp
AFTER INSERT OR UPDATE OF realtor_id ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_lead_assigned_xp();

CREATE OR REPLACE FUNCTION public.trg_transaction_closed_xp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
        PERFORM public.record_realtor_activity(NEW.realtor_id, 500);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_transaction_closed_xp ON public.transactions;
CREATE TRIGGER trg_on_transaction_closed_xp
AFTER UPDATE OF status ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.trg_transaction_closed_xp();
""")

    def generate_all(self):
        self.add_line("-- ========================================================================")
        self.add_line("-- SEED SQL GENERADO AUTOMÁTICAMENTE PARA PRUEBAS DE ZHOMES & CMA PRO")
        self.add_line("-- ========================================================================")
        
        self.generate_ddl()
        
        self.add_line("\nBEGIN;")
        self.add_line("TRUNCATE public.user_swipes, public.tc_messages, public.tc_events, public.tc_documents, public.transactions, public.leads, public.realtor_gamification, public.properties, public.profiles CASCADE;")
        
        self.generate_profiles()
        self.generate_properties()
        self.generate_swipes()
        self.generate_transactions_and_events()
        self.generate_leads_and_gamification()
        
        self.add_line("COMMIT;")
        
    def generate_profiles(self):
        self.add_line("\n-- 1. INSERTAR PERFILES (BROKER, REALTORS, CLIENTES)")
        # 1 Broker
        self.add_line(f"INSERT INTO auth.users (id, email) VALUES ('{BROKER_ID}', 'broker@zhomesre.com') ON CONFLICT DO NOTHING;")
        self.add_line(f"INSERT INTO public.profiles (id, email, full_name, role) VALUES ('{BROKER_ID}', 'broker@zhomesre.com', 'Ernesto Broker Cougil', 'broker');")
        
        # 3 Realtors
        names = ["Jessica Hernandez", "Miriam Castano", "Judith Gonzalez"]
        for idx, r_id in enumerate(REALTOR_IDS):
            email = f"{names[idx].lower().replace(' ', '')}@zhomesre.com"
            self.add_line(f"INSERT INTO auth.users (id, email) VALUES ('{r_id}', '{email}') ON CONFLICT DO NOTHING;")
            self.add_line(f"INSERT INTO public.profiles (id, email, full_name, role) VALUES ('{r_id}', '{email}', '{names[idx]}', 'realtor');")
            
        # 10 Clientes
        for idx, c_id in enumerate(CLIENT_IDS):
            email = f"client{idx+1}@gmail.com"
            name = f"Cliente Louisville {idx+1}"
            self.add_line(f"INSERT INTO auth.users (id, email) VALUES ('{c_id}', '{email}') ON CONFLICT DO NOTHING;")
            self.add_line(f"INSERT INTO public.profiles (id, email, full_name, role) VALUES ('{c_id}', '{email}', '{name}', 'client');")

    def generate_properties(self):
        self.add_line("\n-- 2. INSERTAR PROPIEDADES (ZONIFICADAS EN LOUISVILLE)")
        
        # Inmueble Sujeto ( Highland central - 1,800 sq ft)
        subject_id = "550e8400-e29b-41d4-a716-446655440000"
        self.properties.append(subject_id)
        self.add_line(
            f"INSERT INTO public.properties (id, mls_id, address, location, price, beds, baths, gla, garage, year_built, status) "
            f"VALUES ('{subject_id}', 'MLS-SUJETO-01', '1800 Highlands Ave, Louisville, KY 40204', "
            f"ST_SetSRID(ST_MakePoint({ORIGIN_LNG}, {ORIGIN_LAT}), 4326), 295000.00, 3, 2.0, 1800, 2, 2000, 'active');"
        )
        
        # Distribución de propiedades para forzar la cascada:
        # Zona A: 12 propiedades (Mismo vecindario, variación GLA corta, venta reciente)
        for i in range(12):
            prop_id = str(uuid.uuid4())
            self.properties.append(prop_id)
            lat, lng = generate_point_in_zone('A')
            # Varianza física corta (entre -15% y +15%)
            gla = int(1800 * random.uniform(0.85, 1.15))
            beds = 3 if gla < 2000 else 4
            baths = 2.0 if gla < 1800 else 2.5
            price = gla * random.uniform(160, 180) # $160-180 por sqft
            sold_date = (datetime.now() - timedelta(days=random.randint(10, 150))).strftime('%Y-%m-%d')
            zip_code = random.choice(['40204', '40205'])
            
            self.add_line(
                f"INSERT INTO public.properties (id, mls_id, address, location, price, beds, baths, gla, garage, year_built, status, sold_date) "
                f"VALUES ('{prop_id}', 'MLS-A-{i:02d}', '{1000+i} St Mathews Way, Louisville, KY {zip_code}', "
                f"ST_SetSRID(ST_MakePoint({lng:.6f}, {lat:.6f}), 4326), {price:.2f}, {beds}, {baths}, {gla}, 2, {random.randint(1990, 2015)}, 'sold', '{sold_date}');"
            )

        # Zona B: 18 propiedades (1 a 3 millas, venta de 6 a 12 meses atrás)
        for i in range(18):
            prop_id = str(uuid.uuid4())
            self.properties.append(prop_id)
            lat, lng = generate_point_in_zone('B')
            # Varianza física media (entre -30% y +30%)
            gla = int(1800 * random.uniform(0.70, 1.30))
            beds = 2 if gla < 1300 else (3 if gla < 2100 else 4)
            baths = 1.5 if gla < 1400 else 2.0
            price = gla * random.uniform(140, 160)
            sold_date = (datetime.now() - timedelta(days=random.randint(190, 350))).strftime('%Y-%m-%d')
            zip_code = random.choice(['40207', '40218'])
            
            self.add_line(
                f"INSERT INTO public.properties (id, mls_id, address, location, price, beds, baths, gla, garage, year_built, status, sold_date) "
                f"VALUES ('{prop_id}', 'MLS-B-{i:02d}', '{2000+i} Bardstown Rd, Louisville, KY {zip_code}', "
                f"ST_SetSRID(ST_MakePoint({lng:.6f}, {lat:.6f}), 4326), {price:.2f}, {beds}, {baths}, {gla}, 1, {random.randint(1975, 2005)}, 'sold', '{sold_date}');"
            )

        # Zona C: 20 propiedades (Más lejanas o en código postal ZIP diferente)
        for i in range(20):
            prop_id = str(uuid.uuid4())
            self.properties.append(prop_id)
            lat, lng = generate_point_in_zone('C')
            # Varianza física amplia o características muy dispares
            gla = int(1800 * random.uniform(0.60, 1.40))
            beds = 2 if gla < 1200 else (3 if gla < 1800 else 4)
            baths = 1.0 if gla < 1100 else (2.0 if gla < 2000 else 2.5)
            price = gla * random.uniform(110, 130)
            sold_date = (datetime.now() - timedelta(days=random.randint(370, 500))).strftime('%Y-%m-%d')
            zip_code = random.choice(LOUISVILLE_ZIPS)
            
            self.add_line(
                f"INSERT INTO public.properties (id, mls_id, address, location, price, beds, baths, gla, garage, year_built, status, sold_date) "
                f"VALUES ('{prop_id}', 'MLS-C-{i:02d}', '{4000+i} Shelbyville Rd, Louisville, KY {zip_code}', "
                f"ST_SetSRID(ST_MakePoint({lng:.6f}, {lat:.6f}), 4326), {price:.2f}, {beds}, {baths}, {gla}, 1, {random.randint(1950, 1995)}, 'sold', '{sold_date}');"
            )

    def generate_swipes(self):
        self.add_line("\n-- 3. INSERTAR DESLIZAMIENTOS (TINDER MODE)")
        # Simular que los 10 clientes deslizan sobre varias propiedades sin colisionar la clave única
        swipe_count = 0
        for client_id in CLIENT_IDS:
            sampled_props = random.sample(self.properties, 8)
            for prop_id in sampled_props:
                interaction = 'like' if random.random() > 0.4 else 'nope'
                self.add_line(
                    f"INSERT INTO public.user_swipes (client_id, property_id, interaction_type) "
                    f"VALUES ('{client_id}', '{prop_id}', '{interaction}') ON CONFLICT DO NOTHING;"
                )
                swipe_count += 1

    def generate_transactions_and_events(self):
        self.add_line("\n-- 4. INSERTAR TRANSACCIONES Y EVENTOS DE AUDITORÍA (DEAL ROOM)")
        
        # 3 transacciones
        t1_id = "a1111111-0000-4000-8000-000000000001"
        t2_id = "a2222222-0000-4000-8000-000000000002"
        t3_id = "a3333333-0000-4000-8000-000000000003"
        
        # Transaction 1: under_contract
        self.add_line(
            f"INSERT INTO public.transactions (id, client_id, realtor_id, property_id, status, contingencies_deadline) "
            f"VALUES ('{t1_id}', '{CLIENT_IDS[0]}', '{REALTOR_IDS[0]}', '{self.properties[1]}', 'under_contract', NOW() + INTERVAL '3 days');"
        )
        
        # Documents para Transaction 1
        d1_id = "d1111111-0000-4000-8000-000000000001"
        self.add_line(
            f"INSERT INTO public.tc_documents (id, transaction_id, name, status, docuseal_envelope_id) "
            f"VALUES ('{d1_id}', '{t1_id}', 'Purchase Agreement', 'pending', 'env-982138921');"
        )
        
        # Eventos de auditoría
        self.add_line(
            f"INSERT INTO public.tc_events (transaction_id, event_type, description, raw_payload) "
            f"VALUES ('{t1_id}', 'deal_created', 'Contrato inicial registrado bajo el Deal Room.', '{{\"init\": true}}');"
        )
        
        # Transaction 2: closed (cierre completo)
        self.add_line(
            f"INSERT INTO public.transactions (id, client_id, realtor_id, property_id, status, contingencies_deadline) "
            f"VALUES ('{t2_id}', '{CLIENT_IDS[1]}', '{REALTOR_IDS[1]}', '{self.properties[2]}', 'closed', NOW() - INTERVAL '1 day');"
        )
        
        self.add_line(
            f"INSERT INTO public.tc_documents (id, transaction_id, name, status, document_url) "
            f"VALUES ('{str(uuid.uuid4())}', '{t2_id}', 'HUD-1 Settlement Statement', 'approved', 'https://supabase.co/storage/hud1.pdf');"
        )
        
        self.add_line(
            f"INSERT INTO public.tc_events (transaction_id, event_type, description) "
            f"VALUES ('{t2_id}', 'transaction_closed', 'Cierre oficial y firma de escrituras completado.');"
        )
        
        # Mensajes de chat
        self.add_line(
            f"INSERT INTO public.tc_messages (transaction_id, sender_id, message_text, is_system_notification) "
            f"VALUES ('{t1_id}', '{REALTOR_IDS[0]}', 'Hola, ya cargué la plantilla para que firmes el documento pendiente.', false);"
        )
        self.add_line(
            f"INSERT INTO public.tc_messages (transaction_id, sender_id, message_text, is_system_notification) "
            f"VALUES ('{t1_id}', NULL, 'Sistema ZHomes: El plazo para resolver contingencias expira en 3 días.', true);"
        )

    def generate_leads_and_gamification(self):
        self.add_line("\n-- 5. GAMIFICACIÓN E INICIALIZACIÓN (XP & RACHAS)")
        
        # Inicializar gamificación para los 3 Realtors
        for r_id in REALTOR_IDS:
            self.add_line(
                f"INSERT INTO public.realtor_gamification (realtor_id, xp_points, current_streak, last_active_date) "
                f"VALUES ('{r_id}', 100, 3, CURRENT_DATE - INTERVAL '1 day') ON CONFLICT (realtor_id) DO NOTHING;"
            )
            
        # Insertar un nuevo lead asignado para activar el trigger de XP (+50 XP)
        lead_id = str(uuid.uuid4())
        self.add_line(
            f"INSERT INTO public.leads (id, client_id, realtor_id, status, notes) "
            f"VALUES ('{lead_id}', '{CLIENT_IDS[2]}', '{REALTOR_IDS[0]}', 'new', 'Interesado en casas del área de St. Matthews.');"
        )

    def write_to_file(self, filename):
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("\n".join(self.sql_lines))
        print(f"Archivo semilla escrito exitosamente en: {filename}")

# =========================================================================
# EJECUCIÓN PRINCIPAL
# =========================================================================
if __name__ == '__main__':
    # 1. Generar la semilla SQL
    sim = ZHomesSimulation()
    sim.generate_all()
    sim.write_to_file('c:\\TRABAJO\\ZHOMES\\seed.sql')
    
    print("\n" + "="*80)
    print(" CÓMO PROBAR EL ALGORITMO CMA PRO EN TU BASE DE DATOS DE SUPABASE")
    print("="*80)
    print("1. Abre el panel de control de Supabase y ve al SQL Editor.")
    print("2. Copia y ejecuta todo el contenido del archivo 'c:\\TRABAJO\\ZHOMES\\seed.sql'.")
    print("3. Para probar la valuación del CMA Pro con fallback automático en cascada,")
    print("   ejecuta la siguiente consulta SQL en tu editor:")
    print("\n   SELECT * FROM public.calculate_cma_pro_v2('550e8400-e29b-41d4-a716-446655440000', 1.0, 15.0);")
    print("\n4. Para verificar la gamificación del Realtor asignado a un lead (Jessica), ejecuta:")
    print(f"\n   SELECT xp_points, current_streak, last_active_date FROM public.realtor_gamification WHERE realtor_id = '{REALTOR_IDS[0]}';")
    print("   (Debería mostrar 150 XP, sumando los 100 base + 50 del trigger al asignarle el lead).")
    print("="*80 + "\n")
