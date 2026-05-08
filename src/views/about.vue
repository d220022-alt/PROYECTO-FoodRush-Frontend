<!--
  Guia rápida para presentar:
  Vista de About. Agrupa pantalla, estado visual y acciones que ve el usuario en esa seccion.
  Buscar en VS Code: sobre nosotros, equipo, empresa, presentacion.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const currentYear = ref(new Date().getFullYear());
const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

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

const setupObserver = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1, // Reducido ligeramente para móviles
        rootMargin: "0px 0px -50px 0px"
    });

    document.querySelectorAll('.scroll-animate').forEach((el) => {
        observer.observe(el);
    });
};

onMounted(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    setTimeout(setupObserver, 200);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const teamMembers = [
    { name: "Rardiel", role: "Chief Architect, Backend & Multi-tenancy", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop", icon: "fa-server", social: "#" },
    { name: "Yirbert", role: "Head of Product, Frontend & Interface", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop", icon: "fa-code", social: "#" },
    { name: "Aysmar", role: "Director of Operations & Documentation", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop", icon: "fa-pen-nib", social: "#" }
];

const cultureValues = [
    { title: "Innovación Disruptiva", desc: "No nos conformamos con mejorar lo existente; reinventamos los procesos logísticos desde la raíz utilizando lógica avanzada.", icon: "fa-lightbulb", themeClasses: "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white" },
    { title: "Pasión por la Ejecución", desc: "La estrategia sin ejecución es alucinación. Nos obsesiona la rapidez y la precisión en cada pedido entregado.", icon: "fa-heart", themeClasses: "bg-red-50 text-red-700 group-hover:bg-red-600 group-hover:text-white" },
    { title: "Colaboración Radical", desc: "Nuestra plataforma es fuerte porque unifica. Fomentamos la sinergia entre franquicias, repartidores y clientes finales.", icon: "fa-users", themeClasses: "bg-yellow-50 text-yellow-800 group-hover:bg-yellow-500 group-hover:text-white" },
    { title: "Seguridad Militar", desc: "La integridad de los datos es innegociable. Implementamos cifrado punta a punta y aislamiento total de tenants.", icon: "fa-shield-alt", themeClasses: "bg-green-50 text-green-700 group-hover:bg-green-600 group-hover:text-white" }
];
</script>

<template>
<div class="font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen overflow-x-hidden">

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
                        'font-display text-xl font-extrabold tracking-wide transition-colors duration-300 md:text-2xl',
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
                aria-label="Abrir menú"
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

    <header class="relative h-screen flex items-center justify-center bg-cover bg-center overflow-hidden" style="background-image: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1920&auto=format&fit=crop');">
        <div class="absolute inset-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/40"></div>
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
        <div class="relative z-10 container mx-auto px-4 md:px-6 text-center text-white scroll-animate">
            <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-xs md:text-sm mb-4 md:mb-6 block">Infraestructura Logística Global</span>
            <h1 class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 md:mb-8 leading-tight md:leading-[0.95] font-display drop-shadow-2xl">
                Redefiniendo el <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#BD0A0A]">Ecosistema Gastronómico</span>
            </h1>
            <p class="text-lg md:text-2xl font-light text-gray-200 max-w-4xl mx-auto leading-relaxed md:leading-relaxed opacity-90 px-2">
                FoodRush opera en la intersección de la tecnología avanzada y la logística de última milla. Somos la columna vertebral digital para franquicias de alto rendimiento.
            </p>
        </div>
        <div class="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 text-white/50 text-3xl md:text-4xl animate-bounce">
            <i class="fa-solid fa-angle-down"></i>
        </div>
    </header>

    <section class="py-16 md:py-32 bg-white relative overflow-hidden">
        <div class="container mx-auto px-6 md:px-16 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
                <div class="lg:col-span-6 scroll-animate">
                    <span class="text-[#BD0A0A] font-bold tracking-widest uppercase text-sm">Visión Estratégica</span>
                    <h2 class="text-3xl md:text-5xl font-extrabold text-[#0f172a] mt-2 mb-6 md:mb-10 leading-tight">La Necesidad de un Nuevo Paradigma Operativo</h2>
                    <div class="space-y-4 md:space-y-6 text-gray-600 md:text-gray-700 text-base md:text-lg leading-relaxed">
                        <p>
                            En el panorama actual de la industria gastronómica, la digitalización no es opcional, es imperativa. Sin embargo, las soluciones existentes a menudo fragmentan la operación, elevando los costos de capital y diluyendo el control de la marca. Las franquicias exitosas requieren sistemas unificados que garanticen la consistencia operativa.
                        </p>
                        <p class="font-semibold text-[#0f172a] border-l-4 border-[#BD0A0A] pl-4 md:pl-0 md:border-0">
                            Nuestra misión fundamental es democratizar el acceso a infraestructuras tecnológicas de clase empresarial para el sector de comida rápida, permitiendo a los operadores centrarse en la excelencia del producto.
                        </p>
                        <p>
                            FoodRush no es simplemente una herramienta de software; es un socio estratégico diseñado para optimizar el rendimiento de los activos y maximizar el valor de vida del cliente a través de datos accionables e inteligencia predictiva. Abordamos los desafíos operativos con una mentalidad de 'plataforma como servicio', asegurando que cada 'tenant' reciba las actualizaciones automáticamente.
                        </p>
                    </div>
                </div>
                <div class="lg:col-span-6 relative scroll-animate mt-10 lg:mt-0" style="transition-delay: 0.2s;">
                    <div class="aspect-square bg-gray-100 rounded-3xl p-4 md:p-6 shadow-inner relative overflow-hidden group">
                        <img src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1200&auto=format&fit=crop" class="w-full h-full object-cover rounded-2xl transform group-hover:scale-110 transition-transform duration-700" alt="Gestión operativa moderna">
                        <div class="absolute inset-0 bg-[#0f172a]/60 flex items-end p-6 md:p-10 text-white md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <h4 class="text-2xl md:text-3xl font-bold font-display">Eficiencia Medible</h4>
                        </div>
                    </div>
                    <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=600&auto=format&fit=crop" class="absolute -bottom-8 -left-4 md:-bottom-16 md:-left-16 w-32 h-32 md:w-64 md:h-64 object-cover rounded-full border-4 md:border-8 border-white shadow-xl md:shadow-2xl scroll-animate" style="transition-delay: 0.4s" alt="Colaboración operativa">
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 md:py-32 bg-[#0f172a] text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        <div class="absolute top-0 left-0 w-full h-12 md:h-24 bg-white -skew-y-3 transform origin-top-left"></div>

        <div class="container mx-auto px-6 md:px-16 relative z-10 pt-10 md:pt-16">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
                <div class="lg:col-span-5 lg:sticky lg:top-32 scroll-animate">
                    <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-sm">Ingeniería de Plataforma</span>
                    <h2 class="text-4xl md:text-5xl font-extrabold mt-2 mb-6 md:mb-8 font-display leading-tight">Arquitectura <br class="hidden md:block">Multi-Tenant <br class="hidden md:block">Aislada</h2>
                    <p class="text-gray-300 text-base md:text-lg leading-relaxed mb-8 md:mb-10">
                        Nuestra arquitectura Multi-Tenant de núcleo compartido ofrece un rendimiento de clase empresarial con un aislamiento estricto. Cada franquicia opera en un entorno lógico independiente, garantizando la seguridad de los datos y la privacidad.
                    </p>
                    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop" class="hidden md:block rounded-3xl shadow-xl border border-white/10" alt="Hardware de servidor moderno">
                </div>

                <div class="lg:col-span-7 space-y-6 md:space-y-12 scroll-animate" style="transition-delay: 0.3s;">
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-database text-4xl md:text-5xl text-[#fbbf24] mb-6 block"></i>
                        <h4 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Aislamiento y Cifrado</h4>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                A diferencia de las implementaciones estándar, FoodRush utiliza capas de abstracción lógica de última generación para separar rigurosamente los datos de los inquilinos. Cada tenant tiene su propio espacio de claves de cifrado y esquemas de base de datos aislados.
                            </p>
                            <p>
                                Implementamos cifrado en reposo y en tránsito utilizando estándares de grado militar, asegurando el cumplimiento de las normativas de privacidad de datos más estrictas a nivel global.
                            </p>
                        </div>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-network-wired text-4xl md:text-5xl text-[#BD0A0A] mb-6 block"></i>
                        <h4 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Escalabilidad Horizontal</h4>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                Nuestra plataforma ha sido diseñada desde cero para responder automáticamente a las fluctuaciones de la demanda, aprovisionando recursos en tiempo real para garantizar un rendimiento óptimo durante las horas punta.
                            </p>
                        </div>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-chart-line text-4xl md:text-5xl text-[#42b883] mb-6 block"></i>
                        <h4 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Inteligencia Operativa</h4>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                Recopilamos telemetría operativa de extremo a extremo, proporcionando a los operadores una visibilidad sin precedentes del rendimiento de su negocio. Desde la latencia de cocina hasta la eficiencia de entrega.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="absolute bottom-0 left-0 w-full h-12 md:h-24 bg-white skew-y-3 transform origin-bottom-right"></div>
    </section>

    <section class="py-16 md:py-32 bg-white relative overflow-hidden">
        <div class="container mx-auto px-6 md:px-16 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div class="md:col-span-8 scroll-animate">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-[#0f172a] mb-6 md:mb-8">El Impacto en la Última Milla</h2>
                    <p class="text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mb-8 md:mb-12">
                        La eficiencia logística es el factor determinante del éxito en el sector de comida rápida. FoodRush optimiza radicalmente la logística de última milla a través de una integración vertical inteligente, permitiendo a las franquicias controlar cada aspecto de la experiencia del cliente final sin incurrir en altos costos.
                    </p>
                    <div class="grid grid-cols-2 gap-3 md:gap-6">
                        <img src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?q=80&w=400&auto=format&fit=crop" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Dashboard operativo">
                        <img src="https://images.unsplash.com/photo-1512132411229-c30391241dd8?q=80&w=400&auto=format&fit=crop" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Cocina eficiente">
                        <img src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=400&auto=format&fit=crop" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Repartidor en movimiento">
                        <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=400&auto=format&fit=crop" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Cliente satisfecho">
                    </div>
                </div>
                <div class="md:col-span-4 bg-[#F5F5F5] p-8 md:p-10 rounded-3xl border border-gray-100 flex flex-col justify-center scroll-animate mt-8 md:mt-0" style="transition-delay: 0.2s;">
                    <i class="fas fa-quote-left text-4xl md:text-5xl text-[#BD0A0A]/20 mb-6 md:mb-8"></i>
                    <p class="text-xl md:text-2xl font-light text-[#0f172a] leading-snug mb-6 md:mb-8">
                        "FoodRush no es solo software; es la ventaja competitiva que necesitábamos para escalar nuestra franquicia."
                    </p>
                    <div class="flex items-center gap-4">
                        <img src="https://randomuser.me/api/portraits/men/32.jpg" class="w-12 h-12 rounded-full border-2 border-[#BD0A0A]/30" alt="Testimonio de cliente">
                        <div>
                            <p class="font-bold text-[#0f172a]">Carlos Méndez</p>
                            <p class="text-sm text-gray-500">Propietario, 'El Sabor Local'</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-16 md:py-24 bg-[#F5F5F5]">
        <div class="container mx-auto px-6 md:px-16">
            <div class="text-center mb-12 md:mb-16 max-w-3xl mx-auto scroll-animate">
                <span class="text-[#BD0A0A] font-bold tracking-widest uppercase text-sm">ADN Organizacional</span>
                <h2 class="text-3xl md:text-5xl font-extrabold text-[#0f172a] mt-2 mb-4 md:mb-6 font-display">Los Pilares que Nos Impulsan</h2>
                <p class="text-gray-500 mt-4 text-lg md:text-xl px-4">Construimos un ecosistema basado en confianza, agilidad y resultados.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div v-for="(value, index) in cultureValues" :key="index"
                     class="bg-white p-6 md:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group border border-gray-100 scroll-animate"
                     :style="{ transitionDelay: `${0.1 * index}s` }">
                    <div :class="['w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 md:mb-8 transition-colors', value.themeClasses]">
                        <i :class="['fas text-2xl md:text-3xl', value.icon]"></i>
                    </div>
                    <h3 class="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-slate-800">{{ value.title }}</h3>
                    <p class="text-gray-600 text-sm md:text-base leading-relaxed">{{ value.desc }}</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-16 md:py-32 bg-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        <div class="container mx-auto px-6 md:px-16 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-start">
                <div class="lg:col-span-4 lg:sticky lg:top-32 scroll-animate text-center md:text-left">
                    <span class="text-[#BD0A0A] font-bold tracking-widest uppercase text-sm">Liderazgo</span>
                    <h2 class="text-3xl md:text-5xl font-extrabold text-[#0f172a] mt-2 mb-6 md:mb-8 leading-tight font-display">El Equipo Fundador</h2>
                    <p class="text-gray-600 text-base md:text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                        Combinamos experiencia en arquitectura de sistemas distribuidos, diseño de producto y operaciones logísticas para ofrecer una solución integral de clase mundial.
                    </p>
                </div>

                <div class="lg:col-span-8 space-y-8 md:space-y-12 scroll-animate mt-8 md:mt-0" style="transition-delay: 0.2s;">
                    <div v-for="(member, index) in teamMembers" :key="index" class="flex flex-col md:flex-row gap-6 md:gap-10 items-center bg-gray-50 p-6 md:p-10 rounded-3xl border border-gray-100 group shadow-sm hover:shadow-xl transition-all duration-300">
                        <div class="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative overflow-hidden rounded-full border-4 md:border-8 border-white shadow-xl">
                            <img :src="member.image" :alt="`Fotografía de ${member.name}`" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 md:grayscale group-hover:grayscale-0">
                        </div>
                        <div class="flex-grow text-center md:text-left">
                            <div class="flex flex-col md:flex-row items-center gap-3 md:gap-4 mb-4 justify-center md:justify-start">
                                <div class="hidden md:flex w-12 h-12 md:w-14 md:h-14 bg-[#BD0A0A] rounded-full items-center justify-center text-white border-4 border-white shadow-md">
                                    <i :class="`fas ${member.icon} text-xl`"></i>
                                </div>
                                <div>
                                    <h5 class="text-2xl md:text-3xl font-bold text-gray-900">{{ member.name }}</h5>
                                    <p class="text-[#BD0A0A] font-bold uppercase text-xs md:text-sm tracking-wider mt-1">{{ member.role }}</p>
                                </div>
                            </div>
                            <p class="text-gray-600 leading-relaxed text-sm md:text-base">
                                Dedicado a construir infraestructura tecnológica resiliente. En FoodRush, su objetivo es garantizar que la plataforma soporte la demanda de miles de transacciones por minuto sin latencia, manteniendo una experiencia perfecta para las franquicias.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-[#BD0A0A] text-white mt-auto border-t-4 border-[#fbbf24]">
        <div class="container mx-auto px-6 md:px-10 py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 text-center sm:text-left">
            <div class="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start">
                 <div class="flex items-center justify-center sm:justify-start gap-2 mb-6 bg-white w-fit px-4 py-1.5 rounded-full shadow-lg">
                    <span class="text-[#fbbf24] font-bold text-xl md:text-2xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-xl md:text-2xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/80 text-sm font-medium mb-6 max-w-xs">La mejor comida de tus franquicias directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-github"></i></a>
                </div>
            </div>

            <div class="col-span-1">
                <h5 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Plataforma</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><a href="#" class="hover:text-white transition">Funcionalidades Multi-tenant</a></li>
                    <li><a href="#" class="hover:text-white transition">Seguridad y Cumplimiento</a></li>
                    <li><a href="#" class="hover:text-white transition">Integraciones API</a></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h5 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Empresa</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><a href="#" class="hover:text-white transition">Nuestra Filosofía</a></li>
                    <li><a href="#" class="hover:text-white transition">El Equipo</a></li>
                    <li><a href="#" class="hover:text-white transition">Carreras</a></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h5 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Soporte</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><router-link to="/support" class="hover:text-white transition">Preguntas Frecuentes</router-link></li>
                    <li><router-link to="/terms" class="hover:text-white transition">Términos y Condiciones</router-link></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-white/10 bg-[#9B0808] py-4 text-center">
             <div class="text-xs text-white/60 font-medium px-4">
                &copy; {{ currentYear }} FoodRush Inc. Todos los derechos reservados.
            </div>
        </div>
    </footer>

</div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Titan+One&display=swap');

.font-sans { font-family: 'Nunito', sans-serif; }
.font-display { font-family: 'Titan One', cursive; }

@keyframes electric-blink {
    0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.7)); }
    50% { opacity: 0.8; filter: drop-shadow(0 0 8px rgba(189, 10, 10, 0.9)); }
}
.electric-blink { animation: electric-blink 3s infinite ease-in-out; }

.scroll-animate {
    opacity: 0;
    transform: translateY(40px) scale(0.98); /* Movimiento ligeramente reducido para móviles */
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
}

.scroll-animate.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
}
</style>
