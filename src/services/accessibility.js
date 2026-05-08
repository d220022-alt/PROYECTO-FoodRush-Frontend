/*
  Guia rapida para presentar:
  Preferencias globales de accesibilidad. Guarda ajustes del usuario y aplica clases al documento.
  Buscar en VS Code: accesibilidad, alto contraste, texto grande, reducir movimiento.
  Mantener estos comentarios actualizados si cambia el flujo.
*/
import { computed, ref } from 'vue';

export const ACCESSIBILITY_STORAGE_KEY = 'foodrush_accessibility';
export const ACCESSIBILITY_CHANGED_EVENT = 'foodrush:accessibility-changed';

const FONT_SIZES = ['normal', 'large', 'extra'];
const DEFAULT_SETTINGS = {
  fontSize: 'normal',
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
};

const accessibilitySettings = ref({ ...DEFAULT_SETTINGS });

const hasWindow = () => typeof window !== 'undefined';

const normalizeSettings = (value) => {
  const source = value && typeof value === 'object' ? value : {};

  return {
    fontSize: FONT_SIZES.includes(source.fontSize) ? source.fontSize : DEFAULT_SETTINGS.fontSize,
    highContrast: Boolean(source.highContrast),
    underlineLinks: Boolean(source.underlineLinks),
    reduceMotion: Boolean(source.reduceMotion),
  };
};

const readStoredAccessibility = () => {
  if (!hasWindow()) return { ...DEFAULT_SETTINGS };

  try {
    return normalizeSettings(JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)));
  } catch (error) {
    console.warn('No se pudieron leer las preferencias de accesibilidad', error);
    return { ...DEFAULT_SETTINGS };
  }
};

const persistAccessibility = (settings) => {
  if (!hasWindow()) return;

  window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_CHANGED_EVENT, { detail: settings }));
};

const applyAccessibilityToDocument = (settings) => {
  if (!hasWindow()) return;

  const root = document.documentElement;
  root.classList.toggle('foodrush-a11y-font-large', settings.fontSize === 'large');
  root.classList.toggle('foodrush-a11y-font-extra', settings.fontSize === 'extra');
  root.classList.toggle('foodrush-a11y-contrast', settings.highContrast);
  root.classList.toggle('foodrush-a11y-underline', settings.underlineLinks);
  root.classList.toggle('foodrush-a11y-reduce-motion', settings.reduceMotion);
  root.dataset.accessibilityFont = settings.fontSize;
};

const updateAccessibility = (partialSettings) => {
  const nextSettings = normalizeSettings({
    ...accessibilitySettings.value,
    ...partialSettings,
  });

  accessibilitySettings.value = nextSettings;
  applyAccessibilityToDocument(nextSettings);
  persistAccessibility(nextSettings);
};

export const initializeAccessibility = () => {
  accessibilitySettings.value = readStoredAccessibility();
  applyAccessibilityToDocument(accessibilitySettings.value);
};

export const setFontSize = (fontSize) => {
  updateAccessibility({ fontSize });
};

export const toggleHighContrast = () => {
  updateAccessibility({ highContrast: !accessibilitySettings.value.highContrast });
};

export const toggleUnderlineLinks = () => {
  updateAccessibility({ underlineLinks: !accessibilitySettings.value.underlineLinks });
};

export const toggleReduceMotion = () => {
  updateAccessibility({ reduceMotion: !accessibilitySettings.value.reduceMotion });
};

export const resetAccessibility = () => {
  updateAccessibility({ ...DEFAULT_SETTINGS });
};

export const useAccessibility = () => ({
  settings: accessibilitySettings,
  isDefaultAccessibility: computed(() =>
    accessibilitySettings.value.fontSize === DEFAULT_SETTINGS.fontSize
    && accessibilitySettings.value.highContrast === DEFAULT_SETTINGS.highContrast
    && accessibilitySettings.value.underlineLinks === DEFAULT_SETTINGS.underlineLinks
    && accessibilitySettings.value.reduceMotion === DEFAULT_SETTINGS.reduceMotion
  ),
  setFontSize,
  toggleHighContrast,
  toggleUnderlineLinks,
  toggleReduceMotion,
  resetAccessibility,
});
