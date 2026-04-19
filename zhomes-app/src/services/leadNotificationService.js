// src/services/leadNotificationService.js
//
// Servicio para encolar notificaciones de leads en QStash.
// Cuando un usuario hace swipe positivo o guarda una propiedad,
// este servicio encola una notificación al agente con un delay de 30 minutos.
//
// ¿Por qué 30 minutos de delay?
// - Evita spam inmediato si el usuario está explorando varias propiedades
// - Permite "batching" mental del agente
// - El usuario puede desguardar antes de que la notificación llegue

// Endpoint del proxy de QStash — llama al backend, NO a QStash directamente
// (las llaves de QStash nunca tocan el frontend)
const QSTASH_PROXY_URL = '/api/enqueue-lead';

/**
 * Encola una notificación de lead para el agente de una propiedad.
 * Se envía con 30 minutos de delay a través de QStash.
 *
 * @param {Object} params
 * @param {string} params.agentKey   - Clave del agente en Spark/MLS
 * @param {string} params.propertyId - ID de la propiedad
 * @param {string} params.propertyAddress - Dirección legible
 * @param {string} params.action     - 'saved' | 'swiped_right' | 'tour_requested'
 * @param {string} [params.clientName] - Nombre del usuario (si disponible)
 */
export async function enqueueLeadNotification({
  agentKey,
  propertyId,
  propertyAddress,
  action,
  clientName = 'Anonymous',
}) {
  if (!agentKey || !propertyId || !action) {
    console.warn('[LeadNotification] Faltan parámetros requeridos — no se encoló');
    return { enqueued: false, reason: 'Missing required params' };
  }

  try {
    const response = await fetch(QSTASH_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentKey,
        propertyId,
        propertyAddress,
        action,
        clientName,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[LeadNotification] Error del proxy:', errorData);
      return { enqueued: false, error: errorData };
    }

    const data = await response.json();
    return { enqueued: true, messageId: data.messageId };

  } catch (err) {
    // Error de red — no bloquear la UI del usuario
    console.warn('[LeadNotification] Error de red (no crítico):', err.message);
    return { enqueued: false, error: err.message };
  }
}

/**
 * Atajos semánticos para los distintos eventos de lead
 */
export const LeadActions = {
  SAVED:          'saved',
  SWIPED_RIGHT:   'swiped_right',
  TOUR_REQUESTED: 'tour_requested',
  OFFER_INTENT:   'offer_intent',
};

// Ejemplo de uso en un componente React:
//
// import { enqueueLeadNotification, LeadActions } from '../services/leadNotificationService';
//
// // Cuando el usuario hace swipe right en una propiedad:
// await enqueueLeadNotification({
//   agentKey: property.list_agent_key,
//   propertyId: property.id,
//   propertyAddress: property.address,
//   action: LeadActions.SWIPED_RIGHT,
//   clientName: user?.full_name,
// });
