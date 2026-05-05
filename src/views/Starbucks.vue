<!--
  Guia rapida para presentar:
  Vista de Starbucks. Agrupa pantalla, estado visual y acciones que ve el usuario en esa seccion.
  Buscar en VS Code: franquicia, menu, productos, fetchProducts, filtros, modal producto, addToCart, carrito.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import starbucksLogo from '../assets/images/logo-starbucks.png';
import { getProductImage, resolveProductImage } from '../utils/productImages';
import {
    APP_EVENTS,
    addCartItem,
    clearCart,
    getCartCount,
    getCartRestaurantInfo,
    getFavorites,
    getSession,
    getUnreadNotificationsCount,
    hasCartRestaurantConflict,
    toggleFavoriteItem
} from '../services/storage';

const router = useRouter();

// ── Colors ──
const bgBrand = '#00704A';

// ── State ──
const products = ref([]);
const isLoading = ref(true);
const currentCategory = ref('Todos');
const searchTerm = ref('');
const cartCount = ref(0);
const notificationCount = ref(0);
const userName = ref('');

// Sidebar filter state
const activeTypeFilters = ref([]);
const activeExtraFilter = ref(null);
const activePriceFilter = ref('all');
const activeSortFilter = ref('default');
const showFiltersPanel = ref(true);
const showTypeFilterSection = ref(true);
const showExtraFilterSection = ref(true);
const showPriceFilterSection = ref(true);
const showSortFilterSection = ref(true);
const catalogMotionKey = ref(0);

// Slider state
const currentSlide = ref(0);
let slideInterval = null;
const slides = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=1600&auto=format&fit=crop'
];

const normalizeText = (value = '') => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ALLOWED_CATEGORIES = ['Bebidas', 'Comida', 'Cafe en Casa'];

const TYPE_FILTER_SYNONYMS = {
    caliente: ['caliente', 'hot'],
    frio: ['frio', 'frío', 'cold', 'iced'],
    frappuccino: ['frappuccino', 'frappe'],
    te: ['te', 'té', 'tea', 'chai'],
    sandwich: ['sandwich', 'panini', 'bagel'],
    panaderia: ['panaderia', 'panadería', 'bakery', 'croissant', 'pastry'],
    dulce: ['dulce', 'postre', 'dessert', 'cookie', 'muffin', 'brownie', 'cake'],
    grano: ['grano', 'en grano', 'bean', 'beans', 'whole bean', 'wholebean'],
    molido: ['molido', 'ground', 'ground coffee'],
    capsulas: ['capsula', 'capsulas', 'cápsula', 'cápsulas', 'capsule', 'capsules', 'pod', 'pods', 'k-cup', 'kcup']
};

const TYPE_FILTER_CATEGORY_SCOPE = {
    caliente: ['Bebidas'],
    frio: ['Bebidas'],
    frappuccino: ['Bebidas'],
    te: ['Bebidas'],
    sandwich: ['Comida'],
    panaderia: ['Comida'],
    dulce: ['Comida'],
    grano: ['Cafe en Casa'],
    molido: ['Cafe en Casa'],
    capsulas: ['Cafe en Casa']
};

const normalizeTypeKey = (value = '') => {
    const normalized = normalizeText(value);
    if (!normalized) return '';

    const matchedEntry = Object.entries(TYPE_FILTER_SYNONYMS).find(([key, aliases]) => {
        if (normalized === key) return true;
        return aliases.some((alias) => {
            const normalizedAlias = normalizeText(alias);
            return (
                normalized === normalizedAlias ||
                normalized.includes(normalizedAlias) ||
                normalizedAlias.includes(normalized)
            );
        });
    });

    return matchedEntry ? matchedEntry[0] : normalized;
};

const inferMcCategory = (rawCategory, name, description, rawType = '') => {
    const source = normalizeText(`${rawCategory} ${rawType} ${name} ${description}`);

    if (!source) return '';
    if (source.includes('cafe en casa') || source.includes('home coffee') || source.includes('whole bean') || source.includes('ground coffee') || source.includes('capsula') || source.includes('capsule') || source.includes('pod') || source.includes('k-cup') || source.includes('en grano') || source.includes('grano') || source.includes('beans') || source.includes('molido')) return 'Cafe en Casa';
    if (source.includes('comida') || source.includes('food') || source.includes('sandwich') || source.includes('panini') || source.includes('bagel') || source.includes('croissant') || source.includes('muffin') || source.includes('cookie') || source.includes('brownie') || source.includes('cake')) return 'Comida';
    if (source.includes('bebida') || source.includes('drink') || source.includes('coffee') || source.includes('latte') || source.includes('cappuccino') || source.includes('americano') || source.includes('macchiato') || source.includes('frappuccino') || source.includes('frappe') || source.includes('cold brew') || source.includes('refresher') || source.includes('tea') || source.includes('te ')) return 'Bebidas';
    return '';
};

const inferMcType = (category, name, description, rawType = '') => {
    const source = normalizeText(`${rawType} ${name} ${description}`);

    if (category === 'Bebidas') {
        if (source.includes('frappuccino') || source.includes('frappe')) return 'Frappuccino';
        if (source.includes('chai') || source.includes('tea') || source.includes('te ')) return 'Te';
        if (source.includes('cold') || source.includes('frio') || source.includes('iced') || source.includes('helado')) return 'Frio';
        return 'Caliente';
    }

    if (category === 'Comida') {
        if (source.includes('sandwich') || source.includes('panini') || source.includes('bagel')) return 'Sandwich';
        if (source.includes('muffin') || source.includes('cookie') || source.includes('brownie') || source.includes('cake')) return 'Dulce';
        return 'Panaderia';
    }

    if (category === 'Cafe en Casa') {
        if (source.includes('capsula') || source.includes('capsule') || source.includes('pod') || source.includes('k-cup')) return 'Capsulas';
        if (source.includes('grano') || source.includes('beans') || source.includes('whole bean')) return 'Grano';
        if (source.includes('molido') || source.includes('ground')) return 'Molido';
        const normalizedRawType = normalizeTypeKey(rawType);
        if (normalizedRawType === 'capsulas') return 'Capsulas';
        if (normalizedRawType === 'grano') return 'Grano';
        if (normalizedRawType === 'molido') return 'Molido';
        return 'Molido';
    }

    return rawType || 'General';
};

const getSafeImage = (rawImage, name, category) => {
    return resolveProductImage(rawImage, name, category);
};

const getProductMediaVariant = (category, context = 'card') => {
    const normalizedCategory = normalizeText(category);

    if (context === 'detail') {
        if (normalizedCategory === 'bebidas') return 'product-detail-media__shell--drink';
        if (normalizedCategory === 'comida') return 'product-detail-media__shell--food';
        return 'product-detail-media__shell--home';
    }

    if (normalizedCategory === 'bebidas') return 'product-media__shell--drink';
    if (normalizedCategory === 'comida') return 'product-media__shell--food';
    return 'product-media__shell--home';
};

const openFiltersPanel = () => {
    showFiltersPanel.value = true;
};

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
    }
);

// Detail View State
const selectedProduct = ref(null);
const currentQty = ref(1);
const currentSize = ref('Grande');
const milkOption = ref('Entera');
const tempOption = ref('Caliente');
const sweetenerLevel = ref(70);
const extraShotQty = ref(0);
const warmFood = ref(true);
const sideSauceQty = ref(0);
const grindOption = ref('Molido');
const roastOption = ref('Medio');
const capsuleIntensity = ref('Medio');
const mobileOptionInfoKey = ref(null);
const isFavorite = ref(false);
const sizePrices = ref({ Tall: 0, Grande: 0, Venti: 0 });
const selectedProductTypeKey = computed(() => normalizeTypeKey(selectedProduct.value?.type || ''));

const availableSizes = computed(() => {
    const category = selectedProduct.value?.category;
    if (category === 'Comida') return ['Simple', 'Combo', 'Grande'];
    if (category === 'Cafe en Casa') {
        return selectedProductTypeKey.value === 'capsulas'
            ? ['Caja x10', 'Caja x20', 'Caja x30']
            : ['250g', '500g', '1kg'];
    }
    return ['Tall', 'Grande', 'Venti'];
});

const sizeInfo = computed(() => {
    if (!selectedProduct.value) {
        return { title: '', description: '', note: '' };
    }

    if (selectedProduct.value.category === 'Bebidas') {
        if (currentSize.value === 'Tall') {
            return {
                title: 'Tall',
                description: 'Ideal para una pausa rapida con el sabor clasico de Starbucks.',
                note: 'Recomendado si quieres algo ligero.'
            };
        }
        if (currentSize.value === 'Grande') {
            return {
                title: 'Grande',
                description: 'Balance perfecto entre intensidad, volumen y precio.',
                note: 'Es el tamano mas pedido.'
            };
        }
        return {
            title: 'Venti',
            description: 'Version grande para quienes quieren mas cafe o bebida fria.',
            note: 'Ideal para jornadas largas.'
        };
    }

    if (selectedProduct.value.category === 'Comida') {
        if (currentSize.value === 'Simple') {
            return {
                title: 'Simple',
                description: 'Porcion individual para un snack rapido.',
                note: 'Perfecto para acompanar una bebida.'
            };
        }
        if (currentSize.value === 'Combo') {
            return {
                title: 'Combo',
                description: 'Formato recomendado para una comida completa.',
                note: 'Buen equilibrio entre cantidad y costo.'
            };
        }
        return {
            title: 'Grande',
            description: 'Mas cantidad para compartir o para mayor apetito.',
            note: 'Opcion con mejor volumen.'
        };
    }

    if (selectedProductTypeKey.value === 'capsulas') {
        return {
            title: currentSize.value,
            description: 'Compatible con cafeteras de capsulas segun disponibilidad.',
            note: 'Elige intensidad segun tu preferencia.'
        };
    }

    return {
        title: currentSize.value,
        description: 'Cafe para preparar en casa, ideal para metodo filtrado o espresso.',
        note: 'Puedes ajustar molienda y tueste antes de agregar.'
    };
});

const sweetenerLabel = computed(() => {
    if (sweetenerLevel.value <= 10) return 'Sin azucar';
    if (sweetenerLevel.value <= 45) return 'Bajo';
    if (sweetenerLevel.value <= 75) return 'Normal';
    return 'Alto';
});

const customizationSummary = computed(() => {
    if (!selectedProduct.value) return [];

    const lines = [`Tamano: ${currentSize.value}`];

    if (selectedProduct.value.category === 'Bebidas') {
        lines.push(`Leche: ${milkOption.value}`);
        lines.push(`Temperatura: ${tempOption.value}`);
        lines.push(`Dulzor: ${sweetenerLabel.value}`);
        if (extraShotQty.value > 0) lines.push(`Shots extra: ${extraShotQty.value}`);
    }

    if (selectedProduct.value.category === 'Comida') {
        lines.push(`Calentar: ${warmFood.value ? 'Si' : 'No'}`);
        if (sideSauceQty.value > 0) lines.push(`Salsas extra: ${sideSauceQty.value}`);
    }

    if (selectedProduct.value.category === 'Cafe en Casa') {
        if (selectedProductTypeKey.value === 'capsulas') lines.push(`Intensidad: ${capsuleIntensity.value}`);
        else {
            lines.push(`Molienda: ${grindOption.value}`);
            lines.push(`Tueste: ${roastOption.value}`);
        }
    }

    return lines;
});
const activeCustomizationCount = computed(() => customizationSummary.value.length);
const quantityLabel = computed(() =>
    currentQty.value === 1 ? '1 unidad' : `${currentQty.value} unidades`
);

