<!--
  Guia rápida para presentar:
  Vista de Chilis. Agrupa pantalla, estado visual y acciones que ve el usuario en esa seccion.
  Buscar en VS Code: franquicia, menu, productos, fetchProducts, filtros, modal producto, addToCart, carrito.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { getProductImage, getResponsiveImageSrcset, resolveProductImage } from '../utils/productImages';
import { franchiseConfigs } from './franchiseConfigs';
import { mockProducts } from '../data/mockProducts';
import { getModifiersForCategory } from '../data/productModifiers';
import {
  APP_EVENTS,
  addCartItem,
  getCartCount,
  getFavorites,
  getSession,
  getUnreadNotificationsCount,
  toggleFavoriteItem,
} from '../services/storage';

const FRANCHISE_SLUG = 'chilis';

const router = useRouter();

const franchise = computed(() => {
  return franchiseConfigs[FRANCHISE_SLUG] || franchiseConfigs.mcdonalds;
});

const products = ref([]);
const isLoading = ref(true);
const fetchError = ref(false);
const searchTerm = ref('');
const cartCount = ref(0);
const notificationCount = ref(0);
const userName = ref('');
const currentCategory = ref('');
const activeTypeFilters = ref([]);
const activeExtraFilter = ref(null);
const activePriceFilter = ref('all');
const activeSortFilter = ref('default');
const showFiltersPanel = ref(true);
const showTypeFilter = ref(true);
const showExtraFilterSection = ref(true);
const showPriceFilterSection = ref(true);
const showSortFilterSection = ref(true);
const catalogMotionKey = ref(0);

const selectedProduct = ref(null);
const currentQty = ref(1);
const selectedProductType = ref('');
const isFavorite = ref(false);

const customModifiers = ref([]);
const modifierSelections = ref({});

const currentSlide = ref(0);
let slideInterval = null;

const defaultSlide =
  '/images/slides/home-slide-1.webp';

const slides = computed(() => {
  const brandSlides = franchise.value.slides || [];
  return brandSlides.length > 0 ? brandSlides : [defaultSlide];
});

const normalize = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const hexToRgb = (hexColor) => {
  const safeHex = String(hexColor || '').replace('#', '');
  if (![3, 6].includes(safeHex.length)) return null;

  const normalizedHex =
    safeHex.length === 3
      ? safeHex
          .split('')
          .map((char) => char + char)
          .join('')
      : safeHex;

  const intValue = Number.parseInt(normalizedHex, 16);
  if (Number.isNaN(intValue)) return null;

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
};

const toRgba = (hexColor, alpha) => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(15, 23, 42, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const mixColor = (hexColor, targetHex, amount = 0.5) => {
  const source = hexToRgb(hexColor);
  const target = hexToRgb(targetHex);
  if (!source || !target) return hexColor || targetHex;

  const ratio = Math.min(1, Math.max(0, amount));
  const mixChannel = (start, end) => Math.round(start + ((end - start) * ratio));

  return `rgb(${mixChannel(source.r, target.r)}, ${mixChannel(source.g, target.g)}, ${mixChannel(source.b, target.b)})`;
};

const brandVars = computed(() => {
  const primary = franchise.value.primary || '#00704A';
  const accent = franchise.value.accent || '#ffffff';
  const background = franchise.value.background || '#f8fafc';

  return {
    '--brand-primary': primary,
    '--brand-accent': accent,
    '--brand-background': background,
    '--brand-primary-deep': mixColor(primary, '#0f172a', 0.34),
    '--brand-primary-ink': mixColor(primary, '#020617', 0.48),
    '--brand-primary-soft': mixColor(primary, '#ffffff', 0.84),
    '--brand-primary-faint': mixColor(primary, '#ffffff', 0.93),
    '--brand-surface': mixColor(background, '#ffffff', 0.68),
    '--brand-surface-strong': mixColor(background, '#ffffff', 0.42),
    '--brand-soft': toRgba(primary, 0.1),
    '--brand-soft-strong': toRgba(primary, 0.18),
    '--brand-soft-soft': toRgba(primary, 0.06),
    '--brand-border': toRgba(primary, 0.22),
    '--brand-border-strong': toRgba(primary, 0.34),
    '--brand-shadow': toRgba(primary, 0.24),
    '--brand-shadow-soft': toRgba(primary, 0.14),
    '--brand-accent-soft': toRgba(accent, 0.28),
    '--brand-hero-glow': toRgba(accent || primary, 0.2),
  };
});

const openFiltersPanel = () => {
  showFiltersPanel.value = true;
};

const inferTypeByKeywords = (text) => {
  const source = normalize(text);
  if (!source) return '';

  if (source.includes('res') || source.includes('beef')) return 'Res';
  if (source.includes('pollo') || source.includes('chicken')) return 'Pollo';
  if (source.includes('pescado') || source.includes('fish')) return 'Pescado';
  if (source.includes('cerdo') || source.includes('pork')) return 'Cerdo';
  if (source.includes('papa') || source.includes('fries') || source.includes('hash brown')) return 'Papas';
  if (source.includes('nugget') || source.includes('snack')) return 'Snacks';
  if (source.includes('ensalada') || source.includes('salad')) return 'Ensaladas';
  if (source.includes('helado') || source.includes('ice cream') || source.includes('mcflurry')) return 'Helado';
  if (source.includes('pastel') || source.includes('cake') || source.includes('pay') || source.includes('pie')) return 'Pastel';
  if (source.includes('galleta') || source.includes('cookie')) return 'Galletas';
  if (
    source.includes('cafe') ||
    source.includes('coffee') ||
    source.includes('te') ||
    source.includes('hot chocolate') ||
    source.includes('caliente') ||
    source.includes('espresso')
  ) {
    return 'Caliente';
  }
  if (
    source.includes('frio') ||
    source.includes('cold') ||
    source.includes('hielo') ||
    source.includes('refresco') ||
    source.includes('soda') ||
    source.includes('frappe')
  ) {
    return 'Frío';
  }

  return '';
};

const inferCategoryFromProductSignals = (productName, productType, description, categories) => {
  const nameCategory = inferCategoryFromText(productName, categories);
  if (nameCategory) return nameCategory;

  const typeCategory = inferCategoryFromText(productType, categories);
  if (typeCategory) return typeCategory;

  return inferCategoryFromText(`${productName} ${description}`, categories);
};

const detectExtraFeature = (name, description) => {
  const configuredExtra = normalize(franchise.value.extraLabel || '');
  const source = normalize(`${configuredExtra} ${name} ${description}`);
  const keywords = [
    'picante',
    'spicy',
    'jalapeno',
    'chipotle',
    'extra',
    'doble',
    'premium',
    'supreme',
    'especial',
  ];

  return keywords.some((keyword) => source.includes(keyword));
};

const inferCategoryFromText = (text, categories) => {
  const source = normalize(text);
  if (!source || !Array.isArray(categories) || categories.length === 0) return '';

  const keywordsByCategory = {
    hamburguesas: ['hamburguesa', 'burger', 'res', 'pollo', 'pescado', 'cerdo', 'sandwich', 'wrap'],
    complementos: ['complemento', 'papa', 'fries', 'nugget', 'snack', 'ensalada', 'side', 'acompan'],
    bebidas: ['bebida', 'drink', 'refresco', 'soda', 'jugo', 'frappe', 'cafe', 'coffee', 'tea'],
    postres: ['postre', 'dessert', 'helado', 'ice cream', 'sundae', 'pastel', 'cake', 'pie', 'pay', 'galleta', 'cookie'],
    pizzas: ['pizza'],
    pastas: ['pasta', 'spaghetti', 'lasagna', 'fettuccine'],
    acompanantes: ['acompan', 'side', 'papa', 'fries', 'nugget'],
    combos: ['combo', 'meal'],
    tacos: ['taco'],
    burritos: ['burrito'],
    nachos: ['nacho'],
    pollo: ['pollo', 'chicken'],
    res: ['res', 'beef'],
    'hot dogs': ['hot dog', 'hotdog', 'salchicha'],
    donas: ['dona', 'donut'],
  };

  for (const category of categories) {
    const key = normalize(category);
    const singular = key.endsWith('s') ? key.slice(0, -1) : key;
    if (source.includes(key) || source.includes(singular)) return category;

    const keywords = keywordsByCategory[key] || [];
    if (keywords.some((keyword) => source.includes(keyword))) return category;
  }

  return '';
};

const getDefaultCategory = (categories = []) => {
  const normalized = Array.isArray(categories) ? categories : [];
  const firstRealCategory = normalized.find((category) => normalize(category) !== 'todos');
  return firstRealCategory || normalized[0] || 'General';
};

const parseProduct = (product, index) => {
  const rawDescription = String(product.descripcion || '').trim();
  const descriptionParts = rawDescription
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean);

  let parsedCategory = '';
  let parsedType = '';
  let parsedDescription = rawDescription;

  if (descriptionParts.length >= 3) {
    parsedCategory = descriptionParts[0];
    parsedType = descriptionParts[1];
    parsedDescription = descriptionParts.slice(2).join(' - ').trim();
  } else if (descriptionParts.length === 2) {
    parsedCategory = descriptionParts[0];
    parsedDescription = descriptionParts[1];
  }

  const name = String(product.nombre || product.name || `Producto ${index + 1}`).trim();

  const configuredCategories = (franchise.value.categories || []).filter(
    (cat) => normalize(cat) !== 'todos',
  );
  const defaultCategory = getDefaultCategory(
    configuredCategories.length > 0 ? configuredCategories : franchise.value.categories || [],
  );

  let categoryValue = String(
    product.categoria ||
      product.category ||
      parsedCategory ||
      '',
  ).trim();

  const invalidCategoryValues = [
    '',
    'general',
    'sin clasificacion',
    'sin clasificar',
    'n/a',
    'na',
    'none',
    'null',
    'undefined',
    'todos',
  ];

  if (invalidCategoryValues.includes(normalize(categoryValue))) {
    categoryValue = '';
  }

  if (configuredCategories.length > 0) {
    const inferredFromProduct = inferCategoryFromProductSignals(
      name,
      `${product.tipo || ''} ${product.type || ''} ${parsedType}`,
      parsedDescription || rawDescription,
      configuredCategories,
    );
    const exactCategory = configuredCategories.find(
      (candidate) => normalize(candidate) === normalize(categoryValue),
    );

    if (inferredFromProduct) {
      categoryValue = inferredFromProduct;
    } else if (exactCategory) {
      categoryValue = exactCategory;
    } else {
      const inferredCategory = inferCategoryFromText(
        `${parsedType} ${name} ${parsedDescription || rawDescription}`,
        configuredCategories,
      );
      if (inferredCategory) categoryValue = inferredCategory;
    }

    if (!categoryValue) {
      const inferredFromType = inferCategoryFromText(
        `${product.tipo || ''} ${product.type || ''} ${parsedType}`,
        configuredCategories,
      );
      if (inferredFromType) categoryValue = inferredFromType;
    }
  }

  const category = categoryValue || defaultCategory || 'General';

  let typeValue = String(product.tipo || product.type || parsedType || parsedCategory || category).trim();
  const inferredType = inferTypeByKeywords(`${name} ${parsedDescription || rawDescription}`);
  const normalizedTypeValue = normalize(typeValue);
  const productTypeSource = normalize(`${category} ${name} ${parsedDescription || rawDescription}`);
  const typeLooksLikeCategory =
    configuredCategories.some((candidate) => normalize(candidate) === normalizedTypeValue) ||
    normalizedTypeValue === normalize(category) ||
    normalizedTypeValue === 'general';
  const typeConflictsWithProduct =
    inferredType &&
    normalizedTypeValue !== normalize(inferredType) &&
    (
      (/(helado|postre|sundae|batida|mcflurry|brownie|pastel|dona)/.test(productTypeSource) && /(res|beef|pollo|chicken|carne|hamburguesa|burger)/.test(normalizedTypeValue)) ||
      (/(bebida|refresco|cola|jugo|cafe|te|frappe)/.test(productTypeSource) && /(res|beef|pollo|chicken|carne|hamburguesa|burger)/.test(normalizedTypeValue))
    );
  if (!typeValue || typeLooksLikeCategory || typeConflictsWithProduct) {
    if (inferredType) typeValue = inferredType;
  }
  const type = typeValue || category;

  const priceNumber = Number.parseFloat(product.precio ?? product.price ?? 0);
  const price = Number.isFinite(priceNumber) ? Math.max(1, Math.round(priceNumber)) : 1;

  const description = parsedDescription || `Delicias de ${franchise.value.name}.`;
  const isExtraFeature = detectExtraFeature(name, description);

  return {
    id: product.id || `${FRANCHISE_SLUG}-${index}`,
    name,
    category,
    type,
    price,
    isExtraFeature,
    description,
    img: resolveProductImage(product.img || product.imagen, name, category),
  };
};

