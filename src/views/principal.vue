<!--
  Guia rapida para presentar:
  Vista de Afiliados. Agrupa pantalla, estado visual, formulario de registro y beneficios.
  Buscar en VS Code: afiliacion, landing empresa, registro de locales.
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

// Estado del formulario de afiliación
const afiliateForm = ref({
    nombreResponsable: '',
    nombreLocal: '',
    email: '',
    telefono: '',
    ciudad: '',
    tipoComida: ''
});
const isSubmitting = ref(false);
const showSuccess = ref(false);

const navItems = [
    { path: '/terms', label: 'Términos' },
    { path: '/support', label: 'Soporte' },
    { path: '/about', label: 'Nosotros' },
    { path: '/affiliate', label: 'Afíliate' }
];

const handleScroll = () => {
    isScrolled.value = window.scrollY > 36;
};

const isSolid = computed(() => isScrolled.value || isMobileMenuOpen.value);

const desktopLinkClasses = (path) => [
    'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out',
    route.path === path
        ? isSolid.value
            ? 'bg-[#BD0A0A] text-white shadow-lg shadow-red-200/70'
            : 'bg-white/14 text-white ring-1 ring-white/20 backdrop-blur-md'
        : isSolid.value
            ? 'text-slate-700 hover:bg-slate-100 hover:text-[#BD0A0A]'
            : 'text-white/85 hover:bg-white/10 hover:text-white'
];

const mobileLinkClasses = (path) => [
    'rounded-2xl px-4 py-3 text-center text-sm font-semibold transition-all duration-300 ease-out',
    route.path === path
        ? 'bg-[#BD0A0A] text-white shadow-lg shadow-red-200/70'
        : 'text-slate-700 hover:bg-slate-100 hover:text-[#BD0A0A]'
];

const navigate = (path) => {
    if (route.path === path) {
        isMobileMenuOpen.value = false;
        return;
    }
    const go = () => router.push(path);
    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
        document.startViewTransition(go);
    } else {
        go();
    }
    isMobileMenuOpen.value = false;
};

const goHome = () => navigate('/');

const submitAfiliacion = async () => {
    isSubmitting.value = true;
    
    // Simulamos una llamada a la API de FoodRush
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    isSubmitting.value = false;
    showSuccess.value = true;
    
    // Limpiamos el formulario
    afiliateForm.value = {
        nombreResponsable: '',
        nombreLocal: '',
        email: '',
        telefono: '',
        ciudad: '',
        tipoComida: ''
    };

    // Ocultar el mensaje de éxito después de unos segundos
    setTimeout(() => {
        showSuccess.value = false;
    }, 5000);
};

const scrollToForm = () => {
    document.getElementById('registro-afiliados').scrollIntoView({ behavior: 'smooth' });
};

