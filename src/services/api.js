/*
  Guia rapida para presentar:
  Cliente HTTP principal. Centraliza llamadas al backend, headers de tenant, token y mensajes de error.
  Buscar en VS Code: api, backend, fetch, token, X-Tenant-ID, login, register, pedidos, productos.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
const API_URL = (import.meta.env.VITE_API_URL || 'https://proyecto-foodrush.onrender.com').trim();
const DEFAULT_TENANT_ID = String(import.meta.env.VITE_DEFAULT_TENANT_ID || '1').trim();
const REQUEST_TIMEOUT_MS = 60000;
const TENANT_HEADER_KEYS = ['X-Tenant-ID', 'x-tenant-id', 'tenant-id'];
let cachedOrderStatusesPromise = null;

// IDs de respaldo por si el backend tarda o no devuelve el catalogo de estados.
const FALLBACK_ORDER_STATUS_IDS = {
  pendiente: 1,
  preparando: 3,
  'en camino': 4,
  entregado: 5,
  cancelado: 6,
};

const inferPayloadData = (payload, preferredKeys = []) => {
  if (payload === null || payload === undefined) return null;
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== 'object') return payload;

  const candidateKeys = [
    ...preferredKeys,
    'data',
    'items',
    'results',
    'rows',
    'user',
    'usuario',
    'cliente',
    'clientes',
    'pedido',
    'pedidos',
    'producto',
    'productos',
    'tenants',
  ];

  for (const key of candidateKeys) {
    if (payload[key] !== undefined) {
      return payload[key];
    }
  }

  return null;
};

// El backend mezcla respuestas tipo array, objeto plano y { data }. Estas funciones uniforman todo.
const normalizeResult = (payload, preferredKeys = []) => {
  if (payload === null || payload === undefined) {
    return { success: true, data: null };
  }

  if (Array.isArray(payload)) {
    return { success: true, data: payload };
  }

  if (typeof payload !== 'object') {
    return { success: true, data: payload };
  }

  const data = inferPayloadData(payload, preferredKeys);
  const success = 'success' in payload ? payload.success !== false : !payload.error;

  return {
    ...payload,
    success,
    data: data ?? payload.data ?? null,
  };
};

const normalizeCollectionResult = (payload, preferredKeys = []) => {
  const normalized = normalizeResult(payload, preferredKeys);
  const data = Array.isArray(normalized.data)
    ? normalized.data
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    ...normalized,
    data,
  };
};

const normalizeEntityResult = (payload, preferredKeys = []) => {
  const normalized = normalizeResult(payload, preferredKeys);
  const entity =
    normalized.data ??
    inferPayloadData(payload, preferredKeys) ??
    (payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null);

  return {
    ...normalized,
    data: entity,
  };
};

const hasMeaningfulValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';
const isLocalOnlyOrderId = (value) => String(value || '').trim().toLowerCase().startsWith('local-');

const normalizeStatusToken = (value = '') =>
  String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .toLowerCase();

const getStatusSemanticKey = (value = '') => {
  const normalized = normalizeStatusToken(value);
  if (!normalized) return '';
  if (normalized.includes('cancel')) return 'cancelado';
  if (normalized.includes('entreg')) return 'entregado';
  if (normalized.includes('transito') || normalized.includes('camino') || normalized.includes('ruta') || normalized.includes('shipping')) return 'en camino';
  if (normalized.includes('pend') || normalized.includes('recib') || normalized.includes('solicit')) return 'pendiente';
  if (normalized.includes('prepar') || normalized.includes('confirm')) return 'preparando';
  return normalized;
};

const getStatusSearchValues = (status = {}) => [
  status.codigo,
  status.descripcion,
  status.nombre,
  status.label,
  status.estado,
].map(getStatusSemanticKey).filter(Boolean);

const getFallbackOrderStatusId = (value = '') => {
  const requestedId = Number.parseInt(value, 10);
  if (Number.isFinite(requestedId)) return requestedId;
  const key = getStatusSemanticKey(value);
  return FALLBACK_ORDER_STATUS_IDS[key] || null;
};

const sanitizeParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ''),
  );

const valuesMatch = (left, right) => {
  if (!hasMeaningfulValue(left) || !hasMeaningfulValue(right)) return false;

  const leftNumber = Number.parseFloat(left);
  const rightNumber = Number.parseFloat(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber === rightNumber;
  }

  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
};

const filterCollectionByParams = (collection, params = {}, aliases = {}) => {
  const entries = Object.entries(sanitizeParams(params));
  if (!entries.length) return Array.isArray(collection) ? collection : [];

  return (Array.isArray(collection) ? collection : []).filter((item) =>
    entries.every(([key, expected]) => {
      const candidateKeys = [key, ...(aliases[key] || [])];
      return candidateKeys.some((candidateKey) => valuesMatch(item?.[candidateKey], expected));
    }),
  );
};

const hasUserIdentity = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;

  const identityKeys = [
    'id',
    'user_id',
    'usuario_id',
    'cliente_id',
    'nombre',
    'name',
    'username',
    'correo',
    'email',
    'telefono',
    'phone',
  ];

  return identityKeys.some((key) => hasMeaningfulValue(candidate[key]));
};

const resolveAuthUserEntity = (normalized, payload) => {
  const normalizedData =
    normalized?.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)
      ? normalized.data
      : null;
  const payloadData =
    payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : null;

  const candidates = [
    normalizedData?.user,
    normalizedData?.usuario,
    normalizedData?.cliente,
    payloadData?.user,
    payloadData?.usuario,
    payloadData?.cliente,
    normalized?.user,
    normalized?.usuario,
    normalized?.cliente,
    payload?.user,
    payload?.usuario,
    payload?.cliente,
    normalizedData,
    payloadData,
    payload,
  ];

  for (const candidate of candidates) {
    if (hasUserIdentity(candidate)) {
      return candidate;
    }
  }

  return null;
};

const resolveAuthToken = (normalized, payload) => {
  const normalizedData =
    normalized?.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)
      ? normalized.data
      : null;
  const payloadData =
    payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : null;

  const candidates = [
    normalized?.token,
    normalized?.accessToken,
    payload?.token,
    payload?.accessToken,
    normalizedData?.token,
    normalizedData?.accessToken,
    payloadData?.token,
    payloadData?.accessToken,
    payloadData?.data?.token,
    payloadData?.data?.accessToken,
  ];

  const token = candidates.find((candidate) => hasMeaningfulValue(candidate));
  return token ? String(token).trim() : '';
};

const normalizeAuthResult = (payload) => {
  const normalized = normalizeResult(payload, ['user', 'usuario']);
  const user = resolveAuthUserEntity(normalized, payload);
  const token = resolveAuthToken(normalized, payload);

  return {
    ...normalized,
    success: normalized.success && Boolean(user || token),
    token,
    user,
    data: user,
  };
};

const buildUrl = (endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  return `${API_URL}${endpoint}`;
};

const normalizeResourcePath = (resource = '') => {
  const normalized = String(resource || '').trim().replace(/^\/+/, '');
  if (!normalized) {
    throw new Error('Se requiere un recurso de API valido.');
  }

  return normalized.startsWith('api/') ? `/${normalized}` : `/api/${normalized}`;
};

const hasTenantHeader = (headers = {}) =>
  TENANT_HEADER_KEYS.some((key) => hasMeaningfulValue(headers?.[key]));

const resolveTenantHeaderValue = () => {
  if (typeof window === 'undefined') return DEFAULT_TENANT_ID;

  const storedTenantId = window.localStorage.getItem('user_tenant_id');
  if (hasMeaningfulValue(storedTenantId)) {
    return String(storedTenantId).trim();
  }

  return DEFAULT_TENANT_ID;
};

// Preparamos headers en un solo lugar para no olvidar tenant ni token en llamadas nuevas.
const createHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : '';
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = resolveTenantHeaderValue();
  if (tenantId && !hasTenantHeader(headers)) {
    headers['X-Tenant-ID'] = tenantId;
  }

  return headers;
};

const parseResponseBody = async (response) => {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const createApiError = (message, details = {}) => {
  const error = new Error(message || 'No se pudo completar la solicitud.');
  Object.assign(error, details);
  return error;
};

// Fachada publica: las vistas usan estos metodos y no tienen que saber URLs exactas del backend.
export const api = {
  async resolveOrderStatusId(preferredId = null, headers = {}) {
    const fallbackStatusId = getFallbackOrderStatusId(preferredId);

    if (!cachedOrderStatusesPromise) {
      cachedOrderStatusesPromise = this.request('/api/estadospedidos', { headers })
        .then((payload) => normalizeCollectionResult(payload, ['data']).data)
        .catch((error) => {
          cachedOrderStatusesPromise = null;
          if (fallbackStatusId) return [];
          throw error;
        });
    }

    const statuses = await cachedOrderStatusesPromise;
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return fallbackStatusId;
    }

    const requestedId = Number.parseInt(preferredId, 10);
    if (Number.isFinite(requestedId)) {
      const existingStatus = statuses.find((status) => Number.parseInt(status?.id, 10) === requestedId);
      if (existingStatus) return requestedId;
    }

    const requestedStatusKey = getStatusSemanticKey(preferredId);
    if (requestedStatusKey) {
      const matchingStatus = statuses.find((status) => getStatusSearchValues(status).includes(requestedStatusKey));
      const matchingStatusId = Number.parseInt(matchingStatus?.id, 10);
      if (Number.isFinite(matchingStatusId)) return matchingStatusId;
    }

    const firstStatusId = Number.parseInt(statuses[0]?.id, 10);
    return Number.isFinite(firstStatusId) ? firstStatusId : null;
  },

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Todas las llamadas pasan por aqui: timeout, bearer token, tenant y errores legibles para la UI.
    const config = {
      ...options,
      signal: controller.signal,
      headers: createHeaders(options.headers),
    };

    try {
      const response = await fetch(buildUrl(endpoint), config);
      const payload = await parseResponseBody(response);

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.error ||
          `Error ${response.status}: ${response.statusText}`;

        throw createApiError(message, {
          status: response.status,
          code: payload?.error || payload?.code || null,
          payload,
          retryAfter: response.headers.get('retry-after'),
        });
      }

      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw createApiError('El servidor tardó demasiado en responder. Intenta nuevamente.', {
          code: 'REQUEST_TIMEOUT',
          status: 0,
        });
      }

      if (error instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(error.message || '')) {
        throw createApiError('No pudimos conectar con el servidor de FoodRush. Revisa tu conexión e intenta nuevamente.', {
          code: 'NETWORK_ERROR',
          status: 0,
        });
      }

      if (error.status) {
        throw error;
      }

      console.error('API Error:', error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async getFranchises() {
    return normalizeCollectionResult(await this.request('/api/tenants'), ['data', 'tenants']);
  },

  async getProducts(params = {}, headers = {}) {
    const queryParams = sanitizeParams({
      ...params,
      limite: params.limite ?? params.limit,
    });
    delete queryParams.limit;

    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/productos?${query}` : '/api/productos';
    return normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'productos']);
  },

  // Login acepta correo o usuario; si falta tenant, usamos el default para evitar errores confusos.
  async login(identifier, password, headers = {}) {
    const loginHeaders = { ...headers };
    if (!hasTenantHeader(loginHeaders)) {
      loginHeaders['X-Tenant-ID'] = DEFAULT_TENANT_ID;
    }

    const rawIdentifier = String(identifier || '').trim();
    const normalizedIdentifier = rawIdentifier.includes('@')
      ? rawIdentifier.toLowerCase()
      : rawIdentifier;

    return normalizeAuthResult(
      await this.request('/api/usuarios/login', {
        method: 'POST',
        headers: loginHeaders,
        body: JSON.stringify({
          identifier: normalizedIdentifier,
          usuario: normalizedIdentifier,
          username: normalizedIdentifier,
          email: normalizedIdentifier,
          password,
          correo: normalizedIdentifier,
          contrasena: password,
        }),
      }),
    );
  },

  async ensureTenantId(preferredId = null, headers = {}) {
    const preferredTenantId = Number.parseInt(preferredId, 10);
    const tenants = normalizeCollectionResult(await this.request('/api/tenants', { headers }), ['data', 'tenants']).data;

    if (Number.isFinite(preferredTenantId)) {
      const preferredTenant = tenants.find((tenant) => Number.parseInt(tenant.id, 10) === preferredTenantId);
      if (preferredTenant) return preferredTenantId;
    }

    const firstTenantId = Number.parseInt(tenants[0]?.id, 10);
    if (Number.isFinite(firstTenantId)) {
      return firstTenantId;
    }

    const createdTenant = normalizeEntityResult(
      await this.request('/api/tenants', {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre: 'FoodRush' }),
      }),
      ['data', 'tenant'],
    );

    const createdTenantId = Number.parseInt(createdTenant.data?.id, 10);
    if (Number.isFinite(createdTenantId)) {
      return createdTenantId;
    }

    throw new Error('No se pudo resolver un tenant válido para registrar el usuario.');
  },

  // Registro envia X-Tenant-ID de forma explicita porque el backend lo exige para crear usuarios.
  async register(userData, headers = {}) {
    const tenantId = await this.ensureTenantId(userData.tenantId || 1, headers);

    const payload = {
      nombre: userData.name,
      correo: userData.email,
      contrasena: userData.password,
      telefono: userData.phone,
      direccion: userData.direccion,
      zona: userData.zona,
      tenant_id: tenantId,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
    };

    return normalizeEntityResult(
      await this.request('/api/usuarios', {
        method: 'POST',
        headers: { ...headers, 'X-Tenant-ID': String(tenantId) },
        body: JSON.stringify(payload),
      }),
      ['data', 'user', 'usuario'],
    );
  },

  async getUser(id, headers = {}) {
    return normalizeEntityResult(await this.request(`/api/usuarios/${id}`, { headers }), ['data', 'user', 'usuario']);
  },

  async updateUser(id, data, headers = {}) {
    return normalizeEntityResult(
      await this.request(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }),
      ['data', 'user', 'usuario'],
    );
  },

  async changePassword(userId, currentPassword, newPassword, headers = {}) {
    return normalizeEntityResult(
      await this.request(`/api/usuarios/${userId}/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          currentPassword,
          newPassword,
          current_password: currentPassword,
          new_password: newPassword,
          contrasenaActual: currentPassword,
          contrasenaNueva: newPassword,
        }),
      }),
      ['data'],
    );
  },

  async getClients(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/clientes?${query}` : '/api/clientes';
    const normalized = normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'clientes']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        correo: ['email'],
        email: ['correo'],
        telefono: ['phone'],
        phone: ['telefono'],
        nombre: ['name'],
        tenant_id: ['tenantId'],
      }),
    };
  },

  async createClient(clientData, headers = {}) {
    return normalizeEntityResult(
      await this.request('/api/clientes', {
        method: 'POST',
        headers,
        body: JSON.stringify(clientData),
      }),
      ['data', 'cliente'],
    );
  },

  // Checkout termina aqui: arma el pedido remoto y deja el backend como fuente principal.
  async createOrder(orderData, headers = {}) {
    const resolvedStatusId = await this.resolveOrderStatusId(orderData?.estado_id, headers);
    if (!resolvedStatusId) {
      return {
        success: false,
        error: 'REMOTE_ORDER_UNAVAILABLE',
        message: 'El backend no tiene estados de pedido configurados.',
        data: null,
      };
    }

    return normalizeEntityResult(
      await this.request('/api/pedidos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...orderData,
          estado_id: resolvedStatusId,
        }),
      }),
      ['data', 'pedido'],
    );
  },

  async getOrders(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/pedidos?${query}` : '/api/pedidos';
    const normalized = normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'pedidos']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        cliente_id: ['clienteId'],
        tenant_id: ['tenantId'],
      }),
    };
  },

  async getOrder(id, headers = {}) {
    if (isLocalOnlyOrderId(id)) {
      return {
        success: false,
        error: 'LOCAL_ONLY_ORDER',
        message: 'El pedido solo existe localmente.',
        data: null,
      };
    }

    return normalizeEntityResult(await this.request(`/api/pedidos/${id}`, { headers }), ['data', 'pedido']);
  },

  async updateOrder(id, data, headers = {}) {
    if (isLocalOnlyOrderId(id)) {
      return {
        success: false,
        error: 'LOCAL_ONLY_ORDER',
        message: 'El pedido solo existe localmente.',
        data: null,
      };
    }

    let payload = data;
    if (Object.prototype.hasOwnProperty.call(data || {}, 'estado_id')) {
      const resolvedStatusId = await this.resolveOrderStatusId(data?.estado_id, headers);
      if (!resolvedStatusId) {
        return {
          success: false,
          error: 'REMOTE_ORDER_UNAVAILABLE',
          message: 'El backend no tiene estados de pedido configurados.',
          data: null,
        };
      }

      payload = {
        ...data,
        estado_id: resolvedStatusId,
      };
    }

    return normalizeEntityResult(
      await this.request(`/api/pedidos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      }),
      ['data', 'pedido'],
    );
  },

  async getUsers(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/usuarios?${query}` : '/api/usuarios';
    const normalized = normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'users', 'usuarios']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        tenant_id: ['tenantId'],
        correo: ['email'],
        email: ['correo'],
        telefono: ['phone'],
        phone: ['telefono'],
        nombre: ['name'],
      }),
    };
  },

  async getOrderItems(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/pedidoitems?${query}` : '/api/pedidoitems';
    const normalized = normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'items', 'pedidoitems']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        pedido_id: ['pedidoId'],
        producto_id: ['productoId'],
      }),
    };
  },

  async getServerNotifications(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/notificaciones?${query}` : '/api/notificaciones';
    return normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'notificaciones']);
  },

  async getDeliveryAssignments(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/realtime/assignments?${query}` : '/api/realtime/assignments';
    return normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'assignments']);
  },

  async upsertDeliveryAssignment(data, headers = {}) {
    return normalizeEntityResult(
      await this.request('/api/realtime/assignments', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }),
      ['data', 'assignment'],
    );
  },

  async recordDriverLocation(data, headers = {}) {
    return normalizeEntityResult(
      await this.request('/api/realtime/location', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }),
      ['data', 'location'],
    );
  },

  async getSessions(params = {}, headers = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/sesionesusuarios?${query}` : '/api/sesionesusuarios';
    const normalized = normalizeCollectionResult(await this.request(endpoint, { headers }), ['data', 'sessions', 'sesionesusuarios']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        usuario_id: ['user_id'],
      }),
    };
  },

  async getAdminOperationsState(headers = {}) {
    return normalizeEntityResult(await this.request('/api/admin/operations/state', { headers }), ['data']);
  },

  async getAdminOperationZones(headers = {}) {
    return normalizeCollectionResult(await this.request('/api/admin/operations/zones', { headers }), ['data', 'zones']);
  },

  async upsertAdminOperationZone(zone, headers = {}) {
    const zoneId = encodeURIComponent(String(zone?.id || '').trim());
    return normalizeEntityResult(
      await this.request(`/api/admin/operations/zones/${zoneId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(zone),
      }),
      ['data', 'zone'],
    );
  },

  async getAdminOperationClosures(headers = {}) {
    return normalizeCollectionResult(await this.request('/api/admin/operations/closures', { headers }), ['data', 'closures']);
  },

  async createAdminOperationClosure(record, headers = {}) {
    return normalizeEntityResult(
      await this.request('/api/admin/operations/closures', {
        method: 'POST',
        headers,
        body: JSON.stringify(record),
      }),
      ['data', 'closure'],
    );
  },

  async getAdminOperationAudit(headers = {}) {
    return normalizeCollectionResult(await this.request('/api/admin/operations/audit', { headers }), ['data', 'audit']);
  },

  async createAdminOperationAudit(entry, headers = {}) {
    return normalizeEntityResult(
      await this.request('/api/admin/operations/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
      }),
      ['data', 'entry'],
    );
  },

  async createResource(resource, data, headers = {}) {
    return normalizeEntityResult(
      await this.request(normalizeResourcePath(resource), {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }),
      ['data'],
    );
  },

  async updateResource(resource, id, data, headers = {}) {
    return normalizeEntityResult(
      await this.request(`${normalizeResourcePath(resource)}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      }),
      ['data'],
    );
  },

  async health() {
    return normalizeEntityResult(await this.request('/api/health'), ['data']);
  },

  isNetworkError(error) {
    const message = String(error?.message || '').toLowerCase();
    return (
      error instanceof TypeError ||
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('servidor')
    );
  },
};