const availableCategories = computed(() => {
  const fromProducts = [...new Set(products.value.map((product) => product.category))].filter(Boolean);
  const base = fromProducts.length > 0 ? fromProducts : franchise.value.categories || [];
  const withoutTodos = base.filter((category) => normalize(category) !== 'todos');
  return ['Todos', ...withoutTodos];
});

const isSidebarTypeAllowed = (type) => {
  const catalogSource = normalize(`${franchise.value.name} ${(franchise.value.categories || []).join(' ')}`);
  const typeSource = normalize(type);
  const catalogIsDessertFocused =
    /(helado|postre|dona|batido|bebida|cafe)/.test(catalogSource) &&
    !/(hamburguesa|burger|pizza|pollo|chicken|hot dog|hotdog|taco|burrito|pasta|costilla|ribs|tex)/.test(catalogSource);

  return !(catalogIsDessertFocused && /(res|beef|pollo|chicken|carne|hamburguesa|burger)/.test(typeSource));
};

const categoryTypes = computed(() => {
  const inCategory =
    currentCategory.value === 'Todos'
      ? products.value
      : products.value.filter((product) => product.category === currentCategory.value);
  return [...new Set(inCategory.map((product) => product.type))]
    .filter(Boolean)
    .filter(isSidebarTypeAllowed);
});

const sidebarConfig = computed(() => {
  const types = categoryTypes.value.map((type) => ({ key: type, label: type }));
  return {
    typeLabel: currentCategory.value === 'Todos' ? 'Filtros (Todos)' : 'Tipo',
    types,
    showExtra: true,
    extraLabel: franchise.value.extraLabel || 'Extra',
  };
});

const detailTypeOptions = computed(() => {
  if (!selectedProduct.value) return [];
  const inCategory = products.value.filter(
    (product) => product.category === selectedProduct.value.category,
  );
  return [...new Set(inCategory.map((product) => product.type))].filter(Boolean);
});

const MIN_VISIBLE_PRODUCTS = 2;

