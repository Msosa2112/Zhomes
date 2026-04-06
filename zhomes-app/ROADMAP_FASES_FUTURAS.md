---
description: >
  Documentación arquitectónica de las Fases Futuras del ecosistema ZHomes.
  Incluye la integración de Open Banking (Plaid) y la capa de liquidación (Title).
  STATUS: ON HOLD. NO IMPLEMENTAR hasta recibir orden explícita.
---

# Roadmap Arquitectónico: Fases Financiera y de Liquidación (ON HOLD)

## 🛑 ESTADO ACTUAL: EN PAUSA (ON HOLD)
Este documento es puramente estratégico. Detalla las próximas evoluciones de la plataforma para convertir ZHomes en un ecosistema End-to-End. No generar código, tablas ni flujos para estos módulos hasta que el estatus cambie a ACTIVO.

---

## 💰 Fase 3: Capa Financiera (Open Banking & Pre-aprobación)
**Objetivo:** Eliminar la fricción de recolección de documentos financieros y crear un puente directo con prestamistas locales (Ej. Feria Financial, Casa Lending).

### Arquitectura Propuesta:
1. **Integración Core:** Plaid API (Plan Scale).
2. **Endpoints a usar:** `Assets` (saldos y transacciones) e `Income` (verificación de nómina/empleador).
3. **Flujo de Usuario:** - Módulo en la Bóveda: "Verificar mis Ingresos (Conectar Banco)".
   - Plaid retorna JSON con 12-24 meses de historial.
4. **Orquestación (n8n):**
   - n8n intercepta el Webhook de Plaid.
   - Genera un "Paquete de Pre-Calificación" estructurado.
   - Envía el lead masticado al prestamista local (ideal para préstamos Non-QM o Hard Money que se basan en Bank Statements).

---

## 🏛️ Fase 4: Capa de Liquidación (Title Company & Escrow)
**Objetivo:** Digitalizar el cierre de la transacción para el agente y el comprador, integrando ZHomes directamente con la oficina de título.

### Arquitectura Propuesta:
1. **Digital Earnest Money:**
   - Integración con API de Earnnest o ZOCCAM.
   - Permite al comprador transferir el depósito de buena fe directamente al Escrow desde la app ZHomes, eliminando cheques de caja físicos.
2. **Sincronización de Estatus (Qualia API):**
   - Conexión con el software de la compañía de título (Ej. Qualia Connect).
   - Triggers: Cuando la paralegal marca "Clear to Close" en su sistema, n8n intercepta el webhook y actualiza la UI de ZHomes a color verde, notificando al agente y al cliente.
3. **Closing Disclosure (CD) AI Translator:**
   - **Skill a usar:** `legal_translator` (Gemma 4 / Vertex AI).
   - **Acción:** Cuando el CD se sube al *Deal Room*, la IA extrae el "Cash to Close" y genera un resumen en lenguaje natural (ej. *"Tu cierre es el viernes. Tienes que llevar $12,450.00 exactos para cubrir enganche y seguro"*), eliminando la ansiedad del cliente.
4. **Visión a Largo Plazo:** Remote Online Notarization (RON) vía Notarize/Proof API para firmas 100% digitales.

---
**Nota para el Agente (Antigravity):** Mantén este conocimiento en caché para entender el contexto macro del negocio, pero enfoca tus recursos de procesamiento en las Fases 1 y 2 (UI, MLS, Citas, y Twilio) hasta nuevo aviso.
