<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { getProductImage } from '../utils/productImages';
import { franchiseConfigs } from './franchiseConfigs';

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
});

const router = useRouter();

const franchise = computed(() => {
  return franchiseConfigs[props.slug] || franchiseConfigs.mcdonalds;
});

const products = ref([]);
const isLoading = ref(true);
const fetchError = ref(false);
const searchTerm = ref('');
const cartCount = ref(0);
const userName = ref('');
const currentCategory = ref('');
const activeTypeFilters = ref([]);

const selectedProduct = ref(null);
const currentQty = ref(1);
const selectedOptionKeys = ref([]);
const isFavorite = ref(false);

const currentSlide = ref(0);
let slideInterval = null;

const defaultSlide =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=80';

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

const brandVars = computed(() => ({
  '--brand-primary': franchise.value.primary || '#00704A',
  '--brand-accent': franchise.value.accent || '#ffffff',
  '--brand-background': franchise.value.background || '#f8fafc',
  '--brand-soft': toRgba(franchise.value.primary, 0.1),
  '--brand-soft-strong': toRgba(franchise.value.primary, 0.18),
}));

const parseProduct = (product, index) => {
  const rawDescription = String(product.descripcion || '').trim();
  const descriptionParts = rawDescription.split(' - ');

  let parsedCategory = '';
  let parsedDescription = rawDescription;

  if (descriptionParts.length > 1) {
    parsedCategory = descriptionParts[0].trim();
    parsedDescription = descriptionParts.slice(1).join(' - ').trim();
  }

  const category = String(
    product.categoria ||
      product.category ||
      parsedCategory ||
      franchise.value.categories?.[0] ||
      'General',
  ).trim();

  const type = String(product.tipo || product.type || parsedCategory || category).trim();

  const name = String(product.nombre || product.name || `Producto ${index + 1}`).trim();

  const priceNumber = Number.parseFloat(product.precio ?? product.price ?? 0);
  const price = Number.isFinite(priceNumber) ? Math.round(priceNumber) : 0;

  const description = parsedDescription || `Delicias de ${franchise.value.name}.`;

  return {
    id: product.id || `${props.slug}-${index}`,
    name,
    category,
    type,
    price,
    description,
    img:
      product.img ||
      product.imagen ||
      getProductImage(name, category) ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
  };
};

const availableCategories = computed(() => {
  const fromProducts = [...new Set(products.value.map((product) => product.category))].filter(Boolean);
  if (fromProducts.length > 0) return fromProducts;
  return franchise.value.categories || [];
});

const categoryTypes = computed(() => {
  const inCategory = products.value.filter((product) => product.category === currentCategory.value);
  return [...new Set(inCategory.map((product) => product.type))].filter(Boolean);
});

const filteredProducts = computed(() => {
  let result = products.value;

  if (currentCategory.value) {
    result = result.filter((product) => product.category === currentCategory.value);
  }

  if (searchTerm.value.trim()) {
    const term = normalize(searchTerm.value);
    result = result.filter((product) => normalize(product.name).includes(term));
  }

  if (activeTypeFilters.value.length > 0) {
    result = result.filter((product) => activeTypeFilters.value.includes(product.type));
  }

  return result;
});

const franchiseOptions = computed(() => franchise.value.options || []);

const selectedOptions = computed(() => {
  return franchiseOptions.value.filter((option) => selectedOptionKeys.value.includes(option.key));
});

const currentUnitPrice = computed(() => {
  if (!selectedProduct.value) return 0;
  const optionTotal = selectedOptions.value.reduce((sum, option) => {
    return sum + Number(option.price || 0);
  }, 0);
  return selectedProduct.value.price + optionTotal;
});

const totalPrice = computed(() => {
  return currentUnitPrice.value * currentQty.value;
});

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

