import { computed, ref } from 'vue';

export const THEME_STORAGE_KEY = 'foodrush_theme';
export const LEGACY_ADMIN_THEME_KEY = 'foodrush_admin_theme';
export const THEME_CHANGED_EVENT = 'foodrush:theme-changed';

const LIGHT = 'light';
const DARK = 'dark';

const normalizeTheme = (value) => (value === DARK ? DARK : LIGHT);
const themeMode = ref(LIGHT);

const hasWindow = () => typeof window !== 'undefined';

const readStoredTheme = () => {
  if (!hasWindow()) return LIGHT;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme) return normalizeTheme(storedTheme);

  const legacyAdminTheme = window.localStorage.getItem(LEGACY_ADMIN_THEME_KEY);
  return normalizeTheme(legacyAdminTheme);
};

const applyThemeToDocument = (mode) => {
  if (!hasWindow()) return;

  const normalized = normalizeTheme(mode);
  const isDark = normalized === DARK;
  const root = document.documentElement;

  root.classList.toggle('foodrush-dark', isDark);
  root.dataset.theme = normalized;
  root.style.colorScheme = isDark ? DARK : LIGHT;
};

export const initializeTheme = () => {
  themeMode.value = readStoredTheme();
  applyThemeToDocument(themeMode.value);
};

export const setTheme = (mode) => {
  const normalized = normalizeTheme(mode);
  themeMode.value = normalized;
  applyThemeToDocument(normalized);

  if (hasWindow()) {
    window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    window.localStorage.setItem(LEGACY_ADMIN_THEME_KEY, normalized);
    window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, { detail: { theme: normalized } }));
  }
};

export const toggleTheme = () => {
  setTheme(themeMode.value === DARK ? LIGHT : DARK);
};

export const useTheme = () => ({
  themeMode,
  isDarkMode: computed(() => themeMode.value === DARK),
  setTheme,
  toggleTheme,
});
