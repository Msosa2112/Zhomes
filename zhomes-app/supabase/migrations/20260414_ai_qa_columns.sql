-- Agregamos las columnas necesarias para el procesamiento automatizado por I.A.
-- de los documentos cargados por clientes o realtors.

-- 1. Bandera para habilitar o deshabilitar QA automático en el documento
ALTER TABLE public.tc_documents 
ADD COLUMN IF NOT EXISTS ai_qa_enabled BOOLEAN DEFAULT false;

-- 2. Lineamientos o rubricas para que el modelo visual sepa qué buscar
ALTER TABLE public.tc_documents 
ADD COLUMN IF NOT EXISTS ai_guidelines TEXT;

-- 3. Respuesta en formato texto (el razonamiento del robot)
ALTER TABLE public.tc_documents 
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