const applySort = (list) => {
  const result = [...list];
  if (activeSortFilter.value === 'price-asc') result.sort((a, b) => a.price - b.price);
  else if (activeSortFilter.value === 'price-desc') result.sort((a, b) => b.price - a.price);
  else if (activeSortFilter.value === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
};

const buildFilteredList = ({
  includeCategory = true,
  includeSearch = true,
  includeType = true,
  includeExtra = true,
  includePrice = true,
} = {}) => {
  let result = [...products.value];

  if (includeCategory && currentCategory.value && currentCategory.value !== 'Todos') {
    result = result.filter((product) => product.category === currentCategory.value);
  }

  if (includeSearch && searchTerm.value.trim()) {
    const term = normalize(searchTerm.value);
    result = result.filter((product) =>
      normalize(`${product.name} ${product.description || ''}`).includes(term),
    );
  }

  if (includeType && activeTypeFilters.value.length > 0) {
    const activeTypesNormalized = activeTypeFilters.value.map((type) => normalize(type));
    result = result.filter((product) => {
      const productType = normalize(product.type);
      const searchable = normalize(`${product.type} ${product.name} ${product.description || ''}`);
      return activeTypesNormalized.some(
        (activeType) =>
          productType === activeType ||
          productType.includes(activeType) ||
          activeType.includes(productType) ||
          searchable.includes(activeType),
      );
    });
  }

  if (includeExtra && sidebarConfig.value.showExtra && activeExtraFilter.value) {
    if (activeExtraFilter.value === 'yes') result = result.filter((product) => product.isExtraFeature);
    if (activeExtraFilter.value === 'no') result = result.filter((product) => !product.isExtraFeature);
  }

  if (includePrice) {
    if (activePriceFilter.value === 'low') result = result.filter((product) => product.price <= 150);
    else if (activePriceFilter.value === 'mid') {
      result = result.filter((product) => product.price > 150 && product.price <= 300);
    } else if (activePriceFilter.value === 'high') {
      result = result.filter((product) => product.price > 300);
    }
  }

  return applySort(result);
};

// Para presentar: aplica filtros visibles, busqueda y orden antes de pintar productos.
const filteredProducts = computed(() => buildFilteredList());

const fallbackProducts = computed(() => {
  const pools = [
    buildFilteredList({ includeType: false }),
    buildFilteredList({ includeType: false, includeExtra: false }),
    buildFilteredList({ includeType: false, includeExtra: false, includePrice: false }),
    buildFilteredList({ includeType: false, includeExtra: false, includePrice: false, includeSearch: false }),
    buildFilteredList({
      includeCategory: false,
      includeSearch: false,
      includeType: false,
      includeExtra: false,
      includePrice: false,
    }),
  ];

  const merged = [];
  const seen = new Set();

  pools.forEach((pool) => {
    pool.forEach((item) => {
      const key = item.id ?? `${item.name}-${item.category}-${item.type}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
  });

  return merged.slice(0, MIN_VISIBLE_PRODUCTS);
});

const isUsingFallbackProducts = computed(() =>
  !isLoading.value && filteredProducts.value.length === 0 && fallbackProducts.value.length > 0,
);

const visibleProducts = computed(() =>
  filteredProducts.value.length > 0 ? filteredProducts.value : fallbackProducts.value,
);

const buildModifiersForProduct = (product) => {
  const base = getModifiersForCategory(`${product.category} ${product.type} ${product.name}`) || [];
  const cloned = base.map((mod) => ({ ...mod }));
  const brand = franchise.value || {};
  const brandSlug = normalize(brand.slug);
  const productModifierSource = normalize(`${product.category} ${product.type} ${product.name} ${product.description || ''}`);
  const productUsesSweetOrDrinkModifiers = /(postre|helado|sundae|mcflurry|batida|dona|pastel|brownie|bebida|refresco|cola|jugo|cafe|te|frappe)/.test(productModifierSource);
  const brandLabelFitsProduct = (label) => {
    if (!productUsesSweetOrDrinkModifiers) return true;
    return /(topping|sirope|jarabe|crema|helado|bola|cono|waffle|leche|shot|sabor|hielo|azucar|cafe|te|frappe|batida|chocolate|vainilla|fresa|oreo)/.test(normalize(label));
  };

  const ensureModifier = (candidate) => {
    if (!candidate || !candidate.id) return;
    if (cloned.some((mod) => mod.id === candidate.id)) return;
    cloned.push(candidate);
  };

  cloned.forEach((mod) => {
    if (mod.id === 'combo') {
      if (brand.comboLabel) mod.label = brand.comboLabel;
      if (brand.comboPrice !== undefined && brand.comboPrice !== null) mod.price = brand.comboPrice;
    }
    if (mod.id === 'extra') {
      if (brand.extraLabel) mod.label = brand.extraLabel;
      if (brand.extraPrice !== undefined && brand.extraPrice !== null) mod.price = brand.extraPrice;
      mod.isBrand = true;
    }
    if (mod.id === 'premium') {
      if (brand.premiumLabel) mod.label = brand.premiumLabel;
      if (brand.premiumPrice !== undefined && brand.premiumPrice !== null) mod.price = brand.premiumPrice;
      mod.isBrand = true;
    }
    if (mod.id === 'large') {
      if (brand.largeLabel) mod.label = brand.largeLabel;
      if (brand.largePrice !== undefined && brand.largePrice !== null) mod.price = brand.largePrice;
      mod.isBrand = true;
    }
  });

  if (brandSlug === 'mcdonalds' && normalize(product.category).includes('hamburg')) {
    ensureModifier({
      id: 'lettuce',
      label: 'Lechuga Extra',
      type: 'counter',
      max: 2,
      price: 15,
      isBrand: true,
    });
    ensureModifier({
      id: 'pickles',
      label: 'Pepinillos Extra',
      type: 'counter',
      max: 3,
      price: 15,
      isBrand: true,
    });
  }

  const hasSize = cloned.some((mod) => mod.id === 'size' && mod.type === 'choice');
  if (!hasSize) {
    const basePrice = Number.isFinite(product.price) ? product.price : 0;
    const small = Math.max(1, Math.round(basePrice * 0.8));
    const medium = Math.max(1, Math.round(basePrice));
    const large = Math.max(1, Math.round(basePrice * 1.3));
    cloned.unshift({
      id: 'size',
      label: 'tamaño',
      type: 'choice',
      options: ['Pequeño', 'Mediano', 'Grande'],
      default: 'Mediano',
      priceOptions: {
        Pequeño: small - basePrice,
        Mediano: medium - basePrice,
        Grande: large - basePrice,
      },
    });
  }

  const hasSizeAfter = cloned.some((mod) => mod.id === 'size' && mod.type === 'choice');
  const brandExtras = [];

  const addBrandToggle = (key, label, price, skipWhenSize = false) => {
    if (!label) return;
    if (!brandLabelFitsProduct(label)) return;
    if (skipWhenSize && hasSizeAfter) return;
    if (cloned.some((mod) => mod.id === key)) return;
    brandExtras.push({
      id: key,
      label,
      type: 'toggle',
      price: Number.isFinite(price) ? price : 0,
      isBrand: true,
    });
  };

  addBrandToggle('extra', brand.extraLabel, brand.extraPrice);
  addBrandToggle('premium', brand.premiumLabel, brand.premiumPrice);
  addBrandToggle('large', brand.largeLabel, brand.largePrice, true);

  return [...cloned, ...brandExtras];
};

const sizeModifier = computed(() =>
  customModifiers.value.find((mod) => mod.id === 'size' && mod.type === 'choice'),
);

const selectedSizeLabel = computed(() => {
  if (!sizeModifier.value) return 'Version base';
  return (
    modifierSelections.value[sizeModifier.value.id] ||
    sizeModifier.value.default ||
    sizeModifier.value.options?.[0] ||
    'Version base'
  );
});

const nonSizeModifiers = computed(() =>
  customModifiers.value.filter((mod) => mod.id !== 'size'),
);

const getChoicePriceAdjustment = (mod, selection) => {
  if (!mod || !selection) return 0;
  if (mod.priceOptions && Number.isFinite(mod.priceOptions[selection])) {
    return mod.priceOptions[selection];
  }
  if (Number.isFinite(mod.price) && selection !== mod.default) {
    return mod.price;
  }
  return 0;
};

const baseUnitPrice = computed(() => {
  if (!selectedProduct.value) return 0;
  if (!sizeModifier.value) return selectedProduct.value.price;

  const sizeSelection =
    modifierSelections.value[sizeModifier.value.id] ||
    sizeModifier.value.default ||
    sizeModifier.value.options?.[0];

  return selectedProduct.value.price + getChoicePriceAdjustment(sizeModifier.value, sizeSelection);
});

const priceBreakdown = computed(() => {
  if (!selectedProduct.value) return [];

  const lines = [
    {
      label: `Base ${selectedSizeLabel.value}`,
      value: baseUnitPrice.value,
    },
  ];

  nonSizeModifiers.value.forEach((mod) => {
    const selection = modifierSelections.value[mod.id];

    if (mod.type === 'choice') {
      if (!selection || selection === mod.default) return;
      const adjustment = getChoicePriceAdjustment(mod, selection);
      if (adjustment !== 0) {
        lines.push({
          label: `${mod.label}: ${selection}`,
          value: adjustment,
        });
      }
      return;
    }

    if (mod.type === 'counter' && selection > 0) {
      lines.push({
        label: `${mod.label} x${selection}`,
        value: selection * mod.price,
      });
      return;
    }

    if (mod.type === 'toggle' && selection && mod.price) {
      lines.push({
        label: mod.label,
        value: mod.price,
      });
    }
  });

  return lines;
});

const extrasTotal = computed(() =>
  priceBreakdown.value.slice(1).reduce((total, item) => total + item.value, 0),
);

const currentUnitPrice = computed(() => baseUnitPrice.value + extrasTotal.value);

const totalPrice = computed(() => {
  return currentUnitPrice.value * currentQty.value;
});

const categoryModifiers = computed(() =>
  nonSizeModifiers.value.filter((mod) => !mod.isBrand),
);

const brandModifiers = computed(() =>
  nonSizeModifiers.value.filter((mod) => mod.isBrand),
);

const sizeIconClass = computed(() => {
  if (!selectedProduct.value) return 'fa-utensils';
  const source = normalize(
    `${selectedProduct.value.category} ${selectedProduct.value.type} ${selectedProduct.value.name} ${selectedProduct.value.description}`,
  );
  if (source.includes('helado') || source.includes('postre') || source.includes('sundae') || source.includes('batida') || source.includes('mcflurry')) return 'fa-ice-cream';
  if (source.includes('pizza')) return 'fa-pizza-slice';
  if (source.includes('pollo') || source.includes('chicken')) return 'fa-drumstick-bite';
  if (source.includes('hot dog') || source.includes('hotdog') || source.includes('salchicha')) return 'fa-hotdog';
  if (source.includes('taco') || source.includes('burrito') || source.includes('nacho')) return 'fa-pepper-hot';
  if (source.includes('bebida') || source.includes('frappe') || source.includes('refresco') || source.includes('cola') || source.includes('jugo') || source.includes('limonada')) return 'fa-glass-water';
  if (source.includes('cafe') || source.includes('te') || source.includes('chocolate caliente')) return 'fa-mug-hot';
  if (source.includes('hamburguesa') || source.includes('burger') || source.includes('whopper') || source.includes('chimi')) return 'fa-burger';
  return 'fa-utensils';
});

const getSizeOptionPrice = (option) => {
  if (!selectedProduct.value || !sizeModifier.value) return 0;
  const delta = sizeModifier.value.priceOptions?.[option] ?? 0;
  const base = selectedProduct.value.price;
  return Math.max(1, base + delta);
};

const sizeOptionsGridClass = computed(() => {
  const count = sizeModifier.value?.options?.length || 0;
  if (count <= 2) return 'grid-cols-2';
  if (count >= 4) return 'grid-cols-2 md:grid-cols-4';
  return 'grid-cols-3';
});

const quantityLabel = computed(() =>
  currentQty.value === 1 ? '1 unidad' : `${currentQty.value} unidades`,
);

const modifierSummary = computed(() => {
  const lines = [];

  if (sizeModifier.value) {
    lines.push(`Tamaño: ${selectedSizeLabel.value}`);
  }

  nonSizeModifiers.value.forEach((mod) => {
    const selection = modifierSelections.value[mod.id];
    if (mod.type === 'choice' && selection && selection !== mod.default) {
      lines.push(`${mod.label}: ${selection}`);
    } else if (mod.type === 'counter' && selection > 0) {
      lines.push(`${mod.label}: ${selection}`);
    } else if (mod.type === 'toggle' && selection) {
      lines.push(mod.label);
    }
  });

  return lines;
});

const activeCustomizationCount = computed(() => modifierSummary.value.length);

const sizeInfo = computed(() => {
  if (!sizeModifier.value) return null;

  const options = sizeModifier.value.options || [];
  const currentSelection = selectedSizeLabel.value;
  const currentIndex = options.findIndex((option) => option === currentSelection);

  if (currentIndex <= 0) {
    return {
      title: currentSelection,
      description: 'Formato ideal para una porción ligera y una compra rápida.',
      note: 'Buena opción si quieres probar el producto sin irte al formato grande.',
    };
  }

  if (currentIndex === 1) {
    return {
      title: currentSelection,
      description: 'Balance entre precio, presencia y cantidad para la mayoria de pedidos.',
      note: 'Es la seleccion mas versatil para combinar con extras.',
    };
  }

  return {
    title: currentSelection,
    description: 'La version con mas presencia, pensada para mas hambre o para compartir.',
    note: 'Recomendada si quieres el mayor impacto visual y cantidad.',
  };
});

const defaultDescription = computed(() =>
  `Disfruta del sabor único de ${franchise.value.name}.`,
);

const modifierIntro = computed(() =>
  `Ajusta ingredientes, extras y preferencias de ${franchise.value.name} antes de agregar el pedido.`,
);

const getProductMediaVariant = (category, context = 'card') => {
  const source = normalize(category);
  const prefix = context === 'detail' ? 'product-detail-media__shell--' : 'product-media__shell--';

  if (
    source.includes('bebida') ||
    source.includes('cafe') ||
    source.includes('te') ||
    source.includes('frappe') ||
    source.includes('drink')
  ) {
    return `${prefix}drink`;
  }

  if (
    source.includes('postre') ||
    source.includes('helado') ||
    source.includes('dona') ||
    source.includes('dessert') ||
    source.includes('ice')
  ) {
    return `${prefix}dessert`;
  }

  return `${prefix}food`;
};

const getModifierIcon = (mod) => {
  const key = normalize(`${mod.id} ${mod.label}`);
  if (key.includes('carne') || key.includes('meat') || key.includes('protein')) return 'fa-drumstick-bite';
  if (key.includes('pollo') || key.includes('chicken')) return 'fa-drumstick-bite';
  if (key.includes('queso') || key.includes('cheese')) return 'fa-cheese';
  if (key.includes('tocino') || key.includes('bacon')) return 'fa-bacon';
  if (key.includes('lechuga') || key.includes('lettuce')) return 'fa-leaf';
  if (key.includes('pepino') || key.includes('pickle')) return 'fa-seedling';
  if (key.includes('salsa') || key.includes('sauce') || key.includes('ketchup')) return 'fa-bottle-droplet';
  if (key.includes('sirope') || key.includes('syrup') || key.includes('topping')) return 'fa-ice-cream';
  if (key.includes('hielo') || key.includes('ice')) return 'fa-snowflake';
  if (key.includes('leche') || key.includes('milk')) return 'fa-mug-hot';
  if (key.includes('tortilla') || key.includes('shell')) return 'fa-circle';
  if (key.includes('orilla') || key.includes('crust') || key.includes('pizza')) return 'fa-pizza-slice';
  if (key.includes('combo') || key.includes('acompan') || key.includes('side')) return 'fa-box';
  if (key.includes('picante') || key.includes('spicy')) return 'fa-pepper-hot';
  return 'fa-sliders';
};

const activeFiltersCount = computed(() => {
  let count = 0;
  if (searchTerm.value.trim()) count += 1;
  if (activeTypeFilters.value.length > 0) count += 1;
  if (activeExtraFilter.value) count += 1;
  if (activePriceFilter.value !== 'all') count += 1;
  if (activeSortFilter.value !== 'default') count += 1;
  return count;
});

const availableProductsCount = computed(() => visibleProducts.value.length);

const contentGridClass = computed(() =>
  showFiltersPanel.value ? 'md:grid-cols-4' : 'md:grid-cols-1',
);

const mainColumnClass = computed(() =>
  showFiltersPanel.value ? 'md:col-span-3' : 'md:col-span-1',
);

const productGridClass = computed(() =>
  showFiltersPanel.value ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4',
);

const syncCategory = () => {
  const categories = availableCategories.value;
  if (categories.length === 0) {
    currentCategory.value = '';
    return;
  }

  if (!categories.includes(currentCategory.value)) {
    currentCategory.value = categories[0];
  }
};

const getDefaultProducts = () => {
  const categories = (franchise.value.categories || []).filter((category) => normalize(category) !== 'todos');
  const fallbackCategories = categories.length > 0 ? categories : ['Menú'];
  const fallbackTypeByCategory = {
    hamburguesas: 'Res',
    complementos: 'Snacks',
    bebidas: 'Frío',
    postres: 'Pastel',
    pizzas: 'Especial',
    pastas: 'Clásica',
    combos: 'Combo',
    acompanantes: 'Guarnición',
    tacos: 'Clásico',
    burritos: 'Clásico',
    nachos: 'Clásico',
    pollo: 'Pollo',
    res: 'Res',
    'hot dogs': 'Clásico',
    donas: 'Glaseada',
    comida: 'Clásica',
    'cafe en casa': 'Molido',
  };

  return fallbackCategories.slice(0, 4).map((category, index) => {
    const categoryKey = normalize(category);
    return {
      id: `fallback-${FRANCHISE_SLUG}-${index + 1}`,
      name: `${category} Especial`,
      category,
      type: fallbackTypeByCategory[categoryKey] || 'Clásico',
      price: 160 + (index * 45),
      isExtraFeature: index % 2 === 0,
      description: `Opción recomendada de ${franchise.value.name}.`,
      img: getProductImage(`${franchise.value.name} ${category} ${index + 1}`, category),
    };
  });
};

const getFallbackProducts = () => {
  const tenantId = Number(franchise.value.tenantId);
  const fallbackSource = mockProducts.filter((product) => (
    normalize(product.franchiseSlug) === normalize(franchise.value.slug) ||
    Number(product.tenantId) === tenantId
  ));
  const source = fallbackSource.length > 0 ? fallbackSource : getDefaultProducts();
  return source.map((product, index) => parseProduct(product, index)).filter(Boolean);
};

// Para presentar: carga productos de la franquicia; usa backend y fallback local si la nube tarda.
const fetchProducts = async () => {
  try {
    isLoading.value = true;
    fetchError.value = false;
    const response = await api.getProducts(
      { limit: 200, tenant_id: franchise.value.tenantId },
      { 'X-Tenant-ID': franchise.value.tenantId },
    );
    const rawData =
      response?.success !== false
        ? (Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []))
        : [];

    const parsed = rawData.map((product, index) => parseProduct(product, index)).filter(Boolean);
    const deduped = [];
    const seen = new Set();
    parsed.forEach((item) => {
      const key = `${normalize(item.name)}|${normalize(item.category)}|${normalize(item.type)}`;
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(item);
    });

    products.value = deduped.length > 0 ? deduped : getFallbackProducts();
    fetchError.value = products.value.length === 0;
    syncCategory();
  } catch (error) {
    console.error(`Error loading ${franchise.value.name} products`, error);
    products.value = getFallbackProducts();
    fetchError.value = products.value.length === 0;
    syncCategory();
  } finally {
    isLoading.value = false;
  }
};

const updateCartBadge = () => {
  cartCount.value = getCartCount();
};

const updateNotificationBadge = () => {
  const session = getSession();
  notificationCount.value = session.isAuthenticated ? getUnreadNotificationsCount(session.userEmail) : 0;
};

const setCategory = (category) => {
  currentCategory.value = category;
  activeTypeFilters.value = [];
  activeExtraFilter.value = null;
};

const toggleTypeFilter = (type) => {
  if (activeTypeFilters.value.includes(type)) {
    activeTypeFilters.value = activeTypeFilters.value.filter((currentType) => currentType !== type);
    return;
  }

  activeTypeFilters.value.push(type);
};

const toggleExtraFilter = (value) => {
  activeExtraFilter.value = activeExtraFilter.value === value ? null : value;
};

const setPriceFilter = (value) => {
  activePriceFilter.value = value;
};

const setSortFilter = (value) => {
  activeSortFilter.value = value;
};

const resetFilters = () => {
  searchTerm.value = '';
  activeTypeFilters.value = [];
  activeExtraFilter.value = null;
  activePriceFilter.value = 'all';
  activeSortFilter.value = 'default';
};

watch(
  () => sidebarConfig.value,
  (config) => {
    const allowed = new Set((config.types || []).map((item) => item.key));
    activeTypeFilters.value = activeTypeFilters.value.filter((item) => allowed.has(item));
    if (!config.showExtra) activeExtraFilter.value = null;
  },
  { deep: true, immediate: true },
);

watch(
  [
    currentCategory,
    searchTerm,
    activeExtraFilter,
    activePriceFilter,
    activeSortFilter,
    () => activeTypeFilters.value.join('|'),
  ],
  () => {
    catalogMotionKey.value += 1;
  },
);

const checkFavorite = () => {
  if (!selectedProduct.value) return;
  const favorites = getFavorites();
  isFavorite.value = favorites.some((favorite) => favorite.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
  if (!selectedProduct.value) return;

  const added = toggleFavoriteItem({
    id: selectedProduct.value.id,
    name: selectedProduct.value.name,
    img: selectedProduct.value.img,
    price: selectedProduct.value.price,
    place: franchise.value.name,
    franchiseSlug: franchise.value.slug,
    tenantId: franchise.value.tenantId,
  });

  isFavorite.value = !added ? false : true;

  if (!added) {
    Swal.fire({
      title: 'Eliminado de favoritos',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 1800,
      showConfirmButton: false,
    });
  } else {
    Swal.fire({
      title: 'Agregado a favoritos',
      icon: 'success',
      toast: true,
      position: 'top-end',
      timer: 1800,
      showConfirmButton: false,
    });
  }
};

// Para presentar: abre el modal de producto, donde se eligen variantes, extras y cantidad.
const openProductDetail = (product) => {
  selectedProduct.value = product;
  currentQty.value = 1;
  selectedProductType.value = product.type || '';
  checkFavorite();

  // Load dynamic modifiers based on the product category + brand tweaks
  const modifiers = buildModifiersForProduct(product);
  customModifiers.value = modifiers || [];

  // Initialize selections based on defaults
  const selections = {};
  customModifiers.value.forEach(mod => {
      if (mod.type === 'choice') {
          selections[mod.id] = mod.default || mod.options[0];
      } else if (mod.type === 'counter') {
          selections[mod.id] = 0;
      } else if (mod.type === 'toggle') {
          selections[mod.id] = false;
      }
  });
  modifierSelections.value = selections;

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const closeDetail = () => {
  selectedProduct.value = null;
  selectedProductType.value = '';
};

const changeQty = (step) => {
  const nextValue = currentQty.value + step;
  if (nextValue >= 1) currentQty.value = nextValue;
};

const toggleOption = (optionKey) => {
  // legacy function handled below
};

const updateModifier = (modId, value, type) => {
    if (type === 'counter') {
        const mod = customModifiers.value.find(m => m.id === modId);
        const current = modifierSelections.value[modId] || 0;
        const nextVal = current + value;
        if (nextVal >= 0 && nextVal <= mod.max) {
             modifierSelections.value[modId] = nextVal;
        }
    } else {
        modifierSelections.value[modId] = value;
    }
};

const createCartItem = () => {
  const detailParts = [];
  if (selectedProductType.value) detailParts.push(`Tipo: ${selectedProductType.value}`);

  customModifiers.value.forEach(mod => {
      const selection = modifierSelections.value[mod.id];
      if (mod.type === 'choice') {
          if (mod.id === 'size') {
              detailParts.push(`${mod.label}: ${selection}`);
          } else if (selection !== mod.default) {
              detailParts.push(`${mod.label}: ${selection}`);
          }
      } else if (mod.type === 'counter' && selection > 0) {
          detailParts.push(`+${selection} ${mod.label}`);
      } else if (mod.type === 'toggle' && selection) {
          detailParts.push(`${mod.label}: Sí`);
      }
  });

  const detailSummary = detailParts.length > 0 ? detailParts.join(' | ') : 'Sin adicionales';

  return {
    id: selectedProduct.value.id,
    name: selectedProduct.value.name,
    img: selectedProduct.value.img,
    price: currentUnitPrice.value,
    qty: currentQty.value,
    details: detailSummary,
    place: franchise.value.name,
    franchiseSlug: franchise.value.slug,
    tenantId: franchise.value.tenantId,
  };
};

// Para presentar: agrega el producto personalizado al carrito compartido por Checkout.
const addToCart = async ({ silent = false } = {}) => {
  if (!selectedProduct.value) return false;

  const item = createCartItem();


  addCartItem(item);
  updateCartBadge();

  if (!silent) {
    Swal.fire({
      icon: 'success',
      title: `${item.name} agregado`,
      toast: true,
      position: 'top-end',
      timer: 1400,
      showConfirmButton: false,
      background: franchise.value.primary,
      color: '#fff',
    });
  }

  closeDetail();
  return true;
};

const buyNow = async () => {
  const added = await addToCart({ silent: true });
  if (added) {
    router.push('/checkout');
  }
};

const startSlideShow = () => {
  if (slideInterval) clearInterval(slideInterval);
  if (slides.value.length <= 1) return;

  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.value.length;
  }, 4500);
};

const goToSlide = (index) => {
  currentSlide.value = index;
  startSlideShow();
};

const goBackHome = () => {
  router.push('/');
};

onMounted(async () => {
  updateCartBadge();
  updateNotificationBadge();
  userName.value = getSession().userName || '';
  window.addEventListener(APP_EVENTS.cartChanged, updateCartBadge);
  window.addEventListener(APP_EVENTS.notificationsChanged, updateNotificationBadge);

  currentCategory.value = 'Todos';

  await fetchProducts();
  startSlideShow();
});

onBeforeUnmount(() => {
  window.removeEventListener(APP_EVENTS.cartChanged, updateCartBadge);
  window.removeEventListener(APP_EVENTS.notificationsChanged, updateNotificationBadge);
  if (slideInterval) {
    clearInterval(slideInterval);
  }
});
</script>

<template>
  <div class="catalog-surface font-sans antialiased min-h-screen text-slate-800 flex flex-col" :style="brandVars">
    <header class="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3 md:py-4">
        <div class="flex items-center gap-4">
          <button @click="goBackHome" aria-label="Volver al inicio" class="text-slate-800 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition">
            <i class="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <div class="flex items-center space-x-2 md:space-x-3 cursor-default">
            <i class="fas fa-bolt text-2xl md:text-3xl animate-pulse transform" :style="{ color: 'var(--brand-primary)' }"></i>
            <span class="text-xl md:text-2xl font-extrabold whitespace-nowrap text-slate-900 tracking-tight">FOODRUSH</span>
          </div>
        </div>

        <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 transition-all" :style="{ borderColor: 'var(--brand-soft-strong)' }">
          <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
          <input v-model="searchTerm" type="text" placeholder="Buscar tu antojo..." class="outline-none w-full text-sm bg-transparent">
        </div>

        <div class="flex items-center gap-4 md:gap-6">
          <button type="button" class="md:hidden text-gray-600 text-lg" aria-label="Buscar productos"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button>
          <button @click="router.push('/notifications')" class="transition relative text-xl text-gray-600 p-1" :style="{ color: 'var(--brand-primary)' }" aria-label="Ver notificaciones">
            <i class="fa-regular fa-bell"></i>
            <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm bg-red-500">{{ notificationCount }}</span>
          </button>
          <button @click="router.push('/cart')" class="transition relative text-xl text-gray-600 p-1" :style="{ color: 'var(--brand-primary)' }" aria-label="Ver carrito">
            <i class="fa-solid fa-cart-shopping"></i>
            <span v-if="cartCount > 0" class="absolute -top-1 -right-1 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm" :style="{ backgroundColor: 'var(--brand-primary)' }">{{ cartCount }}</span>
          </button>

          <button v-if="userName" @click="router.push('/profile')" class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition">
            <div class="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm" :style="{ backgroundColor: 'var(--brand-primary)' }">{{ userName.charAt(0).toUpperCase() }}</div>
            <span class="text-sm font-medium text-slate-700 hidden lg:block">{{ userName }}</span>
          </button>
          <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600 transition" :style="{ color: 'var(--brand-primary)' }">
            Iniciar Sesion
          </button>
        </div>
      </div>
    </header>

    <div v-if="!selectedProduct" class="fade-in pb-10 flex-1">
      <section class="brand-hero-panel flex flex-col md:flex-row h-auto md:h-[450px] w-full border-b border-gray-100 relative">
        <div class="brand-hero-panel__logo-side w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 z-10 order-2 md:order-1 relative overflow-hidden">
          <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 20px 20px;"></div>
          <div class="brand-hero-mark z-10 relative" :aria-label="`${franchise.name} logo`">
            <div class="brand-hero-mark__halo"></div>
            <div class="brand-hero-mark__frame">
              <span class="brand-hero-mark__ring"></span>
              <div class="brand-hero-mark__media">
                <img
                  :src="franchise.logo"
                  :alt="`${franchise.name} logo`"
                  class="brand-hero-mark__image"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
          <div class="slider-container">
            <div
              v-for="(slide, idx) in slides"
              :key="idx"
              class="slide"
              :class="{ active: currentSlide === idx }"
            >
              <img
                :src="slide"
                :srcset="getResponsiveImageSrcset(slide, [480, 900])"
                sizes="(max-width: 767px) 100vw, 60vw"
                :alt="`${franchise.name} slide ${idx + 1}`"
                class="w-full h-full object-cover object-center"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : 'auto'"
                decoding="async"
              />
            </div>
          </div>

          <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>

          <div class="slider-dots">
            <button
              v-for="(_, idx) in slides"
              :key="idx"
              type="button"
              class="dot"
              :class="{ active: currentSlide === idx }"
              :aria-label="`Ver promocion ${idx + 1}`"
              :aria-current="currentSlide === idx ? 'true' : undefined"
              @click="goToSlide(idx)"
            ></button>
          </div>
        </div>
      </section>

      <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
        <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar">
          <button
            v-for="category in availableCategories"
            :key="category"
            @click="setCategory(category)"
            class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap"
            :class="currentCategory === category ? 'active text-white' : 'border-gray-200 text-gray-600'"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 gap-6 md:gap-8" :class="contentGridClass">

        <transition name="panel-slide">
          <aside v-if="showFiltersPanel" class="md:col-span-1 relative select-none">
            <div class="filter-panel bg-white/95 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-gray-100 shadow-xl">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-filter text-sm" :style="{ color: 'var(--brand-primary)' }"></i>
                  <h3 class="font-bold text-lg text-slate-800">Filtros</h3>
                  <span class="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full border" :style="{ color: 'var(--brand-primary)', borderColor: 'var(--brand-soft-strong)', backgroundColor: 'var(--brand-soft-soft)' }">
                    {{ activeFiltersCount }}
                  </span>
                </div>
                <button @click="showFiltersPanel = false" class="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 transition" type="button" title="Ocultar panel de filtros">
                  <i class="fa-solid fa-eye-slash text-xs"></i>
                </button>
              </div>

              <div class="filter-section mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-tag opacity-70" :style="{ color: 'var(--brand-primary)' }"></i> {{ sidebarConfig.typeLabel }}
                  </h4>
                  <button @click="showTypeFilter = !showTypeFilter" type="button" class="filter-collapse-btn">
                    {{ showTypeFilter ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <div v-if="showTypeFilter && sidebarConfig.types.length === 0" class="text-sm text-gray-400">
                  Sin filtros para esta categoría.
                </div>
                <div v-else-if="showTypeFilter" class="flex flex-wrap gap-2">
                  <button
                    v-for="typeItem in sidebarConfig.types"
                    :key="typeItem.key"
                    @click="toggleTypeFilter(typeItem.key)"
                    :class="[
                      'px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                      activeTypeFilters.includes(typeItem.key)
                        ? 'text-white shadow-md scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
                    ]"
                    :style="
                      activeTypeFilters.includes(typeItem.key)
                        ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
                        : {}
                    "
                  >
                    {{ typeItem.label }}
                  </button>
                </div>
              </div>

              <div v-if="sidebarConfig.showExtra" class="filter-section mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-pepper-hot opacity-70" :style="{ color: 'var(--brand-primary)' }"></i> {{ sidebarConfig.extraLabel }}
                  </h4>
                  <button @click="showExtraFilterSection = !showExtraFilterSection" type="button" class="filter-collapse-btn">
                    {{ showExtraFilterSection ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <div v-if="showExtraFilterSection" class="flex gap-2 bg-gray-100 p-1 rounded-xl">
                  <button @click="toggleExtraFilter('yes')" :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center', activeExtraFilter === 'yes' ? 'bg-white shadow-sm' : 'text-gray-700 hover:text-gray-900']" :style="activeExtraFilter === 'yes' ? { color: 'var(--brand-primary)' } : {}">
                    Si
                  </button>
                  <button @click="toggleExtraFilter('no')" :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center', activeExtraFilter === 'no' ? 'bg-white shadow-sm' : 'text-gray-700 hover:text-gray-900']" :style="activeExtraFilter === 'no' ? { color: 'var(--brand-primary)' } : {}">
                    No
                  </button>
                </div>
              </div>

              <div class="filter-section mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-dollar-sign opacity-70" :style="{ color: 'var(--brand-primary)' }"></i> Precio
                  </h4>
                  <button @click="showPriceFilterSection = !showPriceFilterSection" type="button" class="filter-collapse-btn">
                    {{ showPriceFilterSection ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <div v-if="showPriceFilterSection" class="flex flex-wrap gap-2">
                  <button @click="setPriceFilter('all')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activePriceFilter === 'all' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activePriceFilter === 'all' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">Todos</button>
                  <button @click="setPriceFilter('low')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activePriceFilter === 'low' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activePriceFilter === 'low' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">Hasta {{ $money(150) }}</button>
                  <button @click="setPriceFilter('mid')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activePriceFilter === 'mid' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activePriceFilter === 'mid' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">{{ $money(151) }}-{{ $money(300) }}</button>
                  <button @click="setPriceFilter('high')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activePriceFilter === 'high' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activePriceFilter === 'high' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">+{{ $money(300) }}</button>
                </div>
              </div>

              <div class="filter-section mb-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                    <i class="fa-solid fa-arrow-down-wide-short opacity-70" :style="{ color: 'var(--brand-primary)' }"></i> Ordenar
                  </h4>
                  <button @click="showSortFilterSection = !showSortFilterSection" type="button" class="filter-collapse-btn">
                    {{ showSortFilterSection ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
                <div v-if="showSortFilterSection" class="flex flex-wrap gap-2">
                  <button @click="setSortFilter('default')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activeSortFilter === 'default' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activeSortFilter === 'default' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">Relevancia</button>
                  <button @click="setSortFilter('price-asc')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activeSortFilter === 'price-asc' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activeSortFilter === 'price-asc' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">Menor precio</button>
                  <button @click="setSortFilter('price-desc')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activeSortFilter === 'price-desc' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activeSortFilter === 'price-desc' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">Mayor precio</button>
                  <button @click="setSortFilter('name-asc')" :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border', activeSortFilter === 'name-asc' ? 'text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50']" :style="activeSortFilter === 'name-asc' ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}">A-Z</button>
                </div>
              </div>

              <div class="pt-2">
                <button @click="resetFilters" type="button" class="filter-reset-btn w-full py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
                  <i class="fa-solid fa-rotate-left"></i> Limpiar filtros
                </button>
              </div>
            </div>
          </aside>
        </transition>

        <main :class="mainColumnClass">
          <div v-if="!isLoading" class="catalog-toolbar-row mb-4 md:mb-5">
            <transition name="float-btn">
              <button
                v-if="!showFiltersPanel"
                @click="openFiltersPanel"
                class="filter-toggle-inline"
                :style="{ backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-soft-strong)' }"
                type="button"
              >
                <i class="fa-solid fa-filter text-[10px]"></i>
                Mostrar filtros
              </button>
            </transition>
            <div class="catalog-toolbar">
              <div class="flex items-center gap-2">
                <span class="catalog-count-pill" :style="{ backgroundColor: 'var(--brand-primary)' }">{{ availableProductsCount }}</span>
                <span class="text-sm md:text-base font-semibold text-slate-700">productos disponibles</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="catalog-chip">Categoría: {{ currentCategory }}</span>
                <span v-if="activeFiltersCount > 0" class="catalog-chip catalog-chip--active" :style="{ backgroundColor: 'var(--brand-primary)' }">
                  {{ activeFiltersCount }} filtros activos
                </span>
              </div>
            </div>
          </div>
          <div v-if="isUsingFallbackProducts" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            No hubo coincidencias exactas. Te mostramos sugerencias para que siempre tengas opciones.
          </div>

          <div v-if="isLoading" class="text-center py-20">
            <div class="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" :style="{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }"></div>
            <p class="text-gray-400 mt-4 font-medium">Cargando productos...</p>
          </div>

          <div v-else-if="fetchError && visibleProducts.length === 0" class="col-span-full text-center py-20 text-gray-500 flex flex-col items-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-4" :style="{ color: 'var(--brand-primary)' }"></i>
            No se pudieron cargar productos para {{ franchise.name }}.
          </div>

          <div v-else-if="visibleProducts.length === 0" class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center">
            <i class="fa-regular fa-face-frown text-4xl mb-4 text-gray-300"></i>
            No se encontraron productos para esta categoría.
          </div>

          <div v-else :key="catalogMotionKey" class="grid gap-3 md:gap-6" :class="productGridClass">
            <article
              v-for="(product, idx) in visibleProducts"
              :key="`${product.id}-${product.name}`"
              @click="openProductDetail(product)"
              class="product-card fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] cursor-pointer bg-white group relative overflow-hidden"
              :style="{ '--stagger-delay': `${Math.min(idx, 10) * 45}ms` }"
            >
              <div class="product-media h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                <div class="card-glow absolute inset-0 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                <div :class="['product-media__shell', getProductMediaVariant(product.category)]">
                  <img
                    :src="product.img"
                    :srcset="getResponsiveImageSrcset(product.img, [180, 320, 420])"
                    sizes="(max-width: 767px) 46vw, 220px"
                    :alt="product.name"
                    class="product-media__image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div class="text-center w-full relative z-10">
                <h3 class="product-name font-bold text-base md:text-lg text-slate-800 mb-1 transition line-clamp-1">
                  {{ product.name }}
                </h3>
                <p class="text-xs font-bold mb-3 md:mb-4 uppercase tracking-wide" :style="{ color: 'var(--brand-primary)' }">
                  {{ product.category }}
                </p>
                <div class="product-footer flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl transition border border-transparent">
                  <span class="font-bold px-2 text-lg">{{ $money(product.price) }}</span>
                  <span class="plus-btn w-8 h-8 rounded-lg bg-white shadow-sm transition flex items-center justify-center border border-gray-100">
                    <i class="fa-solid fa-plus"></i>
                  </span>
                </div>
              </div>
            </article>
          </div>
        </main>
      </div>
    </div>

    <div v-else class="fade-in container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl relative">
      <button @click="closeDetail" class="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-sm font-bold text-gray-700 transition-all transform hover:-translate-x-1 border border-gray-100" :style="{ color: 'var(--brand-primary)' }">
        <i class="fa-solid fa-arrow-left"></i><span>Volver</span>
      </button>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 pt-10">
        <div class="flex flex-col gap-6 md:gap-8 md:col-span-3">
          <div
            class="product-detail-media relative rounded-[2.5rem] flex items-center justify-center p-8 h-80 md:h-[550px] border shadow-inner overflow-hidden group"
            :style="{ backgroundColor: 'var(--brand-soft)', borderColor: 'var(--brand-soft-strong)' }"
          >
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700" :style="{ background: `linear-gradient(to top right, ${toRgba(franchise.primary, 0.08)}, transparent)` }"></div>
            <div :class="['product-detail-media__shell', getProductMediaVariant(selectedProduct.category, 'detail')]">
              <img
                :src="selectedProduct.img"
                :srcset="getResponsiveImageSrcset(selectedProduct.img, [420, 700])"
                sizes="(max-width: 767px) 88vw, 540px"
                :alt="selectedProduct.name"
                class="product-detail-media__image"
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>

          <div v-if="sizeModifier" class="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 class="font-bold text-lg text-slate-800 mb-5 font-heading flex items-center gap-2">
              <i class="fa-solid fa-up-right-and-down-left-from-center" :style="{ color: 'var(--brand-primary)' }"></i>
              Elige el tamano
            </h3>
            <div class="grid gap-3 md:gap-4" :class="sizeOptionsGridClass">
              <button
                v-for="opt in sizeModifier.options"
                :key="opt"
                type="button"
                @click="updateModifier(sizeModifier.id, opt, 'choice')"
                class="size-choice flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div :class="['size-choice__frame', modifierSelections[sizeModifier.id] === opt ? 'is-selected' : '']">
                  <i :class="['fa-solid transition-all duration-300', sizeIconClass, modifierSelections[sizeModifier.id] === opt ? 'active-icon' : 'idle-icon', opt === sizeModifier.options[0] ? 'text-2xl' : opt === sizeModifier.options[1] ? 'text-3xl' : 'text-4xl']"></i>
                  <div v-if="modifierSelections[sizeModifier.id] === opt" class="size-choice__dot"></div>
                </div>
                <div class="text-center leading-tight">
                  <span :class="['size-choice__label', modifierSelections[sizeModifier.id] === opt ? 'is-selected' : '']">{{ opt }}</span>
                  <span class="size-choice__price">{{ $money(getSizeOptionPrice(opt)) }}</span>
                </div>
              </button>
            </div>
          </div>

          <div v-if="sizeInfo" class="size-info-card w-full rounded-2xl border px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5" :style="{ color: 'var(--brand-primary)' }">
              <i class="fa-solid fa-circle-info text-sm"></i>
              <span class="text-xs font-extrabold uppercase tracking-wider">{{ sizeInfo.title }}</span>
            </div>
            <p class="text-sm font-semibold text-slate-800 leading-snug">{{ sizeInfo.description }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ sizeInfo.note }}</p>
          </div>

          <div class="summary-card hidden md:block">
            <div class="summary-card__header">
              <div>
                <span class="summary-card__eyebrow">Resumen rápido</span>
                <h3 class="summary-card__title">Tu configuración actual</h3>
              </div>
              <span class="summary-card__badge">{{ quantityLabel }}</span>
            </div>

            <div class="summary-card__price-box">
              <div
                v-for="(item, idx) in priceBreakdown"
                :key="`${item.label}-${idx}`"
                class="summary-card__price-line"
              >
                <span>{{ item.label }}</span>
                <strong>{{ idx === 0 ? $money(item.value) : $moneySigned(item.value) }}</strong>
              </div>
              <div class="summary-card__price-line summary-card__price-line--total">
                <span>Extras</span>
                <strong>{{ $moneySigned(extrasTotal) }}</strong>
              </div>
            </div>

            <div class="summary-card__chips">
              <span v-for="item in modifierSummary" :key="item" class="summary-card__chip">
                <i class="fa-solid fa-check"></i>
                {{ item }}
              </span>
              <span v-if="modifierSummary.length === 0" class="summary-card__chip">
                <i class="fa-solid fa-sparkles"></i>
                Sin ajustes extra
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col md:col-span-2 relative pb-32 md:pb-0">
          <div class="mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h2 class="text-xs font-bold mb-3 tracking-widest uppercase inline-block px-3 py-1 rounded-full" :style="{ color: 'var(--brand-primary)', backgroundColor: 'var(--brand-soft)' }">
              {{ selectedProduct.category }}
            </h2>
            <h1 class="text-3xl md:text-5xl font-black text-slate-900 mb-4 font-heading leading-tight tracking-tight">
              {{ selectedProduct.name }}
            </h1>

            <div class="flex items-center mb-5 text-sm pb-5 border-b border-gray-100">
              <div class="flex text-amber-400 gap-1 text-base shadow-sm">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star-half-stroke"></i>
              </div>
              <span class="text-gray-400 ml-3 text-sm font-medium underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-gray-600">(Múltiples reseñas)</span>

              <button
                @click="toggleFavorite"
                class="ml-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border"
                :class="isFavorite ? 'bg-red-50 border-red-100 text-red-500 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50/50'"
              >
                <i :class="isFavorite ? 'fa-solid fa-heart text-xl' : 'fa-regular fa-heart text-xl'"></i>
              </button>
            </div>

            <p class="text-gray-600 text-sm md:text-base leading-relaxed break-words">
              {{ selectedProduct.description || defaultDescription }}
            </p>
          </div>

          <div class="studio-hero mb-6 md:mb-8">
            <div class="studio-hero__content">
              <span class="studio-hero__eyebrow">Configuracion en vivo</span>
              <span class="studio-hero__label">Precio unitario</span>
              <div class="studio-hero__price">
                <span>{{ $money(currentUnitPrice) }}</span>
              </div>
              <div class="studio-pill-row">
                <span class="studio-status-pill">{{ selectedSizeLabel }}</span>
                <span class="studio-status-pill">{{ activeCustomizationCount }} ajustes</span>
                <span class="studio-status-pill">{{ quantityLabel }}</span>
              </div>
            </div>

            <div class="studio-qty-panel">
              <span class="studio-qty-panel__label">Cantidad</span>
              <div class="studio-counter studio-counter--hero">
                <button class="studio-counter__btn studio-counter__btn--ghost" @click="changeQty(-1)">
                  <i class="fa-solid fa-minus text-xs"></i>
                </button>
                <span class="studio-counter__value studio-counter__value--hero">{{ currentQty }}</span>
                <button class="studio-counter__btn studio-counter__btn--ghost" @click="changeQty(1)">
                  <i class="fa-solid fa-plus text-xs"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="nonSizeModifiers.length > 0" class="customization-panel bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6 mb-6">
            <h3 class="font-bold text-lg text-slate-800 mb-2 font-heading flex items-center gap-2">
              <i class="fa-solid fa-sliders" :style="{ color: 'var(--brand-primary)' }"></i>
              Personaliza tu pedido
            </h3>
            <p class="text-sm text-slate-500 mb-5">{{ modifierIntro }}</p>

            <div
              v-for="mod in nonSizeModifiers"
              :key="mod.id"
              class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 last:border-0 rounded-xl px-2"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="option-icon-shell">
                  <i class="fa-solid" :class="getModifierIcon(mod)" :style="{ color: 'var(--brand-primary)' }"></i>
                </div>
                <div>
                  <span class="block text-sm font-bold text-slate-800">{{ mod.label }}</span>
                  <span v-if="mod.type !== 'choice' && mod.price > 0" class="text-xs font-medium" :style="{ color: 'var(--brand-primary)' }">{{ $moneySigned(mod.price) }}</span>
                  <span v-else class="text-xs text-slate-500">{{ mod.type === 'choice' ? 'Selecciona una opción' : mod.type === 'counter' ? 'Ajusta la cantidad' : 'Activa si lo deseas' }}</span>
                </div>
              </div>

              <div class="option-control">
                <div v-if="mod.type === 'choice'" class="selector-grid">
                  <button
                    v-for="opt in mod.options"
                    :key="opt"
                    type="button"
                    @click="updateModifier(mod.id, opt, 'choice')"
                    :class="['choice-chip', modifierSelections[mod.id] === opt ? 'is-active' : '']"
                  >
                    {{ opt }}
                  </button>
                </div>

                <div v-else-if="mod.type === 'counter'" class="counter-strip">
                  <button
                    @click="updateModifier(mod.id, -1, 'counter')"
                    class="counter-btn-inline"
                    :disabled="modifierSelections[mod.id] <= 0"
                  >
                    <i class="fa-solid fa-minus text-xs"></i>
                  </button>
                  <span class="counter-value">{{ modifierSelections[mod.id] }}</span>
                  <button
                    @click="updateModifier(mod.id, 1, 'counter')"
                    class="counter-btn-inline"
                    :disabled="modifierSelections[mod.id] >= mod.max"
                  >
                    <i class="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>

                <button
                  v-else-if="mod.type === 'toggle'"
                  type="button"
                  @click="updateModifier(mod.id, !modifierSelections[mod.id], 'toggle')"
                  :class="['toggle-chip', modifierSelections[mod.id] ? 'is-active' : '']"
                >
                  <span>{{ modifierSelections[mod.id] ? 'Activo' : 'Agregar' }}</span>
                  <i :class="modifierSelections[mod.id] ? 'fa-solid fa-check' : 'fa-solid fa-plus'"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="summary-card mb-6 md:hidden">
            <div class="summary-card__header">
              <div>
                <span class="summary-card__eyebrow">Resumen rápido</span>
                <h3 class="summary-card__title">Tu configuración actual</h3>
              </div>
              <span class="summary-card__badge">{{ quantityLabel }}</span>
            </div>

            <div class="summary-card__price-box">
              <div
                v-for="(item, idx) in priceBreakdown"
                :key="`mobile-${item.label}-${idx}`"
                class="summary-card__price-line"
              >
                <span>{{ item.label }}</span>
                <strong>{{ idx === 0 ? $money(item.value) : $moneySigned(item.value) }}</strong>
              </div>
              <div class="summary-card__price-line summary-card__price-line--total">
                <span>Extras</span>
                <strong>{{ $moneySigned(extrasTotal) }}</strong>
              </div>
            </div>

            <div class="summary-card__chips">
              <span v-for="item in modifierSummary" :key="`mobile-${item}`" class="summary-card__chip">
                <i class="fa-solid fa-check"></i>
                {{ item }}
              </span>
              <span v-if="modifierSummary.length === 0" class="summary-card__chip">
                <i class="fa-solid fa-sparkles"></i>
                Sin ajustes extra
              </span>
            </div>
          </div>

          <div class="sticky-bottom-panel">
            <div class="studio-cta shadow-2xl md:shadow-lg">
              <div>
                <span>Total del pedido</span>
                <div>
                  <span class="studio-cta__price">{{ $money(totalPrice) }}</span>
                </div>
              </div>
              <div class="studio-cta__actions">
                <button type="button" class="studio-cta__button studio-cta__button--secondary" @click="addToCart">
                  <span>Añadir</span>
                  <i class="fa-solid fa-cart-arrow-down"></i>
                </button>
                <button type="button" class="studio-cta__button studio-cta__button--primary" @click="buyNow">
                  <span>Pagar</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="brand-footer text-white mt-auto">
      <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div class="mb-8 md:mb-0">
          <div class="flex items-center gap-2 mb-4 brand-footer__badge">
            <span class="brand-footer__food">Food</span>
            <span class="brand-footer__rush">Rush</span>
          </div>
          <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">
            Los favoritos de {{ franchise.name }} con una experiencia más moderna, rápida y clara.
          </p>
          <div class="flex gap-4">
            <a href="#" class="brand-footer__social" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" class="brand-footer__social" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" class="brand-footer__social" aria-label="Twitter"><i class="fa-brands fa-twitter"></i></a>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-8 md:gap-16 text-sm text-left md:text-right w-full md:w-auto">
          <div>
            <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2 md:border-none inline-block w-full md:w-auto">Ayuda</h4>
            <ul class="space-y-3 text-white/70 font-medium">
              <li><a href="#" class="hover:text-white hover:underline transition">Preguntas Frecuentes</a></li>
              <li><a href="#" class="hover:text-white hover:underline transition">Soporte</a></li>
              <li><a href="#" class="hover:text-white hover:underline transition">Términos</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2 md:border-none inline-block w-full md:w-auto">Empresa</h4>
            <ul class="space-y-3 text-white/70 font-medium">
              <li><a href="#" class="hover:text-white hover:underline transition">Sobre Nosotros</a></li>
              <li><a href="#" class="hover:text-white hover:underline transition">Novedades</a></li>
              <li><a href="#" class="hover:text-white hover:underline transition">Afíliate</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 text-center py-4 text-xs text-white/50">
        &copy; 2026 FoodRush Inc. Todos los derechos reservados.
      </div>
    </footer>
  </div>
</template>

<style scoped>

.font-heading {
  font-family: 'Sora', sans-serif;
}

.catalog-surface {
  background:
    radial-gradient(1200px 520px at 10% -20%, var(--brand-soft), transparent 62%),
    radial-gradient(1000px 500px at 100% 0%, var(--brand-soft-strong), transparent 58%),
    var(--brand-background);
}

.brand-hero-panel,
.brand-hero-panel__logo-side {
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.16), transparent 28%),
    linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%);
}

.brand-hero-mark {
  position: relative;
  display: grid;
  place-items: center;
  width: min(72vw, 320px);
  aspect-ratio: 1;
}

.brand-hero-mark__halo,
.brand-hero-mark__frame,
.brand-hero-mark__ring {
  position: absolute;
  inset: 0;
}

.brand-hero-mark__halo {
  inset: 8%;
  border-radius: 38% 62% 55% 45% / 36% 42% 58% 64%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.06) 54%, rgba(255, 255, 255, 0) 74%),
    radial-gradient(circle at 70% 72%, var(--brand-accent-soft), rgba(255, 255, 255, 0) 62%);
  filter: blur(4px);
  transform: rotate(-10deg);
}

.brand-hero-mark__frame {
  display: grid;
  place-items: center;
  padding: clamp(18px, 4vw, 30px);
  border-radius: 36% 64% 58% 42% / 40% 44% 56% 60%;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.05)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 58%);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    0 24px 48px rgba(6, 43, 31, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  transform: rotate(-8deg);
}

.brand-hero-mark__ring {
  inset: 11%;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow:
    inset 0 0 0 12px rgba(255, 255, 255, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.brand-hero-mark__media {
  position: relative;
  z-index: 1;
  width: 72%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 32%;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(235, 245, 240, 0.92));
  box-shadow:
    0 16px 28px rgba(6, 43, 31, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.brand-hero-mark__media::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
  pointer-events: none;
  z-index: 1;
}

.brand-hero-mark__image {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10%;
  filter: drop-shadow(0 18px 24px rgba(15, 23, 42, 0.14));
  transform: scale(1.03) rotate(8deg);
  transition: transform 0.45s ease, filter 0.45s ease;
}

.brand-hero-mark:hover .brand-hero-mark__image {
  transform: scale(1.08) rotate(5deg);
  filter: drop-shadow(0 24px 28px rgba(15, 23, 42, 0.18));
}

.fade-in {
  animation: fadeIn 0.35s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slider-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.9s ease;
}

.slide.active {
  opacity: 1;
}

.slider-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 20;
}

.dot {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: transparent;
}

.dot::before {
  content: '';
  width: 10px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.65);
  border-radius: 999px;
  transition: transform 0.25s, background-color 0.25s;
}

.dot.active::before {
  background-color: #ffffff;
  transform: scale(1.25);
}

.filter-tab {
  transition: all 0.3s ease;
}

.filter-tab.active {
  background-color: var(--brand-primary);
  border-color: var(--brand-primary);
  box-shadow: 0 4px 6px -1px var(--brand-shadow);
}

.filter-tab:not(.active):hover {
  color: var(--brand-primary);
  border-color: var(--brand-primary);
  background-color: var(--brand-soft-soft);
}

.filter-panel {
  position: sticky;
  top: 132px;
  z-index: 20;
  width: 100%;
  max-width: 280px;
  border-color: var(--brand-soft-strong);
  box-shadow: 0 18px 36px var(--brand-soft-strong);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.95));
  transition: box-shadow 0.22s ease, transform 0.22s ease;
}

.filter-panel:hover {
  box-shadow: 0 24px 48px var(--brand-shadow);
}

.filter-section {
  padding-top: 14px;
  border-top: 1px solid var(--brand-soft-strong);
}

.filter-section:first-of-type {
  padding-top: 0;
  border-top: none;
}

.filter-collapse-btn {
  font-size: 11px;
  font-weight: 700;
  color: var(--brand-primary);
  background: var(--brand-soft-soft);
  border: 1px solid var(--brand-soft-strong);
  border-radius: 999px;
  padding: 4px 10px;
  transition: all 0.2s ease;
}

.filter-collapse-btn:hover {
  filter: brightness(0.95);
}

.filter-reset-btn {
  letter-spacing: 0.02em;
  color: var(--brand-primary);
  border: 1px solid var(--brand-soft-strong);
  background: color-mix(in srgb, var(--brand-primary) 6%, white);
}

.filter-reset-btn:hover {
  background: color-mix(in srgb, var(--brand-primary) 10%, white);
}

.filter-toggle-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  min-height: 48px;
  border-radius: 12px;
  background-color: var(--brand-primary);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid var(--brand-soft-strong);
  box-shadow: 0 10px 18px var(--brand-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  letter-spacing: 0.02em;
}

.filter-toggle-inline:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px var(--brand-shadow);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}

.float-btn-enter-active,
.float-btn-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.float-btn-enter-from,
.float-btn-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.catalog-toolbar-row {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 12px;
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--brand-soft-strong);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
  flex: 1;
  min-height: 48px;
}

.catalog-count-pill {
  min-width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 16px var(--brand-shadow);
}

.catalog-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-primary);
  background: var(--brand-soft-soft);
  border: 1px solid var(--brand-soft-strong);
}

.catalog-chip--active {
  color: #ffffff;
  border-color: var(--brand-soft-strong);
}

@media (min-width: 768px) {
  .filter-panel {
    top: 146px;
    max-height: calc(100vh - 156px);
    overflow-y: auto;
    margin-top: 4px;
  }
}

@media (max-width: 767px) {
  .filter-panel {
    position: static !important;
    width: 100% !important;
    max-width: none;
  }

  .filter-toggle-inline {
    min-height: 40px;
    padding: 0 12px;
    font-size: 11px;
    border-radius: 10px;
    width: 100%;
    justify-content: center;
  }

  .catalog-toolbar-row {
    gap: 8px;
    flex-direction: column;
    align-items: stretch;
  }

  .catalog-toolbar {
    padding: 10px 12px;
  }
}

.product-card {
  animation: cardIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--stagger-delay, 0ms);
  border-color: var(--brand-soft-strong) !important;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%) !important;
  box-shadow: 0 12px 28px var(--brand-soft);
}

.product-card:hover {
  border-color: var(--brand-primary);
  transform: translateY(-4px);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
}

.product-card .card-glow {
  background-color: var(--brand-soft);
}

.product-card:hover .product-name {
  color: var(--brand-primary);
}

.product-card .plus-btn {
  color: var(--brand-primary);
}

.product-card:hover .plus-btn {
  background-color: var(--brand-primary);
  color: #ffffff;
}

.product-media {
  position: relative;
  isolation: isolate;
}

.product-media__shell {
  --media-padding: 14px;
  --media-image-width: 100%;
  --media-image-height: 100%;
  --media-image-scale: 1;
  --media-image-x: 0px;
  --media-image-y: 0px;
  --media-image-hover-scale: 1.06;
  --media-image-hover-x: 0px;
  --media-image-hover-y: -2px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--media-padding);
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid var(--brand-soft-strong);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 249, 246, 0.94)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.72), transparent 58%);
  box-shadow:
    0 14px 24px var(--brand-soft),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.product-media__shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.product-media__image {
  position: relative;
  z-index: 1;
  width: var(--media-image-width);
  height: var(--media-image-height);
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 14px 18px rgba(15, 23, 42, 0.14));
  transform: translate(var(--media-image-x), var(--media-image-y)) scale(var(--media-image-scale));
  transition: transform 0.45s ease, filter 0.45s ease;
}

.group:hover .product-media__shell {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--brand-primary) 45%, white);
  box-shadow:
    0 18px 28px var(--brand-soft-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.group:hover .product-media__image {
  transform: translate(var(--media-image-hover-x), var(--media-image-hover-y)) scale(var(--media-image-hover-scale));
  filter: drop-shadow(0 18px 22px rgba(15, 23, 42, 0.18));
}

.product-media__shell--drink {
  --media-padding: 10px 12px 4px;
  --media-image-width: 84%;
  --media-image-height: 100%;
  --media-image-scale: 1.08;
  --media-image-y: 6px;
  --media-image-hover-scale: 1.14;
  --media-image-hover-y: 2px;
}

.product-media__shell--food {
  --media-padding: 12px 10px;
  --media-image-width: 100%;
  --media-image-height: 84%;
  --media-image-scale: 1.03;
  --media-image-y: 4px;
  --media-image-hover-scale: 1.08;
  --media-image-hover-y: 0px;
}

.product-media__shell--dessert {
  --media-padding: 12px;
  --media-image-width: 88%;
  --media-image-height: 90%;
  --media-image-scale: 1.06;
  --media-image-y: 3px;
  --media-image-hover-scale: 1.11;
  --media-image-hover-y: -1px;
}

.product-media::after {
  content: '';
  position: absolute;
  inset: 14% 16%;
  border-radius: 9999px;
  background: radial-gradient(circle, var(--brand-soft-strong) 0%, rgba(0, 0, 0, 0) 70%);
  pointer-events: none;
  z-index: 0;
}

.product-footer {
  border-color: var(--brand-soft-strong);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.product-detail-media {
  isolation: isolate;
}

.product-detail-media::after {
  content: '';
  position: absolute;
  inset: 10% 12%;
  border-radius: 34px;
  background: radial-gradient(circle at center, var(--brand-soft-strong) 0%, rgba(0, 0, 0, 0) 72%);
  pointer-events: none;
  z-index: 0;
}

.product-detail-media__shell {
  --detail-media-padding: clamp(18px, 4vw, 28px);
  --detail-media-image-width: 100%;
  --detail-media-image-height: 100%;
  --detail-media-image-scale: 1;
  --detail-media-image-x: 0px;
  --detail-media-image-y: 0px;
  --detail-media-image-hover-scale: 1.08;
  --detail-media-image-hover-x: 0px;
  --detail-media-image-hover-y: -3px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 430px);
  height: min(100%, 430px);
  padding: var(--detail-media-padding);
  overflow: hidden;
  border-radius: 34px;
  border: 1px solid var(--brand-soft-strong);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 248, 244, 0.96)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.78), transparent 62%);
  box-shadow:
    0 22px 38px var(--brand-soft-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.product-detail-media__shell::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.product-detail-media__image {
  position: relative;
  z-index: 1;
  width: var(--detail-media-image-width);
  height: var(--detail-media-image-height);
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 20px 28px rgba(15, 23, 42, 0.18));
  transform: translate(var(--detail-media-image-x), var(--detail-media-image-y)) scale(var(--detail-media-image-scale));
  transition: transform 0.6s ease, filter 0.6s ease;
}

.group:hover .product-detail-media__image {
  transform: translate(var(--detail-media-image-hover-x), var(--detail-media-image-hover-y)) scale(var(--detail-media-image-hover-scale));
  filter: drop-shadow(0 28px 36px rgba(15, 23, 42, 0.22));
}

.product-detail-media__shell--drink {
  --detail-media-padding: 18px 24px 10px;
  --detail-media-image-width: 82%;
  --detail-media-image-height: 100%;
  --detail-media-image-scale: 1.12;
  --detail-media-image-y: 10px;
  --detail-media-image-hover-scale: 1.17;
  --detail-media-image-hover-y: 4px;
}

.product-detail-media__shell--food {
  --detail-media-padding: 24px 18px;
  --detail-media-image-width: 100%;
  --detail-media-image-height: 82%;
  --detail-media-image-scale: 1.04;
  --detail-media-image-y: 4px;
  --detail-media-image-hover-scale: 1.09;
  --detail-media-image-hover-y: 0px;
}

.product-detail-media__shell--dessert {
  --detail-media-padding: 18px 22px 16px;
  --detail-media-image-width: 88%;
  --detail-media-image-height: 92%;
  --detail-media-image-scale: 1.08;
  --detail-media-image-y: 4px;
  --detail-media-image-hover-scale: 1.13;
  --detail-media-image-hover-y: -1px;
}

.size-choice__frame {
  width: 100%;
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 2px solid #e5e7eb;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.size-choice:hover .size-choice__frame {
  transform: translateY(-2px);
  border-color: var(--brand-soft-strong);
  background: var(--brand-soft-soft);
}

.size-choice__frame.is-selected {
  border-color: var(--brand-primary);
  background: linear-gradient(180deg, #ffffff 0%, var(--brand-soft-soft) 100%);
  box-shadow: 0 12px 18px var(--brand-soft-strong);
  transform: translateY(-2px);
}

.size-choice__frame .idle-icon {
  color: #cbd5e1;
}

.size-choice__frame .active-icon {
  color: var(--brand-primary);
}

.size-choice__dot {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--brand-primary);
}

.size-choice__label {
  display: block;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 700;
  transition: color 0.2s ease;
}

.size-choice__label.is-selected {
  color: var(--brand-primary);
}

.size-choice__price {
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 0.125rem;
}

.size-info-card {
  border-color: var(--brand-soft-strong);
  background: linear-gradient(135deg, var(--brand-soft) 0%, rgba(255, 255, 255, 0.96) 100%);
  box-shadow: 0 16px 28px var(--brand-soft);
}

.studio-hero {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 30px;
  overflow: hidden;
  /* Degradado fijo y sin brillos blancos */
  background: linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary) 100%);
}

.studio-hero::before,
.studio-hero::after {
  display: none !important;
}

.studio-hero__content,
.studio-qty-panel {
  position: relative;
  z-index: 1;
}

.studio-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.86);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.studio-hero__label {
  display: block;
  margin-top: 18px;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.studio-hero__price {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  color: #ffffff;
  font-size: 46px;
  font-weight: 900;
  line-height: 1;
}

.studio-hero__currency {
  font-size: 21px;
  margin-bottom: 7px;
  color: rgba(255, 255, 255, 0.8);
}

.studio-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.studio-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.studio-qty-panel {
  min-width: 160px;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(14px);
}

.studio-qty-panel__label {
  display: block;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.studio-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.studio-counter__btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  transition: transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.studio-counter__btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.studio-counter__btn:active {
  transform: scale(0.96);
}

.studio-counter__value {
  min-width: 46px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  font-size: 18px;
  font-weight: 900;
}

.studio-counter__btn--ghost,
.studio-counter__value--hero {
  backdrop-filter: blur(10px);
}

.customization-panel {
  border-color: var(--brand-soft-strong);
  background:
    radial-gradient(540px 220px at 100% 0%, var(--brand-soft), transparent 68%),
    linear-gradient(180deg, #ffffff 0%, #f8fcfa 100%);
  box-shadow:
    0 22px 38px var(--brand-soft),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.customization-row {
  width: 100%;
  border-radius: 20px;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.customization-row:hover {
  background: rgba(255, 255, 255, 0.75);
}

.option-icon-shell {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-soft);
  border: 1px solid var(--brand-soft-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.option-control {
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: flex-start;
}

@media (min-width: 768px) {
  .option-control {
    justify-content: flex-end;
  }
}

.selector-grid {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-height: 54px;
  width: 100%;
  padding: 6px;
  border-radius: 18px;
  border: 1px solid var(--brand-soft-strong);
  background: #f8fafc;
  box-shadow: none;
}

.selector-grid::-webkit-scrollbar {
  display: none;
}

.selector-grid::after {
  content: '';
  padding-right: 2px;
}

.choice-chip {
  flex-shrink: 0;
  white-space: nowrap;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.choice-chip:hover {
  color: var(--brand-primary);
  box-shadow: 0 4px 8px var(--brand-soft);
  transform: translateY(-1px);
}

.choice-chip.is-active {
  color: var(--brand-primary);
  background: linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--brand-primary) 5%, white) 100%);
  border-color: color-mix(in srgb, var(--brand-primary) 30%, white);
  box-shadow: 0 4px 10px var(--brand-soft-strong);
  transform: translateY(-1px);
}

.counter-strip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid var(--brand-soft-strong);
  background: linear-gradient(180deg, #f7fbf8 0%, #eef5f1 100%);
}

.counter-btn-inline {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--brand-soft-strong);
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.counter-btn-inline:hover:not(:disabled) {
  box-shadow: 0 10px 16px var(--brand-soft);
  transform: translateY(-1px);
}

.counter-btn-inline:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.counter-value {
  min-width: 64px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  border: 1px solid var(--brand-soft-strong);
  background: #ffffff;
  color: #0f172a;
  font-size: 17px;
  font-weight: 900;
}

.toggle-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--brand-soft-strong);
  background: #ffffff;
  color: var(--brand-primary);
  font-size: 12px;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.toggle-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 16px var(--brand-soft);
}

.toggle-chip.is-active {
  color: #ffffff;
  border-color: var(--brand-primary);
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%);
  box-shadow: 0 12px 18px var(--brand-shadow);
}

.summary-card {
  padding: 20px;
  border-radius: 28px;
  border: 1px solid var(--brand-soft-strong);
  background: linear-gradient(180deg, #ffffff 0%, #f7fcf9 100%);
  box-shadow: 0 18px 30px var(--brand-soft);
}

.summary-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--brand-soft);
  border: 1px solid var(--brand-soft-strong);
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.summary-card__title {
  margin-top: 10px;
  color: #0f172a;
  font-size: 22px;
  line-height: 1.1;
  font-weight: 900;
}

.summary-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid var(--brand-soft-strong);
  box-shadow: 0 10px 16px var(--brand-soft);
  color: #0f172a;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.summary-card__price-box {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--brand-soft-strong);
  background: #f6faf8;
}

.summary-card__price-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #4c645b;
  font-size: 13px;
}

.summary-card__price-line strong {
  color: #0f172a;
  font-size: 14px;
  font-weight: 800;
}

.summary-card__price-line--total {
  padding-top: 10px;
  border-top: 1px solid var(--brand-soft-strong);
}

.summary-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.summary-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid var(--brand-soft-strong);
  box-shadow: 0 10px 16px var(--brand-soft);
  color: #25483d;
  font-size: 12.5px;
  font-weight: 700;
}

.summary-card__chip i {
  color: var(--brand-primary);
  font-size: 11px;
}

.studio-cta {
  padding: 12px 16px;
  border-radius: 24px;
  border: 1px solid var(--brand-soft-strong);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  /* Sombra invertida para que resalte al flotar o estar pegado */
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.06);
}

.studio-cta > div {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.studio-cta > div > span {
  color: #6b7d75;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.studio-cta > div > div {
  display: flex;
  align-items: flex-end;
}

.studio-cta__price {
  color: #0f172a;
  font-size: 28px;
  line-height: 1;
  font-weight: 900;
}

.studio-cta > button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 22px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%);
  color: #ffffff;
  box-shadow: 0 18px 30px var(--brand-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.studio-cta > button:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 36px var(--brand-shadow);
  filter: saturate(1.05);
}

.studio-cta > button:active {
  transform: scale(0.985);
}

.studio-cta > button span {
  position: static !important;
  font-size: 15px !important;
  font-weight: 900;
  text-transform: none;
}

.studio-cta > button i {
  position: static !important;
  font-size: 20px;
}

.studio-cta .studio-cta__actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 0;
  padding: 0;
}

.studio-cta__button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: 16px;
  border: 1px solid transparent;
  font-size: 15px;
  font-weight: 900;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.studio-cta__button:hover {
  transform: translateY(-2px);
  filter: saturate(1.05);
}

.studio-cta__button:active {
  transform: scale(0.985);
}

.studio-cta__button--secondary {
  background: var(--brand-soft);
  border-color: var(--brand-soft-strong);
  color: var(--brand-primary-deep);
}

.studio-cta__button--primary {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%);
  color: #ffffff;
  box-shadow: 0 18px 30px var(--brand-shadow);
}

.sticky-bottom-panel {
  position: sticky;
  left: auto;
  right: auto;
  bottom: 1rem;
  z-index: 35;
  align-self: stretch;
  margin-top: auto;
}

@media (min-width: 640px) {
  .studio-cta .studio-cta__actions {
    grid-template-columns: 1fr 1fr;
  }
}

.brand-footer {
  background: linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary) 100%);
}

.brand-footer__badge {
  width: fit-content;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 14px 24px rgba(15, 23, 42, 0.16);
}

.brand-footer__food,
.brand-footer__rush {
  font-size: 20px;
  font-weight: 800;
  font-style: italic;
}

.brand-footer__food {
  color: color-mix(in srgb, var(--brand-accent) 80%, white);
}

.brand-footer__rush {
  color: #ffffff;
  margin-left: -2px;
}

.brand-footer__social {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.brand-footer__social:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

@media (min-width: 768px) {
  .sticky-bottom-panel {
    position: sticky;
    left: auto;
    right: auto;
    bottom: 1.5rem;
    z-index: 20;
    margin-top: auto;
  }

  .studio-hero {
    grid-template-columns: 1fr auto;
    align-items: end;
  }
}

@media (max-width: 1023px) {
  .customization-row {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 12px !important;
  }
}

@media (max-width: 767px) {
  .brand-hero-mark {
    width: min(68vw, 250px);
  }

  .studio-hero {
    padding: 14px;
    border-radius: 24px;
  }

  .studio-hero__price {
    font-size: 32px;
  }

  .summary-card {
    padding: 16px;
    border-radius: 22px;
  }

  .summary-card__header,
  .studio-cta > div {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-card__title {
    font-size: 20px;
  }

  .studio-cta {
    padding: 10px 12px;
    border-radius: 20px;
  }

  .studio-cta__price {
    font-size: 24px;
  }

  .studio-cta__button {
    min-height: 44px;
  }

  .selector-grid {
    gap: 5px;
    padding: 4px;
  }

  .choice-chip {
    line-height: 1.15;
    min-height: 40px;
    padding-left: 10px;
    padding-right: 10px;
  }

  .counter-strip {
    min-height: 46px;
    padding: 4px;
  }

  .counter-btn-inline {
    width: 32px;
    height: 32px;
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
/* Local franchise personalization polish */
.customization-panel {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--brand-primary) 28%, #ffffff) !important;
  border-radius: 28px !important;
  background:
    radial-gradient(520px 220px at 100% 0%, var(--brand-soft-strong), transparent 68%),
    linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 12%, #ffffff) 0%, color-mix(in srgb, var(--brand-background) 84%, #ffffff) 100%) !important;
  box-shadow:
    0 22px 38px var(--brand-soft),
    inset 0 1px 0 rgba(255, 255, 255, 0.78) !important;
}

.customization-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: linear-gradient(90deg, var(--brand-primary), var(--brand-primary-deep));
  z-index: 0;
}

.customization-panel > * {
  position: relative;
  z-index: 1;
}

.customization-panel h3 {
  min-height: 42px;
  margin-bottom: 8px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid color-mix(in srgb, var(--brand-primary) 18%, #ffffff) !important;
  color: var(--brand-primary-deep) !important;
}

.customization-panel h3 i {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #ffffff !important;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%);
  box-shadow: 0 10px 18px var(--brand-soft-strong);
}

.customization-panel > p {
  margin-bottom: 14px !important;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--brand-primary) 14%, #ffffff);
  background: color-mix(in srgb, var(--brand-primary) 7%, #ffffff);
  color: color-mix(in srgb, var(--brand-primary-deep) 82%, #475569) !important;
  font-weight: 650;
}

.customization-row {
  position: relative;
  align-items: stretch !important;
  margin-bottom: 10px;
  padding: 12px !important;
  border: 1px solid color-mix(in srgb, var(--brand-primary) 14%, #ffffff) !important;
  border-radius: 20px !important;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.045);
}

.customization-row:last-child {
  margin-bottom: 0;
}

.customization-row:hover {
  background: color-mix(in srgb, var(--brand-primary) 9%, #ffffff) !important;
  border-color: color-mix(in srgb, var(--brand-primary) 34%, #ffffff) !important;
  box-shadow:
    inset 4px 0 0 var(--brand-primary),
    0 14px 26px var(--brand-soft);
  transform: translateY(-1px);
}

.customization-row .block.text-sm {
  color: var(--brand-primary-deep) !important;
  letter-spacing: -0.01em;
}

.customization-row .text-xs {
  color: color-mix(in srgb, var(--brand-primary-deep) 62%, #64748b) !important;
}

.customization-row .font-medium {
  color: var(--brand-primary) !important;
}

.option-icon-shell {
  width: 44px !important;
  height: 44px !important;
  flex: 0 0 44px;
  border-radius: 16px !important;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%) !important;
  border: 1px solid color-mix(in srgb, var(--brand-primary) 42%, #ffffff) !important;
  box-shadow:
    0 12px 20px var(--brand-soft-strong),
    inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
}

.option-icon-shell i {
  color: #ffffff !important;
}

.option-control {
  align-items: center;
}

.selector-grid {
  min-height: 52px !important;
  padding: 6px !important;
  border-radius: 18px !important;
  border-color: color-mix(in srgb, var(--brand-primary) 22%, #ffffff) !important;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 9%, #ffffff), color-mix(in srgb, var(--brand-background) 88%, #ffffff)) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
}

.choice-chip {
  width: auto !important;
  min-height: 40px !important;
  padding: 0 15px !important;
  border-radius: 14px !important;
  border-color: color-mix(in srgb, var(--brand-primary) 14%, #ffffff) !important;
  background: rgba(255, 255, 255, 0.76) !important;
  color: var(--brand-primary-deep) !important;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.04) !important;
}

.choice-chip:hover {
  background: #ffffff !important;
  border-color: color-mix(in srgb, var(--brand-primary) 36%, #ffffff) !important;
  color: var(--brand-primary) !important;
}

.choice-chip.is-active,
.choice-chip[aria-pressed='true'] {
  color: #ffffff !important;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%) !important;
  border-color: var(--brand-primary) !important;
  box-shadow: 0 10px 18px var(--brand-shadow) !important;
}

.counter-strip,
.sweetness-box {
  min-height: 52px !important;
  border-radius: 18px !important;
  border-color: color-mix(in srgb, var(--brand-primary) 22%, #ffffff) !important;
  background: color-mix(in srgb, var(--brand-primary) 9%, #ffffff) !important;
}

.counter-btn-inline,
.counter-value,
.mobile-info-btn {
  border-color: color-mix(in srgb, var(--brand-primary) 24%, #ffffff) !important;
  background: rgba(255, 255, 255, 0.78) !important;
  color: var(--brand-primary-deep) !important;
}

.counter-btn-inline:hover:not(:disabled),
.mobile-info-btn:hover {
  border-color: color-mix(in srgb, var(--brand-primary) 42%, #ffffff) !important;
  background: #ffffff !important;
  color: var(--brand-primary) !important;
  box-shadow: 0 10px 16px var(--brand-soft) !important;
}

.toggle-chip {
  min-height: 44px !important;
  border-color: color-mix(in srgb, var(--brand-primary) 24%, #ffffff) !important;
  background: rgba(255, 255, 255, 0.78) !important;
  color: var(--brand-primary-deep) !important;
}

.toggle-chip:hover {
  border-color: color-mix(in srgb, var(--brand-primary) 42%, #ffffff) !important;
  background: #ffffff !important;
}

.toggle-chip.is-active {
  color: #ffffff !important;
  border-color: var(--brand-primary) !important;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%) !important;
}

@media (max-width: 767px) {
  .customization-panel {
    border-radius: 22px !important;
  }

  .customization-row {
    padding: 10px !important;
  }

  .option-icon-shell {
    width: 40px !important;
    height: 40px !important;
    flex-basis: 40px;
  }
}

/* Advanced catalog responsive polish */
.catalog-surface {
  background:
    radial-gradient(1100px 460px at 8% -18%, var(--brand-primary-faint), transparent 62%),
    radial-gradient(900px 420px at 100% 2%, var(--brand-soft-strong), transparent 58%),
    linear-gradient(180deg, var(--brand-surface) 0%, var(--brand-background) 100%) !important;
  color: #0f172a;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.catalog-surface :where(button, input) {
  font-family: inherit;
}

.catalog-toolbar,
.filter-panel,
.product-card,
.summary-card,
.customization-panel,
.studio-cta {
  letter-spacing: 0;
}

.catalog-toolbar {
  border-color: var(--brand-border) !important;
  background: rgba(255, 255, 255, 0.9) !important;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.05);
}

.catalog-chip {
  border-color: var(--brand-border) !important;
  background: var(--brand-primary-faint) !important;
  color: var(--brand-primary-ink) !important;
}

.catalog-chip--active,
.catalog-count-pill {
  color: #ffffff !important;
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%) !important;
}

.product-card {
  height: auto !important;
  min-height: clamp(304px, 34vw, 372px);
  padding: clamp(0.9rem, 1.8vw, 1.35rem) !important;
  border-radius: 24px !important;
  border-color: var(--brand-border) !important;
  background: linear-gradient(180deg, #ffffff 0%, var(--brand-surface) 100%) !important;
  box-shadow: 0 18px 34px var(--brand-shadow-soft) !important;
}

.product-card:hover {
  border-color: var(--brand-border-strong) !important;
  box-shadow: 0 22px 42px rgba(15, 23, 42, 0.14) !important;
}

.product-name {
  min-height: 1.2em;
  color: #0f172a;
  font-weight: 850;
  line-height: 1.15;
}

.product-card p,
.summary-card__price-line,
.customization-row .text-xs {
  line-height: 1.35;
}

.product-footer {
  min-height: 52px;
  border-color: var(--brand-border) !important;
  background: color-mix(in srgb, var(--brand-primary) 5%, #ffffff) !important;
}

.product-media {
  width: 100%;
  height: clamp(150px, 31vw, 198px) !important;
  margin-bottom: clamp(0.75rem, 1.8vw, 1.1rem) !important;
}

.product-media__shell {
  width: min(100%, 220px) !important;
  height: auto !important;
  max-height: 100%;
  aspect-ratio: 1;
  padding: clamp(10px, 2vw, 16px) !important;
  border-color: var(--brand-border) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), var(--brand-primary-faint)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.78), transparent 62%) !important;
  box-shadow:
    0 16px 28px var(--brand-shadow-soft),
    inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
}

.product-media__shell--drink {
  width: min(100%, 184px) !important;
}

.product-media__shell--dessert,
.product-media__shell--home {
  width: min(100%, 206px) !important;
}

.product-media__image,
.product-detail-media__image,
.brand-hero-mark__image,
.starbucks-hero-mark__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain !important;
  object-position: center !important;
}

.product-detail-media {
  min-height: clamp(320px, 54vw, 560px);
  border-color: var(--brand-border-strong) !important;
  background:
    radial-gradient(560px 300px at 50% 12%, var(--brand-soft-strong), transparent 66%),
    linear-gradient(180deg, var(--brand-primary-faint) 0%, #ffffff 100%) !important;
}

.product-detail-media__shell {
  width: min(100%, 460px) !important;
  height: auto !important;
  max-height: min(100%, 460px);
  aspect-ratio: 1;
  border-color: var(--brand-border) !important;
}

.studio-hero {
  border: 1px solid color-mix(in srgb, var(--brand-primary) 35%, #ffffff);
  background: linear-gradient(135deg, var(--brand-primary-ink) 0%, var(--brand-primary) 100%) !important;
  box-shadow: 0 22px 42px var(--brand-shadow) !important;
}

.studio-hero__eyebrow,
.studio-hero__label,
.studio-qty-panel__label,
.studio-cta > div > span {
  letter-spacing: 0.11em;
}

.studio-hero__price {
  font-size: clamp(32px, 5vw, 48px) !important;
  letter-spacing: 0;
}

.studio-status-pill {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.customization-panel {
  padding: clamp(1rem, 2vw, 1.5rem) !important;
}

.customization-row {
  gap: 14px !important;
}

.selector-grid {
  max-width: 100%;
  border-color: var(--brand-border) !important;
}

.choice-chip {
  max-width: min(72vw, 260px);
  overflow: hidden;
  text-overflow: ellipsis;
}

.counter-strip,
.toggle-chip {
  flex-shrink: 0;
}

.summary-card {
  border-color: var(--brand-border) !important;
  background: linear-gradient(180deg, #ffffff 0%, var(--brand-surface) 100%) !important;
}

.summary-card__title {
  font-size: clamp(1.15rem, 2vw, 1.4rem) !important;
  letter-spacing: 0;
}

.summary-card__price-box {
  border-color: var(--brand-border) !important;
  background: color-mix(in srgb, var(--brand-primary) 5%, #ffffff) !important;
}

.summary-card__chip {
  max-width: 100%;
  color: var(--brand-primary-ink) !important;
}

.sticky-bottom-panel {
  position: sticky !important;
  left: auto !important;
  right: auto !important;
  bottom: 1rem;
  z-index: 35;
  align-self: stretch;
  margin-top: auto;
  padding-top: 0.5rem;
  pointer-events: none;
}

.sticky-bottom-panel .studio-cta {
  pointer-events: auto;
}

.studio-cta {
  width: 100%;
  max-width: 100%;
  border-color: var(--brand-border) !important;
  background: rgba(255, 255, 255, 0.94) !important;
  box-shadow: 0 -10px 34px rgba(15, 23, 42, 0.08), 0 18px 34px var(--brand-shadow-soft) !important;
}

.studio-cta__price {
  font-size: clamp(24px, 4vw, 30px) !important;
  letter-spacing: 0;
}

.studio-cta__button {
  min-width: 0;
  white-space: nowrap;
}

@supports (bottom: max(1rem, env(safe-area-inset-bottom))) {
  .sticky-bottom-panel {
    bottom: max(1rem, env(safe-area-inset-bottom));
  }
}

@media (min-width: 768px) {
  .sticky-bottom-panel {
    bottom: 1.5rem;
    z-index: 25;
  }

  .product-detail-media__shell {
    max-height: 460px;
  }
}

@media (max-width: 767px) {
  .product-card {
    min-height: 298px;
    border-radius: 20px !important;
  }

  .product-media {
    height: clamp(140px, 42vw, 170px) !important;
  }

  .product-media__shell {
    width: min(100%, 168px) !important;
    border-radius: 20px !important;
  }

  .product-detail-media {
    min-height: 320px;
    border-radius: 28px !important;
  }

  .product-detail-media__shell {
    width: min(100%, 300px) !important;
    max-height: 300px;
    border-radius: 26px !important;
  }

  .studio-hero,
  .customization-panel,
  .summary-card,
  .studio-cta {
    border-radius: 22px !important;
  }

  .studio-pill-row {
    gap: 6px;
  }

  .studio-status-pill {
    padding: 7px 10px;
    font-size: 11px;
  }

  .sticky-bottom-panel {
    bottom: 0.75rem;
    padding-top: 0.25rem;
  }
}
</style>
