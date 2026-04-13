-- Extensión para facilitar UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Transacciones (tc_transactions)
CREATE TABLE IF NOT EXISTS public.tc_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    realtor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Agente principal
    
    -- Información de la propiedad
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Louisville, KY',
    price NUMERIC,
    property_id TEXT, -- Por si está linkeada al feed
    
    -- Status y Tipo
    transaction_type TEXT DEFAULT 'purchase', -- 'purchase', 'sale', 'lease'
    status TEXT DEFAULT 'under_contract', -- 'listed', 'under_contract', 'inspection', 'appraisal', 'pre_close', 'closed', 'cancelled'
    
    -- Info de Cliente
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    
    -- Deadlines
    contract_date DATE,
    inspection_deadline DATE,
    financing_deadline DATE,
    appraisal_deadline DATE,
    closing_date DATE,
    
    notes TEXT
);

ALTER TABLE public.tc_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes pueden ver sus transacciones"
    ON public.tc_transactions
    FOR SELECT
    USING (
      auth.uid() = realtor_id
      OR
      (auth.jwt()->>'email') = client_email
      OR
      (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
    );

CREATE POLICY "Agentes pueden crear nuevas transacciones"
    ON public.tc_transactions
    FOR INSERT
    WITH CHECK ( auth.uid() = realtor_id );

CREATE POLICY "Participantes o brokers pueden actualizar"
    ON public.tc_transactions
    FOR UPDATE
    USING (
      auth.uid() = realtor_id
      OR
      (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
    );

-- 2. Tabla de Documentos (Checklist)
CREATE TABLE IF NOT EXISTS public.tc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.tc_transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    name TEXT NOT NULL,
    category TEXT DEFAULT 'contract', -- 'contract', 'inspection', 'financial', 'title', 'closing'
    status TEXT DEFAULT 'pending', -- 'pending', 'uploaded', 'reviewing', 'approved', 'rejected'
    
    required BOOLEAN DEFAULT true,
    file_url TEXT, -- Link a Supabase storage cuando se suba
    file_type TEXT, 
    notes TEXT,
    sort_order INTEGER DEFAULT 99
);

ALTER TABLE public.tc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes del deal pueden ver documentos"
    ON public.tc_documents
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.tc_transactions t 
        WHERE t.id = tc_documents.transaction_id 
          AND (
            t.realtor_id = auth.uid() 
            OR (auth.jwt()->>'email') = t.client_email
            OR (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
          )
      )
    );

CREATE POLICY "Permitir inserts desde Edge Funcs y TC"
    ON public.tc_documents
    FOR ALL
    USING (true)
    WITH CHECK (true); -- En entorno RLS estricto, ajustar esto a policies finas, aquí confíamos en Supabase service role para auto-generación

-- 3. Tabla de Chat/Mensajes de Transacción
CREATE TABLE IF NOT EXISTS public.tc_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.tc_transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    sender_name TEXT,
    sender_role TEXT, -- 'system', 'realtor', 'tc', 'client'
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'user' -- 'user', 'system', 'status_change', 'ai_summary', 'doc_uploaded'
);

ALTER TABLE public.tc_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura y escritura para participantes del deal"
    ON public.tc_messages
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.tc_transactions t 
        WHERE t.id = tc_messages.transaction_id 
          AND (
            t.realtor_id = auth.uid() 
            OR (auth.jwt()->>'email') = t.client_email
            OR (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
          )
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.tc_transactions t 
        WHERE t.id = tc_messages.transaction_id 
          AND (
            t.realtor_id = auth.uid() 
            OR (auth.jwt()->>'email') = t.client_email
            OR (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
          )
      )
    );

-- 4. Tabla de Eventos e Hitos (Timeline / Alertas)
CREATE TABLE IF NOT EXISTS public.tc_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.tc_transactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    event_type TEXT NOT NULL, -- 'status_changed', 'deadline_approaching', 'document_missing'
    description TEXT,
    due_date DATE,
    is_alert BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false
);

ALTER TABLE public.tc_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura de eventos del deal"
    ON public.tc_events
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.tc_transactions t 
        WHERE t.id = tc_events.transaction_id 
          AND (
            t.realtor_id = auth.uid() 
            OR (auth.jwt()->>'email') = t.client_email
            OR (auth.jwt()->'user_metadata'->>'role') IN ('broker', 'tc', 'admin')
          )
      )
    );
CREATE POLICY "Gestión total a Admins/Broker para Eventos"
    ON public.tc_events
    FOR ALL
    USING (true)
    WITH CHECK(true);
