/*
  Guia rapida para presentar:
  Genera y normaliza el codigo que conecta al cliente con el repartidor al entregar.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
const safeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
};

const normalizeCode = (value = '') =>
  safeString(value)
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

const fallbackCodeFromId = (id = '') =>
  normalizeCode(id).slice(-6).padStart(6, '0');

export const resolveDeliveryCode = (order = {}, fallbackId = '') => {
  const provided = normalizeCode(
    order.securityCode ||
      order.codigo_seguridad ||
      order.codigoDelivery ||
      order.deliveryCode ||
      order.delivery_code ||
      order.pin_entrega ||
      order.pin ||
      order?.payload?.securityCode ||
      order?.payload?.codigo_seguridad,
  );

  if (provided) return provided;
  return fallbackCodeFromId(fallbackId || order.id || order.orderId || order.pedido_id);
};

export const normalizeDeliveryCodeInput = (value = '') => normalizeCode(value);
