const API_URL = (import.meta.env.VITE_API_URL || 'https://proyecto-foodrush.onrender.com').trim();
const DEFAULT_TENANT_ID = String(import.meta.env.VITE_DEFAULT_TENANT_ID || '1').trim();

const hasWindow = () => typeof window !== 'undefined';

const buildUrl = (endpoint) => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  return `${API_URL}${endpoint}`;
};

const getRealtimeHeaders = (tenantId = '') => {
  const headers = {
    Accept: 'text/event-stream',
    'X-Tenant-ID': String(tenantId || DEFAULT_TENANT_ID),
  };

  if (hasWindow()) {
    const token = window.localStorage.getItem('auth_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseSseFrame = (frame = '') => {
  const lines = frame.split(/\r?\n/);
  let event = 'message';
  const dataLines = [];

  lines.forEach((line) => {
    if (line.startsWith('event:')) event = line.slice(6).trim() || event;
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  });

  if (dataLines.length === 0) return null;

  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return { event, data: dataLines.join('\n') };
  }
};

export const connectRealtime = ({ tenantId, onEvent, onError } = {}) => {
  if (!hasWindow() || !tenantId || typeof fetch !== 'function') {
    return { close() {} };
  }

  const controller = new AbortController();
  let closed = false;

  const start = async () => {
    try {
      const response = await fetch(buildUrl(`/api/realtime/stream?tenant_id=${encodeURIComponent(tenantId)}`), {
        headers: getRealtimeHeaders(tenantId),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Realtime no disponible (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\n\n/);
        buffer = frames.pop() || '';

        frames
          .map(parseSseFrame)
          .filter(Boolean)
          .forEach((message) => onEvent?.(message));
      }
    } catch (error) {
      if (!closed && error.name !== 'AbortError') {
        onError?.(error);
      }
    }
  };

  void start();

  return {
    close() {
      closed = true;
      controller.abort();
    },
  };
};