const toggleMobileOptionInfo = (key) => {
    mobileOptionInfoKey.value = mobileOptionInfoKey.value === key ? null : key;
};

const setMilkOption = (value) => {
    milkOption.value = value;
};

const setTempOption = (value) => {
    tempOption.value = value;
};

const setWarmFoodOption = (value) => {
    warmFood.value = value;
};

const setCapsuleIntensityOption = (value) => {
    capsuleIntensity.value = value;
};

const setGrindOption = (value) => {
    grindOption.value = value;
};

const setRoastOption = (value) => {
    roastOption.value = value;
};

const milkInfoText = computed(() => {
    const info = {
        Entera: 'Leche clasica y cremosa. Mantiene el sabor original de la bebida.',
        Deslactosada: 'Version mas ligera para mejor digestion, sin perder cremosidad.',
        Avena: 'Alternativa vegetal suave y ligeramente dulce. Puede sumar costo extra.',
        Almendra: 'Alternativa vegetal con sabor tostado y cuerpo ligero. Puede sumar costo extra.'
    };
    return info[milkOption.value] || '';
});

const temperatureInfoText = computed(() =>
    tempOption.value === 'Frio'
        ? 'Servido frio para una experiencia mas refrescante.'
        : 'Servido caliente para resaltar aroma y cuerpo del cafe.'
);

const sweetenerInfoText = computed(() => {
    if (sweetenerLevel.value <= 10) return 'Sin azucar: sabor mas puro del cafe.';
    if (sweetenerLevel.value <= 45) return 'Dulzor bajo: balance entre cafe y toque dulce.';
    if (sweetenerLevel.value <= 75) return 'Dulzor normal: nivel recomendado para la mayoria.';
    return 'Dulzor alto: sabor mas dulce y suave al paladar.';
});

const shotInfoText = computed(() =>
    extraShotQty.value > 0
        ? `Llevas ${extraShotQty.value} shot(s) extra para mayor intensidad y cafeina.`
        : 'Puedes agregar shots extra para un sabor mas intenso.'
);

const warmFoodInfoText = computed(() =>
    warmFood.value
        ? 'El producto se entregara caliente, listo para consumir.'
        : 'Se entregara sin calentar para conservar su textura original.'
);

const sauceInfoText = computed(() =>
    sideSauceQty.value > 0
        ? `Incluye ${sideSauceQty.value} salsa(s) extra para acompanar.`
        : 'Agrega salsas extra para complementar tu pedido.'
);

const capsuleIntensityInfoText = computed(() => {
    const info = {
        Suave: 'Perfil ligero y aromático, ideal para sabores delicados.',
        Medio: 'Balance entre cuerpo y aroma, opcion mas versatil.',
        Intenso: 'Sabor fuerte y profundo para quienes prefieren mayor potencia.'
    };
    return info[capsuleIntensity.value] || '';
});

const grindInfoText = computed(() => {
    const info = {
        Molido: 'Listo para preparar directamente en cafetera o metodo filtrado.',
        'En grano': 'Ideal para moler al momento y conservar mejor el aroma.'
    };
    return info[grindOption.value] || '';
});

const roastInfoText = computed(() => {
    const info = {
        Suave: 'Tueste claro: notas mas acidas y aromaticas.',
        Medio: 'Tueste equilibrado: sabor balanceado y cuerpo medio.',
        Oscuro: 'Tueste intenso: sabor mas fuerte y notas tostadas.'
    };
    return info[roastOption.value] || '';
});

// ── Slider Logic ──
const startSlideShow = () => {
    slideInterval = setInterval(() => {
        currentSlide.value = (currentSlide.value + 1) % slides.length;
    }, 4000);
};
const goToSlide = (index) => {
    currentSlide.value = index;
    clearInterval(slideInterval);
    startSlideShow();
};

// ── Sidebar Filter Types ──
const sidebarConfig = computed(() => {
    if (currentCategory.value === 'Todos') {
        return {
            typeLabel: 'Filtros (Todos)',
            types: [
                { key: 'Caliente', label: 'Cafe Caliente' },
                { key: 'Frio', label: 'Cafe Frio' },
                { key: 'Frappuccino', label: 'Frappuccino' },
                { key: 'Te', label: 'Te / Chai' },
                { key: 'Sandwich', label: 'Sandwiches' },
                { key: 'Panaderia', label: 'Panaderia' },
                { key: 'Dulce', label: 'Postres / Dulces' },
                { key: 'Grano', label: 'Cafe en Grano' },
                { key: 'Molido', label: 'Cafe Molido' },
                { key: 'Capsulas', label: 'Capsulas' }
            ],
            showExtra: true,
            extraLabel: 'Sin Azucar'
        };
    } else if (currentCategory.value === 'Bebidas') {
        return {
            typeLabel: 'Tipo de Bebida',
            types: [
                { key: 'Caliente', label: 'Caliente' },
                { key: 'Frio', label: 'Frio' },
                { key: 'Frappuccino', label: 'Frappuccino' },
                { key: 'Te', label: 'Te / Chai' }
            ],
            showExtra: true,
            extraLabel: 'Sin Azucar'
        };
    } else if (currentCategory.value === 'Comida') {
        return {
            typeLabel: 'Tipo',
            types: [
                { key: 'Sandwich', label: 'Sandwiches' },
                { key: 'Panaderia', label: 'Panaderia' },
                { key: 'Dulce', label: 'Postres / Dulces' }
            ],
            showExtra: false
        };
    } else {
        return {
            typeLabel: 'Presentacion',
            types: [
                { key: 'Grano', label: 'En Grano' },
                { key: 'Molido', label: 'Molido' },
                { key: 'Capsulas', label: 'Capsulas' }
            ],
            showExtra: false
        };
    }
});

const toggleTypeFilter = (type) => {
    if (activeTypeFilters.value.includes(type)) {
        activeTypeFilters.value = activeTypeFilters.value.filter(t => t !== type);
    } else {
        activeTypeFilters.value.push(type);
    }
};

const toggleExtraFilter = (val) => {
    activeExtraFilter.value = (activeExtraFilter.value === val) ? null : val;
};

const setPriceFilter = (val) => {
    activePriceFilter.value = val;
};

const setSortFilter = (val) => {
    activeSortFilter.value = val;
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
        const allowedKeys = new Set((config.types || []).map((t) => t.key));
        activeTypeFilters.value = activeTypeFilters.value.filter((key) => allowedKeys.has(key));
        if (!config.showExtra) {
            activeExtraFilter.value = null;
        }
    },
    { deep: true, immediate: true }
);

