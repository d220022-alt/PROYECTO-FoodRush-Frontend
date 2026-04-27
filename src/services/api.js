const API_URL = (import.meta.env.VITE_API_URL || 'https://proyecto-foodrush.onrender.com').trim();
const REQUEST_TIMEOUT_MS = 60000;
let cachedOrderStatusesPromise = null;

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

const createHeaders = (extraHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : '';
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
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

export const api = {
  async resolveOrderStatusId(preferredId = null) {
    if (!cachedOrderStatusesPromise) {
      cachedOrderStatusesPromise = this.request('/api/estadospedidos')
        .then((payload) => normalizeCollectionResult(payload, ['data']).data)
        .catch((error) => {
          cachedOrderStatusesPromise = null;
          throw error;
        });
    }

    const statuses = await cachedOrderStatusesPromise;
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return null;
    }

    const requestedId = Number.parseInt(preferredId, 10);
    if (Number.isFinite(requestedId)) {
      const existingStatus = statuses.find((status) => Number.parseInt(status?.id, 10) === requestedId);
      if (existingStatus) return requestedId;
    }

    const firstStatusId = Number.parseInt(statuses[0]?.id, 10);
    return Number.isFinite(firstStatusId) ? firstStatusId : null;
  },

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

        throw new Error(message);
      }

      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('El servidor tardo demasiado en responder. Intenta nuevamente.');
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

  async login(email, password) {
    return normalizeAuthResult(
      await this.request('/api/usuarios/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          correo: email,
          contrasena: password,
        }),
      }),
    );
  },

  async ensureTenantId(preferredId = null) {
    const preferredTenantId = Number.parseInt(preferredId, 10);
    const tenants = normalizeCollectionResult(await this.request('/api/tenants'), ['data', 'tenants']).data;

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

  async register(userData) {
    const tenantId = await this.ensureTenantId(userData.tenantId || 1);

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
        body: JSON.stringify(payload),
      }),
      ['data', 'user', 'usuario'],
    );
  },

  async getUser(id) {
    return normalizeEntityResult(await this.request(`/api/usuarios/${id}`), ['data', 'user', 'usuario']);
  },

  async updateUser(id, data) {
    return normalizeEntityResult(
      await this.request(`/api/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      ['data', 'user', 'usuario'],
    );
  },

  async changePassword(userId, currentPassword, newPassword) {
    return normalizeEntityResult(
      await this.request(`/api/usuarios/${userId}/password`, {
        method: 'PUT',
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

  async getClients(params = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/clientes?${query}` : '/api/clientes';
    const normalized = normalizeCollectionResult(await this.request(endpoint), ['data', 'clientes']);

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

  async createClient(clientData) {
    return normalizeEntityResult(
      await this.request('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(clientData),
      }),
      ['data', 'cliente'],
    );
  },

  async createOrder(orderData) {
    const resolvedStatusId = await this.resolveOrderStatusId(orderData?.estado_id);
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
        body: JSON.stringify({
          ...orderData,
          estado_id: resolvedStatusId,
        }),
      }),
      ['data', 'pedido'],
    );
  },

  async getOrders(params = {}) {
    const queryParams = sanitizeParams(params);
    const query = new URLSearchParams(queryParams).toString();
    const endpoint = query ? `/api/pedidos?${query}` : '/api/pedidos';
    const normalized = normalizeCollectionResult(await this.request(endpoint), ['data', 'pedidos']);

    return {
      ...normalized,
      data: filterCollectionByParams(normalized.data, queryParams, {
        cliente_id: ['clienteId'],
        tenant_id: ['tenantId'],
      }),
    };
  },

  async getOrder(id) {
    if (isLocalOnlyOrderId(id)) {
      return {
        success: false,
        error: 'LOCAL_ONLY_ORDER',
        message: 'El pedido solo existe localmente.',
        data: null,
      };
    }

    return normalizeEntityResult(await this.request(`/api/pedidos/${id}`), ['data', 'pedido']);
  },

  async updateOrder(id, data) {
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
      const resolvedStatusId = await this.resolveOrderStatusId(data?.estado_id);
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
        body: JSON.stringify(payload),
      }),
      ['data', 'pedido'],
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
