<template>
  <div class="font-sans antialiased bg-cream overflow-x-hidden flex flex-col min-h-screen">

    <div class="bg-dark text-white text-center py-2 text-xs font-bold tracking-widest uppercase relative z-50">
      <span class="text-accent">⚡</span> ¡Tu Gusto Nuestra Felicidad! <span class="text-accent">⚡</span>
    </div>

    <nav class="bg-white shadow-sm py-3 md:py-4 sticky top-0 z-50 transition-all border-b border-gray-100">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 md:px-12">
        <a href="#" class="flex items-center space-x-2 group">
          <i class="fas fa-bolt text-2xl md:text-3xl text-primary animate-pulse transform group-hover:scale-110 transition-transform"></i>
          <span class="self-center text-2xl font-extrabold whitespace-nowrap text-dark tracking-tighter font-sans">
            FOOD<span class="text-primary">RUSH</span>
          </span>
        </a>
        
        <nav class="hidden md:flex gap-8 font-medium">
          <a href="#" class="text-primary font-bold border-b-2 border-primary pb-1">Inicio</a>
          <a href="#" class="text-gray-500 hover:text-primary transition font-medium">Categorías</a>
          <a href="#" class="text-gray-500 hover:text-primary transition font-medium">Ofertas</a>
        </nav>
        
        <div class="flex items-center gap-4">
          <button class="md:hidden text-gray-600 text-xl"><i class="fa-solid fa-magnifying-glass"></i></button>
          <div class="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-accent cursor-pointer hover:bg-orange-100 transition border border-orange-100" 
               @click="openAuth('login')">
            <i class="fa-solid fa-user"></i>
          </div>
        </div>
      </div>
    </nav>

    <div id="default-carousel" class="relative w-full h-[380px] md:h-[380px] overflow-hidden">
      <div class="relative h-full">
        <transition-group name="fade" tag="div">
          <div v-show="currentSlide === 0" key="slide1" class="absolute w-full h-full">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1470&auto=format&fit=crop" class="w-full h-full object-cover brightness-[0.65]" alt="Slide 1">
          </div>
          <div v-show="currentSlide === 1" key="slide2" class="absolute w-full h-full">
            <img src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=1470&auto=format&fit=crop" class="w-full h-full object-cover brightness-[0.65]" alt="Slide 2">
          </div>
          <div v-show="currentSlide === 2" key="slide3" class="absolute w-full h-full">
            <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1374&auto=format&fit=crop" class="w-full h-full object-cover brightness-[0.65]" alt="Slide 3">
          </div>
        </transition-group>
      </div>

      <div class="absolute inset-0 z-30 flex flex-col items-center justify-center px-4">
        <div class="relative z-10 w-full max-w-2xl px-4 animate-[fadeIn_0.8s_ease-out]">
          <h2 class="text-white text-center font-display text-2xl md:text-4xl mb-6 drop-shadow-md">¿Qué se te antoja hoy?</h2>
          <div class="clean-search">
            <div class="search-icon">
              <i class="fa-solid fa-magnifying-glass text-accent"></i>
            </div>
            <input type="text" v-model="searchTerm" placeholder="Buscar franquicia o comida...">
            <button>Buscar</button>
          </div>
        </div>
      </div>
    </div>

    <section class="container mx-auto px-4 md:px-12 py-8 md:py-12">
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
        <button @click="showFilters = true" class="bg-dark hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition flex-shrink-0">
          <i class="fa-solid fa-sliders"></i>
          <span>Filtros</span>
        </button>
        
        <div class="w-full overflow-x-auto no-scrollbar pb-2">
          <div class="flex flex-wrap md:flex-nowrap gap-3 min-w-max">
            <button @click="currentCategory = 'all'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'all' ? 'active' : '']">Todos</button>
            <button @click="currentCategory = 'Hamburguesa'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Hamburguesa' ? 'active' : '']"><i class="fa-solid fa-burger mr-1"></i> Hamburguesas</button>
            <button @click="currentCategory = 'Pizza'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Pizza' ? 'active' : '']"><i class="fa-solid fa-pizza-slice mr-1"></i> Pizza</button>
            <button @click="currentCategory = 'Pollo'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Pollo' ? 'active' : '']"><i class="fa-solid fa-drumstick-bite mr-1"></i> Pollo</button>
            <button @click="currentCategory = 'Bebidas'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Bebidas' ? 'active' : '']"><i class="fa-solid fa-mug-hot mr-1"></i> Bebidas</button>
            <button @click="currentCategory = 'Tacos'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Tacos' ? 'active' : '']"><i class="fa-solid fa-pepper-hot mr-1"></i> Tacos</button>
            <button @click="currentCategory = 'Postres'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Postres' ? 'active' : '']"><i class="fa-solid fa-ice-cream mr-1"></i> Postres</button>
            <button @click="currentCategory = 'Criolla'" :class="['filter-btn px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap', currentCategory === 'Criolla' ? 'active' : '']"><i class="fa-solid fa-utensils mr-1"></i> Criolla</button>
          </div>
        </div>
      </div>

      <div v-if="filteredFranchises.length > 0" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <div v-for="item in filteredFranchises" :key="item.id" 
             class="card-franchise flex flex-col items-center justify-center text-center p-5 cursor-pointer group fade-in"
             @click="goToPage(item.id, item.name)">
             
          <span v-if="item.promo" class="absolute top-3 right-3 bg-accent text-white text-[10px] uppercase tracking-wide px-2 py-1 rounded-md font-bold shadow-sm z-10">Promo</span>
          
          <div class="w-28 h-28 mb-4 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-110">
            <img :src="item.img" :alt="item.name" class="max-w-full max-h-full object-contain drop-shadow-sm">
          </div>
          
          <h3 class="font-bold text-lg text-dark mb-1 group-hover:text-primary transition line-clamp-1">{{ item.name }}</h3>
          
          <div class="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
            <div class="flex items-center text-accent"><i class="fa-solid fa-star text-xs mr-1"></i>{{ item.rating }}</div>
            <span class="text-gray-300">|</span>
            <span class="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{{ item.category }}</span>
          </div>
          
          <div v-if="item.pickup" class="w-full mt-2 pt-2 border-t border-gray-50 text-[11px] text-green-600 font-bold flex items-center justify-center gap-1">
            <i class="fa-solid fa-bag-shopping"></i> Pickup
          </div>
          <div v-else class="w-full mt-2 pt-2 border-t border-transparent text-[11px] text-transparent">.</div>
        </div>
      </div>
      
      <div v-else class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
        <i class="fa-regular fa-face-frown text-4xl mb-4"></i>
        <p>No se encontraron resultados.</p>
      </div>
    </section>

    <footer class="bg-dark text-white mt-auto border-t-4 border-primary">
      <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div class="mb-8 md:mb-0">
           <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-1">
            <span class="text-accent font-black text-xl italic font-display">Food</span>
            <span class="text-dark font-black text-xl italic -ml-1 font-display">Rush</span>
          </div>
          <p class="text-gray-400 text-sm mb-6 font-medium max-w-xs leading-relaxed">Conectando tus antojos con las mejores franquicias del mundo.</p>
          <div class="flex gap-4">
            <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-instagram"></i></a>
            <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary hover:text-white transition duration-300"><i class="fa-brands fa-twitter"></i></a>
          </div>
        </div>
        <div class="flex gap-12 md:gap-20 text-sm text-left md:text-right w-full md:w-auto">
          <div>
            <h4 class="font-bold mb-4 text-lg text-white">Ayuda</h4>
            <ul class="space-y-3 text-gray-400 font-medium">
              <li><a href="#" class="hover:text-accent transition">Preguntas Frecuentes</a></li>
              <li><a href="#" class="hover:text-accent transition">Soporte Técnico</a></li>
              <li><a href="#" class="hover:text-accent transition">Términos y Condiciones</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4 text-lg text-white">Empresa</h4>
            <ul class="space-y-3 text-gray-400 font-medium">
              <li><a href="#" class="hover:text-accent transition">Sobre Nosotros</a></li>
              <li><a href="#" class="hover:text-accent transition">Blog Corporativo</a></li>
              <li><a href="#" class="hover:text-accent transition">Afíliate</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="bg-black text-center py-4 text-xs text-gray-600">
        &copy; 2025 FoodRush Inc. Todos los derechos reservados.
      </div>
    </footer>

    <div v-if="showFilters" class="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center fade-in backdrop-blur-sm" @click.self="showFilters = false">
      <div class="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md mx-4 relative shadow-2xl border-t-8 border-primary">
        <button @click="showFilters = false" class="absolute top-4 right-4 text-gray-400 hover:text-primary transition bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"><i class="fa-solid fa-xmark text-lg"></i></button>
        <h2 class="text-2xl font-bold text-center mb-6 text-dark font-display">Filtrar Búsqueda</h2>
        
        <div class="space-y-6">
          <div>
            <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Ordenar Por</h3>
            <div class="flex flex-wrap gap-2">
              <button @click="sortType = 'sugeridos'" :class="['modal-chip', sortType === 'sugeridos' ? 'selected' : '']"><i class="fa-solid fa-fire text-xs"></i> Sugeridos</button>
              <button @click="sortType = 'rating'" :class="['modal-chip', sortType === 'rating' ? 'selected' : '']"><i class="fa-solid fa-star text-xs"></i> Calificación</button>
              <button @click="sortType = 'rapidos'" :class="['modal-chip', sortType === 'rapidos' ? 'selected' : '']"><i class="fa-solid fa-clock text-xs"></i> Rapidez</button>
            </div>
          </div>
          <div>
            <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Tipo de Servicio</h3>
            <div class="flex flex-wrap gap-2">
              <button @click="toggleModalFilter('pickup')" :class="['modal-chip', activeFilters.includes('pickup') ? 'selected' : '']">Pickup (Retiro)</button>
              <button @click="toggleModalFilter('delivery')" :class="['modal-chip', activeFilters.includes('delivery') ? 'selected' : '']">Delivery FoodRush</button>
            </div>
          </div>
          <div>
            <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wider mb-3">Ofertas</h3>
            <div class="flex flex-wrap gap-2">
              <button @click="toggleModalFilter('descuentos')" :class="['modal-chip', activeFilters.includes('descuentos') ? 'selected' : '']">Promo Activa</button>
              <button @click="toggleModalFilter('envio')" :class="['modal-chip', activeFilters.includes('envio') ? 'selected' : '']">Envío Gratis</button>
            </div>
          </div>
        </div>
        
        <button @click="showFilters = false" class="w-full bg-dark hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-lg text-lg mt-8 flex justify-center items-center gap-2">
          <span>Ver Resultados</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>

    <div v-if="showAuth" class="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center fade-in backdrop-blur-sm" @click.self="showAuth = false">
      <div class="auth-card relative" :class="{ 'active-register': authMode === 'register' }">
        <button @click="showAuth = false" class="absolute top-4 right-4 text-white text-2xl font-bold z-50 hover:scale-110 transition opacity-80 hover:opacity-100"><i class="fa-solid fa-xmark"></i></button>
        <div class="auth-header">
          <div class="auth-logo-box"><i class="fa-solid fa-bolt"></i></div>
          <div class="auth-brand-name">FoodRush</div>
        </div>
        <div class="auth-forms-wrapper">
          <div class="auth-panel">
            <h2 class="auth-title">¡Bienvenido!</h2>
            <form @submit.prevent>
              <label class="auth-label">Usuario / Correo</label>
              <input class="auth-input" type="text" placeholder="ejemplo@foodrush.com">
              <label class="auth-label">Contraseña</label>
              <input class="auth-input" type="password" placeholder="••••••••">
              <button type="button" class="auth-btn-action">Iniciar Sesión</button>
            </form>
            <div class="auth-separator"><span>o continúa con</span></div>
            <div class="flex gap-2">
              <a href="#" class="auth-social-btn flex-1"><i class="fa-brands fa-google mr-2 text-red-500"></i> Google</a>
              <a href="#" class="auth-social-btn flex-1"><i class="fa-brands fa-apple mr-2"></i> Apple</a>
            </div>
            <div class="auth-switch-link">¿Nuevo aquí? <a @click="authMode = 'register'">Crea una cuenta</a></div>
          </div>
          <div class="auth-panel">
            <h2 class="auth-title">Regístrate</h2>
            <form @submit.prevent>
              <label class="auth-label">Correo Electrónico</label>
              <input class="auth-input" type="email" placeholder="correo@ejemplo.com">
              <label class="auth-label">Nombre</label>
              <input class="auth-input" type="text" placeholder="Tu nombre">
              <label class="auth-label">Contraseña</label>
              <input class="auth-input" type="password" placeholder="Crea una contraseña">
              <button type="button" class="auth-btn-action">Crear Cuenta</button>
            </form>
            <div class="auth-switch-link">¿Ya tienes cuenta? <a @click="authMode = 'login'">Inicia Sesión</a></div>
          </div>
          <div class="auth-overlay-slider"></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'FoodRushApp',
  data() {
    return {
      currentCategory: 'all',
      searchTerm: '',
      showFilters: false,
      showAuth: false,
      authMode: 'login', // 'login' or 'register'
      sortType: 'sugeridos',
      activeFilters: [],
      currentSlide: 0,
      carouselInterval: null,
      items: [
        { id: 1, name: "Starbucks", category: "Bebidas", rating: 4.8, img: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png", pickup: true, promo: true },
        { id: 2, name: "McDonald`s", category: "Hamburguesa", rating: 4.7, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png", pickup: true, promo: false },
        { id: 3, name: "KFC", category: "Pollo", rating: 4.6, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/KFC_logo.svg/1200px-KFC_logo.svg.png", pickup: false, promo: true },
        { id: 4, name: "Burger King", category: "Hamburguesa", rating: 4.3, img: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg", pickup: true, promo: true },
        { id: 5, name: "Little Caesars", category: "Pizza", rating: 4.5, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Little_Caesars_pizza_logo.svg/1200px-Little_Caesars_pizza_logo.svg.png", pickup: true, promo: false },
        { id: 6, name: "Domino`s", category: "Pizza", rating: 4.8, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Domino%27s_pizza_logo.svg/1200px-Domino%27s_pizza_logo.svg.png", pickup: true, promo: true },
        { id: 7, name: "Pizza Hut", category: "Pizza", rating: 4.6, img: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/Pizza_Hut_logo.svg/1200px-Pizza_Hut_logo.svg.png", pickup: false, promo: false },
        { id: 8, name: "Krispy Kreme", category: "Postres", rating: 4.9, img: "https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Krispy_Kreme_logo.svg/1200px-Krispy_Kreme_logo.svg.png", pickup: true, promo: true },
        { id: 9, name: "Rico Hot Dog", category: "Criolla", rating: 4.2, img: "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=100063636306692", pickup: true, promo: false },
        { id: 10, name: "Pizzarelli", category: "Pizza", rating: 4.7, img: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Pizzarelli_Logo.png", pickup: true, promo: false },
        { id: 11, name: "Barra Payán", category: "Criolla", rating: 4.9, img: "https://upload.wikimedia.org/wikipedia/commons/5/59/Barra_Payan_Logo.jpg", pickup: true, promo: true },
        { id: 12, name: "Taco Bell", category: "Tacos", rating: 4.4, img: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b3/Taco_Bell_2016.svg/1200px-Taco_Bell_2016.svg.png", pickup: false, promo: true },
        { id: 13, name: "Helados Bon", category: "Postres", rating: 4.8, img: "https://upload.wikimedia.org/wikipedia/commons/8/82/Helados_Bon_Logo.png", pickup: true, promo: true },
        { id: 14, name: "Chili`s", category: "Mexicana", rating: 4.5, img: "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Chili%27s_Grill_%26_Bar_logo.svg/1200px-Chili%27s_Grill_%26_Bar_logo.svg.png", pickup: false, promo: false },
        { id: 15, name: "Panda Express", category: "Asiática", rating: 4.7, img: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Panda_Express_logo.svg/1200px-Panda_Express_logo.svg.png", pickup: true, promo: true }
      ]
    }
  },
  computed: {
    filteredFranchises() {
      let result = [...this.items];

      // Filtro por categoría
      if (this.currentCategory !== 'all') {
        result = result.filter(item => item.category === this.currentCategory);
      }

      // Filtro por búsqueda (input)
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        result = result.filter(item => 
          item.name.toLowerCase().includes(term) || 
          item.category.toLowerCase().includes(term)
        );
      }

      // Filtros del Modal
      if (this.activeFilters.includes('pickup')) {
        result = result.filter(item => item.pickup === true);
      }
      if (this.activeFilters.includes('descuentos') || this.activeFilters.includes('cupones')) {
        result = result.filter(item => item.promo === true);
      }

      // Ordenamiento
      if (this.sortType === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (this.sortType === 'sugeridos') {
        result.sort((a, b) => a.id - b.id);
      }

      return result;
    }
  },
  methods: {
    goToPage(id, name) {
      if (id === 1) window.location.href = 'Starbukz.html';
      else if (id === 2) window.location.href = 'mcdonal.html'; 
      else if (id === 3) window.location.href = 'kfc.html'; 
      else if (id === 4) window.location.href = 'burger king.html'; 
      else if (id === 5) window.location.href = 'Little Ceasars.html'; 
      else if (id === 6) window.location.href = 'Domino`s Pizza.html'; 
      else if (id === 7) window.location.href = 'Pizza Hut.html'; 
      else if (id === 8) window.location.href = 'Krispy Kreme.html'; 
      else if (id === 9) window.location.href = 'Rico Hot Dog.html'; 
      else if (id === 10) window.location.href = 'Pizzarelli.html'; 
      else if (id === 11) window.location.href = 'Barra Payan.html'; 
      else if (id === 12) window.location.href = 'Taco Bell.html'; 
      else if (id === 13) window.location.href = 'Helados Bon.html'; 
      else if (id === 14) window.location.href = 'Chili`s Grill & Bar.html'; 
      else if (id === 15) window.location.href = 'Panda Express.html'; 
      else alert('Navegando a ' + name);
    },
    toggleModalFilter(filter) {
      if (this.activeFilters.includes(filter)) {
        this.activeFilters = this.activeFilters.filter(f => f !== filter);
      } else {
        this.activeFilters.push(filter);
      }
    },
    openAuth(mode) {
      this.authMode = mode;
      this.showAuth = true;
    },
    startCarousel() {
      this.carouselInterval = setInterval(() => {
        this.currentSlide = (this.currentSlide + 1) % 3;
      }, 4000);
    }
  },
  mounted() {
    this.startCarousel();
  },
  beforeUnmount() { // O beforeDestroy si usas Vue 2
    clearInterval(this.carouselInterval);
  }
}
</script>

<style scoped>
/* IMPORTANTE: Asegúrate de importar estas fuentes en tu archivo principal (index.html o App.vue global) si no se ven */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');

/* Utilities customizadas que pediste */
.font-display { font-family: 'Titan One', cursive; }
.font-sans { font-family: 'Poppins', sans-serif; }

/* Tarjetas Franquicias - Diseño Original Exacto */
.card-franchise {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #f3f4f6;
    position: relative;
    overflow: hidden;
}
.card-franchise:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: #F48C06; /* Usando hexadecimal directo en CSS o variable si configuras Tailwind */
}

/* Animaciones */
.fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Scroll Horizontal Oculto */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Filtros */
.filter-btn {
    border: 1px solid #e5e7eb;
    color: #4b5563;
    background: white;
    transition: all 0.2s;
}
.filter-btn:hover { border-color: #D90429; color: #D90429; }
.filter-btn.active { background-color: #D90429; color: white; border-color: #D90429; box-shadow: 0 4px 6px rgba(217, 4, 41, 0.2); }

/* Chips del Modal */
.modal-chip { padding: 8px 16px; border-radius: 9999px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid #e5e7eb; background-color: white; color: #4b5563; display: flex; align-items: center; gap: 6px; }
.modal-chip:hover { border-color: #F48C06; color: #F48C06; }
.modal-chip.selected { background-color: #F48C06; border-color: #F48C06; color: white; font-weight: 600; }

/* Auth Styles - Diseño Original Exacto */
.auth-card { background: white; width: 900px; max-width: 95%; height: 600px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); overflow: hidden; position: relative; display: flex; flex-direction: column; }
.auth-header { background-color: #F48C06; padding: 15px 40px; display: flex; align-items: center; height: 80px; }
.auth-logo-box { background: white; padding: 5px; border-radius: 8px; margin-right: 15px; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; border: 1px solid #ddd; }
.auth-logo-box i { font-size: 24px; color: #D90429; }
.auth-brand-name { font-family: 'Titan One', cursive; font-size: 32px; color: white; letter-spacing: 1px; text-shadow: 2px 2px 0px rgba(0,0,0,0.1); }
.auth-forms-wrapper { display: flex; height: calc(100% - 80px); position: relative; }
.auth-panel { flex: 1; padding: 20px 40px; display: flex; flex-direction: column; justify-content: center; }
.auth-title { font-family: 'Titan One', cursive; color: #D90429; font-size: 28px; margin-bottom: 15px; }
.auth-label { font-weight: 600; font-size: 13px; color: #374151; margin-bottom: 4px; display: block; }
.auth-input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none; transition: border 0.3s; }
.auth-input:focus { border-color: #F48C06; ring: 2px solid #F48C06; }
.auth-btn-action { width: 100%; background-color: #D90429; color: white; border: none; padding: 12px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 10px; transition: background 0.3s; }
.auth-btn-action:hover { background-color: #b90322; }
.auth-separator { display: flex; align-items: center; margin: 15px 0; color: #9ca3af; font-size: 12px; }
.auth-separator::before, .auth-separator::after { content: ''; flex: 1; border-bottom: 1px solid #e5e7eb; }
.auth-social-btn { width: 100%; padding: 10px; margin-bottom: 8px; background: white; border: 1px solid #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: 600; font-size: 13px; color: #374151; transition: bg 0.3s; }
.auth-social-btn:hover { background-color: #f9fafb; }
.auth-switch-link { text-align: center; margin-top: 15px; font-size: 13px; color: #6b7280; }
.auth-switch-link a { color: #D90429; font-weight: bold; cursor: pointer; text-decoration: underline; }
.auth-overlay-slider { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10; transition: transform 0.6s ease-in-out; backdrop-filter: blur(5px); }
.auth-card.active-register .auth-overlay-slider { transform: translateX(-100%); }

/* BUSCADOR ESTILO LIMPIO (Naranja) */
.clean-search {
    display: flex; align-items: center; background: white; border-radius: 12px;
    overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.15); width: 100%; height: 55px;
    border: 1px solid rgba(255,255,255,0.2);
}
.clean-search input {
    border: none !important; outline: none !important; box-shadow: none !important;
    height: 100%; flex-grow: 1; padding-left: 15px; font-size: 16px; color: #333;
}
.clean-search button {
    height: 100%; padding: 0 25px; background-color: #F48C06; color: white;
    font-weight: 700; font-size: 15px; border: none; cursor: pointer; transition: background 0.3s;
    text-transform: uppercase; letter-spacing: 0.5px;
}
.clean-search button:hover { background-color: #E85D04; }
.search-icon { padding-left: 20px; color: #9CA3AF; font-size: 18px; }

/* Transiciones Vue */
.fade-enter-active, .fade-leave-active { transition: opacity 1s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>