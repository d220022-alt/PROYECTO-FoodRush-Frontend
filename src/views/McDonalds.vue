<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { getProductImage } from '../utils/productImages';

const router = useRouter();

// ── Colors ──
const bgBrand = '#DB0007';

// ── State ──
const products = ref([]);
const isLoading = ref(true);
const currentCategory = ref('Todos');
const searchTerm = ref('');
const cartCount = ref(0);
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
    'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576107025878-4cd382211993?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512152272829-e3139592d56f?q=80&w=1600&auto=format&fit=crop'
];

const normalizeText = (value = '') => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ALLOWED_CATEGORIES = ['Hamburguesas', 'Complementos', 'Bebidas', 'Postres'];

const inferMcCategory = (rawCategory, name, description, rawType = '') => {
    const source = normalizeText(`${rawCategory} ${rawType} ${name} ${description}`);

    if (!source) return '';
    if (source.includes('hamburg') || source.includes('burger') || source.includes('mcrib') || source.includes('mcwrap')) return 'Hamburguesas';
    if (source.includes('complement') || source.includes('acompan') || source.includes('side') || source.includes('papa') || source.includes('nugget') || source.includes('ensalada') || source.includes('hash brown')) return 'Complementos';
    if (source.includes('bebida') || source.includes('drink') || source.includes('refresco') || source.includes('soda') || source.includes('cafe') || source.includes('coffee') || source.includes('frappe') || source.includes('malteada') || source.includes('shake')) return 'Bebidas';
    if (source.includes('postre') || source.includes('dessert') || source.includes('helado') || source.includes('mcflurry') || source.includes('sundae') || source.includes('pastel') || source.includes('pay') || source.includes('pie') || source.includes('galleta') || source.includes('cookie')) return 'Postres';
    return '';
};

const inferMcType = (category, name, description, rawType = '') => {
    const source = normalizeText(`${rawType} ${name} ${description}`);

    if (category === 'Hamburguesas') {
        if (source.includes('pollo') || source.includes('chicken') || source.includes('mcchicken')) return 'Pollo';
        if (source.includes('pescado') || source.includes('fish') || source.includes('filet')) return 'Pescado';
        if (source.includes('cerdo') || source.includes('pork') || source.includes('mcrib')) return 'Cerdo';
        return 'Res';
    }

    if (category === 'Complementos') {
        if (source.includes('papa') || source.includes('fries') || source.includes('hash brown')) return 'Papas';
        if (source.includes('ensalada') || source.includes('salad')) return 'Ensaladas';
        return 'Snacks';
    }

    if (category === 'Bebidas') {
        if (source.includes('cafe') || source.includes('coffee') || source.includes('caliente') || source.includes('hot')) return 'Caliente';
        return 'Frio';
    }

    if (category === 'Postres') {
        if (source.includes('helado') || source.includes('mcflurry') || source.includes('sundae') || source.includes('ice cream')) return 'Helado';
        if (source.includes('galleta') || source.includes('cookie')) return 'Galletas';
        return 'Pastel';
    }

    return rawType || 'General';
};

