/*
  Guia rapida para presentar:
  Capa de localStorage. Guarda sesion, carrito, pedidos cacheados y notificaciones por usuario.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { resolveDeliveryCode } from '../utils/deliveryCode';

const STORAGE_KEYS = {
  authToken: 'auth_token',
  userId: 'user_id',
  userTenantId: 'user_tenant_id',
  userName: 'user_name',
  userEmail: 'user_email',
  userPhone: 'user_phone',
  userAddress: 'user_address',
  userZone: 'user_zone',
  cart: 'foodrush_cart',
  favorites: 'foodrush_favorites',
  cards: 'foodrush_saved_cards',
  paypals: 'foodrush_saved_paypals',
  preferredPayments: 'foodrush_preferred_payments',
  orders: 'foodrush_orders',
  deliveryAssignments: 'foodrush_delivery_assignments',
  clients: 'foodrush_clients',
  notifications: 'foodrush_notifications',
};

export const APP_EVENTS = {
  authChanged: 'foodrush:auth-changed',
  cartChanged: 'foodrush:cart-changed',
  favoritesChanged: 'foodrush:favorites-changed',
  paymentsChanged: 'foodrush:payments-changed',
  ordersChanged: 'foodrush:orders-changed',
  notificationsChanged: 'foodrush:notifications-changed',
};

const STATUS_LABELS = {
  1: 'Pendiente de confirmacion',
  2: 'Pedido confirmado por el restaurante',
  3: 'Pedido en preparación',
  4: 'Pedido en camino',
  5: 'Pedido entregado',
  6: 'Pedido cancelado',
};

const STATUS_LABELS_BY_KEY = {
  pendiente: 'Pendiente de confirmacion',
  preparando: 'Pedido en preparación',
  en_transito: 'Pedido en camino',
  'en camino': 'Pedido en camino',
  entregado: 'Pedido entregado',
  cancelado: 'Pedido cancelado',
};

const normalizeStatusKey = (value = '') =>
  String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getStatusLabel = (statusId, fallback = 'Actualizado') => {
  const numericStatus = Number.parseInt(statusId, 10);
  if (Number.isFinite(numericStatus) && STATUS_LABELS[numericStatus]) return STATUS_LABELS[numericStatus];

  const key = normalizeStatusKey(statusId).replace(/_/g, ' ');
  if (key.includes('cancel')) return STATUS_LABELS_BY_KEY.cancelado;
  if (key.includes('entreg')) return STATUS_LABELS_BY_KEY.entregado;
  if (key.includes('transito') || key.includes('camino')) return STATUS_LABELS_BY_KEY.en_transito;
  if (key.includes('pend') || key.includes('recib') || key.includes('solicit')) return STATUS_LABELS_BY_KEY.pendiente;
  if (key.includes('prepar') || key.includes('confirm')) return STATUS_LABELS_BY_KEY.preparando;

  return fallback;
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'welcome',
    type: 'system',
    title: 'Bienvenido a FoodRush',
    message: 'Tu cuenta esta lista para recibir alertas de pedidos, ofertas y cambios de estado.',
    icon: 'fa-solid fa-bolt',
    route: '/',
    read: false,
    created_at: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'promo-delivery',
    type: 'promo',
    title: 'Promos activas cerca de ti',
    message: 'Revisa tus franquicias favoritas y agrega productos al carrito para no perder ofertas.',
    icon: 'fa-solid fa-tag',
    route: '/',
    read: false,
    created_at: '2026-04-30T00:01:00.000Z',
  },
];

const CARD_ICONS = {
  Visa: 'fa-brands fa-cc-visa text-blue-800',
  Mastercard: 'fa-brands fa-cc-mastercard text-red-600',
  Amex: 'fa-brands fa-cc-amex text-sky-700',
  Tarjeta: 'fa-regular fa-credit-card text-slate-600',
};

const hasWindow = () => typeof window !== 'undefined';

const getStorage = () => (hasWindow() ? window.localStorage : null);

const emitAppEvent = (eventName, detail) => {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

const safeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const isPlainObject = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const pickFirstObject = (...values) => {
  for (const value of values) {
    if (isPlainObject(value)) return value;
  }
  return null;
};

const toNumber = (value, fallback = 0) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};

const toInteger = (value, fallback = 0) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
};

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readJson = (key, fallback) => {
  const storage = getStorage();
  if (!storage) return fallback;
  return safeJsonParse(storage.getItem(key), fallback);
};

const writeJson = (key, value) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
};

const removeStorageKey = (key) => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(key);
};

const normalizeEmailKey = (email) => {
  const normalized = safeString(email).toLowerCase();
  return normalized || 'guest@foodrush.local';
};

const resolveAuthUser = (authResult = {}) => {
  const data = isPlainObject(authResult.data) ? authResult.data : null;
  const direct = pickFirstObject(authResult.user, authResult.usuario, authResult.cliente);
  const nestedFromData = data ? pickFirstObject(data.user, data.usuario, data.cliente) : null;
  const nestedFromDirect = direct ? pickFirstObject(direct.user, direct.usuario, direct.cliente) : null;

  return nestedFromData || nestedFromDirect || direct || data || {};
};

const resolveAuthToken = (authResult = {}) => {
  const data = isPlainObject(authResult.data) ? authResult.data : null;
  const deepData = data && isPlainObject(data.data) ? data.data : null;

  return safeString(
    authResult.token ||
      authResult.accessToken ||
      authResult.authToken ||
      data?.token ||
      data?.accessToken ||
      data?.authToken ||
      deepData?.token ||
      deepData?.accessToken,
  );
};

const parseJwtPayload = (token = '') => {
  const rawToken = safeString(token);
  const payloadSegment = rawToken.split('.')[1];
  if (!payloadSegment) return null;

  const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    let decoded = '';
    if (hasWindow() && typeof window.atob === 'function') {
      decoded = window.atob(padded);
    } else if (typeof atob === 'function') {
      decoded = atob(padded);
    }

    return decoded ? safeJsonParse(decoded, null) : null;
  } catch {
    return null;
  }
};

const toScopeSegment = (value, fallback = 'guest') => {
  const normalized = safeString(value).replace(/[^a-zA-Z0-9@._-]/g, '');
  return normalized || fallback;
};

const resolveScopeFromToken = (token = '') => {
  const payload = parseJwtPayload(token);
  if (!isPlainObject(payload)) return '';

  const email = safeString(payload.email || payload.correo || payload.upn || payload.unique_name);
  if (email) return `email:${normalizeEmailKey(email)}`;

  const userId = safeString(
    payload.sub || payload.user_id || payload.usuario_id || payload.cliente_id || payload.id,
  );
  if (userId) return `user:${toScopeSegment(userId)}`;

  return '';
};

function purgeLegacySharedData() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(STORAGE_KEYS.cart);
  storage.removeItem(STORAGE_KEYS.favorites);
}

const inferCardBrand = (value = '') => {
  const digits = safeString(value).replace(/\D/g, '');
  if (digits.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'Amex';
  return 'Tarjeta';
};

const maskCardNumber = (value = '') => {
  const digits = safeString(value).replace(/\D/g, '');
  if (digits.length >= 12) {
    return `**** **** **** ${digits.slice(-4)}`;
  }

  return safeString(value, '**** **** **** 0000');
};

const normalizeSavedCard = (card) => {
  if (!card || typeof card !== 'object') return null;

  const brand = safeString(card.brand || card.type) || inferCardBrand(card.number);
  const normalized = {
    brand,
    type: brand,
    number: maskCardNumber(card.number),
    expiry: safeString(card.expiry, '--/--'),
    name: safeString(card.name),
  };

  return {
    ...normalized,
    icon: CARD_ICONS[brand] || CARD_ICONS.Tarjeta,
  };
};

const normalizePaymentMethod = (method, fallback = '') => {
  const value = safeString(method).toLowerCase();
  if (value === 'card' || value === 'paypal' || value === 'cash') return value;
  return fallback;
};

const buildRestaurantKey = (item = {}) =>
  [
    safeString(item.franchiseSlug),
    safeString(item.place),
    safeString(item.restaurantName),
    safeString(item.tenantId),
  ]
    .filter(Boolean)
    .join('::');

const buildCartLineKey = (item = {}) =>
  [
    safeString(item.id, 'item'),
    safeString(item.details, 'Sin adicionales'),
    buildRestaurantKey(item),
  ].join('::');

const normalizeCartItem = (item = {}) => {
  const normalized = {
    ...item,
    id: safeString(item.productId || item.producto_id || item.id, `item-${Date.now()}`),
    name: safeString(item.name || item.nombre || item.producto?.nombre, 'Producto'),
    img: safeString(item.img),
    price: Math.max(0, toNumber(item.price ?? item.precio_unitario ?? item.precio ?? item.unitPrice, 0)),
    qty: Math.max(1, toInteger(item.qty ?? item.cantidad ?? item.quantity, 1)),
    details: safeString(item.details, 'Sin adicionales'),
    place: safeString(item.place),
    franchiseSlug: safeString(item.franchiseSlug),
    tenantId: safeString(item.tenantId || item.tenant_id) || null,
  };

  normalized.lineKey = safeString(item.lineKey) || buildCartLineKey(normalized);
  return normalized;
};

const normalizeFavoriteItem = (item = {}) => ({
  id: safeString(item.id, `fav-${Date.now()}`),
  name: safeString(item.name, 'Producto'),
  img: safeString(item.img),
  price: Math.max(0, toNumber(item.price, 0)),
  place: safeString(item.place),
  franchiseSlug: safeString(item.franchiseSlug),
  tenantId: safeString(item.tenantId) || null,
});

export const getSession = () => {
  const storage = getStorage();
  if (!storage) {
    return {
      token: '',
      userId: '',
      tenantId: '',
      userName: '',
      userEmail: '',
      userPhone: '',
      userAddress: '',
      userZone: '',
      isAuthenticated: false,
    };
  }

  const session = {
    token: safeString(storage.getItem(STORAGE_KEYS.authToken)),
    userId: safeString(storage.getItem(STORAGE_KEYS.userId)),
    tenantId: safeString(storage.getItem(STORAGE_KEYS.userTenantId)),
    userName: safeString(storage.getItem(STORAGE_KEYS.userName)),
    userEmail: safeString(storage.getItem(STORAGE_KEYS.userEmail)),
    userPhone: safeString(storage.getItem(STORAGE_KEYS.userPhone)),
    userAddress: safeString(storage.getItem(STORAGE_KEYS.userAddress)),
    userZone: safeString(storage.getItem(STORAGE_KEYS.userZone)),
  };

  return {
    ...session,
    isAuthenticated: Boolean(session.token || session.userId || session.userEmail),
  };
};

export const setSessionFromAuth = (authResult = {}) => {
  const storage = getStorage();
  if (!storage) return getSession();

  const user = resolveAuthUser(authResult);
  const token = resolveAuthToken(authResult);

  if (token) {
    storage.setItem(STORAGE_KEYS.authToken, token);
  } else {
    storage.removeItem(STORAGE_KEYS.authToken);
  }

  const profileMap = [
    [STORAGE_KEYS.userId, user.id ?? user.user_id ?? user.usuario_id ?? user.cliente_id ?? authResult.userId],
    [STORAGE_KEYS.userTenantId, user.tenant_id ?? user.tenantId ?? authResult.tenantId],
    [STORAGE_KEYS.userName, user.nombre ?? user.name ?? user.username ?? authResult.userName],
    [STORAGE_KEYS.userEmail, user.correo ?? user.email ?? user.mail ?? authResult.userEmail ?? authResult.email],
    [STORAGE_KEYS.userPhone, user.telefono ?? user.phone ?? user.celular ?? authResult.userPhone],
    [STORAGE_KEYS.userAddress, user.direccion ?? user.address],
    [STORAGE_KEYS.userZone, user.zona ?? user.zone],
  ];

  profileMap.forEach(([key, rawValue]) => {
    const value = safeString(rawValue);
    if (value) {
      storage.setItem(key, value);
    } else {
      storage.removeItem(key);
    }
  });

  purgeLegacySharedData();

  const session = getSession();
  emitAppEvent(APP_EVENTS.authChanged, session);
  return session;
};

export const updateSessionProfile = (profile = {}) => {
  const storage = getStorage();
  if (!storage) return getSession();

  const updates = [
    [STORAGE_KEYS.userName, profile.nombre ?? profile.name],
    [STORAGE_KEYS.userTenantId, profile.tenant_id ?? profile.tenantId],
    [STORAGE_KEYS.userEmail, profile.correo ?? profile.email],
    [STORAGE_KEYS.userPhone, profile.telefono ?? profile.phone],
    [STORAGE_KEYS.userAddress, profile.direccion ?? profile.address],
    [STORAGE_KEYS.userZone, profile.zona ?? profile.zone],
  ];

  updates.forEach(([key, rawValue]) => {
    const value = safeString(rawValue);
    if (value) {
      storage.setItem(key, value);
    }
  });

  const session = getSession();
  emitAppEvent(APP_EVENTS.authChanged, session);
  return session;
};

export const clearSession = () => {
  Object.values({
    authToken: STORAGE_KEYS.authToken,
    userId: STORAGE_KEYS.userId,
    tenantId: STORAGE_KEYS.userTenantId,
    userName: STORAGE_KEYS.userName,
    userEmail: STORAGE_KEYS.userEmail,
    userPhone: STORAGE_KEYS.userPhone,
    userAddress: STORAGE_KEYS.userAddress,
    userZone: STORAGE_KEYS.userZone,
  }).forEach(removeStorageKey);

  const session = getSession();
  emitAppEvent(APP_EVENTS.authChanged, session);
  return session;
};

const resolveAccountScope = (scope = null) => {
  if (scope && typeof scope === 'string') return scope;
  if (scope && typeof scope === 'object') {
    if (scope.userId) return `user:${safeString(scope.userId)}`;
    if (scope.userEmail || scope.email) return `email:${normalizeEmailKey(scope.userEmail || scope.email)}`;
  }

  const session = getSession();
  if (session.userId) return `user:${safeString(session.userId)}`;
  if (session.userEmail) return `email:${normalizeEmailKey(session.userEmail)}`;
  if (session.token) {
    const tokenScope = resolveScopeFromToken(session.token);
    if (tokenScope) return tokenScope;
    return `token:${toScopeSegment(session.token.slice(0, 24), 'anon')}`;
  }
  return 'guest';
};

// Todas las claves quedan separadas por usuario para que una sesion no contamine otra.
const scopedStorageKey = (baseKey, scope = null) => `${baseKey}::${resolveAccountScope(scope)}`;

export const getCart = (scope = null) => {
  const key = scopedStorageKey(STORAGE_KEYS.cart, scope);
  return readJson(key, []).map(normalizeCartItem);
};

export const getCartCount = (scope = null) =>
  getCart(scope).reduce((total, item) => total + Math.max(1, toInteger(item.qty, 1)), 0);

export const getCartRestaurantInfo = (cart = getCart()) => {
  if (!Array.isArray(cart) || cart.length === 0) return null;
  const item = normalizeCartItem(cart[0]);
  const key = buildRestaurantKey(item);

  return {
    key,
    name:
      safeString(item.place) ||
      safeString(item.restaurantName) ||
      safeString(item.franchiseSlug) ||
      safeString(item.tenantId, 'FoodRush'),
    tenantId: item.tenantId,
    franchiseSlug: item.franchiseSlug,
  };
};

export const hasCartRestaurantConflict = (incomingItem, cart = getCart()) => {
  if (!incomingItem || !Array.isArray(cart) || cart.length === 0) return false;

  const currentInfo = getCartRestaurantInfo(cart);
  const incomingInfo = getCartRestaurantInfo([incomingItem]);

  if (!currentInfo?.key || !incomingInfo?.key) return false;
  return currentInfo.key !== incomingInfo.key;
};

export const saveCart = (items = [], scope = null) => {
  const normalized = Array.isArray(items) ? items.map(normalizeCartItem) : [];
  const scopeKey = resolveAccountScope(scope);
  writeJson(scopedStorageKey(STORAGE_KEYS.cart, scope), normalized);
  emitAppEvent(APP_EVENTS.cartChanged, { scope: scopeKey, items: normalized });
  return normalized;
};

export const addCartItem = (item, scope = null) => {
  const normalizedItem = normalizeCartItem(item);
  const cart = getCart(scope);
  const existing = cart.find((entry) => entry.lineKey === normalizedItem.lineKey);

  if (existing) {
    existing.qty += normalizedItem.qty;
  } else {
    cart.push(normalizedItem);
  }

  saveCart(cart, scope);
  return existing || normalizedItem;
};

export const updateCartItemQuantity = (lineKey, nextQty, scope = null) => {
  const cart = getCart(scope);
  const item = cart.find((entry) => entry.lineKey === lineKey);
  if (!item) return null;

  item.qty = Math.max(1, toInteger(nextQty, 1));
  saveCart(cart, scope);
  return item;
};

export const removeCartItem = (lineKey, scope = null) => {
  const nextCart = getCart(scope).filter((item) => item.lineKey !== lineKey);
  saveCart(nextCart, scope);
  return nextCart;
};

export const clearCart = (scope = null) => {
  const scopeKey = resolveAccountScope(scope);
  removeStorageKey(scopedStorageKey(STORAGE_KEYS.cart, scope));
  emitAppEvent(APP_EVENTS.cartChanged, { scope: scopeKey, items: [] });
};

export const getFavorites = (scope = null) => {
  const key = scopedStorageKey(STORAGE_KEYS.favorites, scope);
  return readJson(key, []).map(normalizeFavoriteItem);
};

export const saveFavorites = (items = [], scope = null) => {
  const normalized = Array.isArray(items) ? items.map(normalizeFavoriteItem) : [];
  const scopeKey = resolveAccountScope(scope);
  writeJson(scopedStorageKey(STORAGE_KEYS.favorites, scope), normalized);
  emitAppEvent(APP_EVENTS.favoritesChanged, { scope: scopeKey, items: normalized });
  return normalized;
};

export const removeFavoriteItem = (favoriteId, scope = null) => {
  const nextFavorites = getFavorites(scope).filter((item) => String(item.id) !== String(favoriteId));
  saveFavorites(nextFavorites, scope);
  return nextFavorites;
};

export const toggleFavoriteItem = (item, scope = null) => {
  const normalizedItem = normalizeFavoriteItem(item);
  const favorites = getFavorites(scope);
  const exists = favorites.some((favorite) => String(favorite.id) === String(normalizedItem.id));

  const nextFavorites = exists
    ? favorites.filter((favorite) => String(favorite.id) !== String(normalizedItem.id))
    : [...favorites, normalizedItem];

  saveFavorites(nextFavorites, scope);
  return !exists;
};

export const getSavedCard = (email) => {
  const cards = readJson(STORAGE_KEYS.cards, {});
  return normalizeSavedCard(cards[normalizeEmailKey(email)]);
};

export const saveSavedCard = (email, card) => {
  const normalizedCard = normalizeSavedCard(card);
  if (!normalizedCard) return null;

  const cards = readJson(STORAGE_KEYS.cards, {});
  cards[normalizeEmailKey(email)] = {
    brand: normalizedCard.brand,
    type: normalizedCard.type,
    number: normalizedCard.number,
    expiry: normalizedCard.expiry,
    name: normalizedCard.name,
  };

  writeJson(STORAGE_KEYS.cards, cards);
  emitAppEvent(APP_EVENTS.paymentsChanged, { email: normalizeEmailKey(email), card: normalizedCard });
  return normalizedCard;
};

export const removeSavedCard = (email) => {
  const cards = readJson(STORAGE_KEYS.cards, {});
  delete cards[normalizeEmailKey(email)];
  writeJson(STORAGE_KEYS.cards, cards);
  emitAppEvent(APP_EVENTS.paymentsChanged, { email: normalizeEmailKey(email), card: null });
};

export const getSavedPayPal = (email) => {
  const paypals = readJson(STORAGE_KEYS.paypals, {});
  const paypal = paypals[normalizeEmailKey(email)];
  return paypal && typeof paypal === 'object'
    ? { email: safeString(paypal.email, normalizeEmailKey(email)) }
    : null;
};

export const saveSavedPayPal = (email, paypalEmail) => {
  const paypals = readJson(STORAGE_KEYS.paypals, {});
  const payload = { email: safeString(paypalEmail, normalizeEmailKey(email)) };
  paypals[normalizeEmailKey(email)] = payload;
  writeJson(STORAGE_KEYS.paypals, paypals);
  emitAppEvent(APP_EVENTS.paymentsChanged, { email: normalizeEmailKey(email), paypal: payload });
  return payload;
};

export const removeSavedPayPal = (email) => {
  const paypals = readJson(STORAGE_KEYS.paypals, {});
  delete paypals[normalizeEmailKey(email)];
  writeJson(STORAGE_KEYS.paypals, paypals);
  emitAppEvent(APP_EVENTS.paymentsChanged, { email: normalizeEmailKey(email), paypal: null });
};

export const getPreferredPaymentMethod = (email) => {
  const bucket = readJson(STORAGE_KEYS.preferredPayments, {});
  const emailKey = normalizeEmailKey(email);
  if (!(emailKey in bucket)) return '';
  return normalizePaymentMethod(bucket[emailKey], '');
};

export const setPreferredPaymentMethod = (email, method) => {
  const normalizedMethod = normalizePaymentMethod(method, 'cash');
  const bucket = readJson(STORAGE_KEYS.preferredPayments, {});
  const emailKey = normalizeEmailKey(email);

  bucket[emailKey] = normalizedMethod;
  writeJson(STORAGE_KEYS.preferredPayments, bucket);
  emitAppEvent(APP_EVENTS.paymentsChanged, {
    email: emailKey,
    preferredMethod: normalizedMethod,
  });

  return normalizedMethod;
};

export const clearPreferredPaymentMethod = (email) => {
  const bucket = readJson(STORAGE_KEYS.preferredPayments, {});
  const emailKey = normalizeEmailKey(email);
  delete bucket[emailKey];
  writeJson(STORAGE_KEYS.preferredPayments, bucket);
  emitAppEvent(APP_EVENTS.paymentsChanged, { email: emailKey, preferredMethod: 'cash' });
};

const normalizeOrder = (order = {}, fallbackEmail = '') => {
  const statusId = Math.max(1, toInteger(order.estado_id ?? order.statusId ?? order.estado?.id, 1));
  const explicitStatus = safeString(order.statusLabel || order.status || order.estado?.descripcion || order.estado);
  const explicitStatusKey = normalizeStatusKey(explicitStatus).replace(/_/g, ' ');
  const statusFromId = STATUS_LABELS[statusId];
  const statusIdKey = normalizeStatusKey(statusFromId).replace(/_/g, ' ');
  const statusLabel = statusFromId && statusId !== 1 && (!explicitStatus || explicitStatusKey === 'pendiente' || explicitStatusKey !== statusIdKey)
    ? statusFromId
    : statusId === 1 && explicitStatusKey.includes('recib')
      ? STATUS_LABELS[1]
      : explicitStatus || statusFromId || STATUS_LABELS[1];
  const rawItems = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.itemsDetailed)
      ? order.itemsDetailed.map((item) => ({
          id: item.productId || item.producto_id || item.id,
          name: item.name || item.nombre,
          qty: item.quantity || item.cantidad,
          price: item.unitPrice || item.precio_unitario || item.price,
          subtotal: item.subtotal,
          tenantId: order.tenantId || order.tenant_id,
        }))
      : [];
  const orderId = safeString(order.id, `local-${Date.now()}`);
  const deliveryCode = resolveDeliveryCode(order, orderId);

  return {
    ...order,
    id: orderId,
    cliente_id: order.cliente_id ?? order.client_id ?? order.customerId ?? null,
    total: Math.max(0, toNumber(order.total ?? order.totalValue, 0)),
    direccion_entrega: safeString(order.direccion_entrega || order.address, 'Recogida en tienda'),
    notas: safeString(order.notas || order.notes),
    metodo_pago: safeString(order.metodo_pago || order.paymentMethod),
    creado_en: safeString(order.creado_en || order.createdAt, new Date().toISOString()),
    estado_id: statusId,
    estado: {
      ...(typeof order.estado === 'object' ? order.estado : {}),
      descripcion: statusLabel,
    },
    items: rawItems.map(normalizeCartItem),
    user_email: normalizeEmailKey(order.user_email || order.customerEmail || order.cliente?.correo || fallbackEmail),
    user_name: safeString(order.user_name || order.userName || order.customerName || order.cliente?.nombre || order.nombre),
    repartidor_nombre: safeString(order.repartidor_nombre || order.driverName || order.repartidor?.nombre),
    repartidor_email: normalizeEmailKey(order.repartidor_email || order.driverEmail),
    securityCode: deliveryCode,
    codigo_seguridad: deliveryCode,
    codigoDelivery: deliveryCode,
    source: safeString(order.source, String(orderId).startsWith('local-') ? 'local' : 'remote'),
  };
};

const sortOrdersByDate = (orders = []) =>
  [...orders].sort((left, right) => {
    const leftTime = new Date(left.creado_en).getTime();
    const rightTime = new Date(right.creado_en).getTime();
    return rightTime - leftTime;
  });

const sortNotificationsByDate = (notifications = []) =>
  [...notifications].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    return rightTime - leftTime;
  });

const normalizeNotification = (notification = {}) => ({
  id: safeString(notification.id, `notif-${Date.now()}`),
  type: safeString(notification.type, 'system'),
  title: safeString(notification.title, 'Notificacion'),
  message: safeString(notification.message, ''),
  icon: safeString(notification.icon, 'fa-regular fa-bell'),
  route: safeString(notification.route, ''),
  read: Boolean(notification.read),
  created_at: safeString(notification.created_at || notification.createdAt, new Date().toISOString()),
  order_id: notification.order_id ?? notification.orderId ?? null,
});

const readNotificationsBucket = () => readJson(STORAGE_KEYS.notifications, {});

const writeNotificationsBucket = (bucket, email = '') => {
  writeJson(STORAGE_KEYS.notifications, bucket);
  const emailKey = normalizeEmailKey(email);
  const notifications = sortNotificationsByDate((bucket[emailKey] || []).map(normalizeNotification));
  emitAppEvent(APP_EVENTS.notificationsChanged, {
    email: emailKey,
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
  });
};

const ensureNotificationsForEmail = (email = '') => {
  const emailKey = normalizeEmailKey(email);
  const bucket = readNotificationsBucket();

  if (!Array.isArray(bucket[emailKey])) {
    bucket[emailKey] = DEFAULT_NOTIFICATIONS.map((notification) => normalizeNotification(notification));
    writeNotificationsBucket(bucket, emailKey);
  }

  return { bucket, emailKey };
};

export const getNotifications = (email = '') => {
  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  return sortNotificationsByDate((bucket[emailKey] || []).map(normalizeNotification));
};

export const mergeNotifications = (notifications = [], email = '') => {
  const incoming = Array.isArray(notifications) ? notifications.map(normalizeNotification) : [];
  if (incoming.length === 0) return getNotifications(email);

  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  const current = (bucket[emailKey] || []).map(normalizeNotification);
  const currentById = new Map(current.map((notification) => [String(notification.id), notification]));
  const incomingIds = new Set(incoming.map((notification) => String(notification.id)));

  bucket[emailKey] = sortNotificationsByDate([
    ...incoming.map((notification) => ({
      ...notification,
      read: currentById.get(String(notification.id))?.read ?? Boolean(notification.read),
    })),
    ...current.filter((notification) => !incomingIds.has(String(notification.id))),
  ]);

  writeNotificationsBucket(bucket, emailKey);
  return getNotifications(emailKey);
};

export const getUnreadNotificationsCount = (email = '') =>
  getNotifications(email).filter((notification) => !notification.read).length;

export const addNotification = (notification = {}, email = '') => {
  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  const normalized = normalizeNotification({
    ...notification,
    id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: notification.created_at || new Date().toISOString(),
    read: false,
  });

  const current = (bucket[emailKey] || []).map(normalizeNotification);
  bucket[emailKey] = sortNotificationsByDate([
    normalized,
    ...current.filter((entry) => String(entry.id) !== String(normalized.id)),
  ]);
  writeNotificationsBucket(bucket, emailKey);
  return normalized;
};

export const markNotificationRead = (notificationId, email = '') => {
  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  bucket[emailKey] = (bucket[emailKey] || []).map((entry) => {
    const normalized = normalizeNotification(entry);
    return String(normalized.id) === String(notificationId)
      ? { ...normalized, read: true }
      : normalized;
  });
  writeNotificationsBucket(bucket, emailKey);
};

export const markAllNotificationsRead = (email = '') => {
  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  bucket[emailKey] = (bucket[emailKey] || []).map((entry) => ({
    ...normalizeNotification(entry),
    read: true,
  }));
  writeNotificationsBucket(bucket, emailKey);
};

export const clearNotifications = (email = '') => {
  const { bucket, emailKey } = ensureNotificationsForEmail(email);
  bucket[emailKey] = [];
  writeNotificationsBucket(bucket, emailKey);
};

const readOrdersBucket = () => readJson(STORAGE_KEYS.orders, {});

const writeOrdersBucket = (bucket) => {
  writeJson(STORAGE_KEYS.orders, bucket);
  emitAppEvent(APP_EVENTS.ordersChanged, bucket);
};

const normalizeDeliveryAssignment = (assignment = {}) => ({
  orderId: safeString(assignment.orderId || assignment.pedido_id || assignment.id),
  tenantId: safeString(assignment.tenantId || assignment.tenant_id),
  driverId: safeString(assignment.driverId || assignment.repartidor_id),
  repartidor_id: safeString(assignment.repartidor_id || assignment.driverId),
  driverName: safeString(assignment.driverName || assignment.repartidor_nombre, 'Repartidor FoodRush'),
  driverEmail: normalizeEmailKey(assignment.driverEmail || assignment.repartidor_email),
  status: safeString(assignment.status, 'accepted'),
  stage: safeString(assignment.stage, 'accepted'),
  assignedAt: safeString(assignment.assignedAt || assignment.creado_en, new Date().toISOString()),
  updatedAt: safeString(assignment.updatedAt, new Date().toISOString()),
});

const readDeliveryAssignments = () => readJson(STORAGE_KEYS.deliveryAssignments, {});

const writeDeliveryAssignments = (bucket) => {
  writeJson(STORAGE_KEYS.deliveryAssignments, bucket);
  emitAppEvent(APP_EVENTS.ordersChanged, readOrdersBucket());
};

export const getDeliveryAssignment = (orderId) => {
  const normalizedOrderId = safeString(orderId);
  if (!normalizedOrderId) return null;

  const assignment = readDeliveryAssignments()[normalizedOrderId];
  return assignment ? normalizeDeliveryAssignment(assignment) : null;
};

export const setDeliveryAssignment = (orderId, assignment = {}) => {
  const normalizedOrderId = safeString(orderId || assignment.orderId);
  if (!normalizedOrderId) return null;

  const bucket = readDeliveryAssignments();
  const previous = bucket[normalizedOrderId] || {};
  const normalized = normalizeDeliveryAssignment({
    ...previous,
    ...assignment,
    orderId: normalizedOrderId,
    updatedAt: new Date().toISOString(),
  });

  bucket[normalizedOrderId] = normalized;
  writeDeliveryAssignments(bucket);
  return normalized;
};

export const clearDeliveryAssignment = (orderId) => {
  const normalizedOrderId = safeString(orderId);
  if (!normalizedOrderId) return;

  const bucket = readDeliveryAssignments();
  delete bucket[normalizedOrderId];
  writeDeliveryAssignments(bucket);
};

export const getCachedOrders = (email) => {
  const bucket = readOrdersBucket();

  if (email) {
    const normalizedEmail = normalizeEmailKey(email);
    return sortOrdersByDate((bucket[normalizedEmail] || []).map((order) => normalizeOrder(order, email)));
  }

  return sortOrdersByDate(
    Object.values(bucket)
      .flat()
      .map((order) => normalizeOrder(order)),
  );
};

export const getCachedOrderById = (orderId, email) => {
  const directBucket = email ? getCachedOrders(email) : getCachedOrders();
  const directMatch = directBucket.find((order) => String(order.id) === String(orderId));
  if (directMatch) return directMatch;

  if (email) {
    return getCachedOrders().find((order) => String(order.id) === String(orderId)) || null;
  }

  return null;
};

export const saveCachedOrder = (order, email) => {
  const normalizedOrder = normalizeOrder(order, email);
  const bucket = readOrdersBucket();
  const emailKey = normalizeEmailKey(email || normalizedOrder.user_email);
  const currentOrders = (bucket[emailKey] || []).map((entry) => normalizeOrder(entry, emailKey));
  const nextOrders = sortOrdersByDate([
    normalizedOrder,
    ...currentOrders.filter((entry) => String(entry.id) !== String(normalizedOrder.id)),
  ]);

  bucket[emailKey] = nextOrders;
  writeOrdersBucket(bucket);
  return normalizedOrder;
};

export const updateCachedOrderStatus = (orderId, statusId, email, patch = {}) => {
  const bucket = readOrdersBucket();
  const emailKeys = email ? [normalizeEmailKey(email)] : Object.keys(bucket);
  let updatedOrder = null;

  emailKeys.forEach((emailKey) => {
    if (!Array.isArray(bucket[emailKey])) return;

    bucket[emailKey] = bucket[emailKey].map((entry) => {
      const normalizedEntry = normalizeOrder(entry, emailKey);
      if (String(normalizedEntry.id) !== String(orderId)) return normalizedEntry;

      updatedOrder = normalizeOrder(
        {
          ...normalizedEntry,
          ...patch,
          estado_id: statusId,
          estado: {
            ...(normalizedEntry.estado || {}),
            descripcion: getStatusLabel(statusId, normalizedEntry.estado?.descripcion),
          },
        },
        emailKey,
      );

      return updatedOrder;
    });
  });

  if (updatedOrder) {
    writeOrdersBucket(bucket);
    addNotification(
      {
        type: 'order',
        title: `Pedido #${updatedOrder.id} actualizado`,
        message: `Estado actual: ${updatedOrder.estado?.descripcion || getStatusLabel(statusId)}.`,
        icon: 'fa-solid fa-motorcycle',
        route: `/tracking/${updatedOrder.id}${updatedOrder.tenantId || updatedOrder.tenant_id ? `?tenant=${encodeURIComponent(updatedOrder.tenantId || updatedOrder.tenant_id)}` : ''}`,
        order_id: updatedOrder.id,
      },
      updatedOrder.user_email,
    );
  }

  return updatedOrder;
};

export const buildLocalOrder = ({
  orderPayload = {},
  userEmail = '',
  userName = '',
  clientId = null,
  paymentMethod = '',
  deliveryMode = 'delivery',
}) =>
  normalizeOrder(
    {
      id: `local-${Date.now()}`,
      cliente_id: clientId,
      total: orderPayload.total,
      direccion_entrega: orderPayload.direccion_entrega,
      notas: orderPayload.notas,
      estado_id: orderPayload.estado_id ?? 1,
      items: orderPayload.items || [],
      metodo_pago: paymentMethod || orderPayload.metodo_pago,
      creado_en: new Date().toISOString(),
      user_email: normalizeEmailKey(userEmail),
      user_name: userName,
      modo_entrega: deliveryMode,
      source: 'local',
    },
    userEmail,
  );

export const getLastClientId = (email) => {
  const clients = readJson(STORAGE_KEYS.clients, {});
  return clients[normalizeEmailKey(email)] || null;
};

export const setLastClientId = (email, clientId) => {
  const normalizedClientId = safeString(clientId);
  if (!normalizedClientId) return null;

  const clients = readJson(STORAGE_KEYS.clients, {});
  clients[normalizeEmailKey(email)] = normalizedClientId;
  writeJson(STORAGE_KEYS.clients, clients);
  return normalizedClientId;
};
