/*
  Guia rapida para presentar:
  Decide a que portal enviar cada sesion: cliente, administracion o delivery.
  Buscar en VS Code: redireccion por rol, admin, delivery, cliente, correo.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
const ADMIN_EMAIL_SUFFIX = '@admin.com.do';
const DELIVERY_EMAIL_SUFFIX = '@delivery.com.do';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

export const isAdminPortalEmail = (email = '') => normalizeEmail(email).endsWith(ADMIN_EMAIL_SUFFIX);

export const isDeliveryPortalEmail = (email = '') => normalizeEmail(email).endsWith(DELIVERY_EMAIL_SUFFIX);

export const getPortalRouteByEmail = (email = '') => {
    if (isAdminPortalEmail(email)) return '/administracion';
    if (isDeliveryPortalEmail(email)) return '/delivery';
    return '/';
};