const fetchProducts = async () => {
  try {
    isLoading.value = true;
    fetchError.value = false;

    const response = await api.getProducts(
      { limit: 200 },
      { 'X-Tenant-ID': franchise.value.tenantId },
    );

    if (response?.success === false) {
      throw new Error(response.message || 'No se pudieron cargar los productos.');
    }

    const rawData = response?.data || response;
    const list = Array.isArray(rawData) ? rawData : [];

    products.value = list.map((product, index) => parseProduct(product, index));
    syncCategory();
  } catch (error) {
    console.error(`Error loading ${franchise.value.name} products`, error);
    products.value = [];
    fetchError.value = true;
    syncCategory();
  } finally {
    isLoading.value = false;
  }
};

const updateCartBadge = () => {
  const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
  cartCount.value = cart.reduce((sum, item) => sum + Number(item.qty || 1), 0);
};

const setCategory = (category) => {
  currentCategory.value = category;
  activeTypeFilters.value = [];
};

const toggleTypeFilter = (type) => {
  if (activeTypeFilters.value.includes(type)) {
    activeTypeFilters.value = activeTypeFilters.value.filter((currentType) => currentType !== type);
    return;
  }

  if (activeTypeFilters.value.length >= 2) {
    activeTypeFilters.value.shift();
  }

  activeTypeFilters.value.push(type);
};

const resetFilters = () => {
  searchTerm.value = '';
  activeTypeFilters.value = [];
};

const checkFavorite = () => {
  if (!selectedProduct.value) return;
  const favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];
  isFavorite.value = favorites.some((favorite) => favorite.id === selectedProduct.value.id);
};

const toggleFavorite = () => {
  if (!selectedProduct.value) return;

  let favorites = JSON.parse(localStorage.getItem('foodrush_favorites')) || [];

  if (isFavorite.value) {
    favorites = favorites.filter((favorite) => favorite.id !== selectedProduct.value.id);
    isFavorite.value = false;
    Swal.fire({
      title: 'Eliminado de favoritos',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 1800,
      showConfirmButton: false,
    });
  } else {
    favorites.push({
      id: selectedProduct.value.id,
      name: selectedProduct.value.name,
      img: selectedProduct.value.img,
      price: selectedProduct.value.price,
      place: franchise.value.name,
    });
    isFavorite.value = true;
    Swal.fire({
      title: 'Agregado a favoritos',
      icon: 'success',
      toast: true,
      position: 'top-end',
      timer: 1800,
      showConfirmButton: false,
    });
  }

  localStorage.setItem('foodrush_favorites', JSON.stringify(favorites));
};

const openProductDetail = (product) => {
  selectedProduct.value = product;
  currentQty.value = 1;
  selectedOptionKeys.value = [];
  checkFavorite();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const closeDetail = () => {
  selectedProduct.value = null;
};

const changeQty = (step) => {
  const nextValue = currentQty.value + step;
  if (nextValue >= 1) currentQty.value = nextValue;
};

const toggleOption = (optionKey) => {
  if (selectedOptionKeys.value.includes(optionKey)) {
    selectedOptionKeys.value = selectedOptionKeys.value.filter((key) => key !== optionKey);
    return;
  }

  selectedOptionKeys.value.push(optionKey);
};

const createCartItem = () => {
  const detailSummary =
    selectedOptions.value.length > 0
      ? selectedOptions.value.map((option) => option.label).join(', ')
      : 'Sin extras';

  return {
    id: selectedProduct.value.id,
    name: selectedProduct.value.name,
    img: selectedProduct.value.img,
    price: currentUnitPrice.value,
    qty: currentQty.value,
    details: detailSummary,
  };
};

const addToCart = () => {
  if (!selectedProduct.value) return;

  const item = createCartItem();
  const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];

  const existing = cart.find(
    (cartItem) => cartItem.id === item.id && cartItem.details === item.details,
  );

  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.push(item);
  }

  localStorage.setItem('foodrush_cart', JSON.stringify(cart));
  updateCartBadge();

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

  closeDetail();
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
  userName.value = localStorage.getItem('user_name') || '';

  currentCategory.value = franchise.value.categories?.[0] || '';

  await fetchProducts();
  startSlideShow();
});

