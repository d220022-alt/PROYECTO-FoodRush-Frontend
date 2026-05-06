const RD_PLACE_KEYWORDS = [
  'republica dominicana',
  'santo domingo',
  'distrito nacional',
  'santiago',
  'santiago de los caballeros',
  'gurabo',
  'villa olga',
  'pekin',
  'los jardines',
  'la trinitaria',
  'la zurza',
  'los alamos',
  'cerros de gurabo',
  'la vega',
  'san cristobal',
  'san pedro',
  'san francisco de macoris',
  'puerto plata',
  'la romana',
  'higuey',
  'bonao',
  'moca',
  'azua',
  'bani',
  'barahona',
  'san juan',
  'maimom',
];

const ADDRESS_SIGNAL_KEYWORDS = [
  'calle',
  'avenida',
  'av',
  'autopista',
  'carretera',
  'residencial',
  'urbanizacion',
  'urb',
  'sector',
  'ensanche',
  'barrio',
  'prolongacion',
  'apartamento',
  'apto',
  'edificio',
  'manzana',
  'casa',
  'plaza',
  'km',
];

export const DELIVERY_ZONE_OPTIONS = [
  { key: 'pekin', label: 'Pekin', fee: 25, keywords: ['pekin'] },
  { key: 'gurabo', label: 'Gurabo', fee: 50, keywords: ['gurabo', 'cerros de gurabo'] },
  { key: 'villa_olga', label: 'Villa Olga', fee: 75, keywords: ['villa olga'] },
  { key: 'santiago_centro', label: 'Santiago Centro', fee: 40, keywords: ['santiago', 'los jardines', 'la trinitaria'] },
];

export const DEFAULT_DELIVERY_FEE = 50;

const normalizeLookupText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const normalizeDominicanAddressInput = (value = '') =>
  String(value || '')
    .replace(/[^a-zA-Z0-9\u00C0-\u00FF\u00D1\u00F1\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const hasAddressSymbols = (value = '') =>
  /[^a-zA-Z0-9\u00C0-\u00FF\u00D1\u00F1\s]/.test(String(value || ''));

export const resolveDominicanAddressZone = (address = '', fallbackZone = '') => {
  const normalized = normalizeLookupText(address);
  const byAddress = DELIVERY_ZONE_OPTIONS.find((zone) =>
    zone.keywords.some((keyword) => normalized.includes(normalizeLookupText(keyword))),
  );
  if (byAddress) return byAddress;

  const fallback = normalizeLookupText(fallbackZone).replace(/-/g, '_');
  return DELIVERY_ZONE_OPTIONS.find((zone) => zone.key === fallback) || null;
};

export const getDeliveryFeeForZone = (zoneKey = '') =>
  DELIVERY_ZONE_OPTIONS.find((zone) => zone.key === String(zoneKey || '').toLowerCase().replace(/-/g, '_'))?.fee || DEFAULT_DELIVERY_FEE;

export const validateDominicanAddress = (value = '') => {
  const original = String(value || '').trim();
  const sanitized = normalizeDominicanAddressInput(original);
  const normalized = normalizeLookupText(sanitized);

  if (!sanitized) {
    return { valid: false, sanitized, message: 'La direccion es obligatoria.' };
  }

  if (hasAddressSymbols(original)) {
    return {
      valid: false,
      sanitized,
      message: 'La direccion no puede contener signos ni simbolos. Usa solo letras, numeros y espacios.',
    };
  }

  if (sanitized.length < 12) {
    return {
      valid: false,
      sanitized,
      message: 'Escribe una direccion mas completa de Republica Dominicana.',
    };
  }

  const hasPlace = RD_PLACE_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (!hasPlace) {
    return {
      valid: false,
      sanitized,
      message: 'La direccion debe indicar una ciudad o sector real de Republica Dominicana.',
    };
  }

  const hasSignal = ADDRESS_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
  if (!hasSignal) {
    return {
      valid: false,
      sanitized,
      message: 'Agrega calle, avenida, sector, residencial, casa o una referencia real.',
    };
  }

  return { valid: true, sanitized, message: 'Direccion valida.' };
};
