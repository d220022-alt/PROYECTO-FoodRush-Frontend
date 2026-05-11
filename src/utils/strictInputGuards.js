export const NAME_INPUT_CHAR_PATTERN = /^[a-zA-Z\u00C0-\u00FF\u00D1\u00F1\s]$/;
export const ADDRESS_INPUT_CHAR_PATTERN = /^[a-zA-Z0-9\u00C0-\u00FF\u00D1\u00F1\s]$/;
export const DIGIT_INPUT_CHAR_PATTERN = /^\d$/;

export const sanitizeAllowedCharacters = (value = '', allowedPattern, replacement = '') =>
  Array.from(String(value || ''))
    .map((character) => (allowedPattern.test(character) ? character : replacement))
    .join('');

const containsOnlyAllowedCharacters = (value = '', allowedPattern) =>
  Array.from(String(value || '')).every((character) => allowedPattern.test(character));

export const preventDisallowedInput = (event, allowedPattern) => {
  if (event.inputType?.startsWith('delete')) return;
  if (!event.data) return;
  if (!containsOnlyAllowedCharacters(event.data, allowedPattern)) {
    event.preventDefault();
  }
};

export const replaceSelectedText = (target, text = '') => {
  const currentValue = target?.value || '';
  const start = target?.selectionStart ?? currentValue.length;
  const end = target?.selectionEnd ?? currentValue.length;
  return `${currentValue.slice(0, start)}${text}${currentValue.slice(end)}`;
};

export const pasteAllowedInput = (event, allowedPattern, applyValue, replacement = '') => {
  const target = event.target;
  const clipboardText = event.clipboardData?.getData('text') || '';
  const cleanText = sanitizeAllowedCharacters(clipboardText, allowedPattern, replacement);

  event.preventDefault();
  applyValue(target, replaceSelectedText(target, cleanText));
};

export const syncTargetValue = (target, nextValue = '') => {
  if (target && target.value !== nextValue) {
    target.value = nextValue;
  }
};