onBeforeUnmount(() => {
  if (slideInterval) {
    clearInterval(slideInterval);
  }
});
</script>

<template>
  <div class="font-sans antialiased min-h-screen text-slate-800 flex flex-col" :style="brandVars">
    <header class="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div class="max-w-screen-xl flex items-center justify-between mx-auto px-4 py-3 md:py-4 gap-3">
        <div class="flex items-center gap-3 md:gap-4 min-w-0">
          <button
            @click="goBackHome"
            aria-label="Volver al inicio"
            class="text-slate-700 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition"
          >
            <i class="fa-solid fa-arrow-left text-lg"></i>
          </button>

          <div class="flex items-center gap-3 min-w-0">
            <img :src="franchise.logo" :alt="franchise.name" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
            <div class="min-w-0">
              <p class="text-[11px] uppercase tracking-wider text-gray-500">FoodRush</p>
              <h1 class="font-black text-lg md:text-xl truncate">{{ franchise.name }}</h1>
            </div>
          </div>
        </div>

        <div
          class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 transition"
          :style="{ borderColor: 'var(--brand-soft-strong)' }"
        >
          <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar productos"
            class="outline-none w-full text-sm bg-transparent"
          />
        </div>

        <div class="flex items-center gap-4 md:gap-5">
          <button class="md:hidden text-gray-600 text-lg">
            <i class="fa-solid fa-magnifying-glass"></i>
          </button>

          <button
            @click="router.push('/cart')"
            class="transition relative text-xl text-gray-600 p-1"
            :style="{ color: 'var(--brand-primary)' }"
            aria-label="Ver carrito"
          >
            <i class="fa-solid fa-cart-shopping"></i>
            <span
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
              :style="{ backgroundColor: 'var(--brand-primary)' }"
            >
              {{ cartCount }}
            </span>
          </button>

          <button
            v-if="userName"
            @click="router.push('/profile')"
            class="flex items-center gap-2 hover:bg-gray-100 rounded-full px-3 py-1 transition"
          >
            <div
              class="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
              :style="{ backgroundColor: 'var(--brand-primary)' }"
            >
              {{ userName.charAt(0).toUpperCase() }}
            </div>
          </button>
          <button v-else @click="router.push('/login')" class="text-sm font-bold text-slate-600">
            Iniciar sesion
          </button>
        </div>
      </div>
    </header>

    <div v-if="!selectedProduct" class="fade-in pb-10 flex-1">
      <section class="flex flex-col md:flex-row h-auto md:h-[430px] w-full bg-white border-b border-gray-100">
        <div
          class="w-full md:w-2/5 flex flex-col items-center justify-center p-8 md:p-12 order-2 md:order-1 gap-4"
          :style="{ backgroundColor: 'var(--brand-soft)' }"
        >
          <img :src="franchise.logo" :alt="`${franchise.name} logo`" class="h-32 md:h-48 w-auto object-contain drop-shadow-lg" />
          <div class="text-center">
            <h2 class="text-2xl md:text-4xl font-black uppercase tracking-tight" :style="{ color: 'var(--brand-primary)' }">
              {{ franchise.heroTitle }}
            </h2>
            <p class="text-sm md:text-base text-gray-600 mt-2">{{ franchise.heroSubtitle }}</p>
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
              <img :src="slide" :alt="`${franchise.name} slide ${idx + 1}`" class="w-full h-full object-cover object-center" />
            </div>
          </div>

          <div class="absolute inset-0 bg-black/30"></div>

          <div class="absolute bottom-6 left-6 md:left-10 text-white z-20">
            <p class="text-xs uppercase tracking-[0.2em] text-white/80">Menu</p>
            <h3 class="text-3xl md:text-5xl font-black leading-none">{{ franchise.name }}</h3>
          </div>

          <div class="slider-dots">
            <button
              v-for="(_, idx) in slides"
              :key="idx"
              type="button"
              class="dot"
              :class="{ active: currentSlide === idx }"
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

      <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        <aside class="md:col-span-1">
          <div class="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm sticky top-[130px]">
            <h3 class="font-bold text-lg mb-4">Filtros</h3>

            <div class="mb-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Buscar</p>
              <div class="flex items-center border border-gray-200 rounded-xl px-3 py-2">
                <i class="fa-solid fa-magnifying-glass text-gray-400 text-sm"></i>
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Nombre de producto"
                  class="ml-2 text-sm w-full outline-none"
                />
              </div>
            </div>

            <div class="mb-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tipo</p>

              <div v-if="categoryTypes.length === 0" class="text-sm text-gray-400">
                Sin filtros para esta categoria.
              </div>

              <div v-else class="space-y-1">
                <button
                  v-for="type in categoryTypes"
                  :key="type"
                  @click="toggleTypeFilter(type)"
                  class="side-filter-btn w-full text-left"
                  :class="{ active: activeTypeFilters.includes(type) }"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <button
              @click="resetFilters"
              type="button"
              class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
            >
              <i class="fa-solid fa-rotate-left"></i> Limpiar filtros
            </button>
          </div>
        </aside>

        <main class="md:col-span-3">
          <div v-if="isLoading" class="text-center py-20">
            <div
              class="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              :style="{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }"
            ></div>
            <p class="text-gray-400 mt-4 font-medium">Cargando productos...</p>
          </div>

          <div v-else-if="fetchError" class="col-span-full text-center py-20 text-gray-500 flex flex-col items-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-4" :style="{ color: 'var(--brand-primary)' }"></i>
            No se pudieron cargar productos para {{ franchise.name }}.
          </div>

          <div v-else-if="filteredProducts.length === 0" class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center">
            <i class="fa-regular fa-face-frown text-4xl mb-4 text-gray-300"></i>
            No se encontraron productos para esta categoria.
          </div>

          <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <article
              v-for="product in filteredProducts"
              :key="product.id"
              @click="openProductDetail(product)"
              class="product-card fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] cursor-pointer bg-white group relative overflow-hidden"
            >
              <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                <div class="card-glow absolute inset-0 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                <img
                  :src="product.img"
                  :alt="product.name"
                  class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10"
                  loading="lazy"
                />
              </div>

              <div class="text-center w-full relative z-10">
                <h3 class="product-name font-bold text-base md:text-lg text-slate-800 mb-1 transition line-clamp-1">
                  {{ product.name }}
                </h3>
                <p class="text-xs text-gray-400 mb-3 md:mb-4 line-clamp-1">{{ product.type }}</p>
                <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl transition border border-transparent">
                  <span class="font-bold px-2 text-lg">${{ product.price }}</span>
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

    <div v-else class="fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
      <button @click="closeDetail" class="mb-6 flex items-center text-sm font-bold text-gray-500 transition group">
        <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 transition">
          <i class="fa-solid fa-chevron-left"></i>
        </div>
        Volver al menu
      </button>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
        <div class="flex flex-col gap-6 md:gap-8">
          <div class="relative rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border overflow-hidden" :style="{ backgroundColor: 'var(--brand-soft)', borderColor: 'var(--brand-soft-strong)' }">
            <img
              :src="selectedProduct.img"
              :alt="selectedProduct.name"
              class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div class="w-full">
            <h3 class="font-bold text-lg text-slate-800 mb-4 border-b border-gray-100 pb-2">Cantidad</h3>
            <div class="flex items-center justify-center md:justify-start gap-4">
              <button class="counter-btn" @click="changeQty(-1)"><i class="fa-solid fa-minus text-xs"></i></button>
              <span class="w-8 text-center font-bold text-lg">{{ currentQty }}</span>
              <button class="counter-btn" @click="changeQty(1)"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>
          </div>
        </div>

        <div class="flex flex-col h-full">
          <div class="mb-6">
            <h2 class="text-xs font-bold mb-2 tracking-widest uppercase" :style="{ color: 'var(--brand-primary)' }">
              {{ selectedProduct.category }}
            </h2>
            <h1 class="text-3xl md:text-4xl font-bold mb-3 leading-tight" :style="{ color: 'var(--brand-primary)' }">
              {{ selectedProduct.name }}
            </h1>

            <div class="flex items-center mb-4 text-sm">
              <div class="flex text-amber-400 gap-1 text-sm">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star-half-stroke"></i>
              </div>
              <span class="text-gray-400 ml-2 text-xs font-medium">(260 Reviews)</span>

              <button
                @click="toggleFavorite"
                class="ml-auto w-10 h-10 rounded-full flex items-center justify-center transition"
                :class="isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:text-red-400'"
              >
                <i :class="isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
              </button>
            </div>

            <p class="text-gray-600 text-sm md:text-base leading-relaxed">
              {{ selectedProduct.description }}
            </p>
          </div>

          <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm mb-6">
            <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
              <span class="font-bold text-sm">Precio unitario</span>
              <span class="font-black text-xl" :style="{ color: 'var(--brand-primary)' }">${{ currentUnitPrice }}</span>
            </div>

            <div v-if="franchiseOptions.length > 0" class="p-3 md:p-4 space-y-2">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Personaliza tu pedido</h3>
              <button
                v-for="option in franchiseOptions"
                :key="option.key"
                type="button"
                class="option-row"
                :class="{ active: selectedOptionKeys.includes(option.key) }"
                @click="toggleOption(option.key)"
              >
                <div>
                  <p class="font-semibold text-sm text-slate-700">{{ option.label }}</p>
                  <p class="text-xs text-gray-500">{{ option.description }}</p>
                </div>
                <span class="font-bold text-sm">+${{ option.price }}</span>
              </button>
            </div>
          </div>

          <div class="mt-auto bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4">
            <div class="flex justify-between items-center mb-4">
              <span class="text-sm text-gray-500 font-medium">Total estimado</span>
              <span class="text-3xl font-bold" :style="{ color: 'var(--brand-primary)' }">${{ totalPrice }}</span>
            </div>
            <button
              @click="addToCart"
              class="w-full text-white font-bold py-3 md:py-4 rounded-xl shadow-lg text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
              :style="{ backgroundColor: 'var(--brand-primary)' }"
            >
              <span>Anadir al pedido</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-white mt-auto" :style="{ backgroundColor: 'var(--brand-primary)' }">
      <div class="container mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div class="mb-6 md:mb-0">
          <p class="font-black text-2xl">FOODRUSH</p>
          <p class="text-white/80 text-sm mt-2">Tu comida favorita en un mismo lugar.</p>
        </div>

        <div class="text-sm text-white/85">
          <p>Ayuda</p>
          <p>Terminos</p>
          <p>Privacidad</p>
        </div>
      </div>
      <div class="border-t border-white/20 text-center py-3 text-xs text-white/70">
        (c) 2026 FoodRush. Todos los derechos reservados.
      </div>
    </footer>
  </div>
</template>

<style scoped>
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
  width: 10px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  transition: all 0.25s;
}

.dot.active {
  background-color: #ffffff;
  transform: scale(1.15);
}

.filter-tab {
  transition: all 0.25s ease;
}

.filter-tab.active {
  background-color: var(--brand-primary);
  border-color: var(--brand-primary);
}

.filter-tab:not(.active):hover {
  color: var(--brand-primary);
  border-color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.side-filter-btn {
  cursor: pointer;
  padding: 8px 12px;
  color: #4b5563;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  font-size: 0.92rem;
  display: flex;
  align-items: center;
  border-radius: 0 6px 6px 0;
}

.side-filter-btn:hover {
  color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.side-filter-btn.active {
  color: var(--brand-primary);
  font-weight: 700;
  border-left-color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.product-card:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
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

.counter-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  color: var(--brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: #ffffff;
}

.counter-btn:hover {
  border-color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.option-row {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  transition: all 0.2s;
}

.option-row:hover {
  border-color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.option-row.active {
  border-color: var(--brand-primary);
  background-color: var(--brand-soft);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>