onMounted(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    handleScroll();
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
<div class="font-sans antialiased bg-gray-50 overflow-x-hidden flex flex-col min-h-screen">

    <!-- NAVBAR IGUAL DE ELEGANTE -->
    <nav
        :class="[
            'fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ease-out',
            isSolid
                ? 'border-gray-200 bg-white/92 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl'
                : 'border-transparent bg-transparent py-5 md:py-6',
        ]"
    >
        <div class="mx-auto flex max-w-screen-2xl items-center justify-between px-4 md:px-12 lg:px-16">
            <a href="/" class="group z-50 flex items-center gap-3" @click.prevent="goHome">
                <i
                    :class="[
                        'fas fa-bolt text-2xl transition-all duration-300 ease-out group-hover:scale-110 animate-pulse',
                        isSolid ? 'text-[#BD0A0A]' : 'text-[#fbbf24]',
                    ]"
                ></i>
                <span
                    :class="[
                        'text-xl font-extrabold tracking-wide transition-colors duration-300 md:text-2xl',
                        isSolid ? 'text-slate-900' : 'text-white',
                    ]"
                >
                    FOOD<span class="text-[#BD0A0A]">RUSH</span>
                </span>
            </a>

            <div class="hidden items-center gap-3 md:flex">
                <a
                    v-for="item in navItems"
                    :key="item.path"
                    :href="item.path"
                    :class="desktopLinkClasses(item.path)"
                    @click.prevent="navigate(item.path)"
                >
                    {{ item.label }}
                </a>

                <button
                    type="button"
                    class="ml-3 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-black"
                    @click="goHome"
                >
                    <i class="fa-solid fa-house text-xs"></i>
                    Menú
                </button>
            </div>

            <button
                type="button"
                class="z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl transition-all duration-300 md:hidden"
                :class="isSolid ? 'bg-slate-100 text-slate-900' : 'bg-white/12 text-white backdrop-blur-sm'"
                aria-label="Abrir menu"
                @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
                <i :class="isMobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
            </button>
        </div>

        <div
            :class="[
                'overflow-hidden border-t border-transparent bg-white/98 backdrop-blur-xl transition-all duration-300 ease-out md:hidden',
                isMobileMenuOpen ? 'max-h-96 border-gray-100 shadow-xl' : 'max-h-0',
            ]"
        >
            <div class="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-4">
                <a
                    v-for="item in navItems"
                    :key="`${item.path}-mobile`"
                    :href="item.path"
                    :class="mobileLinkClasses(item.path)"
                    @click.prevent="navigate(item.path)"
                >
                    {{ item.label }}
                </a>
                <button
                    type="button"
                    class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#BD0A0A] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-red-700"
                    @click="goHome"
                >
                    <i class="fa-solid fa-house text-xs"></i>
                    Ir al menú principal
                </button>
            </div>
        </div>
    </nav>

    <!-- CAROUSEL ORIENTADO A AFILIADOS -->
    <div id="default-carousel" class="relative w-full" data-carousel="slide">
        <div class="relative h-full overflow-hidden">
            <div class="hidden duration-1000 ease-in-out" data-carousel-item="active">
                <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop" class="absolute block w-full h-full object-cover brightness-50" alt="Restaurant Kitchen">
                <div class="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
                    <span class="text-[#fbbf24] font-bold tracking-widest uppercase mb-4" data-aos="fade-down">Plataforma Multi-Inquilino</span>
                    <h1 class="text-5xl md:text-7xl font-extrabold mb-4 text-shadow" data-aos="zoom-in">ÚNETE A FOODRUSH</h1>
                    <p class="text-xl md:text-2xl mb-8 max-w-2xl" data-aos="fade-up" data-aos-delay="200">Aumenta tus ventas y deja la logística de última milla en nuestras manos.</p>
                    <button @click="scrollToForm" class="bg-[#fbbf24] text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transform hover:-translate-y-1 transition-all">
                        Afiliar mi restaurante
                    </button>
                </div>
            </div>
        </div>
        
        <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer z-30" @click="scrollToForm">
             <i class="fas fa-chevron-down text-white text-3xl"></i>
        </div>
    </div>

    <!-- SECCIÓN: BENEFICIOS DE AFILIARSE (NUEVO) -->
    <section class="py-20 bg-white overflow-hidden">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <span class="text-[#BD0A0A] font-bold tracking-widest uppercase">¿Por qué unirte?</span>
                <h2 class="text-4xl font-extrabold text-gray-900 mt-2">Beneficios Exclusivos para Aliados</h2>
                <p class="mt-4 text-gray-600 max-w-2xl mx-auto">Potenciamos tu negocio con tecnología de punta y una red logística impecable.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                <!-- Beneficio 1 -->
                <div class="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <div class="w-14 h-14 bg-red-100 text-[#BD0A0A] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Más Ventas</h3>
                    <p class="text-gray-600 text-sm">Llega a miles de usuarios activos en nuestra plataforma todos los días.</p>
                </div>
                <!-- Beneficio 2 -->
                <div class="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <div class="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="fas fa-motorcycle"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Logística Resolutiva</h3>
                    <p class="text-gray-600 text-sm">Nos encargamos de los repartidores y la entrega rápida.</p>
                </div>
                <!-- Beneficio 3 -->
                <div class="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="fas fa-tablet-alt"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">App de Gestión</h3>
                    <p class="text-gray-600 text-sm">Recibe y gestiona órdenes desde una tablet con nuestra interfaz amigable.</p>
                </div>
                <!-- Beneficio 4 -->
                <div class="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                    <div class="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Soporte 24/7</h3>
                    <p class="text-gray-600 text-sm">Atención personalizada para ti y tus clientes en todo momento.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- FORMULARIO DE AFILIACIÓN DE ALTA CONVERSIÓN (NUEVO) -->
    <section id="registro-afiliados" class="py-24 bg-gray-900 relative overflow-hidden">
        <!-- Decoración de fondo -->
        <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div class="absolute -top-40 -right-40 w-96 h-96 bg-[#BD0A0A] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div class="absolute top-40 -left-40 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div class="container mx-auto px-4 relative z-10">
            <div class="flex flex-col lg:flex-row gap-12 items-center bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                
                <!-- Columna Izquierda: Copy y Pasos -->
                <div class="w-full lg:w-5/12 p-8 lg:p-12 text-white">
                    <h2 class="text-4xl font-extrabold mb-4">Empieza a vender en <span class="text-[#BD0A0A]">FoodRush</span></h2>
                    <p class="text-gray-300 mb-8 text-lg">Únete a la red de franquicias más eficiente. Completa el formulario y un asesor se pondrá en contacto contigo en menos de 24 horas.</p>
                    
                    <div class="space-y-6">
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#BD0A0A] flex items-center justify-center font-bold">1</div>
                            <div>
                                <h4 class="text-lg font-bold">Llena tus datos</h4>
                                <p class="text-sm text-gray-400">Queremos conocer sobre tu restaurante.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#BD0A0A] flex items-center justify-center font-bold">2</div>
                            <div>
                                <h4 class="text-lg font-bold">Configuramos tu menú</h4>
                                <p class="text-sm text-gray-400">Subimos tus platillos y fotos a nuestra app.</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-[#BD0A0A] flex items-center justify-center font-bold">3</div>
                            <div>
                                <h4 class="text-lg font-bold">¡Recibe pedidos!</h4>
                                <p class="text-sm text-gray-400">Comienza a ganar dinero de inmediato.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: El Formulario Funcional -->
                <div class="w-full lg:w-7/12 p-8 lg:p-12 bg-white rounded-l-3xl lg:rounded-l-none lg:rounded-r-3xl">
                    
                    <!-- Mensaje de Éxito -->
                    <div v-if="showSuccess" class="h-full flex flex-col items-center justify-center text-center py-10 animate-fade-in">
                        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <i class="fas fa-check text-4xl text-green-500"></i>
                        </div>
                        <h3 class="text-3xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h3>
                        <p class="text-gray-600 text-lg">Gracias por confiar en FoodRush. Nuestro equipo revisará tu información y te contactaremos muy pronto.</p>
                        <button @click="showSuccess = false" class="mt-8 text-[#BD0A0A] font-semibold hover:underline">Enviar otra solicitud</button>
                    </div>

                    <!-- El Formulario -->
                    <form v-else @submit.prevent="submitAfiliacion" class="space-y-5 animate-fade-in">
                        <h3 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Formulario de Registro</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Nombre del Propietario</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-user text-gray-400"></i>
                                    </div>
                                    <input v-model="afiliateForm.nombreResponsable" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" placeholder="Ej. Juan Pérez" required>
                                </div>
                            </div>
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Nombre del Local / Franquicia</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-store text-gray-400"></i>
                                    </div>
                                    <input v-model="afiliateForm.nombreLocal" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" placeholder="Ej. Burger Palace" required>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-envelope text-gray-400"></i>
                                    </div>
                                    <input v-model="afiliateForm.email" type="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" placeholder="contacto@restaurante.com" required>
                                </div>
                            </div>
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Teléfono Móvil</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-phone text-gray-400"></i>
                                    </div>
                                    <input v-model="afiliateForm.telefono" type="tel" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" placeholder="+1 234 567 8900" required>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Ciudad de Operación</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-map-marker-alt text-gray-400"></i>
                                    </div>
                                    <input v-model="afiliateForm.ciudad" type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" placeholder="Tu ciudad" required>
                                </div>
                            </div>
                            <div>
                                <label class="block mb-1 text-sm font-medium text-gray-700">Especialidad (Tipo de comida)</label>
                                <div class="relative">
                                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <i class="fas fa-utensils text-gray-400"></i>
                                    </div>
                                    <select v-model="afiliateForm.tipoComida" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full pl-10 p-3 transition-colors" required>
                                        <option value="" disabled selected>Selecciona una opción</option>
                                        <option value="rapida">Comida Rápida / Hamburguesas</option>
                                        <option value="pizza">Pizzas e Italiano</option>
                                        <option value="sushi">Sushi / Asiática</option>
                                        <option value="saludable">Saludable / Vegana</option>
                                        <option value="postres">Postres / Panadería</option>
                                        <option value="otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center pt-2">
                            <input id="terminos" type="checkbox" required class="w-4 h-4 text-[#BD0A0A] bg-gray-100 border-gray-300 rounded focus:ring-[#BD0A0A] focus:ring-2">
                            <label for="terminos" class="ml-2 text-sm font-medium text-gray-600">Acepto los <a href="/terms" class="text-[#BD0A0A] hover:underline">términos y condiciones</a> de afiliación.</label>
                        </div>

                        <button type="submit" :disabled="isSubmitting" class="w-full text-white bg-[#BD0A0A] hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-bold rounded-xl text-lg px-5 py-4 text-center transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-red-500/30">
                            <span v-if="isSubmitting"><i class="fas fa-circle-notch fa-spin"></i> Procesando solicitud...</span>
                            <span v-else>Enviar Solicitud de Afiliación <i class="fas fa-paper-plane ml-1"></i></span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- MARCAS ALIADAS (Mantenido intacto como prueba social) -->
    <section id="marcas" class="py-20 bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <span class="text-[#BD0A0A] font-bold tracking-widest uppercase">Ellos ya confían en nosotros</span>
                <h2 class="text-4xl font-extrabold text-gray-900 mt-2">Top Franquicias</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="100">
                    <div class="h-40 bg-yellow-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="McDonalds">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">McDonald's</h3>
                        <p class="text-gray-500 text-sm">Integración exitosa con tiempos de entrega récord.</p>
                    </div>
                </div>
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="200">
                    <div class="h-40 bg-gray-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="KFC">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">KFC</h3>
                        <p class="text-gray-500 text-sm">Optimizando sus rutas mediante nuestra tecnología.</p>
                    </div>
                </div>
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="300">
                    <div class="h-40 bg-blue-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="BK">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">Burger King</h3>
                        <p class="text-gray-500 text-sm">Incremento del 30% en ventas a través del canal digital.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- MISION / VISION / OBJETIVO (Mantenido según instrucciones) -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-gray-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-[#BD0A0A]" data-aos="fade-up" data-aos-delay="100">
                    <div class="w-16 h-16 bg-red-100 text-[#BD0A0A] rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-[#BD0A0A] group-hover:text-white transition-colors">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Misión</h3>
                    <p class="text-gray-600">Revolucionar la entrega de comida rápida mediante una plataforma multi-inquilino eficiente.</p>
                </div>
                <div class="bg-gray-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-yellow-500" data-aos="fade-up" data-aos-delay="200">
                    <div class="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                        <i class="fas fa-eye"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Visión</h3>
                    <p class="text-gray-600">Ser el ecosistema digital estándar para franquicias en toda la región.</p>
                </div>
                <div class="bg-gray-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-slate-800" data-aos="fade-up" data-aos-delay="300">
                    <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Objetivo</h3>
                    <p class="text-gray-600">Reducir los tiempos de espera y optimizar la logística de última milla.</p>
                </div>
            </div>
        </div>
    </section>

   <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg">
                    <span class="text-[#BD0A0A] font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor tecnología de logística para tus franquicias favoritas.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex gap-16 text-sm text-left md:text-right">
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><router-link to="/support" class="hover:text-white hover:underline">Preguntas Frecuentes</router-link></li>
                        <li><router-link to="/support" class="hover:text-white hover:underline">Soporte</router-link></li>
                        <li><router-link to="/terms" class="hover:text-white hover:underline">Términos</router-link></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><router-link to="/about" class="hover:text-white hover:underline">Sobre Nosotros</router-link></li>
                        <li><a href="#" class="hover:text-white hover:underline">Blog</a></li>
                        <li><router-link to="/affiliate" class="hover:text-white hover:underline">Afíliate</router-link></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="border-t border-white/20 text-center py-4 text-xs text-white/60">
            &copy; 2026 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>

    <!-- MODAL DE LOGIN (Intacto) -->
    <div id="login-modal" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative p-4 w-full max-w-md max-h-full">
            <div class="relative bg-white rounded-2xl shadow dark:bg-gray-700">
                <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                        Bienvenido de nuevo
                    </h3>
                    <button type="button" class="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="login-modal">
                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <div class="p-4 md:p-5">
                    <form class="space-y-4" action="#">
                        <div>
                            <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tu email</label>
                            <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full p-2.5" placeholder="nombre@foodrush.com" required>
                        </div>
                        <div>
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                            <input type="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#BD0A0A] focus:border-[#BD0A0A] block w-full p-2.5" required>
                        </div>
                        <button type="submit" class="w-full text-white bg-[#BD0A0A] hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">Entrar a tu cuenta</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

</div>
</template>

<style>
        .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        
        #default-carousel {
            height: 100vh;
            width: 100%;
            position: relative;
            z-index: 0;
        }

        /* Animaciones para el Formulario y Fondo Decorativo */
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: blob 7s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s ease-out forwards;
        }
</style>