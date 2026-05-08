/*
  Guia rápida para presentar:
  Validacion de telefonos. Mantiene un criterio unico en registro y perfil.
  Buscar en VS Code: telefono dominicano, validacion, formato, registro, perfil.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
const DOMINICAN_AREA_CODES = new Set(['809', '829', '849']);

export const onlyPhoneDigits = (value = '') => String(value || '').replace(/\D/g, '');

const stripDominicanCountryCode = (digits = '') => {
  const normalized = onlyPhoneDigits(digits);
  if (normalized.length === 11 && normalized.startsWith('1')) {
    return normalized.slice(1);
  }

  return normalized;
};

export const getDominicanPhoneDigits = (value = '') =>
  stripDominicanCountryCode(value).slice(0, 10);

export const countDominicanPhoneDigits = (value = '') => getDominicanPhoneDigits(value).length;

export const formatDominicanPhone = (value = '') => {
  const digits = getDominicanPhoneDigits(value);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 10);

  if (third) return `${first}-${second}-${third}`;
  if (second) return `${first}-${second}`;
  return first;
};

const isRepeatedDigits = (digits = '') => /^(\d)\1+$/.test(digits);

const isSequentialPlaceholder = (digits = '') =>
  ['0123456789', '1234567890', '9876543210', '0000000000'].includes(digits);

const hasFakeSubscriberNumber = (digits = '') => {
  const subscriber = digits.slice(3);
  return isRepeatedDigits(subscriber) || ['0000000', '1234567', '7654321'].includes(subscriber);
};

export const validateDominicanPhone = (value = '') => {
  const digits = getDominicanPhoneDigits(value);

  if (!digits) {
    return { valid: false, digits, message: 'El telefono es obligatorio.' };
  }

  if (digits.length !== 10) {
    return { valid: false, digits, message: 'El telefono debe tener 10 digitos.' };
  }

  if (!DOMINICAN_AREA_CODES.has(digits.slice(0, 3))) {
    return { valid: false, digits, message: 'Usa un numero dominicano 809, 829 o 849.' };
  }

  if (isRepeatedDigits(digits) || isSequentialPlaceholder(digits) || hasFakeSubscriberNumber(digits)) {
    return { valid: false, digits, message: 'Ingresa un telefono real para recibir tu pedido.' };
  }

  return { valid: true, digits, message: '' };
};

export const normalizeDominicanPhone = (value = '') => formatDominicanPhone(value);