const getSafeImage = (rawImage, name, category) => {
    const candidate = String(rawImage || '').trim();
    if (candidate && (candidate.startsWith('http://') || candidate.startsWith('https://'))) {
        return candidate;
    }
    return getProductImage(name, category);
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
const currentSize = ref('Mediano');
const meatOption = ref('Res');
const extraCheeseQty = ref(0);
const sauceQty = ref(0);
const extraBaconQty = ref(0);
const extraLettuceQty = ref(0);
const extraPicklesQty = ref(0);
const isFavorite = ref(false);
const sizePrices = ref({ Pequeño: 0, Mediano: 0, Grande: 0 });

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
                { key: 'Res', label: 'Res' },
                { key: 'Pollo', label: 'Pollo' },
                { key: 'Pescado', label: 'Pescado' },
                { key: 'Cerdo', label: 'Cerdo' },
                { key: 'Papas', label: 'Papas Fritas' },
                { key: 'Snacks', label: 'Snacks / Nuggets' },
                { key: 'Ensaladas', label: 'Ensaladas' },
                { key: 'Helado', label: 'Helados' },
                { key: 'Pastel', label: 'Pasteles' },
                { key: 'Galletas', label: 'Galletas' },
                { key: 'Frio', label: 'Bebidas Frías' },
                { key: 'Caliente', label: 'Bebidas Calientes' }
            ],
            showExtra: true,
            extraLabel: 'Picante'
        };
    } else if (currentCategory.value === 'Hamburguesas') {
        return {
            typeLabel: 'Tipo de Carne',
            types: [
                { key: 'Res', label: 'Res' },
                { key: 'Pollo', label: 'Pollo' },
                { key: 'Pescado', label: 'Pescado' },
                { key: 'Cerdo', label: 'Cerdo' }
            ],
            showExtra: true,
            extraLabel: 'Picante'
        };
    } else if (currentCategory.value === 'Complementos') {
        return {
            typeLabel: 'Tipo',
            types: [
                { key: 'Papas', label: 'Papas Fritas' },
                { key: 'Snacks', label: 'Snacks / Nuggets' },
                { key: 'Ensaladas', label: 'Ensaladas' }
            ],
            showExtra: false
        };
    } else if (currentCategory.value === 'Postres') {
        return {
            typeLabel: 'Tipo',
            types: [
                { key: 'Helado', label: 'Helados' },
                { key: 'Pastel', label: 'Pasteles' },
                { key: 'Galletas', label: 'Galletas' }
            ],
            showExtra: false
        };
    } else {
        return {
            typeLabel: 'Formato',
            types: [
                { key: 'Frio', label: 'Fríos' },
                { key: 'Caliente', label: 'Calientes' }
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
    const favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    isFavorite.value = favorites.some(f => f.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
    if (!selectedProduct.value) return;
    let favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
    if (isFavorite.value) {
        favorites = favorites.filter(f => f.id !== selectedProduct.value.id);
        isFavorite.value = false;
        Swal.fire({ title: 'Eliminado de favoritos', icon: 'info', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } else {
        favorites.push({ id: selectedProduct.value.id, name: selectedProduct.value.name, img: selectedProduct.value.img, price: selectedProduct.value.price, place: 'McDonalds' });
        isFavorite.value = true;
        Swal.fire({ title: 'Añadido a favoritos', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    }
    localStorage.setItem('foodrush_favorites', JSON.stringify(favorites));
};

// ── Fetch Real Data ──
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        const franchisesRes = await api.getFranchises();
        let tenantId = 2; // McDonald's Tenant ID
        if (franchisesRes.success !== false) {
            const data = franchisesRes.data || franchisesRes;
            const franchise = (Array.isArray(data) ? data : []).find(f => f.nombre.includes('McDonald'));
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
                    const isSpicy = ['picante', 'spicy', 'jalapeno', 'chipotle'].some((term) => normalizeText(`${name} ${description}`).includes(term));
                    const priceNumber = Number.parseFloat(p.precio ?? p.price ?? 0);
                    const price = Number.isFinite(priceNumber) ? Math.round(priceNumber) : 0;
                    if (price <= 0) return null;

                    return {
                        id: p.id || `mc-${index}-${name}`,
                        name,
                        category,
                        type,
                        price,
                        isExtraFeature: isSpicy,
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
            throw new Error(response.message || 'No se pudieron cargar los productos de McDonald\'s');
        }
    } catch (e) {
        console.error("Error fetching products", e);
        // Fallback to hardcoded products
        products.value = getDefaultProducts();
    } finally {
        isLoading.value = false;
    }
};

const getDefaultProducts = () => [
    // Hamburguesas (5)
    { id: 101, name: "Big Mac", category: "Hamburguesas", type: "Res", price: 350, isExtraFeature: false, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80", description: "Dos tortas de 100% carne de res, salsa especial Big Mac, lechuga, queso, pepinillos y cebolla en un pan con semillas de ajonjolí." },
    { id: 102, name: "Quarter Pounder", category: "Hamburguesas", type: "Res", price: 400, isExtraFeature: false, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80", description: "Una torta de cuarto de libra de carne 100% de res con queso derretido, cebolla y pepinillos." },
    { id: 103, name: "McChicken", category: "Hamburguesas", type: "Pollo", price: 280, isExtraFeature: false, img: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&q=80", description: "Torta de pollo crujiente con lechuga fresca y mayonesa." },
    { id: 104, name: "Filet-O-Fish", category: "Hamburguesas", type: "Pescado", price: 250, isExtraFeature: false, img: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=500&q=80", description: "Filete de pescado empanizado, queso americano y salsa tártara." },
    { id: 105, name: "McRib", category: "Hamburguesas", type: "Cerdo", price: 320, isExtraFeature: true, img: "https://images.unsplash.com/photo-1605900598717-d1cb2f5716e2?w=500&q=80", description: "Carne de cerdo sin hueso bañada en salsa BBQ, cebolla y pepinillos." },

    // Complementos (5)
    { id: 106, name: "Papas Fritas Grandes", category: "Complementos", type: "Papas", price: 180, isExtraFeature: false, img: "https://images.unsplash.com/photo-1576107025878-4cd382211993?w=500&q=80", description: "Papas fritas doradas y crujientes por fuera, suaves por dentro." },
    { id: 107, name: "McNuggets x10", category: "Complementos", type: "Snacks", price: 290, isExtraFeature: false, img: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=500&q=80", description: "10 piezas de tiernos nuggets de pechuga de pollo, crujientes." },
    { id: 108, name: "McNuggets x20", category: "Complementos", type: "Snacks", price: 450, isExtraFeature: false, img: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=500&q=80", description: "20 piezas de nuestros crujientes McNuggets. Ideal para compartir." },
    { id: 109, name: "Hash Browns", category: "Complementos", type: "Papas", price: 100, isExtraFeature: false, img: "https://images.unsplash.com/photo-1623595119708-26b1f7300075?w=500&q=80", description: "Papas ralladas fritas, crujientes por fuera y tiernas por dentro." },
    { id: 110, name: "Ensalada César con Pollo", category: "Complementos", type: "Ensaladas", price: 250, isExtraFeature: false, img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500&q=80", description: "Lechuga romana, pechuga de pollo asada, queso parmesano y aderezo César." },

    // Bebidas (5)
    { id: 111, name: "Coca-Cola", category: "Bebidas", type: "Frio", price: 100, isExtraFeature: false, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80", description: "Refresco Coca-Cola frío y burbujeante." },
    { id: 112, name: "Sprite", category: "Bebidas", type: "Frio", price: 100, isExtraFeature: false, img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80", description: "Refresco de lima-limón refrescante y frío." },
    { id: 113, name: "Oreo Frappé", category: "Bebidas", type: "Frio", price: 250, isExtraFeature: true, img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80", description: "Bebida fría y dulce de café y galleta Oreo, con crema batida." },
    { id: 114, name: "Café Americano", category: "Bebidas", type: "Caliente", price: 80, isExtraFeature: false, img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&q=80", description: "Café negro recién preparado." },
    { id: 115, name: "Chocolate Caliente", category: "Bebidas", type: "Caliente", price: 120, isExtraFeature: false, img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80", description: "Chocolate caliente cremoso, perfecto para acompañar tu comida." },

    // Postres (5)
    { id: 116, name: "McFlurry Oreo", category: "Postres", type: "Helado", price: 220, isExtraFeature: false, img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80", description: "Suave helado de vainilla mezclado con trozos de galleta Oreo." },
    { id: 117, name: "Sundae de Chocolate", category: "Postres", type: "Helado", price: 150, isExtraFeature: false, img: "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80", description: "Helado de vainilla cremoso cubierto de salsa de chocolate caliente." },
    { id: 118, name: "Pay de Manzana", category: "Postres", type: "Pastel", price: 120, isExtraFeature: false, img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80", description: "Clásico pay de manzana caliente, horneado con una costra dorada." },
    { id: 119, name: "Brownie", category: "Postres", type: "Pastel", price: 140, isExtraFeature: false, img: "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&q=80", description: "Brownie de chocolate intenso con textura suave y húmeda." },
    { id: 120, name: "Galleta con Chispas de Chocolate", category: "Postres", type: "Galletas", price: 60, isExtraFeature: false, img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80", description: "Galleta horneada calientita con chispas de chocolate." },
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
        const activeTypeKeys = activeTypeFilters.value.map(normalizeText);
        result = result.filter((p) => {
            const productType = normalizeText(p.type);
            const searchable = normalizeText(`${p.type} ${p.name} ${p.description || ''}`);
            return activeTypeKeys.some((activeType) =>
                productType === activeType ||
                productType.includes(activeType) ||
                activeType.includes(productType) ||
                searchable.includes(activeType)
            );
        });
    }

    if (includeExtra && sidebarConfig.value.showExtra && activeExtraFilter.value) {
        if (activeExtraFilter.value === 'yes') result = result.filter((p) => p.isExtraFeature === true);
        else if (activeExtraFilter.value === 'no') result = result.filter((p) => p.isExtraFeature === false);
    }

    if (includePrice) {
        if (activePriceFilter.value === 'low') result = result.filter((p) => p.price <= 150);
        else if (activePriceFilter.value === 'mid') result = result.filter((p) => p.price > 150 && p.price <= 300);
        else if (activePriceFilter.value === 'high') result = result.filter((p) => p.price > 300);
    }

    return applySort(result);
};

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
const openProductDetail = (product) => {
    selectedProduct.value = product;
    currentQty.value = 1;
    meatOption.value = product.type || 'Res';
    extraCheeseQty.value = 0;
    extraBaconQty.value = 0;
    extraLettuceQty.value = 0;
    extraPicklesQty.value = 0;
    sauceQty.value = 0;

    const base = product.price;
    // Precios estimados para tamaños
    sizePrices.value = { Pequeño: Math.round(base * 0.8), Mediano: base, Grande: Math.round(base * 1.3) };
    currentSize.value = 'Mediano';
    checkFavorite();
    window.scrollTo(0, 0);
};

const closeDetail = () => {
    selectedProduct.value = null;
};

const changeQty = (amount) => {
    if (currentQty.value + amount >= 1) currentQty.value += amount;
};

const selectSize = (size) => {
    currentSize.value = size;
};

const updateIngredient = (type, amount) => {
    if (type === 'cheese') {
        const newVal = extraCheeseQty.value + amount;
        if (newVal >= 0 && newVal <= 3) extraCheeseQty.value = newVal;
    }
    if (type === 'bacon') {
        const newVal = extraBaconQty.value + amount;
        if (newVal >= 0 && newVal <= 2) extraBaconQty.value = newVal;
    }
    if (type === 'lettuce') {
        const newVal = extraLettuceQty.value + amount;
        if (newVal >= 0 && newVal <= 2) extraLettuceQty.value = newVal;
    }
    if (type === 'pickles') {
        const newVal = extraPicklesQty.value + amount;
        if (newVal >= 0 && newVal <= 3) extraPicklesQty.value = newVal;
    }
    if (type === 'sauce') {
        const newVal = sauceQty.value + amount;
        if (newVal >= 0 && newVal <= 5) sauceQty.value = newVal;
    }
};

const currentUnitPrice = computed(() => {
    if (!selectedProduct.value) return 0;
    let price = sizePrices.value[currentSize.value] || selectedProduct.value.price;

    // Add extra costs for customizations (if applicable)
    if (selectedProduct.value.category === 'Hamburguesas') {
        price += (extraCheeseQty.value * 30); // 30 pesos por cada queso extra
        price += (extraBaconQty.value * 45); // 45 pesos por tocino extra
    }
    return price;
});

const totalPrice = computed(() => {
    return currentUnitPrice.value * currentQty.value;
});

// ── Cart Logic ──
const updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    cartCount.value = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
};

const createCartItem = () => {
    let detailsStr = `Tamaño: ${currentSize.value}`;
    if (selectedProduct.value.category === 'Hamburguesas') {
        detailsStr += `, Carne: ${meatOption.value}`;
        if (extraCheeseQty.value > 0) detailsStr += `, Queso Extra: ${extraCheeseQty.value}`;
        if (extraBaconQty.value > 0) detailsStr += `, Tocino Extra: ${extraBaconQty.value}`;
        if (extraLettuceQty.value > 0) detailsStr += `, Lechuga Extra: ${extraLettuceQty.value}`;
        if (extraPicklesQty.value > 0) detailsStr += `, Pepinillos Extra: ${extraPicklesQty.value}`;
    }
    if (selectedProduct.value.category === 'Hamburguesas' || selectedProduct.value.category === 'Complementos') {
        if (sauceQty.value > 0) detailsStr += `, Salsas: ${sauceQty.value}`;
    }

    return {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        price: currentUnitPrice.value,
        img: selectedProduct.value.img,
        qty: currentQty.value,
        details: detailsStr
    };
};

const addToCart = () => {
    if (!selectedProduct.value) return;
    const cartItem = createCartItem();
    let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
    const existing = cart.find(i => i.id === cartItem.id && i.details === cartItem.details);
    if (existing) {
        existing.qty += currentQty.value;
    } else {
        cart.push(cartItem);
    }
    localStorage.setItem('foodrush_cart', JSON.stringify(cart));
    updateCartBadge();
    Swal.fire({
        icon: 'success', title: '¡Añadido!',
        showConfirmButton: false, timer: 1000,
        background: '#DB0007', color: '#fff',
        toast: true, position: 'top-end'
    });
    closeDetail();
};

const goBackHome = () => {
    router.push('/');
};

onMounted(() => {
    updateCartBadge();
    const storedName = localStorage.getItem('user_name');
    if (storedName) userName.value = storedName;
    fetchProducts();
    startSlideShow();
});

onBeforeUnmount(() => {
    clearInterval(slideInterval);
});
</script>

<template>
<div class="catalog-surface font-sans antialiased bg-[#f9f9f9] min-h-screen text-slate-800">
    <!-- HEADER -->
    <header class="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3 md:py-4">
            <div class="flex items-center gap-4">
                <button @click="goBackHome" aria-label="Volver al inicio" class="text-slate-800 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#DB0007]">
                    <i class="fa-solid fa-arrow-left text-xl"></i>
                </button>
                <div class="flex items-center space-x-2 md:space-x-3 cursor-default">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-[#DB0007] animate-pulse transform"></i>
                    <span class="text-xl md:text-2xl font-extrabold whitespace-nowrap text-slate-900 tracking-tight">FOODRUSH</span>
                </div>
            </div>

            <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-[#DB0007] focus-within:ring-1 focus-within:ring-[#DB0007] transition-all">
                <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                <input v-model="searchTerm" type="text" placeholder="Buscar tu antojo..." class="outline-none w-full text-sm bg-transparent">
            </div>

            <div class="flex items-center gap-4 md:gap-6">
                <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>
                <button @click="router.push('/cart')" class="hover:text-[#DB0007] transition relative text-xl text-gray-600 p-1" aria-label="Ver carrito">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span v-if="cartCount > 0" class="absolute -top-1 -right-1 bg-[#FFC72C] text-[#DB0007] font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{{ cartCount }}</span>
                </button>

                <button v-if="userName" @click="router.push('/profile')" class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition">
                    <div class="w-8 h-8 rounded-full bg-[#DB0007] text-white flex items-center justify-center font-bold text-sm">{{ userName.charAt(0).toUpperCase() }}</div>
                    <span class="text-sm font-medium text-slate-700 hidden lg:block">{{ userName }}</span>
                </button>
                <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600 hover:text-[#DB0007] transition">Iniciar Sesión</button>
            </div>
        </div>
    </header>

    <!-- ═══ CATALOG VIEW ═══ -->
    <div v-if="!selectedProduct" class="fade-in pb-10">
        <!-- Hero Banner with Carousel -->
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-[#DB0007] border-b border-gray-100 relative">
            <!-- Logo Side -->
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-[#DB0007] z-10 order-2 md:order-1 relative overflow-hidden">
                <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 20px 20px;"></div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png"
                     alt="McDonalds Logo" class="h-32 md:h-56 w-auto object-contain drop-shadow-2xl hover:scale-105 transition duration-500 z-10 relative">
            </div>
            <!-- Slider Side -->
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

        <!-- Category Tabs -->
        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar">
                <button v-for="cat in ['Todos', 'Hamburguesas', 'Complementos', 'Bebidas', 'Postres']" :key="cat"
                        @click="setCategory(cat)"
                        :class="['filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap', currentCategory === cat ? 'active' : 'border-gray-200 text-gray-600']">
                    {{ cat }}
                </button>
            </div>
        </div>

        <!-- Main Content: Sidebar + Grid -->
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
                            <i class="fa-solid fa-filter text-[#DB0007] text-sm"></i>
                            <h3 class="font-bold text-lg text-slate-800 font-heading">Filtros</h3>
                            <span class="ml-1 text-[11px] font-bold text-[#DB0007] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                {{ activeFiltersCount }}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button @click="showFiltersPanel = false" class="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:bg-red-50 transition" type="button" title="Ocultar panel">
                                <i class="fa-solid fa-eye-slash text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Type Filter -->
                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-tag text-[#DB0007] opacity-70"></i> {{ sidebarConfig.typeLabel }}
                            </h4>
                            <button @click="showTypeFilterSection = !showTypeFilterSection" type="button" class="filter-collapse-btn">
                                {{ showTypeFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showTypeFilterSection" class="flex flex-wrap gap-2">
                            <button v-for="t in sidebarConfig.types" :key="t.key"
                               @click="toggleTypeFilter(t.key)"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeTypeFilters.includes(t.key) ? 'bg-[#DB0007] text-white border-[#DB0007] shadow-md scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007] hover:bg-gray-50']">
                                {{ t.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Extra feature Filter -->
                    <div v-if="sidebarConfig.showExtra" class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-pepper-hot text-[#DB0007] opacity-70"></i> {{ sidebarConfig.extraLabel }}
                            </h4>
                            <button @click="showExtraFilterSection = !showExtraFilterSection" type="button" class="filter-collapse-btn">
                                {{ showExtraFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showExtraFilterSection" class="flex gap-2 bg-gray-100 p-1 rounded-xl">
                            <button @click="toggleExtraFilter('yes')"
                               :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center',
                                        activeExtraFilter === 'yes' ? 'bg-white text-[#DB0007] shadow-sm' : 'text-gray-500 hover:text-gray-700']">
                                Sí
                            </button>
                            <button @click="toggleExtraFilter('no')"
                               :class="['flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 text-center',
                                        activeExtraFilter === 'no' ? 'bg-white text-[#DB0007] shadow-sm' : 'text-gray-500 hover:text-gray-700']">
                                No
                            </button>
                        </div>
                    </div>

                    <!-- Price Filter -->
                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-dollar-sign text-[#DB0007] opacity-70"></i> Precio
                            </h4>
                            <button @click="showPriceFilterSection = !showPriceFilterSection" type="button" class="filter-collapse-btn">
                                {{ showPriceFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showPriceFilterSection" class="flex flex-wrap gap-2">
                            <button @click="setPriceFilter('all')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'all' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                Todos
                            </button>
                            <button @click="setPriceFilter('low')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'low' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                Hasta $150
                            </button>
                            <button @click="setPriceFilter('mid')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'mid' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                $151-$300
                            </button>
                            <button @click="setPriceFilter('high')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activePriceFilter === 'high' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                +$300
                            </button>
                        </div>
                    </div>

                    <!-- Sort Filter -->
                    <div class="filter-section mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="font-bold text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                                <i class="fa-solid fa-arrow-down-wide-short text-[#DB0007] opacity-70"></i> Ordenar
                            </h4>
                            <button @click="showSortFilterSection = !showSortFilterSection" type="button" class="filter-collapse-btn">
                                {{ showSortFilterSection ? 'Ocultar' : 'Mostrar' }}
                            </button>
                        </div>
                        <div v-if="showSortFilterSection" class="flex flex-wrap gap-2">
                            <button @click="setSortFilter('default')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'default' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                Relevancia
                            </button>
                            <button @click="setSortFilter('price-asc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'price-asc' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                Menor precio
                            </button>
                            <button @click="setSortFilter('price-desc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'price-desc' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                Mayor precio
                            </button>
                            <button @click="setSortFilter('name-asc')"
                               :class="['px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                                        activeSortFilter === 'name-asc' ? 'bg-[#DB0007] text-white border-[#DB0007]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0007] hover:text-[#DB0007]']">
                                A-Z
                            </button>
                        </div>
                    </div>

                    <!-- Reset Button -->
                    <div class="pt-2">
                        <button @click="resetFilters" class="filter-reset-btn w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2">
                            <i class="fa-solid fa-rotate-left"></i> Limpiar Filtros
                        </button>
                    </div>
                    </div>
                </aside>
            </transition>

            <!-- Product Grid -->
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
                    <div class="inline-block w-8 h-8 border-4 border-[#DB0007] border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-gray-400 mt-4 font-medium">Buscando tu comida...</p>
                </div>
                <div v-else-if="visibleProducts.length === 0" class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center">
                    <i class="fa-solid fa-burger text-4xl mb-4 text-gray-300"></i>
                    No se encontraron productos.
                </div>
                <div v-else :key="catalogMotionKey" class="products-grid grid gap-3 md:gap-6" :class="productGridClass">
                    <div v-for="(product, idx) in visibleProducts" :key="`${product.id}-${product.name}`"
                         @click="openProductDetail(product)"
                         class="product-card fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-[#DB0007] transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden"
                         :style="{ '--stagger-delay': `${Math.min(idx, 10) * 45}ms` }">

                        <div class="product-media h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                            <div class="absolute inset-0 bg-[#FFC72C]/10 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                            <img :src="product.img" :alt="product.name"
                                 class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10" loading="lazy">
                        </div>

                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-[#DB0007] transition line-clamp-1 font-heading">{{ product.name }}</h3>
                            <p class="text-xs font-bold text-[#DB0007] mb-3 md:mb-4 uppercase tracking-wide">{{ product.category }}</p>
                            <div class="product-footer flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-[#FFF7EA]/50 transition border border-transparent group-hover:border-[#FFC72C]">
                                <span class="text-slate-800 font-bold px-2 text-lg">${{ product.price }}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-[#DB0007] shadow-sm hover:bg-[#DB0007] hover:text-white transition flex items-center justify-center border border-gray-100">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- ═══ DETAIL VIEW ═══ -->
    <div v-else class="fade-in container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl relative">
        <button @click="closeDetail" class="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-sm font-bold text-gray-700 hover:text-[#DB0007] hover:bg-white transition-all transform hover:-translate-x-1 border border-gray-100">
            <i class="fa-solid fa-arrow-left"></i><span>Volver</span>
        </button>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 pt-10">
            <!-- Left: Image + Size Selector -->
            <div class="flex flex-col gap-6 md:gap-8 md:col-span-3">
                <div class="relative bg-[#FFFDF5] rounded-[2.5rem] flex items-center justify-center p-8 h-80 md:h-[550px] border border-[#FFD97D]/50 shadow-inner overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-tr from-[#DB0007]/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-700"></div>
                    <img :src="selectedProduct.img" :alt="selectedProduct.name"
                         class="h-full w-auto object-contain drop-shadow-2xl z-10 transition-transform duration-700 group-hover:scale-110">
                </div>

                <!-- Size Selector -->
                <div class="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 class="font-bold text-lg text-slate-800 mb-5 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-up-right-and-down-left-from-center text-[#DB0007]"></i> Elige el tamaño
                    </h3>
                    <div class="flex gap-4 justify-center md:justify-start">
                        <div v-for="size in ['Pequeño', 'Mediano', 'Grande']" :key="size"
                             @click="selectSize(size)"
                             class="flex flex-col items-center gap-3 cursor-pointer group flex-1 max-w-[120px]">
                            <div :class="['w-full h-24 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden', 
                                         currentSize === size ? 'border-[#FFC72C] bg-[#FFF7EA] shadow-md transform -translate-y-1' : 'border-gray-100 bg-white hover:border-[#FFC72C] hover:bg-gray-50']">
                                <i :class="['fa-solid transition-all duration-300', 
                                           selectedProduct.category === 'Bebidas' ? 'fa-glass-water' : 'fa-burger', 
                                           currentSize === size ? 'text-[#DB0007]' : 'text-gray-300 group-hover:text-gray-400', 
                                           size === 'Pequeño' ? 'text-2xl' : size === 'Mediano' ? 'text-3xl' : 'text-4xl']"></i>
                                <div v-if="currentSize === size" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#DB0007]"></div>
                            </div>
                            <div class="text-center leading-tight">
                                <span :class="['block text-sm font-bold transition-colors', currentSize === size ? 'text-[#DB0007]' : 'text-slate-700']">{{ size }}</span>
                                <span class="block text-xs text-gray-500 font-medium mt-0.5">${{ sizePrices[size] }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Info + Customization -->
            <div class="flex flex-col h-full md:col-span-2">
                <div class="mb-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 class="text-xs font-bold text-[#DB0007] mb-3 tracking-widest uppercase bg-[#FFF2F2] inline-block px-3 py-1 rounded-full">{{ selectedProduct.category }}</h2>
                    <h1 class="text-3xl md:text-5xl font-black text-[#5C0003] mb-4 font-heading leading-tight tracking-tight">{{ selectedProduct.name }}</h1>

                    <div class="flex items-center mb-5 text-sm pb-5 border-b border-gray-100">
                        <div class="flex text-[#FFC72C] gap-1 text-base shadow-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-3 text-sm font-medium underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-gray-600">(Múltiples Reviews)</span>

                        <button @click="toggleFavorite" class="ml-auto w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border"
                                :class="isFavorite ? 'bg-red-50 border-red-100 text-red-500 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50/50'">
                            <i :class="isFavorite ? 'fa-solid fa-heart text-xl' : 'fa-regular fa-heart text-xl'"></i>
                        </button>
                    </div>

                    <p class="text-gray-600 text-sm md:text-base leading-relaxed break-words">{{ selectedProduct.description || 'Disfruta del sabor único de McDonald\'s. Me encanta.' }}</p>
                </div>

                <!-- Price + Qty Bar -->
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 bg-[#DB0007] p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                    <div class="flex flex-col mb-4 sm:mb-0 relative z-10">
                        <span class="text-white/80 font-medium text-xs uppercase tracking-widest mb-1">Precio Unitario</span>
                        <div class="flex items-end gap-1">
                            <span class="text-xl font-bold text-[#FFC72C] mb-1">$</span>
                            <span class="text-4xl font-black text-white leading-none">{{ currentUnitPrice }}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 bg-black/10 p-1.5 rounded-xl backdrop-blur-sm relative z-10 w-full sm:w-auto justify-center border border-white/10">
                        <button @click="changeQty(-1)" class="w-10 h-10 flex items-center justify-center rounded-lg text-white font-bold transition hover:bg-white/20 hover:scale-105 active:scale-95"><i class="fa-solid fa-minus"></i></button>
                        <span class="w-12 text-center font-bold text-2xl text-white">{{ currentQty }}</span>
                        <button @click="changeQty(1)" class="w-10 h-10 flex items-center justify-center rounded-lg text-white font-bold transition hover:bg-white/20 hover:scale-105 active:scale-95"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>

                <!-- Customization (Food only) -->
                <div v-if="selectedProduct.category === 'Hamburguesas' || selectedProduct.category === 'Complementos'" class="flex-grow mb-8">
                    <div class="bg-white border border-gray-100 rounded-3xl shadow-sm p-5 md:p-6">
                        <h3 class="font-bold text-lg text-slate-800 mb-5 font-heading flex items-center gap-2 pb-3 border-b border-gray-50">
                            <i class="fa-solid fa-sliders text-[#DB0007]"></i> Personaliza tu pedido
                        </h3>

                        <!-- Meat Option -->
                        <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-red-50/80 flex items-center justify-center text-[#DB0007] shadow-inner border border-red-100"><i class="fa-solid fa-drumstick-bite text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Tipo de Carne</span>
                                    <span class="text-xs text-gray-400">Elaborada a la parrilla</span>
                                </div>
                            </div>
                            <div class="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                                <button v-for="opt in ['Res', 'Pollo', 'Pescado']" :key="opt"
                                        @click="meatOption = opt"
                                        :class="['flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all duration-300 min-w-[70px]', 
                                                 meatOption === opt ? 'bg-white text-[#DB0007] shadow-sm transform scale-105' : 'text-gray-500 hover:text-gray-700']">{{ opt }}</button>
                            </div>
                        </div>

                        <!-- Cheese -->
                        <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex justify-between items-center py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded-xl px-2 mt-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-yellow-50/80 flex items-center justify-center text-yellow-500 shadow-inner border border-yellow-100"><i class="fa-solid fa-cheese text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Queso Extra</span>
                                    <span class="text-xs text-[#DB0007] font-medium">+$30</span>
                                </div>
                            </div>
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button @click="updateIngredient('cheese', -1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="font-bold text-slate-800 w-8 text-center text-sm">{{ extraCheeseQty }}</span>
                                <button @click="updateIngredient('cheese', 1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </div>

                        <!-- Bacon -->
                        <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex justify-between items-center py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-orange-50/80 flex items-center justify-center text-orange-500 shadow-inner border border-orange-100"><i class="fa-solid fa-bacon text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Tocino Extra</span>
                                    <span class="text-xs text-[#DB0007] font-medium">+$45</span>
                                </div>
                            </div>
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button @click="updateIngredient('bacon', -1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="font-bold text-slate-800 w-8 text-center text-sm">{{ extraBaconQty }}</span>
                                <button @click="updateIngredient('bacon', 1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </div>

                        <!-- Lettuce -->
                        <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex justify-between items-center py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-green-50/80 flex items-center justify-center text-green-500 shadow-inner border border-green-100"><i class="fa-solid fa-leaf text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Lechuga Extra</span>
                                </div>
                            </div>
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button @click="updateIngredient('lettuce', -1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="font-bold text-slate-800 w-8 text-center text-sm">{{ extraLettuceQty }}</span>
                                <button @click="updateIngredient('lettuce', 1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </div>

                        <!-- Pickles -->
                        <div v-if="selectedProduct.category === 'Hamburguesas'" class="flex justify-between items-center py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors rounded-xl px-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-green-100/80 flex items-center justify-center text-green-600 shadow-inner border border-green-200"><i class="fa-solid fa-seedling text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Pepinillos Extra</span>
                                </div>
                            </div>
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button @click="updateIngredient('pickles', -1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="font-bold text-slate-800 w-8 text-center text-sm">{{ extraPicklesQty }}</span>
                                <button @click="updateIngredient('pickles', 1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </div>

                        <!-- Sauces -->
                        <div class="flex justify-between items-center py-4 hover:bg-gray-50/50 transition-colors rounded-xl px-2 mt-2">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-red-50/80 flex items-center justify-center text-red-500 shadow-inner border border-red-100"><i class="fa-solid fa-bottle-droplet text-lg"></i></div>
                                <div>
                                    <span class="block text-sm font-bold text-slate-800">Sobres de Ketchup</span>
                                </div>
                            </div>
                            <div class="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                <button @click="updateIngredient('sauce', -1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="font-bold text-slate-800 w-8 text-center text-sm">{{ sauceQty }}</span>
                                <button @click="updateIngredient('sauce', 1)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#DB0007] hover:bg-white hover:shadow-sm transition"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add to Cart -->
                <div class="mt-auto bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-gray-200/50 shadow-xl sticky bottom-4 z-20">
                    <div class="flex justify-between items-end mb-4 px-2">
                        <span class="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Final</span>
                        <div class="flex items-end gap-1">
                            <span class="text-xl font-bold text-[#DB0007] mb-1">$</span>
                            <span class="text-4xl font-black text-[#5C0003] leading-none">{{ totalPrice }}</span>
                        </div>
                    </div>
                    <button @click="addToCart" class="w-full bg-[#FFC72C] hover:bg-[#e6b325] text-[#DB0007] font-bold py-4 rounded-2xl shadow-lg shadow-yellow-500/30 text-lg transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden">
                        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span class="relative z-10">Añadir al Pedido</span>
                        <i class="fa-solid fa-cart-arrow-down relative z-10 text-xl group-hover:animate-bounce"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                <div class="flex items-center gap-2 mb-4 bg-[#DB0007] w-fit px-3 py-1 rounded shadow-lg">
                    <span class="text-[#FFC72C] font-bold text-xl italic">Food</span>
                    <span class="text-white font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de McDonald's directo a tu puerta con FoodRush.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#DB0007] hover:text-white transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#DB0007] hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#DB0007] hover:text-white transition"><i class="fa-brands fa-twitter"></i></a>
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
            &copy; 2025 FoodRush Inc. Todos los derechos reservados.
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
        radial-gradient(1200px 520px at 10% -20%, rgba(255, 199, 44, 0.16), transparent 62%),
        radial-gradient(1000px 500px at 100% 0%, rgba(219, 0, 7, 0.08), transparent 58%),
        #f7f8fb;
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

/* ── Sidebar Filters ── */
.side-filter-btn {
    display: none;
}

/* ── Category Tabs ── */
.filter-tab { transition: all 0.3s ease; }
.filter-tab.active { background-color: #DB0007; color: white; border-color: #DB0007; box-shadow: 0 4px 6px -1px rgba(219, 0, 7, 0.3); }
.filter-tab:not(.active):hover { border-color: #FFC72C; color: #9f1616; background-color: #FFF8E7; }

.filter-panel {
    position: sticky;
    top: 132px;
    z-index: 20;
    width: 100%;
    max-width: 280px;
    border-color: #ffdca1;
    box-shadow: 0 18px 36px rgba(122, 61, 0, 0.12);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 237, 0.96));
    transition: box-shadow 0.22s ease, transform 0.22s ease;
}

.filter-panel:hover {
    box-shadow: 0 24px 48px rgba(122, 61, 0, 0.18);
}

.filter-section {
    padding-top: 14px;
    border-top: 1px solid #ffe8bd;
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
    color: #8d4208;
    background: #fff8ea;
    border: 1px solid #ffd491;
    border-radius: 999px;
    padding: 4px 10px;
    transition: all 0.2s ease;
}

.filter-collapse-btn:hover {
    color: #7a2d11;
    border-color: #FFC72C;
    background: #FFF2D2;
}

.filter-toggle-inline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 14px;
    min-height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #DB0007 0%, #b30005 100%);
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid #FFC72C;
    box-shadow:
        0 10px 18px rgba(219, 0, 7, 0.18),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    letter-spacing: 0.02em;
}

.filter-toggle-inline:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 24px rgba(219, 0, 7, 0.28);
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
    border: 1px solid #ffdca1;
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
    background: #DB0007;
    color: white;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.01em;
    box-shadow: 0 8px 16px rgba(219, 0, 7, 0.25);
}

.catalog-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    color: #7a3f0a;
    background: #fff7e8;
    border: 1px solid #ffd491;
}

.catalog-chip--active {
    color: #ffffff;
    background: #DB0007;
    border-color: #FFC72C;
}

.product-card {
    animation: cardIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: var(--stagger-delay, 0ms);
    border-color: #ffe3ad !important;
    background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%) !important;
    box-shadow: 0 12px 28px rgba(122, 61, 0, 0.1);
}

.product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
}

.product-media::after {
    content: '';
    position: absolute;
    inset: 14% 16%;
    border-radius: 9999px;
    background: radial-gradient(circle, rgba(255, 199, 44, 0.2) 0%, rgba(255, 199, 44, 0) 70%);
    pointer-events: none;
    z-index: 0;
}

.product-footer {
    border-color: #ffe7bd;
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

/* ── Size Cards ── */
.size-card {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    border: 2px solid #e5e7eb; border-radius: 12px;
    width: 80px; height: 90px;
    cursor: pointer; transition: all 0.2s;
    position: relative; background-color: white;
}
@media (min-width: 768px) { .size-card { width: 90px; height: 100px; } }
.size-card:hover { border-color: #FFC72C; transform: translateY(-2px); }
.size-card.selected { border-color: #FFC72C; background-color: #FFFDF5; box-shadow: 0 4px 12px rgba(255, 199, 44, 0.2); }
.size-card i { color: #d1d5db; transition: color 0.2s; }
.size-card.selected i { color: #FFC72C; }

/* ── Counter Buttons ── */
.counter-btn {
    width: 30px; height: 30px; border-radius: 50%;
    border: 1px solid #e5e7eb; color: #DB0007;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; background: white;
}
.counter-btn:hover { border-color: #DB0007; background-color: #FFF2F2; }

/* ── Scrollbar Hide ── */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ── Details Toggle ── */
details > summary { list-style: none; outline: none; }
details > summary::-webkit-details-marker { display: none; }

/* ── Hide legacy detail view elements if needed ── */
.size-card, .counter-btn { display: none !important; }
</style>
