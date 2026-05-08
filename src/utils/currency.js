import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export const CURRENCY_STORAGE_KEY = 'foodrush_currency_preference';
export const CURRENCY_CHANGED_EVENT = 'foodrush:currency-changed';

const LIVE_RATE_URL = 'https://fxapi.app/api/dop.json';
const FALLBACK_RATE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/dop.json';
const RATE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const CURRENCY_OPTIONS = [
  {
    code: 'DOP',
    label: 'RD',
    currencyName: 'Peso dominicano',
    country: 'Republica Dominicana',
    prefix: 'RD$',
    suffix: '',
    dopPerUnit: 1,
    decimals: 0,
  },
  {
    code: 'USD',
    label: 'EEUU',
    currencyName: 'Dolar estadounidense',
    country: 'Estados Unidos',
    prefix: 'US$',
    suffix: '',
    dopPerUnit: 59,
    decimals: 2,
  },
  {
    code: 'EUR',
    label: 'Euro',
    currencyName: 'Euro',
    country: 'Union Europea',
    prefix: 'EUR ',
    suffix: '',
    dopPerUnit: 64,
    decimals: 2,
  },
];

const DEFAULT_CODE = 'DOP';
const SUPPORTED_CODES = new Set(CURRENCY_OPTIONS.map((item) => item.code));
const DEFAULT_RATES = Object.fromEntries(CURRENCY_OPTIONS.map((item) => [item.code, item.dopPerUnit]));

let refreshPromise = null;

const hasWindow = () => typeof window !== 'undefined';

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getCurrencyOption = (code = DEFAULT_CODE) =>
  CURRENCY_OPTIONS.find((option) => option.code === String(code || '').toUpperCase()) || CURRENCY_OPTIONS[0];

export const normalizeCurrencyCode = (code = DEFAULT_CODE) => getCurrencyOption(code).code;

const normalizeCurrencyRate = (value, fallback = 1) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeRates = (rates = {}) => {
  const nextRates = { ...DEFAULT_RATES };

  if (!rates || typeof rates !== 'object') return nextRates;

  Object.entries(rates).forEach(([rateCode, value]) => {
    const code = String(rateCode || '').toUpperCase();
    if (!SUPPORTED_CODES.has(code)) return;
    nextRates[code] = normalizeCurrencyRate(value, DEFAULT_RATES[code]);
  });

  nextRates.DOP = 1;
  return nextRates;
};

const normalizeTimestamp = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const getCurrencyPreference = () => {
  const stored = hasWindow()
    ? safeJsonParse(window.localStorage.getItem(CURRENCY_STORAGE_KEY), {})
    : {};
  const code = normalizeCurrencyCode(stored?.code || DEFAULT_CODE);

  return {
    code,
    rates: normalizeRates(stored?.rates),
    fetchedAt: normalizeTimestamp(stored?.fetchedAt),
    source: typeof stored?.source === 'string' ? stored.source : 'local',
  };
};

export const saveCurrencyPreference = ({ code, rates, fetchedAt, source } = {}) => {
  const current = getCurrencyPreference();
  const preference = {
    code: normalizeCurrencyCode(code || current.code),
    rates: rates ? normalizeRates({ ...current.rates, ...rates }) : normalizeRates(current.rates),
    fetchedAt: fetchedAt === undefined ? current.fetchedAt : normalizeTimestamp(fetchedAt),
    source: source || current.source || 'local',
  };

  if (hasWindow()) {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(preference));
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGED_EVENT, { detail: preference }));
  }

  return preference;
};

export const setActiveCurrency = (code) => saveCurrencyPreference({ code });

const getRateValue = (rates, code) => Number.parseFloat(rates?.[code] ?? rates?.[code.toLowerCase()]);

const parseDopBaseRates = (rates) => {
  if (!rates || typeof rates !== 'object') return null;

  const nextRates = { DOP: 1 };
  let validRates = 0;

  ['USD', 'EUR'].forEach((code) => {
    const dopToCurrency = getRateValue(rates, code);
    if (Number.isFinite(dopToCurrency) && dopToCurrency > 0) {
      nextRates[code] = 1 / dopToCurrency;
      validRates += 1;
    }
  });

  return validRates > 0 ? nextRates : null;
};