// ── Favorites ──
const checkFavorite = () => {
    if (!selectedProduct.value) return;
    const favorites = getFavorites();
    isFavorite.value = favorites.some(f => f.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
    if (!selectedProduct.value) return;

    const added = toggleFavoriteItem({
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        img: selectedProduct.value.img,
        price: selectedProduct.value.price,
        place: 'Starbucks',
        franchiseSlug: 'starbucks',
        tenantId: 1
    });

    isFavorite.value = added;

    if (!added) {
        Swal.fire({ title: 'Eliminado de favoritos', icon: 'info', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } else {
        Swal.fire({ title: 'Añadido a favoritos', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
};

// ── Fetch Real Data ──
// Para presentar: carga productos de la franquicia; usa backend y fallback local si la nube tarda.
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        const franchisesRes = await api.getFranchises();
        let tenantId = 1; // Starbucks Tenant ID
        if (franchisesRes.success !== false) {
            const data = franchisesRes.data || franchisesRes;
            const franchise = (Array.isArray(data) ? data : []).find((f) => normalizeText(f.nombre || f.name || '').includes('starbucks'));
            if (franchise) tenantId = franchise.id;
        }

        const response = await api.getProducts({ limit: 100 }, { 'X-Tenant-ID': tenantId });
        if (response.success !== false) {
            const data = response.data || response;
            const mapped = (Array.isArray(data) ? data : [])
                .map((p, index) => {
                    const name = String(p.nombre || p.name || '').trim();
                    const description = String(p.descripcion || p.description || '').trim();
                    if (!name) return null;

                    const rawCategory = String(p.category || p.categoria || '').trim();
                    const rawType = String(p.tipo || p.type || '').trim();
                    const category = inferMcCategory(rawCategory, name, description, rawType);
                    if (!ALLOWED_CATEGORIES.includes(category)) return null;

                    const type = inferMcType(category, name, description, rawType);
                    const isSugarFree = ['sin azucar', 'sugar free', 'light', 'skinny', 'descafeinado', 'decaf'].some((term) =>
                        normalizeText(`${name} ${description} ${rawType}`).includes(term)
                    );
                    const priceNumber = Number.parseFloat(p.precio ?? p.price ?? 0);
                    const price = Number.isFinite(priceNumber) ? Math.round(priceNumber) : 0;
                    if (price <= 0) return null;

                    return {
                        id: p.id || `sb-${index}-${name}`,
                        name,
                        category,
                        type,
                        price,
                        isExtraFeature: isSugarFree,
                        img: getSafeImage(p.img || p.imagen, name, category),
                        description
                    };
                })
                .filter(Boolean);

            const deduped = [];
            const seen = new Set();
            mapped.forEach((item) => {
                const key = `${normalizeText(item.name)}|${normalizeText(item.category)}|${normalizeText(item.type)}`;
                if (seen.has(key)) return;
                seen.add(key);
                deduped.push(item);
            });

            products.value = deduped.length > 0 ? deduped : getDefaultProducts();
        } else {
            throw new Error(response.message || 'No se pudieron cargar los productos de Starbucks');
        }
    } catch (e) {
        console.error("Error fetching products", e);
        products.value = getDefaultProducts();
    } finally {
        isLoading.value = false;
    }
};

const getDefaultProducts = () => [
    // Bebidas (6)
    { id: 101, name: "Caffe Latte", category: "Bebidas", type: "Caliente", price: 190, isExtraFeature: false, img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80", description: "Espresso con leche vaporizada y espuma suave." },
    { id: 102, name: "Cappuccino Clasico", category: "Bebidas", type: "Caliente", price: 180, isExtraFeature: false, img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80", description: "Espresso intenso con espuma cremosa." },
    { id: 103, name: "Caramel Macchiato Iced", category: "Bebidas", type: "Frio", price: 220, isExtraFeature: false, img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80", description: "Leche fría con vainilla, espresso y caramelo." },
    { id: 104, name: "Cold Brew", category: "Bebidas", type: "Frio", price: 205, isExtraFeature: true, img: "https://images.unsplash.com/photo-1517701550927-30cf4ba1f2f6?w=500&q=80", description: "Café infusionado en frío por horas, opción sin azúcar." },
    { id: 105, name: "Mocha Frappuccino", category: "Bebidas", type: "Frappuccino", price: 245, isExtraFeature: false, img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80", description: "Bebida frappé de café y chocolate con crema batida." },
    { id: 106, name: "Chai Tea Latte", category: "Bebidas", type: "Te", price: 210, isExtraFeature: false, img: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80", description: "Té chai especiado mezclado con leche caliente." },

    // Comida (5)
    { id: 107, name: "Sandwich de Pavo y Queso", category: "Comida", type: "Sandwich", price: 270, isExtraFeature: false, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80", description: "Sandwich caliente con pavo y queso derretido." },
    { id: 108, name: "Croissant de Jamon y Queso", category: "Comida", type: "Panaderia", price: 220, isExtraFeature: false, img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80", description: "Croissant mantequilloso relleno de jamón y queso." },
    { id: 109, name: "Bagel con Queso Crema", category: "Comida", type: "Sandwich", price: 200, isExtraFeature: false, img: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=500&q=80", description: "Bagel tostado con queso crema suave." },
    { id: 110, name: "Muffin de Arandanos", category: "Comida", type: "Dulce", price: 160, isExtraFeature: true, img: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&q=80", description: "Muffin esponjoso, disponible versión light." },
    { id: 111, name: "Brownie de Chocolate", category: "Comida", type: "Dulce", price: 150, isExtraFeature: false, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80", description: "Brownie húmedo de chocolate intenso." },

    // Cafe en Casa (4)
    { id: 112, name: "Pike Place Roast Molido", category: "Cafe en Casa", type: "Molido", price: 320, isExtraFeature: false, img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80", description: "Café molido de tueste medio para casa." },
    { id: 113, name: "House Blend en Grano", category: "Cafe en Casa", type: "Grano", price: 340, isExtraFeature: false, img: "https://images.unsplash.com/photo-1494314671902-399b18174975?w=500&q=80", description: "Café en grano balanceado para preparar al momento." },
    { id: 114, name: "Espresso Roast en Grano", category: "Cafe en Casa", type: "Grano", price: 360, isExtraFeature: false, img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80", description: "Tueste oscuro ideal para espresso casero." },
    { id: 115, name: "Capsulas Espresso", category: "Cafe en Casa", type: "Capsulas", price: 420, isExtraFeature: true, img: "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=500&q=80", description: "Capsulas compatibles, opción descafeinada disponible." },
].map(item => ({
    ...item,
    img: getSafeImage(item.img, item.name, item.category)
}));

const MIN_VISIBLE_PRODUCTS = 2;


const applySort = (list) => {
    let result = [...list];
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
    includePrice = true
} = {}) => {
    let result = [...products.value];

    if (includeCategory && currentCategory.value !== 'Todos') {
        result = result.filter((p) => p.category === currentCategory.value);
    }

    if (includeSearch && searchTerm.value.trim()) {
        const term = normalizeText(searchTerm.value);
        result = result.filter((p) => normalizeText(`${p.name} ${p.description || ''}`).includes(term));
    }

    if (includeType && activeTypeFilters.value.length > 0) {
        const activeTypeKeys = activeTypeFilters.value
            .map((typeKey) => normalizeTypeKey(typeKey))
            .filter(Boolean);
        result = result.filter((p) => {
            const productType = normalizeTypeKey(p.type);
            const searchable = normalizeText(`${p.type} ${p.name} ${p.description || ''} ${p.category}`);
            return activeTypeKeys.some((activeType) => {
                const allowedCategories = TYPE_FILTER_CATEGORY_SCOPE[activeType];
                if (Array.isArray(allowedCategories) && !allowedCategories.includes(p.category)) {
                    return false;
                }

                const aliases = TYPE_FILTER_SYNONYMS[activeType] || [activeType];
                return aliases.some((aliasRaw) => {
                    const alias = normalizeText(aliasRaw);
                    return (
                        productType === alias ||
                        productType.includes(alias) ||
                        alias.includes(productType) ||
                        searchable.includes(alias)
                    );
                });
            });
        });
    }

    if (includeExtra && sidebarConfig.value.showExtra && activeExtraFilter.value) {
        const desired = activeExtraFilter.value === 'yes' ? true : activeExtraFilter.value === 'no' ? false : null;
        if (desired !== null) {
            // In "Todos", this filter should only affect beverages.
            if (currentCategory.value === 'Todos') {
                result = result.filter((p) => p.category !== 'Bebidas' || p.isExtraFeature === desired);
            } else if (currentCategory.value === 'Bebidas') {
                result = result.filter((p) => p.isExtraFeature === desired);
            }
        }
    }

    if (includePrice) {
        if (activePriceFilter.value === 'low') result = result.filter((p) => p.price <= 150);
        else if (activePriceFilter.value === 'mid') result = result.filter((p) => p.price > 150 && p.price <= 300);
        else if (activePriceFilter.value === 'high') result = result.filter((p) => p.price > 300);
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
        buildFilteredList({ includeCategory: false, includeSearch: false, includeType: false, includeExtra: false, includePrice: false })
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

const popularProducts = computed(() => {
    return products.value.slice(0, 4);
    // Aquí sacamos unos cuantos productos top pa' antojarlos
});

const isUsingFallbackProducts = computed(() =>
    !isLoading.value && filteredProducts.value.length === 0 && fallbackProducts.value.length > 0
);

const visibleProducts = computed(() =>
    filteredProducts.value.length > 0 ? filteredProducts.value : fallbackProducts.value
);

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
    showFiltersPanel.value ? 'md:grid-cols-4' : 'md:grid-cols-1'
);

const mainColumnClass = computed(() =>
    showFiltersPanel.value ? 'md:col-span-3' : 'md:col-span-1'
);

const productGridClass = computed(() =>
    showFiltersPanel.value ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'
);

// Category Logic
const setCategory = (cat) => {
    currentCategory.value = cat;
    activeTypeFilters.value = [];
    activeExtraFilter.value = null;
};

// ── Detail View Logic ──
// Para presentar: abre el modal de producto, donde se eligen variantes, extras y cantidad.
const openProductDetail = (product) => {
    selectedProduct.value = product;
    mobileOptionInfoKey.value = null;
    currentQty.value = 1;
    milkOption.value = 'Entera';
    tempOption.value = 'Caliente';
    sweetenerLevel.value = 70;
    extraShotQty.value = 0;
    warmFood.value = true;
    sideSauceQty.value = 0;

    const productType = normalizeTypeKey(product.type);
    grindOption.value = productType === 'grano' ? 'En grano' : 'Molido';
    roastOption.value = 'Medio';
    capsuleIntensity.value = 'Medio';

    const base = product.price;
    if (product.category === 'Comida') {
        sizePrices.value = { Simple: Math.round(base * 0.85), Combo: base, Grande: Math.round(base * 1.25) };
        currentSize.value = 'Combo';
    } else if (product.category === 'Cafe en Casa') {
        if (productType === 'capsulas') {
            sizePrices.value = { 'Caja x10': Math.round(base * 0.7), 'Caja x20': base, 'Caja x30': Math.round(base * 1.4) };
            currentSize.value = 'Caja x20';
        } else {
            sizePrices.value = { '250g': Math.round(base * 0.8), '500g': base, '1kg': Math.round(base * 1.8) };
            currentSize.value = '500g';
        }
    } else {
        sizePrices.value = { Tall: Math.round(base * 0.9), Grande: base, Venti: Math.round(base * 1.25) };
        currentSize.value = 'Grande';
    }

    checkFavorite();
    window.scrollTo(0, 0);
};

const closeDetail = () => {
    selectedProduct.value = null;
    mobileOptionInfoKey.value = null;
};

const changeQty = (amount) => {
    if (currentQty.value + amount >= 1) currentQty.value += amount;
};

const selectSize = (size) => {
    currentSize.value = size;
};

const updateIngredient = (type, amount) => {
    if (type === 'shot') {
        const newVal = extraShotQty.value + amount;
        if (newVal >= 0 && newVal <= 4) extraShotQty.value = newVal;
    }
    if (type === 'sauce') {
        const newVal = sideSauceQty.value + amount;
        if (newVal >= 0 && newVal <= 3) sideSauceQty.value = newVal;
    }
};

const baseUnitPrice = computed(() => {
    if (!selectedProduct.value) return 0;
    return sizePrices.value[currentSize.value] || selectedProduct.value.price;
});

const currentUnitPrice = computed(() => {
    if (!selectedProduct.value) return 0;
    let price = baseUnitPrice.value;

    if (selectedProduct.value.category === 'Bebidas') {
        price += (extraShotQty.value * 20);
        if (milkOption.value === 'Avena' || milkOption.value === 'Almendra') price += 15;
    }

    if (selectedProduct.value.category === 'Comida') {
        price += (sideSauceQty.value * 8);
    }

    return price;
});

const totalPrice = computed(() => {
    return currentUnitPrice.value * currentQty.value;
});

const priceBreakdown = computed(() => {
    if (!selectedProduct.value) return [];

    const lines = [
        { label: `Base ${currentSize.value}`, value: baseUnitPrice.value }
    ];

    if (selectedProduct.value.category === 'Bebidas') {
        if (milkOption.value === 'Avena' || milkOption.value === 'Almendra') {
            lines.push({ label: `Leche ${milkOption.value}`, value: 15 });
        }
        if (extraShotQty.value > 0) {
            lines.push({ label: `Shot extra x${extraShotQty.value}`, value: extraShotQty.value * 20 });
        }
    }

    if (selectedProduct.value.category === 'Comida' && sideSauceQty.value > 0) {
        lines.push({ label: `Salsas extra x${sideSauceQty.value}`, value: sideSauceQty.value * 8 });
    }

    return lines;
});

const extrasTotal = computed(() =>
    priceBreakdown.value.slice(1).reduce((total, item) => total + item.value, 0)
);

// ── Cart Logic ──
const updateCartBadge = () => {
    cartCount.value = getCartCount();
};

const updateNotificationBadge = () => {
    const session = getSession();
    notificationCount.value = session.isAuthenticated ? getUnreadNotificationsCount(session.userEmail) : 0;
};

const createCartItem = () => {
    let detailsStr = `Tamano: ${currentSize.value}`;

    if (selectedProduct.value.category === 'Bebidas') {
        detailsStr += `, Leche: ${milkOption.value}`;
        detailsStr += `, Temperatura: ${tempOption.value}`;
        detailsStr += `, Dulzor: ${sweetenerLabel.value}`;
        if (extraShotQty.value > 0) detailsStr += `, Shots extra: ${extraShotQty.value}`;
    }

    if (selectedProduct.value.category === 'Comida') {
        detailsStr += `, Calentar: ${warmFood.value ? 'Si' : 'No'}`;
        if (sideSauceQty.value > 0) detailsStr += `, Salsas: ${sideSauceQty.value}`;
    }

    if (selectedProduct.value.category === 'Cafe en Casa') {
        if (selectedProductTypeKey.value === 'capsulas') {
            detailsStr += `, Intensidad: ${capsuleIntensity.value}`;
        } else {
            detailsStr += `, Molienda: ${grindOption.value}`;
            detailsStr += `, Tueste: ${roastOption.value}`;
        }
    }

    return {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        price: currentUnitPrice.value,
        img: selectedProduct.value.img,
        qty: currentQty.value,
        details: detailsStr,
        place: 'Starbucks',
        franchiseSlug: 'starbucks',
        tenantId: 1
    };
};

// Para presentar: agrega el producto personalizado al carrito compartido por Checkout.
const addToCart = async ({ silent = false } = {}) => {
    if (!selectedProduct.value) return false;
    const cartItem = createCartItem();

    if (hasCartRestaurantConflict(cartItem)) {
        const currentRestaurant = getCartRestaurantInfo();
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Cambiar restaurante',
            text: `Tu carrito actual es de ${currentRestaurant?.name || 'otra franquicia'}. Si continúas, se reemplazará por Starbucks.`,
            showCancelButton: true,
            confirmButtonText: 'Reemplazar carrito',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: bgBrand
        });

        if (!result.isConfirmed) {
            return false;
        }

        clearCart();
    }

    addCartItem(cartItem);
    updateCartBadge();
    if (!silent) {
        Swal.fire({
            icon: 'success', title: '¡Añadido!',
            showConfirmButton: false, timer: 1000,
            background: bgBrand, color: '#fff',
            toast: true, position: 'top-end'
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

const goBackHome = () => {
    router.push('/');
};

onMounted(() => {
    updateCartBadge();
    updateNotificationBadge();
    window.addEventListener(APP_EVENTS.cartChanged, updateCartBadge);
    window.addEventListener(APP_EVENTS.notificationsChanged, updateNotificationBadge);
    const storedName = getSession().userName;
    if (storedName) userName.value = storedName;
    fetchProducts();
    startSlideShow();
});

onBeforeUnmount(() => {
    window.removeEventListener(APP_EVENTS.cartChanged, updateCartBadge);
    window.removeEventListener(APP_EVENTS.notificationsChanged, updateNotificationBadge);
    clearInterval(slideInterval);
});
</script>

<template>
<div class="catalog-surface font-sans antialiased bg-[#f9f9f9] min-h-screen text-slate-800">
    <header class="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3 md:py-4">
            <div class="flex items-center gap-4">
                <button @click="goBackHome" aria-label="Volver al inicio" class="text-slate-800 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#00704A]">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="flex items-center space-x-2 md:space-x-3 cursor-default">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-[#00704A] animate-pulse transform"></i>
                    <span class="text-xl md:text-2xl font-extrabold whitespace-nowrap text-slate-900 tracking-tight">FOODRUSH</span>
                </div>
            </div>

            <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-[#00704A] focus-within:ring-1 focus-within:ring-[#00704A] transition-all">
                <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                <input v-model="searchTerm" type="text" placeholder="Buscar tu antojo..." class="outline-none w-full text-sm bg-transparent">
            </div>

            <div class="flex items-center gap-4 md:gap-6">
                <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>
                <button @click="router.push('/notifications')" class="hover:text-[#00704A] transition relative text-xl text-gray-600 p-1" aria-label="Ver notificaciones">
                    <i class="fa-regular fa-bell"></i>
                    <span v-if="notificationCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-sm">{{ notificationCount }}</span>
                </button>
                <button @click="router.push('/cart')" class="hover:text-[#00704A] transition relative text-xl text-gray-600 p-1" aria-label="Ver carrito">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-[#D4E9E2] text-[#00704A] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{{ cartCount }}</span>
                </button>

                <button v-if="userName" @click="router.push('/profile')" class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition">
                    <div class="w-8 h-8 rounded-full bg-[#00704A] text-white flex items-center justify-center font-bold text-sm">{{ userName.charAt(0).toUpperCase() }}</div>
                    <span class="text-sm font-medium text-slate-700 hidden lg:block">{{ userName }}</span>
                </button>
                <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600 hover:text-[#00704A] transition">Iniciar Sesión</button>
            </div>
        </div>
    </header>

    <div v-if="!selectedProduct" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-[#00704A] border-b border-gray-100 relative">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-[#00704A] z-10 order-2 md:order-1 relative overflow-hidden">
                <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 20px 20px;"></div>
                <div class="starbucks-hero-mark z-10 relative" aria-label="Starbucks Logo">
                    <div class="starbucks-hero-mark__halo"></div>
                    <div class="starbucks-hero-mark__frame">
                        <span class="starbucks-hero-mark__ring"></span>
                        <div class="starbucks-hero-mark__media">
                            <img
                                :src="starbucksLogo"
                                alt="Starbucks Logo"
                                class="starbucks-hero-mark__image"
                            >
                        </div>
                    </div>
                </div>
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container">
                    <div v-for="(slide, idx) in slides" :key="idx"
                         class="slide" :class="{ active: currentSlide === idx }">
                        <img :src="slide" alt="Promo Slide" class="w-full h-full object-cover object-center">
                    </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>
                <div class="slider-dots">
                    <div v-for="(_, idx) in slides" :key="idx"
                         class="dot" :class="{ active: currentSlide === idx }"
                         @click="goToSlide(idx)">
                    </div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar">
                <button v-for="cat in ['Todos', 'Bebidas', 'Comida', 'Cafe en Casa']" :key="cat"
                        @click="setCategory(cat)"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === cat ? 'active' : 'border-gray-200 text-gray-600']">
                    {{ cat }}
                </button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 gap-6 md:gap-8" :class="contentGridClass">
            <transition name="panel-slide">
                <aside v-if="showFiltersPanel" class="md:col-span-1 relative select-none">
                    <div
                        class="filter-panel bg-white/95 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-gray-100 shadow-xl"
                    >
                    <div
                        class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100"
                    >
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-filter text-[#00704A] text-sm"></i>
                            <h3 class="font-bold text-lg text-slate-800 font-heading">Filtros</h3>
                            <span class="ml-1 text-[11px] font-bold text-[#00704A] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                {{ activeFiltersCount }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="showFiltersPanel = false" class="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition" type="button" title="Ocultar panel">
                                <i class="fa-solid fa-eye-slash text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-tag text-[#00704A] opacity-70"></i> {{ sidebarConfig.typeLabel }}
                            </h4>
                            <button @click="showTypeFilterSection = !showTypeFilterSection" type="button" class="filter-collapse-btn">
                                {{ showTypeFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showTypeFilterSection" class="flex flex-wrap gap-2">
                            <button v-for="t in sidebarConfig.types" :key="t.key"
                               @click="toggleTypeFilter(t.key)"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeTypeFilters.includes(t.key) ? 'bg-[#00704A] text-white border-[#00704A] shadow-md scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A] hover:bg-gray-50']">
                                {{ t.label }}
                            </button>
                        </div>
                    </div>

                    <div v-if="sidebarConfig.showExtra" class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-pepper-hot text-[#00704A] opacity-70"></i> {{ sidebarConfig.extraLabel }}
                            </h4>
                            <button @click="showExtraFilterSection = !showExtraFilterSection" type="button" class="filter-collapse-btn">
                                {{ showExtraFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showExtraFilterSection" class="flex gap-2 bg-gray-100 p-1 rounded-xl">
                            <button @click="toggleExtraFilter('yes')"
                               :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center',
                                        activeExtraFilter === 'yes' ? 'bg-white text-[#00704A] shadow-sm' : 'text-gray-500 hover:text-gray-700']">
                                Sí
                            </button>
                            <button @click="toggleExtraFilter('no')"
                               :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center',
                                        activeExtraFilter === 'no' ? 'bg-white text-[#00704A] shadow-sm' : 'text-gray-500 hover:text-gray-700']">
                                No
                            </button>
                        </div>
                    </div>

                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-dollar-sign text-[#00704A] opacity-70"></i> Precio
                            </h4>
                            <button @click="showPriceFilterSection = !showPriceFilterSection" type="button" class="filter-collapse-btn">
                                {{ showPriceFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showPriceFilterSection" class="flex flex-wrap gap-2">
                            <button @click="setPriceFilter('all')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'all' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                Todos
                            </button>
                            <button @click="setPriceFilter('low')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'low' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                Hasta $150
                            </button>
                            <button @click="setPriceFilter('mid')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'mid' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                $151-$300
                            </button>
                            <button @click="setPriceFilter('high')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'high' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                +$300
                            </button>
                        </div>
                    </div>

                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-arrow-down-wide-short text-[#00704A] opacity-70"></i> Ordenar
                            </h4>
                            <button @click="showSortFilterSection = !showSortFilterSection" type="button" class="filter-collapse-btn">
                                {{ showSortFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showSortFilterSection" class="flex flex-wrap gap-2">
                            <button @click="setSortFilter('default')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'default' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                Relevancia
                            </button>
                            <button @click="setSortFilter('price-asc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'price-asc' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                Menor precio
                            </button>
                            <button @click="setSortFilter('price-desc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'price-desc' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                Mayor precio
                            </button>
                            <button @click="setSortFilter('name-asc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'name-asc' ? 'bg-[#00704A] text-white border-[#00704A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#00704A] hover:text-[#00704A]']">
                                A-Z
                            </button>
                        </div>
                    </div>

                    <div class="pt-2">
                        <button @click="resetFilters" class="filter-reset-btn w-full py-2.5 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition flex items-center justify-center gap-2">
                            <i class="fa-solid fa-rotate-left"></i> Limpiar Filtros
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
                            type="button"
                        >
                            <i class="fa-solid fa-filter text-[10px]"></i>
                            Mostrar filtros
                        </button>
                    </transition>
                    <div class="catalog-toolbar">
                        <div class="flex items-center gap-2">
                            <span class="catalog-count-pill">{{ availableProductsCount }}</span>
                            <span class="text-sm md:text-base font-semibold text-slate-700">productos disponibles</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="catalog-chip">Categoría: {{ currentCategory }}</span>
                            <span v-if="activeFiltersCount > 0" class="catalog-chip catalog-chip--active">
                                {{ activeFiltersCount }} filtros activos
                            </span>
                        </div>
                    </div>
                </div>
                <div v-if="isUsingFallbackProducts" class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    No hubo coincidencias exactas. Te mostramos sugerencias para que siempre tengas opciones.
                </div>

                <div v-if="isLoading" class="text-center py-20">
                    <div class="inline-block w-8 h-8 border-4 border-[#00704A] border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-gray-400 mt-4 font-medium">Buscando tu cafe...</p>
                </div>
                
                <div v-else-if="visibleProducts.length === 0" class="col-span-full py-10 fade-in">
                    <div class="text-center mb-10 flex flex-col items-center">
                        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-sm">
                            <i class="fa-solid fa-magnifying-glass-minus text-3xl text-gray-300"></i>
                        </div>
                        <h3 class="text-2xl font-black text-slate-800 font-heading mb-2">¡Ups! No encontramos eso</h3>
                        <p class="text-gray-500 max-w-md mx-auto">Pero no te quedes con el antojo. Chequea los productos más comprados y personalízalos a tu gusto:</p>
                    </div>

                    <div class="products-grid grid gap-3 md:gap-6" :class="productGridClass">
                        <div v-for="(product, idx) in popularProducts" :key="`pop-${product.id}`"
                             @click="openProductDetail(product)"
                             class="product-card fade-in border border-amber-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-amber-400 transition-all duration-300 cursor-pointer bg-gradient-to-b from-white to-amber-50/20 group relative overflow-hidden"
                             :style="{ '--stagger-delay': `${idx * 45}ms` }">

                            <div class="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 z-20 shadow-md">
                                <i class="fa-solid fa-fire"></i> Top Ventas
                            </div>

                            <div class="product-media h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                                <div class="absolute inset-0 bg-amber-100/30 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                                <div :class="['product-media__shell', getProductMediaVariant(product.category)]">
                                    <img :src="product.img" :alt="product.name"
                                         class="product-media__image" loading="lazy">
                                </div>
                            </div>

                            <div class="text-center w-full relative z-10">
                                <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-orange-600 transition line-clamp-1 font-heading">{{ product.name }}</h3>
                                <p class="text-xs font-bold text-orange-500 mb-3 md:mb-4 uppercase tracking-wide">{{ product.category }}</p>
                                <div class="product-footer flex justify-between items-center w-full bg-white p-2 rounded-xl group-hover:bg-amber-50 transition border border-gray-100 group-hover:border-amber-200 shadow-sm">
                                    <span class="text-slate-800 font-bold px-2 text-lg">${{ product.price }}</span>
                                    <button class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 shadow-sm hover:bg-orange-500 hover:text-white transition flex items-center justify-center border border-orange-100">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else :key="catalogMotionKey" class="products-grid grid gap-3 md:gap-6" :class="productGridClass">
                    <div v-for="(product, idx) in visibleProducts" :key="`${product.id}-${product.name}`"
                         @click="openProductDetail(product)"
                         class="product-card fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-[#00704A] transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden"
                         :style="{ '--stagger-delay': `${Math.min(idx, 10) * 45}ms` }">

                        <div class="product-media h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                            <div class="absolute inset-0 bg-[#D4E9E2]/10 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                            <div :class="['product-media__shell', getProductMediaVariant(product.category)]">
                                <img :src="product.img" :alt="product.name"
                                     class="product-media__image" loading="lazy">
                            </div>
                        </div>

                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-[#00704A] transition line-clamp-1 font-heading">{{ product.name }}</h3>
                            <p class="text-xs font-bold text-[#00704A] mb-3 md:mb-4 uppercase tracking-wide">{{ product.category }}</p>
                            <div class="product-footer flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-[#EFF9F4]/50 transition border border-transparent group-hover:border-[#D4E9E2]">
                                <span class="text-slate-800 font-bold px-2 text-lg">${{ product.price }}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-[#00704A] shadow-sm hover:bg-[#00704A] hover:text-white transition flex items-center justify-center border border-gray-100">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <div v-else class="fade-in container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl relative">
        <button @click="closeDetail" class="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-sm font-bold text-gray-700 hover:text-[#00704A] hover:bg-white transition-all transform hover:-translate-x-1 border border-gray-100">
            <i class="fa-solid fa-arrow-left"></i><span>Volver</span>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 pt-10">
            <div class="flex flex-col gap-6 md:gap-8 md:col-span-3">
                <div class="product-detail-media relative bg-[#F6FCF9] rounded-[2.5rem] flex items-center justify-center p-8 h-80 md:h-[550px] border border-[#B8E0D2]/50 shadow-inner overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-tr from-[#00704A]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-700"></div>
                    <div :class="['product-detail-media__shell', getProductMediaVariant(selectedProduct.category, 'detail')]">
                        <img :src="selectedProduct.img" :alt="selectedProduct.name"
                             class="product-detail-media__image">
                    </div>
                </div>

                <div class="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 class="font-bold text-lg text-slate-800 mb-5 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-up-right-and-down-left-from-center text-[#00704A]"></i> Elige el tamaño
                    </h3>
                    <div class="grid grid-cols-3 gap-3 md:gap-4">
                        <div v-for="size in availableSizes" :key="size"
                             @click="selectSize(size)"
                             class="size-choice flex flex-col items-center gap-3 cursor-pointer group">
                            <div :class="['w-full h-20 md:h-24 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden', 
                                         currentSize === size ? 'border-[#D4E9E2] bg-[#EFF9F4] shadow-md transform -translate-y-1' : 'border-gray-100 bg-white hover:border-[#D4E9E2] hover:bg-gray-50']">
                                <i :class="['fa-solid transition-all duration-300',
                                           selectedProduct.category === 'Bebidas' ? 'fa-mug-hot' : selectedProduct.category === 'Cafe en Casa' ? 'fa-bag-shopping' : 'fa-cookie-bite',
                                           currentSize === size ? 'text-[#00704A]' : 'text-gray-300 group-hover:text-gray-400',
                                           size === availableSizes[0] ? 'text-2xl' : size === availableSizes[1] ? 'text-3xl' : 'text-4xl']"></i>
                                <div v-if="currentSize === size" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00704A]"></div>
                            </div>
                            <div class="text-center leading-tight">
                                <span :class="['block text-sm font-bold transition-colors', currentSize === size ? 'text-[#00704A]' : 'text-slate-700']">{{ size }}</span>
                                <span class="block text-xs text-gray-500 font-medium mt-0.5">${{ sizePrices[size] }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="size-info-card w-full rounded-2xl border border-emerald-100 bg-emerald-50/55 px-4 py-3">
                    <div class="flex items-center gap-2 text-[#00704A] mb-1.5">
                        <i class="fa-solid fa-circle-info text-sm"></i>
                        <span class="text-xs font-extrabold uppercase tracking-wider">{{ sizeInfo.title }}</span>
                    </div>
                    <p class="text-sm font-semibold text-slate-800 leading-snug">{{ sizeInfo.description }}</p>
                    <p class="text-xs text-slate-500 mt-1">{{ sizeInfo.note }}</p>
                </div>

                <div class="summary-card hidden md:block">
                    <div class="summary-card__header">
                        <div>
                            <span class="summary-card__eyebrow">Resumen rapido</span>
                            <h4 class="summary-card__title">Tu configuracion actual</h4>
                        </div>
                        <span class="summary-card__badge">{{ quantityLabel }}</span>
                    </div>

                    <div class="summary-card__price-box">
                        <div v-for="(item, idx) in priceBreakdown" :key="`${item.label}-${idx}`" class="summary-card__price-line">
                            <span>{{ item.label }}</span>
                            <strong>{{ idx === 0 ? '' : '+' }}${{ item.value }}</strong>
                        </div>
                        <div class="summary-card__price-line summary-card__price-line--total">
                            <span>Extras</span>
                            <strong>{{ extrasTotal > 0 ? '+' : '' }}${{ extrasTotal }}</strong>
                        </div>
                    </div>

                    <div class="summary-card__chips" aria-live="polite">
                        <span
                            v-for="(line, idx) in customizationSummary"
                            :key="`${line}-${idx}`"
                            class="summary-card__chip"
                        >
                            <i class="fa-solid fa-check"></i>
                            <span>{{ line }}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full md:col-span-2">
                <div class="mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 class="text-xs font-bold text-[#00704A] mb-3 tracking-widest uppercase bg-[#E8F6F1] inline-block px-3 py-1 rounded-full">{{ selectedProduct.category }}</h2>
                    <h1 class="text-3xl md:text-5xl font-black text-[#1E3932] mb-4 font-heading leading-tight tracking-tight">{{ selectedProduct.name }}</h1>

                    <div class="flex items-center mb-5 text-sm pb-5 border-b border-gray-100">
                        <div class="flex text-[#00704A] gap-1 text-base shadow-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-3 text-sm font-medium underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-gray-600">(Múltiples Reviews)</span>

                        <button @click="toggleFavorite" class="ml-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border"
                                :class="isFavorite ? 'bg-emerald-50 border-emerald-100 text-emerald-600 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/50'">
                            <i :class="isFavorite ? 'fa-solid fa-heart text-xl' : 'fa-regular fa-heart text-xl'"></i>
                        </button>
                    </div>

                    <p class="text-gray-600 text-sm md:text-base leading-relaxed break-words">{{ selectedProduct.description || 'Disfruta el sabor de Starbucks donde quieras.' }}</p>
                </div>

                <div class="studio-hero mb-6 md:mb-8">
                    <div class="studio-hero__content">
                        <span class="studio-hero__eyebrow">Configuracion en vivo</span>
                        <span class="studio-hero__label">Precio unitario</span>
                        <div class="studio-hero__price">
                            <span class="studio-hero__currency">$</span>
                            <span>{{ currentUnitPrice }}</span>
                        </div>
                        <div class="studio-pill-row">
                            <span class="studio-status-pill">{{ currentSize }}</span>
                            <span class="studio-status-pill">{{ activeCustomizationCount }} ajustes</span>
                            <span class="studio-status-pill">{{ quantityLabel }}</span>
                        </div>
                    </div>

                    <div class="studio-qty-panel">
                        <span class="studio-qty-panel__label">Cantidad</span>
                        <div class="studio-counter studio-counter--hero">
                            <button type="button" @click="changeQty(-1)" class="studio-counter__btn studio-counter__btn--ghost" aria-label="Quitar una unidad">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <span class="studio-counter__value studio-counter__value--hero">{{ currentQty }}</span>
                            <button type="button" @click="changeQty(1)" class="studio-counter__btn studio-counter__btn--ghost" aria-label="Agregar una unidad">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex-grow mb-8">
                    <div class="customization-panel bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6">
                        <h3 class="font-bold text-lg text-slate-800 mb-5 font-heading flex items-center gap-2 pb-3 border-b border-gray-50">
                            <i class="fa-solid fa-sliders text-[#00704A]"></i> Personaliza tu pedido
                        </h3>
                        <p class="text-xs font-medium text-slate-500 -mt-2 mb-4">
                            Ajusta cada detalle antes de agregar el producto al pedido.
                        </p>

                        <template v-if="selectedProduct.category === 'Bebidas'">
                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-[#00704A] shadow-inner border border-emerald-100"><i class="fa-solid fa-cow text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Tipo de Leche</span>
                                        <span class="text-xs text-gray-400">Elige tu base favorita</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="selector-grid selector-grid--milk w-full">
                                        <button v-for="opt in ['Entera', 'Deslactosada', 'Avena', 'Almendra']" :key="opt"
                                                type="button"
                                                @click="setMilkOption(opt)"
                                                :aria-pressed="milkOption === opt"
                                                :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                         milkOption === opt ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt }}</button>
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de tipo de leche"
                                        @click="toggleMobileOptionInfo('milk')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'milk' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'milk'" class="option-info-text">
                                    {{ milkInfoText }}
                                </p>
                            </div>

                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-orange-50/80 flex items-center justify-center text-orange-500 shadow-inner border border-orange-100"><i class="fa-solid fa-temperature-three-quarters text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Temperatura</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="selector-grid selector-grid--temp w-full">
                                        <button v-for="opt in ['Caliente', 'Frio']" :key="opt"
                                                type="button"
                                                @click="setTempOption(opt)"
                                                :aria-pressed="tempOption === opt"
                                                :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                         tempOption === opt ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt }}</button>
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de temperatura"
                                        @click="toggleMobileOptionInfo('temp')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'temp' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'temp'" class="option-info-text">
                                    {{ temperatureInfoText }}
                                </p>
                            </div>

                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-100"><i class="fa-solid fa-cube text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Dulzor</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="sweetness-box bg-gray-50 border border-gray-200 rounded-xl p-3 flex-1">
                                        <div class="sweetness-labels flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                                            <span>Sin azucar</span>
                                            <span class="text-[#00704A]">{{ sweetenerLabel }}</span>
                                            <span>Alto</span>
                                        </div>
                                        <input
                                            v-model.number="sweetenerLevel"
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            class="sweetness-range w-full"
                                        >
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de dulzor"
                                        @click="toggleMobileOptionInfo('sweet')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'sweet' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'sweet'" class="option-info-text">
                                    {{ sweetenerInfoText }}
                                </p>
                            </div>

                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-yellow-50/80 flex items-center justify-center text-yellow-600 shadow-inner border border-yellow-100"><i class="fa-solid fa-bolt text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Shot extra de espresso</span>
                                        <span class="text-xs text-[#00704A] font-medium">+$20</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="counter-strip">
                                        <button type="button" @click="updateIngredient('shot', -1)" class="counter-btn-inline" aria-label="Quitar shot extra"><i class="fa-solid fa-minus text-xs"></i></button>
                                        <span class="counter-value">{{ extraShotQty }}</span>
                                        <button type="button" @click="updateIngredient('shot', 1)" class="counter-btn-inline" aria-label="Agregar shot extra"><i class="fa-solid fa-plus text-xs"></i></button>
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de shot extra"
                                        @click="toggleMobileOptionInfo('shot')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'shot' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'shot'" class="option-info-text">
                                    {{ shotInfoText }}
                                </p>
                            </div>
                        </template>

                        <template v-else-if="selectedProduct.category === 'Comida'">
                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-[#00704A] shadow-inner border border-emerald-100"><i class="fa-solid fa-fire text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Calentar producto</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="selector-grid selector-grid--temp w-full">
                                        <button v-for="opt in [{label:'Si',value:true},{label:'No',value:false}]" :key="opt.label"
                                                type="button"
                                                @click="setWarmFoodOption(opt.value)"
                                                :aria-pressed="warmFood === opt.value"
                                                :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                         warmFood === opt.value ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt.label }}</button>
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de calentar producto"
                                        @click="toggleMobileOptionInfo('warm')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'warm' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'warm'" class="option-info-text">
                                    {{ warmFoodInfoText }}
                                </p>
                            </div>

                            <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 rounded-xl px-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-amber-50/80 flex items-center justify-center text-amber-600 shadow-inner border border-amber-100"><i class="fa-solid fa-bottle-droplet text-lg"></i></div>
                                    <div>
                                        <span class="block text-sm font-bold text-slate-800">Salsas extra</span>
                                        <span class="text-xs text-[#00704A] font-medium">+$8</span>
                                    </div>
                                </div>
                                <div class="option-control">
                                    <div class="counter-strip">
                                        <button type="button" @click="updateIngredient('sauce', -1)" class="counter-btn-inline" aria-label="Quitar salsa extra"><i class="fa-solid fa-minus text-xs"></i></button>
                                        <span class="counter-value">{{ sideSauceQty }}</span>
                                        <button type="button" @click="updateIngredient('sauce', 1)" class="counter-btn-inline" aria-label="Agregar salsa extra"><i class="fa-solid fa-plus text-xs"></i></button>
                                    </div>
                                    <button
                                        type="button"
                                        class="mobile-info-btn"
                                        aria-label="Ver ayuda de salsas extra"
                                        @click="toggleMobileOptionInfo('sauce')"
                                    >
                                        <i :class="mobileOptionInfoKey === 'sauce' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                    </button>
                                </div>
                                <p v-if="mobileOptionInfoKey === 'sauce'" class="option-info-text">
                                    {{ sauceInfoText }}
                                </p>
                            </div>
                        </template>

                        <template v-else>
                            <template v-if="selectedProductTypeKey === 'capsulas'">
                                <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 rounded-xl px-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-violet-50/80 flex items-center justify-center text-violet-600 shadow-inner border border-violet-100"><i class="fa-solid fa-battery-half text-lg"></i></div>
                                        <div>
                                            <span class="block text-sm font-bold text-slate-800">Intensidad de capsula</span>
                                        </div>
                                    </div>
                                    <div class="option-control">
                                        <div class="selector-grid selector-grid--triple w-full">
                                            <button v-for="opt in ['Suave', 'Medio', 'Intenso']" :key="opt"
                                                    type="button"
                                                    @click="setCapsuleIntensityOption(opt)"
                                                    :aria-pressed="capsuleIntensity === opt"
                                                    :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                             capsuleIntensity === opt ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt }}</button>
                                        </div>
                                        <button
                                            type="button"
                                            class="mobile-info-btn"
                                            aria-label="Ver ayuda de intensidad de capsula"
                                            @click="toggleMobileOptionInfo('capsule')"
                                        >
                                            <i :class="mobileOptionInfoKey === 'capsule' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                        </button>
                                    </div>
                                    <p v-if="mobileOptionInfoKey === 'capsule'" class="option-info-text">
                                        {{ capsuleIntensityInfoText }}
                                    </p>
                                </div>
                            </template>

                            <template v-else>
                                <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 rounded-xl px-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-emerald-50/80 flex items-center justify-center text-[#00704A] shadow-inner border border-emerald-100"><i class="fa-solid fa-seedling text-lg"></i></div>
                                        <div>
                                            <span class="block text-sm font-bold text-slate-800">Tipo de molienda</span>
                                        </div>
                                    </div>
                                    <div class="option-control">
                                        <div class="selector-grid selector-grid--temp w-full">
                                            <button v-for="opt in ['Molido', 'En grano']" :key="opt"
                                                    type="button"
                                                    @click="setGrindOption(opt)"
                                                    :aria-pressed="grindOption === opt"
                                                    :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                             grindOption === opt ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt }}</button>
                                        </div>
                                        <button
                                            type="button"
                                            class="mobile-info-btn"
                                            aria-label="Ver ayuda de tipo de molienda"
                                            @click="toggleMobileOptionInfo('grind')"
                                        >
                                            <i :class="mobileOptionInfoKey === 'grind' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                        </button>
                                    </div>
                                    <p v-if="mobileOptionInfoKey === 'grind'" class="option-info-text">
                                        {{ grindInfoText }}
                                    </p>
                                </div>

                                <div class="customization-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 rounded-xl px-2">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-orange-50/80 flex items-center justify-center text-orange-500 shadow-inner border border-orange-100"><i class="fa-solid fa-mug-saucer text-lg"></i></div>
                                        <div>
                                            <span class="block text-sm font-bold text-slate-800">Nivel de tueste</span>
                                        </div>
                                    </div>
                                    <div class="option-control">
                                        <div class="selector-grid selector-grid--triple w-full">
                                            <button v-for="opt in ['Suave', 'Medio', 'Oscuro']" :key="opt"
                                                    type="button"
                                                    @click="setRoastOption(opt)"
                                                    :aria-pressed="roastOption === opt"
                                                    :class="['choice-chip px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200',
                                                             roastOption === opt ? 'bg-white text-[#00704A] border border-emerald-200 shadow-sm' : 'text-slate-500 hover:text-[#00704A]']">{{ opt }}</button>
                                        </div>
                                        <button
                                            type="button"
                                            class="mobile-info-btn"
                                            aria-label="Ver ayuda de nivel de tueste"
                                            @click="toggleMobileOptionInfo('roast')"
                                        >
                                            <i :class="mobileOptionInfoKey === 'roast' ? 'fa-solid fa-xmark text-[11px]' : 'fa-solid fa-circle-question text-[12px]'"></i>
                                        </button>
                                    </div>
                                    <p v-if="mobileOptionInfoKey === 'roast'" class="option-info-text">
                                        {{ roastInfoText }}
                                    </p>
                                </div>
                            </template>
                        </template>
                    </div>
                </div>
                <div class="summary-card mb-6 md:hidden">
                    <div class="summary-card__header">
                        <div>
                            <span class="summary-card__eyebrow">Resumen rapido</span>
                            <h4 class="summary-card__title">Tu configuracion actual</h4>
                        </div>
                        <span class="summary-card__badge">{{ quantityLabel }}</span>
                    </div>

                    <div class="summary-card__price-box">
                        <div v-for="(item, idx) in priceBreakdown" :key="`mobile-${item.label}-${idx}`" class="summary-card__price-line">
                            <span>{{ item.label }}</span>
                            <strong>{{ idx === 0 ? '' : '+' }}${{ item.value }}</strong>
                        </div>
                        <div class="summary-card__price-line summary-card__price-line--total">
                            <span>Extras</span>
                            <strong>{{ extrasTotal > 0 ? '+' : '' }}${{ extrasTotal }}</strong>
                        </div>
                    </div>

                    <div class="summary-card__chips" aria-live="polite">
                        <span
                            v-for="(line, idx) in customizationSummary"
                            :key="`mobile-${line}-${idx}`"
                            class="summary-card__chip"
                        >
                            <i class="fa-solid fa-check"></i>
                            <span>{{ line }}</span>
                        </span>
                    </div>
                </div>
                <div class="studio-cta mt-auto sticky bottom-4 z-20">
                    <div class="flex justify-between items-end mb-4 px-2">
                        <span class="text-sm text-gray-500 font-bold uppercase tracking-wider">Total final</span>
                        <div class="flex items-end gap-1">
                            <span class="text-xl font-bold text-[#00704A] mb-1">$</span>
                            <span class="text-4xl font-black text-[#1E3932] leading-none">{{ totalPrice }}</span>
                        </div>
                    </div>
                    <div class="studio-cta__actions">
                        <button type="button" class="studio-cta__button studio-cta__button--secondary" @click="addToCart">
                            <span>Añadir al Pedido</span>
                            <i class="fa-solid fa-cart-arrow-down"></i>
                        </button>
                        <button type="button" class="studio-cta__button studio-cta__button--primary" @click="buyNow">
                            <span>Pagar ahora</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-[#1E3932] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                <div class="flex items-center gap-2 mb-4 bg-[#00704A] w-fit px-3 py-1 rounded shadow-lg">
                    <span class="text-[#D4E9E2] font-bold text-xl italic">Food</span>
                    <span class="text-white font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">El mejor cafe de Starbucks directo a tu puerta con FoodRush.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#00704A] hover:text-white transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#00704A] hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#00704A] hover:text-white transition"><i class="fa-brands fa-twitter"></i></a>
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
                        <li><a href="#" class="hover:text-white hover:underline transition">Oportunidades</a></li>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap');

body { font-family: 'Inter', sans-serif; }
.font-heading { font-family: 'Sora', sans-serif; }

.catalog-surface {
    background:
        radial-gradient(1200px 520px at 10% -20%, rgba(212, 233, 226, 0.28), transparent 62%),
        radial-gradient(1000px 500px at 100% 0%, rgba(0, 112, 74, 0.10), transparent 58%),
        #f4faf7;
}

/* ── Animations ── */
.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── Slider ── */
.slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
.slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
.slide.active { opacity: 1; }
.slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
.slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
.dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
.dot.active { background-color: white; transform: scale(1.2); }

.starbucks-hero-mark {
    position: relative;
    display: grid;
    place-items: center;
    width: min(72vw, 320px);
    aspect-ratio: 1;
}

.starbucks-hero-mark__halo,
.starbucks-hero-mark__frame,
.starbucks-hero-mark__ring {
    position: absolute;
    inset: 0;
}

.starbucks-hero-mark__halo {
    inset: 8%;
    border-radius: 38% 62% 55% 45% / 36% 42% 58% 64%;
    background:
        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.05) 54%, rgba(255, 255, 255, 0) 74%),
        radial-gradient(circle at 70% 72%, rgba(212, 233, 226, 0.22), rgba(212, 233, 226, 0) 62%);
    filter: blur(4px);
    transform: rotate(-10deg);
}

.starbucks-hero-mark__frame {
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

.starbucks-hero-mark__ring {
    inset: 11%;
    border-radius: 50%;
    border: 1px solid rgba(212, 233, 226, 0.72);
    box-shadow:
        inset 0 0 0 12px rgba(255, 255, 255, 0.06),
        0 0 0 1px rgba(255, 255, 255, 0.08);
}

.starbucks-hero-mark__media {
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

.starbucks-hero-mark__media::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
    pointer-events: none;
    z-index: 1;
}

.starbucks-hero-mark__image {
    position: relative;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(1.02) contrast(1.02);
    transform: scale(1.04) rotate(8deg);
    transition: transform 0.45s ease, filter 0.45s ease;
}

.starbucks-hero-mark:hover .starbucks-hero-mark__image {
    transform: scale(1.08) rotate(5deg);
    filter: saturate(1.05) contrast(1.04);
}

/* ── Sidebar Filters ── */
.side-filter-btn {
    display: none;
}

/* ── Category Tabs ── */
.filter-tab { transition: all 0.3s ease; }
.filter-tab.active { background-color: #00704A; color: white; border-color: #00704A; box-shadow: 0 4px 6px -1px rgba(0, 112, 74, 0.28); }
.filter-tab:not(.active):hover { border-color: #D4E9E2; color: #006241; background-color: #F2FBF7; }

.filter-panel {
    position: sticky;
    top: 132px;
    z-index: 20;
    width: 100%;
    max-width: 280px;
    border-color: #C7E5DC;
    box-shadow: 0 18px 36px rgba(16, 73, 56, 0.12);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 237, 0.96));
    transition: box-shadow 0.22s ease, transform 0.22s ease;
}

.filter-panel:hover {
    box-shadow: 0 24px 48px rgba(16, 73, 56, 0.18);
}

.filter-section {
    padding-top: 14px;
    border-top: 1px solid #D9EFE8;
}

.filter-section:first-of-type {
    padding-top: 0;
    border-top: none;
}

.filter-reset-btn {
    letter-spacing: 0.02em;
}

.filter-collapse-btn {
    font-size: 11px;
    font-weight: 700;
    color: #1E3932;
    background: #f2fbf7;
    border: 1px solid #BADFD2;
    border-radius: 999px;
    padding: 4px 10px;
    transition: all 0.2s ease;
}

.filter-collapse-btn:hover {
    color: #184534;
    border-color: #D4E9E2;
    background: #ECF8F3;
}

.filter-toggle-inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 14px;
    min-height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #00704A 0%, #006241 100%);
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid #D4E9E2;
    box-shadow:
        0 10px 18px rgba(0, 112, 74, 0.18),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    letter-spacing: 0.02em;
}

.filter-toggle-inline:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 24px rgba(0, 112, 74, 0.28);
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

.products-grid {
    align-content: start;
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
    border: 1px solid #C7E5DC;
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
    background: #00704A;
    color: white;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.01em;
    box-shadow: 0 8px 16px rgba(0, 112, 74, 0.25);
}

.catalog-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: #1e3932;
    background: #edf8f3;
    border: 1px solid #BADFD2;
}

.catalog-chip--active {
    color: #ffffff;
    background: #00704A;
    border-color: #D4E9E2;
}

.product-card {
    animation: cardIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: var(--stagger-delay, 0ms);
    border-color: #cde8df !important;
    background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%) !important;
    box-shadow: 0 12px 28px rgba(16, 73, 56, 0.10);
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
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
    border: 1px solid #dcece5;
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 249, 246, 0.94)),
        radial-gradient(circle at top, rgba(255, 255, 255, 0.72), transparent 58%);
    box-shadow:
        0 14px 24px rgba(16, 73, 56, 0.08),
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
    border-color: #bedfd2;
    box-shadow:
        0 18px 28px rgba(16, 73, 56, 0.12),
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

.product-media__shell--home {
    --media-padding: 11px 12px 8px;
    --media-image-width: 88%;
    --media-image-height: 94%;
    --media-image-scale: 1.05;
    --media-image-y: 3px;
    --media-image-hover-scale: 1.1;
    --media-image-hover-y: -1px;
}

.product-media::after {
    content: '';
    position: absolute;
    inset: 14% 16%;
    border-radius: 9999px;
    background: radial-gradient(circle, rgba(0, 112, 74, 0.16) 0%, rgba(0, 112, 74, 0) 70%);
    pointer-events: none;
    z-index: 0;
}

.product-detail-media {
    isolation: isolate;
}

.product-detail-media::after {
    content: '';
    position: absolute;
    inset: 10% 12%;
    border-radius: 34px;
    background: radial-gradient(circle at center, rgba(0, 112, 74, 0.10) 0%, rgba(0, 112, 74, 0) 72%);
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
    border: 1px solid rgba(192, 223, 211, 0.92);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 248, 244, 0.96)),
        radial-gradient(circle at top, rgba(255, 255, 255, 0.78), transparent 62%);
    box-shadow:
        0 22px 38px rgba(16, 73, 56, 0.12),
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

.product-detail-media__shell--home {
    --detail-media-padding: 18px 22px 16px;
    --detail-media-image-width: 88%;
    --detail-media-image-height: 92%;
    --detail-media-image-scale: 1.08;
    --detail-media-image-y: 4px;
    --detail-media-image-hover-scale: 1.13;
    --detail-media-image-hover-y: -1px;
}

.product-footer {
    border-color: #d7eee6;
}

.customization-panel {
    border-color: #cfe8df;
    background: linear-gradient(180deg, #ffffff 0%, #f8fcfa 100%);
    box-shadow:
        0 14px 26px rgba(16, 73, 56, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.customization-panel > div {
    position: relative;
    flex-wrap: wrap;
    padding-right: 0;
    border: 1px solid #d8ebe2;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 251, 248, 0.95));
    box-shadow: 0 8px 18px rgba(16, 73, 56, 0.08);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.customization-panel > div:hover {
    border-color: #b9dccc;
    box-shadow: 0 10px 20px rgba(16, 73, 56, 0.1);
    transform: translateY(-1px);
}

.customization-row {
    width: 100%;
    border-radius: 14px;
}

.size-info-card {
    box-shadow: 0 8px 18px rgba(16, 73, 56, 0.08);
}

.size-choice {
    min-width: 0;
}

.summary-card {
    box-shadow: 0 10px 20px rgba(16, 73, 56, 0.08);
    background: linear-gradient(180deg, #ffffff 0%, #f7fcf9 100%);
}

.mobile-info-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 1px solid #b9dccc;
    background: #ffffff;
    color: #00704A;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(16, 73, 56, 0.08);
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.mobile-info-btn:hover {
    border-color: #92cdb8;
    background-color: #f2fbf7;
}

.mobile-info-btn:active {
    transform: scale(0.92);
}

.option-info-text {
    width: 100%;
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.4;
    color: #415b52;
    background: #eef8f3;
    border: 1px solid #cfe8df;
    border-radius: 10px;
    padding: 8px 10px;
    animation: fadeIn 0.18s ease;
}

.selector-grid {
    display: grid;
    gap: 6px;
    min-height: 50px;
    padding: 5px;
    border-radius: 13px;
    border: 1px solid #d6e3dd;
    background: linear-gradient(180deg, #f3f7f5 0%, #edf2ef 100%);
}

.option-control {
    width: 100%;
    max-width: none;
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: 0;
    min-width: 0;
}

.option-control > :first-child {
    flex: 1;
    min-width: 0;
}

.selector-grid--milk {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    gap: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
}

.selector-grid--milk::-webkit-scrollbar {
    height: 5px;
}

.selector-grid--milk::-webkit-scrollbar-thumb {
    background: rgba(0, 112, 74, 0.28);
    border-radius: 999px;
}

.selector-grid--milk .choice-chip {
    flex: 0 0 calc((100% - 12px) / 2.5);
    min-width: calc((100% - 12px) / 2.5);
    white-space: nowrap;
    scroll-snap-align: start;
}

.selector-grid--temp {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.selector-grid--triple {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.choice-chip {
    border: 1px solid transparent;
    background: transparent;
    min-height: 38px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    white-space: normal;
    line-height: 1.2;
    color: #4a5f56;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.choice-chip:hover {
    background: #ffffff;
    border-color: #c9dacf;
    color: #006845;
    box-shadow: 0 4px 10px rgba(16, 73, 56, 0.08);
}

.choice-chip[aria-pressed='true'] {
    background: #ffffff;
    color: #006845;
    border-color: #b8d7cb;
    box-shadow: 0 4px 10px rgba(16, 73, 56, 0.1);
}

.choice-chip:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 74, 0.2);
}

.sweetness-box {
    width: 100%;
    border-color: #d6e3dd !important;
    background: linear-gradient(180deg, #f3f7f5 0%, #edf2ef 100%) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.sweetness-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    margin: 0;
    border-radius: 999px;
    background: transparent;
}

.sweetness-range:focus {
    outline: none;
}

.sweetness-range::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(90deg, #a7f3d0 0%, #047857 100%);
}

.sweetness-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: #047857;
    margin-top: -6px;
    box-shadow: 0 4px 10px rgba(4, 120, 87, 0.28);
}

.sweetness-range::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(90deg, #a7f3d0 0%, #047857 100%);
}

.sweetness-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: #047857;
    box-shadow: 0 4px 10px rgba(4, 120, 87, 0.28);
}

.counter-strip {
    width: 100%;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 13px;
    border: 1px solid #d6e3dd;
    background: linear-gradient(180deg, #f3f7f5 0%, #edf2ef 100%);
}

.counter-btn-inline {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid transparent;
    color: #00704A;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.counter-btn-inline:hover {
    border-color: #bcd8cc;
    box-shadow: 0 4px 10px rgba(16, 73, 56, 0.08);
}

.counter-btn-inline:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 74, 0.2);
}

.counter-btn-inline:active {
    transform: scale(0.94);
}

.counter-value {
    min-width: 56px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 16px;
    font-weight: 800;
    color: #0f5132;
    border: 1px solid #c8ddd4;
    border-radius: 10px;
    background: #ffffff;
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

@media (min-width: 768px) {
    .filter-panel {
        top: 146px;
        max-height: calc(100vh - 156px);
        overflow-y: auto;
        margin-top: 4px;
    }

    .filter-toggle-inline {
        font-size: 12px;
        padding: 0 14px;
    }

    .mobile-info-btn {
        width: 30px;
        height: 30px;
    }

    .option-info-text {
        margin-top: 12px;
        max-width: 100%;
        padding: 10px 12px;
        color: #334155;
        border-color: #d5dde4;
        background: linear-gradient(180deg, #f8fafb 0%, #edf1f5 100%);
        box-shadow: 0 10px 20px rgba(15, 23, 42, 0.1);
        border-radius: 12px;
        position: relative;
    }

    .option-info-text::before {
        content: '';
        position: absolute;
        top: -7px;
        right: 16px;
        width: 12px;
        height: 12px;
        background: #f6f9fb;
        border-left: 1px solid #d5dde4;
        border-top: 1px solid #d5dde4;
        transform: rotate(45deg);
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

@media (min-width: 1024px) {
    .customization-panel > div {
        padding-right: 0;
    }

    .customization-row {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 14px !important;
        padding-top: 14px !important;
        padding-bottom: 14px !important;
    }

    .option-control {
        display: flex;
        align-items: center;
        width: 100%;
        max-width: none;
    }

    .selector-grid--milk {
        display: flex;
        flex-wrap: nowrap;
    }

    .selector-grid {
        gap: 7px;
        padding: 6px;
    }

    .choice-chip {
        min-height: 40px;
        font-size: 12px;
        white-space: normal;
        padding: 8px 12px;
    }

    .selector-grid--milk .choice-chip { white-space: nowrap; }

    .sweetness-labels {
        font-size: 11px !important;
        gap: 8px;
    }

    .sweetness-labels > span {
        min-width: 0;
    }

    .sweetness-box {
        padding: 12px !important;
    }

    .counter-strip {
        width: 100%;
        min-height: 50px;
        padding: 6px 8px;
        gap: 10px;
        justify-content: space-between;
    }

    .counter-btn-inline {
        width: 36px;
        height: 36px;
    }

    .counter-value {
        min-width: 56px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 1px solid #c8ddd4;
        background: #ffffff;
        color: #0f5132;
        font-size: 16px;
    }

    .mobile-info-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        margin-top: 0;
        border-color: #a6d2c4;
        box-shadow: 0 6px 12px rgba(16, 73, 56, 0.12);
    }
}

@media (max-width: 767px) {
    .starbucks-hero-mark {
        width: min(68vw, 250px);
    }

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

    .customization-panel > div {
        padding-right: 0;
    }

    .option-control {
        width: 100%;
    }

    .selector-grid {
        gap: 5px;
        padding: 4px;
    }

    .choice-chip {
        white-space: normal;
        line-height: 1.15;
        min-height: 40px;
        padding-left: 8px;
        padding-right: 8px;
    }

    .counter-strip {
        min-height: 46px;
        padding: 4px;
    }

    .counter-btn-inline {
        width: 32px;
        height: 32px;
    }

    .option-info-text {
        font-size: 11.5px;
        padding: 8px 9px;
    }
}

/* ── Size Cards ── */
.studio-hero {
    position: relative;
    display: grid;
    gap: 18px;
    padding: 22px;
    border-radius: 30px;
    overflow: hidden;
    background: linear-gradient(135deg, #0a5f40 0%, #1E3932 58%, #0b7b63 100%);
    box-shadow: 0 26px 42px rgba(16, 73, 56, 0.22);
}

.studio-hero::before,
.studio-hero::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
}

.studio-hero::before {
    width: 260px;
    height: 260px;
    top: -140px;
    right: -90px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 72%);
}

.studio-hero::after {
    width: 180px;
    height: 180px;
    left: -70px;
    bottom: -90px;
    background: radial-gradient(circle, rgba(212, 233, 226, 0.24) 0%, rgba(212, 233, 226, 0) 70%);
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
    color: #D4E9E2;
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
    min-width: 220px;
    padding: 16px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.10);
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
    padding: 8px 10px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.10);
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.studio-counter__btn {
    width: 42px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
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
    min-width: 54px;
    height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.16);
    color: #ffffff;
    font-size: 20px;
    font-weight: 900;
}

.studio-counter__btn--ghost,
.studio-counter__value--hero {
    backdrop-filter: blur(10px);
}

.customization-panel {
    border-color: #d7ebe2;
    background:
        radial-gradient(540px 220px at 100% 0%, rgba(0, 112, 74, 0.08), transparent 68%),
        linear-gradient(180deg, #ffffff 0%, #f8fcfa 100%);
    box-shadow:
        0 22px 38px rgba(16, 73, 56, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.customization-panel > h3 {
    margin-bottom: 14px !important;
}

.customization-panel > p {
    margin-bottom: 20px !important;
}

.customization-panel > div {
    position: relative;
    padding: 18px 18px 16px;
    border-radius: 24px;
    border: 1px solid #dcece6;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 250, 247, 0.94));
    box-shadow: 0 16px 26px rgba(16, 73, 56, 0.08);
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.customization-panel > div:hover {
    border-color: #b5dacb;
    box-shadow: 0 22px 32px rgba(16, 73, 56, 0.12);
    transform: translateY(-2px);
}

.customization-panel > div::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid rgba(255, 255, 255, 0.7);
    pointer-events: none;
}

.customization-row {
    width: 100%;
    border-radius: 20px;
}

.size-info-card {
    background: linear-gradient(135deg, rgba(212, 233, 226, 0.78), rgba(255, 255, 255, 0.96));
    border-color: #cfe8df;
    box-shadow: 0 16px 28px rgba(16, 73, 56, 0.08);
}

.selector-grid {
    gap: 8px;
    min-height: 54px;
    padding: 6px;
    border-radius: 18px;
    border: 1px solid #d6e6df;
    background: linear-gradient(180deg, #f7fbf8 0%, #eef5f1 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.option-control {
    align-items: stretch;
    gap: 12px;
}

.selector-grid--milk {
    gap: 8px;
}

.selector-grid--milk .choice-chip {
    flex: 0 0 calc((100% - 16px) / 2.35);
    min-width: calc((100% - 16px) / 2.35);
}

.choice-chip {
    min-height: 44px;
    font-size: 12.5px;
    font-weight: 800;
    border-radius: 14px;
    transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
}

.choice-chip:hover {
    box-shadow: 0 10px 16px rgba(16, 73, 56, 0.10);
    transform: translateY(-1px);
}

.choice-chip[aria-pressed='true'] {
    background: linear-gradient(180deg, #ffffff 0%, #eff9f3 100%);
    border-color: #8ec9b0;
    box-shadow: 0 12px 18px rgba(0, 112, 74, 0.14);
    transform: translateY(-1px);
}

.sweetness-box {
    padding: 14px !important;
    border-radius: 20px !important;
}

.sweetness-range {
    height: 8px;
}

.sweetness-range::-webkit-slider-runnable-track,
.sweetness-range::-moz-range-track {
    height: 8px;
    background: linear-gradient(90deg, #c9f1df 0%, #047857 100%);
}

.sweetness-range::-webkit-slider-thumb {
    width: 22px;
    height: 22px;
    border: 3px solid #ffffff;
    margin-top: -7px;
    box-shadow: 0 8px 16px rgba(4, 120, 87, 0.24);
}

.sweetness-range::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border: 3px solid #ffffff;
    box-shadow: 0 8px 16px rgba(4, 120, 87, 0.24);
}

.counter-strip {
    min-height: 54px;
    padding: 8px;
    border-radius: 18px;
}

.counter-btn-inline {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    transition: transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.counter-btn-inline:hover {
    box-shadow: 0 10px 16px rgba(16, 73, 56, 0.10);
    transform: translateY(-1px);
}

.counter-value {
    min-width: 64px;
    height: 40px;
    font-size: 17px;
    font-weight: 900;
    border-radius: 14px;
}

.mobile-info-btn {
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 14px;
    box-shadow: 0 10px 18px rgba(16, 73, 56, 0.10);
}

.mobile-info-btn:hover {
    transform: translateY(-1px);
}

.option-info-text {
    margin-top: 12px;
    font-size: 12.5px;
    line-height: 1.5;
    color: #35594c;
    border-radius: 16px;
    padding: 12px 14px;
    background: linear-gradient(180deg, #eff8f4 0%, #e7f3ed 100%);
}

.summary-card {
    padding: 20px;
    border-radius: 28px;
    border: 1px solid #d7ebe2;
    background: linear-gradient(180deg, #ffffff 0%, #f7fcf9 100%);
    box-shadow: 0 18px 30px rgba(16, 73, 56, 0.09);
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
    background: #edf8f3;
    border: 1px solid #cbe5da;
    color: #00704A;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.summary-card__title {
    margin-top: 10px;
    color: #1E3932;
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
    border: 1px solid #d7eae2;
    box-shadow: 0 10px 16px rgba(16, 73, 56, 0.08);
    color: #1E3932;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
}

.summary-card__price-box {
    display: grid;
    gap: 10px;
    padding: 14px;
    border-radius: 20px;
    border: 1px solid #e0eee8;
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
    color: #1E3932;
    font-size: 14px;
    font-weight: 800;
}

.summary-card__price-line--total {
    padding-top: 10px;
    border-top: 1px solid #ddebe5;
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
    border: 1px solid #d7e8e1;
    box-shadow: 0 10px 16px rgba(16, 73, 56, 0.06);
    color: #25483d;
    font-size: 12.5px;
    font-weight: 700;
}

.summary-card__chip i {
    color: #00704A;
    font-size: 11px;
}

.studio-cta {
    padding: 20px;
    border-radius: 28px;
    border: 1px solid rgba(211, 230, 222, 0.95);
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(18px);
    box-shadow: 0 24px 40px rgba(16, 73, 56, 0.14);
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

.studio-cta > div > div span:first-child {
    color: #00704A;
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 6px;
}

.studio-cta > div > div span:last-child {
    color: #1E3932;
    font-size: 42px;
    line-height: 1;
    font-weight: 900;
}

.studio-cta > button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 22px;
    border: 1px solid transparent;
    background: linear-gradient(135deg, #D4E9E2 0%, #bddfd2 100%);
    color: #0c4f38;
    box-shadow: 0 18px 30px rgba(0, 112, 74, 0.18);
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.studio-cta > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 36px rgba(0, 112, 74, 0.22);
    filter: saturate(1.05);
}

.studio-cta > button:active {
    transform: scale(0.985);
}

.studio-cta > button > div {
    display: none;
}

.studio-cta > button span {
    position: static !important;
    font-size: 18px;
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
    gap: 12px;
    min-height: 56px;
    padding: 14px 18px;
    border-radius: 20px;
    border: 1px solid transparent;
    font-size: 16px;
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
    background: linear-gradient(135deg, #D4E9E2 0%, #bddfd2 100%);
    color: #0c4f38;
    box-shadow: 0 14px 24px rgba(0, 112, 74, 0.14);
}

.studio-cta__button--primary {
    background: linear-gradient(135deg, #00704A 0%, #0c4f38 100%);
    color: #ffffff;
    box-shadow: 0 18px 30px rgba(0, 112, 74, 0.22);
}

@media (min-width: 640px) {
    .studio-cta .studio-cta__actions {
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 768px) {
    .studio-hero {
        grid-template-columns: 1fr auto;
        align-items: end;
    }
}

@media (max-width: 767px) {
    .studio-hero {
        padding: 18px;
        border-radius: 24px;
    }

    .studio-hero__price {
        font-size: 38px;
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
        padding: 16px;
        border-radius: 22px;
    }

    .studio-cta > div > div span:last-child {
        font-size: 34px;
    }
}

.size-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px solid #e5e7eb; border-radius: 12px;
    width: 80px; height: 90px;
    cursor: pointer; transition: all 0.2s;
    position: relative; background-color: white;
}
@media (min-width: 768px) { .size-card { width: 90px; height: 100px; } }
.size-card:hover { border-color: #D4E9E2; transform: translateY(-2px); }
.size-card.selected { border-color: #D4E9E2; background-color: #F6FCF9; box-shadow: 0 4px 12px rgba(0, 112, 74, 0.16); }
.size-card i { color: #d1d5db; transition: color 0.2s; }
.size-card.selected i { color: #D4E9E2; }

/* ── Counter Buttons ── */
.counter-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid #e5e7eb; color: #00704A;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; background: white;
}
.counter-btn:hover { border-color: #00704A; background-color: #E8F6F1; }

/* ── Scrollbar Hide ── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Details Toggle ── */
details > summary { list-style: none; outline: none; }
details > summary::-webkit-details-marker { display: none; }

/* ── Hide legacy detail view elements if needed ── */
.size-card, .counter-btn { display: none !important; }
</style>