const RATE_PROVIDERS = [
  {
    source: 'fxapi.app',
    url: LIVE_RATE_URL,
    parse: (payload) => parseDopBaseRates(payload?.rates),
  },
  {
    source: 'currency-api',
    url: FALLBACK_RATE_URL,
    parse: (payload) => parseDopBaseRates(payload?.dop),
  },
];

export const refreshCurrencyRates = async ({ force = false } = {}) => {
  const current = getCurrencyPreference();

  if (!hasWindow() || typeof fetch !== 'function') return current;
  if (!force && current.fetchedAt && Date.now() - current.fetchedAt < RATE_REFRESH_INTERVAL_MS) {
    return current;
  }
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    for (const provider of RATE_PROVIDERS) {
      try {
        const response = await fetch(provider.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        const rates = provider.parse(payload);
        if (rates) {
          return saveCurrencyPreference({
            rates,
            fetchedAt: Date.now(),
            source: provider.source,
          });
        }
      } catch (error) {
        console.warn(`No se pudo actualizar la tasa desde ${provider.source}`, error);
      }
    }

    return current;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export const startCurrencyRateAutoRefresh = () => {
  if (!hasWindow()) return () => {};

  const refreshWhenIdle = () => refreshCurrencyRates();
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(refreshWhenIdle, { timeout: 3000 });
  } else {
    window.setTimeout(refreshWhenIdle, 1500);
  }

  const intervalId = window.setInterval(() => {
    refreshCurrencyRates({ force: true });
  }, RATE_REFRESH_INTERVAL_MS);

  const refreshWhenVisible = () => {
    if (!document.hidden) refreshCurrencyRates();
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', refreshWhenVisible);
  }

  return () => {
    window.clearInterval(intervalId);
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    }
  };
};

const resolveCurrencyConfig = (options = {}) => {
  const preference = options.preference || getCurrencyPreference();
  const code = normalizeCurrencyCode(options.code || preference.code);
  const option = getCurrencyOption(code);
  const rates = normalizeRates({
    ...(preference.rates || {}),
    ...(options.rates || {}),
  });

  return {
    ...option,
    dopPerUnit: normalizeCurrencyRate(rates[code], option.dopPerUnit),
  };
};

export const convertFromDop = (amount, options = {}) => {
  const currency = resolveCurrencyConfig(options);
  const parsed = Number.parseFloat(amount);
  const baseAmount = Number.isFinite(parsed) ? parsed : 0;
  return baseAmount / currency.dopPerUnit;
};

const formatNumber = (value, decimals) =>
  new Intl.NumberFormat('es-DO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

export const formatCurrency = (amount, options = {}) => {
  const currency = resolveCurrencyConfig(options);
  const converted = convertFromDop(amount, options);
  const decimals = Number.isInteger(options.decimals) ? options.decimals : currency.decimals;
  const sign = converted < 0 ? '-' : options.sign || '';
  const absolute = Math.abs(converted);

  if (options.compact && absolute >= 1000) {
    const compactValue = absolute / 1000;
    const compactDecimals = compactValue >= 10 ? 0 : 1;
    return `${sign}${currency.prefix || ''}${formatNumber(compactValue, compactDecimals)}k${currency.suffix || ''}`;
  }

  return `${sign}${currency.prefix || ''}${formatNumber(absolute, decimals)}${currency.suffix || ''}`;
};

export const formatSignedCurrency = (amount, options = {}) => {
  const parsed = Number.parseFloat(amount);
  const value = Number.isFinite(parsed) ? parsed : 0;
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return formatCurrency(Math.abs(value), { ...options, sign });
};

export const useCurrency = () => {
  const preference = ref(getCurrencyPreference());

  const syncPreference = (event) => {
    preference.value = event?.detail || getCurrencyPreference();
  };

  onMounted(() => {
    if (!hasWindow()) return;
    window.addEventListener(CURRENCY_CHANGED_EVENT, syncPreference);
    refreshCurrencyRates();
  });

  onBeforeUnmount(() => {
    if (hasWindow()) window.removeEventListener(CURRENCY_CHANGED_EVENT, syncPreference);
  });

  return {
    currencyOptions: CURRENCY_OPTIONS,
    currencyPreference: computed(() => preference.value),
    formatCurrency: (amount, options = {}) =>
      formatCurrency(amount, { ...options, preference: preference.value }),
    formatSignedCurrency: (amount, options = {}) =>
      formatSignedCurrency(amount, { ...options, preference: preference.value }),
  };
};
