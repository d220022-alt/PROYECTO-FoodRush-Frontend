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
            ? 'bg-[#1a1a2e] text-white shadow-lg shadow-slate-200/70'
            : 'bg-white/14 text-white ring-1 ring-white/20 backdrop-blur-md'
        : isSolid.value
            ? 'text-slate-700 hover:bg-slate-100 hover:text-[#1a1a2e]'
            : 'text-white/85 hover:bg-white/10 hover:text-white'
];

const mobileLinkClasses = (path) => [
    'rounded-2xl px-4 py-3 text-center text-sm font-semibold transition-all duration-300 ease-out',
    route.path === path
        ? 'bg-[#1a1a2e] text-white shadow-lg shadow-slate-200/70'
        : 'text-slate-700 hover:bg-slate-100 hover:text-[#1a1a2e]'
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

const scrollToOverview = () => {
    document.getElementById('vision-estrategica')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
    { name: "Rardiel", role: "Arquitectura, backend y multi-tenant", image: "/images/page-media/about-1.webp", icon: "fa-server", social: "#" },
    { name: "Yirbert", role: "Producto, frontend e interfaz", image: "/images/page-media/about-2.webp", icon: "fa-code", social: "#" },
    { name: "Aysmar", role: "Operaciones y documentación", image: "/images/page-media/about-3.webp", icon: "fa-pen-nib", social: "#" }
];

const cultureValues = [
    { title: "Innovación aplicada", desc: "Mejoramos los procesos de pedidos, carrito, checkout y seguimiento con soluciones claras y medibles.", icon: "fa-lightbulb", themeClasses: "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white" },
    { title: "Ejecución responsable", desc: "Priorizamos que cada flujo funcione de forma estable, rápida y comprensible para clientes, administradores y repartidores.", icon: "fa-heart", themeClasses: "bg-orange-50 text-orange-700 group-hover:bg-orange-500 group-hover:text-white" },
    { title: "Colaboración", desc: "El proyecto une franquicias, clientes, soporte y delivery en una experiencia coherente de principio a fin.", icon: "fa-users", themeClasses: "bg-yellow-50 text-yellow-800 group-hover:bg-yellow-500 group-hover:text-white" },
    { title: "Seguridad de datos", desc: "La información se maneja con autenticación, separación por tenant y validaciones acordes al alcance académico del proyecto.", icon: "fa-shield-alt", themeClasses: "bg-green-50 text-green-700 group-hover:bg-green-600 group-hover:text-white" }
];
</script>

<template>
<div class="about-page font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen overflow-x-hidden">

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
                        isSolid ? 'text-[#c2410c]' : 'text-[#fbbf24]',
                    ]"
                ></i>
                <span
                    :class="[
                        'font-display text-xl font-extrabold tracking-wide transition-colors duration-300 md:text-2xl',
                        isSolid ? 'text-slate-900' : 'text-white',
                    ]"
                >
                    FOOD<span :class="isSolid ? 'text-[#c2410c]' : 'text-[#fbbf24]'">RUSH</span>
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
                    class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a2e] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#111827]"
                    @click="goHome"
                >
                    <i class="fa-solid fa-house text-xs"></i>
                    Ir al menú principal
                </button>
            </div>
        </div>
    </nav>

    <header class="relative h-screen flex items-center justify-center bg-cover bg-center overflow-hidden" style="background-image: url('/images/page-media/about-4.webp');">
        <div class="absolute inset-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/40"></div>
        <div class="absolute inset-0 subtle-dot-pattern opacity-10"></div>
        <div class="relative z-10 container mx-auto px-4 md:px-6 text-center text-white scroll-animate">
            <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-xs md:text-sm mb-4 md:mb-6 block">Proyecto FoodRush</span>
            <h1 class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 md:mb-8 leading-tight md:leading-[0.95] font-display drop-shadow-2xl">
                Conoce <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#c2410c]">FoodRush</span>
            </h1>
            <p class="text-lg md:text-2xl font-light text-gray-200 max-w-4xl mx-auto leading-relaxed md:leading-relaxed opacity-90 px-2">
                FoodRush integra franquicias, clientes, administradores y repartidores en una plataforma clara para pedidos, pagos, seguimiento y soporte.
            </p>
        </div>
        <button type="button" class="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 text-white/70 text-3xl md:text-4xl animate-bounce transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 rounded-full p-2" aria-label="Ir a la información del proyecto" @click="scrollToOverview">
            <i class="fa-solid fa-angle-down"></i>
        </button>
    </header>

    <section id="vision-estrategica" class="py-16 md:py-32 bg-white relative overflow-hidden">
        <div class="container mx-auto px-6 md:px-16 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
                <div class="lg:col-span-6 scroll-animate">
                    <span class="text-[#c2410c] font-bold tracking-widest uppercase text-sm">Visión Estratégica</span>
                    <h2 class="text-3xl md:text-5xl font-extrabold text-[#0f172a] mt-2 mb-6 md:mb-10 leading-tight">Una operación de pedidos más clara y medible</h2>
                    <div class="space-y-4 md:space-y-6 text-gray-600 md:text-gray-700 text-base md:text-lg leading-relaxed">
                        <p>
                            En FoodRush organizamos en una sola experiencia lo que el usuario necesita para comprar: catálogo por franquicia, carrito, checkout, tracking y soporte. La idea es que cada pantalla tenga una función clara y pueda defenderse con evidencia real.
                        </p>
                        <p class="font-semibold text-[#0f172a] border-l-4 border-[#c2410c] pl-4 md:pl-0 md:border-0">
                            Nuestra meta es ofrecer una plataforma académica funcional, accesible y bien conectada con los flujos de backend y base de datos definidos para el proyecto.
                        </p>
                        <p>
                            El proyecto mantiene separación por franquicia, validaciones visibles, moneda consistente y rutas preparadas para revisar cliente, administración, delivery, soporte y seguimiento sin depender de explicaciones externas.
                        </p>
                    </div>
                </div>
                <div class="lg:col-span-6 relative scroll-animate mt-10 lg:mt-0" style="transition-delay: 0.2s;">
                    <div class="aspect-square bg-gray-100 rounded-3xl p-4 md:p-6 shadow-inner relative overflow-hidden group">
                        <img src="/images/page-media/about-5.webp" class="w-full h-full object-cover rounded-2xl transform group-hover:scale-110 transition-transform duration-700" alt="Gestión operativa moderna">
                        <div class="absolute inset-0 bg-[#0f172a]/60 flex items-end p-6 md:p-10 text-white md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <h3 class="text-2xl md:text-3xl font-bold font-display">Eficiencia Medible</h3>
                        </div>
                    </div>
                    <img src="/images/page-media/about-6.webp" class="absolute -bottom-8 -left-4 md:-bottom-16 md:-left-16 w-32 h-32 md:w-64 md:h-64 object-cover rounded-full border-4 md:border-8 border-white shadow-xl md:shadow-2xl scroll-animate" style="transition-delay: 0.4s" alt="Colaboración operativa">
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 md:py-32 bg-[#0f172a] text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 subtle-dot-pattern"></div>
        <div class="absolute top-0 left-0 w-full h-12 md:h-24 bg-white -skew-y-3 transform origin-top-left"></div>

        <div class="container mx-auto px-6 md:px-16 relative z-10 pt-10 md:pt-16">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
                <div class="lg:col-span-5 lg:sticky lg:top-32 scroll-animate">
                    <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-sm">Ingeniería de Plataforma</span>
                    <h2 class="text-4xl md:text-5xl font-extrabold mt-2 mb-6 md:mb-8 font-display leading-tight">Arquitectura <br class="hidden md:block">Multi-Tenant <br class="hidden md:block">Aislada</h2>
                    <p class="text-gray-300 text-base md:text-lg leading-relaxed mb-8 md:mb-10">
                        La plataforma usa una lógica multi-tenant para separar información y comportamiento por franquicia. Esto permite mostrar catálogos, pedidos y flujos administrativos de forma ordenada durante la revisión del proyecto.
                    </p>
                    <img src="/images/page-media/about-7.webp" class="hidden md:block rounded-3xl shadow-xl border border-white/10" alt="Hardware de servidor moderno">
                </div>

                <div class="lg:col-span-7 space-y-6 md:space-y-12 scroll-animate" style="transition-delay: 0.3s;">
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-database text-4xl md:text-5xl text-[#fbbf24] mb-6 block"></i>
                        <h3 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Aislamiento y Cifrado</h3>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                FoodRush separa los datos por tenant y aplica validaciones de acceso para que cada flujo consulte la información que le corresponde.
                            </p>
                            <p>
                                El proyecto evita exponer información sensible en el frontend y usa tokens/autenticación para los endpoints protegidos.
                            </p>
                        </div>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-network-wired text-4xl md:text-5xl text-[#c2410c] mb-6 block"></i>
                        <h3 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Escalabilidad Horizontal</h3>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                La interfaz está organizada para responder de forma estable en vistas de catálogo, carrito, checkout, tracking y administración.
                            </p>
                        </div>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl backdrop-blur-sm group hover:bg-white/10 transition">
                        <i class="fa-solid fa-chart-line text-4xl md:text-5xl text-[#42b883] mb-6 block"></i>
                        <h3 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-white">Inteligencia Operativa</h3>
                        <div class="text-gray-300 space-y-4 text-sm md:text-base leading-relaxed">
                            <p>
                                Las pantallas administrativas y de seguimiento muestran estados, totales y datos operativos suficientes para validar el flujo completo.
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
                        La eficiencia logística es importante, pero también lo es que el usuario entienda qué está pasando. FoodRush muestra estados claros del pedido, costos separados y acciones visibles para que la experiencia sea fácil de revisar.
                    </p>
                    <div class="grid grid-cols-2 gap-3 md:gap-6">
                        <img src="/images/page-media/about-8.webp" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Dashboard operativo">
                        <img src="/images/page-media/about-9.webp" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Cocina eficiente">
                        <img src="/images/page-media/about-10.webp" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Repartidor en movimiento">
                        <img src="/images/page-media/about-11.webp" class="w-full h-28 md:h-40 object-cover rounded-xl shadow-md" alt="Cliente satisfecho">
                    </div>
                </div>
                <div class="md:col-span-4 bg-[#F5F5F5] p-8 md:p-10 rounded-3xl border border-gray-100 flex flex-col justify-center scroll-animate mt-8 md:mt-0" style="transition-delay: 0.2s;">
                    <i class="fas fa-quote-left text-4xl md:text-5xl text-[#c2410c]/20 mb-6 md:mb-8"></i>
                    <p class="text-xl md:text-2xl font-light text-[#0f172a] leading-snug mb-6 md:mb-8">
                        "FoodRush nos permite mostrar el pedido, el pago y el seguimiento de una forma mucho más organizada."
                    </p>
                    <div class="flex items-center gap-4">
                        <img src="https://randomuser.me/api/portraits/men/32.jpg" class="w-12 h-12 rounded-full border-2 border-[#c2410c]/30" alt="Testimonio de cliente">
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
                <span class="text-[#c2410c] font-bold tracking-widest uppercase text-sm">ADN Organizacional</span>
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
        <div class="absolute inset-0 opacity-5 subtle-dot-pattern"></div>
        <div class="container mx-auto px-6 md:px-16 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-start">
                <div class="lg:col-span-4 lg:sticky lg:top-32 scroll-animate text-center md:text-left">
                    <span class="text-[#c2410c] font-bold tracking-widest uppercase text-sm">Liderazgo</span>
                    <h2 class="text-3xl md:text-5xl font-extrabold text-[#0f172a] mt-2 mb-6 md:mb-8 leading-tight font-display">El Equipo Fundador</h2>
                    <p class="text-gray-600 text-base md:text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                        Organizamos el trabajo entre backend, frontend, operaciones y documentación para que el proyecto pueda explicarse y probarse con claridad.
                    </p>
                </div>

                <div class="lg:col-span-8 space-y-8 md:space-y-12 scroll-animate mt-8 md:mt-0" style="transition-delay: 0.2s;">
                    <div v-for="(member, index) in teamMembers" :key="index" class="flex flex-col md:flex-row gap-6 md:gap-10 items-center bg-gray-50 p-6 md:p-10 rounded-3xl border border-gray-100 group shadow-sm hover:shadow-xl transition-all duration-300">
                        <div class="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 relative overflow-hidden rounded-full border-4 md:border-8 border-white shadow-xl">
                            <img :src="member.image" :alt="`Fotografía de ${member.name}`" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 md:grayscale group-hover:grayscale-0">
                        </div>
                        <div class="flex-grow text-center md:text-left">
                            <div class="flex flex-col md:flex-row items-center gap-3 md:gap-4 mb-4 justify-center md:justify-start">
                                <div class="hidden md:flex w-12 h-12 md:w-14 md:h-14 bg-[#1a1a2e] rounded-full items-center justify-center text-white border-4 border-white shadow-md">
                                    <i :class="`fas ${member.icon} text-xl`"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl md:text-3xl font-bold text-gray-900">{{ member.name }}</h3>
                                    <p class="text-[#c2410c] font-bold uppercase text-xs md:text-sm tracking-wider mt-1">{{ member.role }}</p>
                                </div>
                            </div>
                            <p class="text-gray-600 leading-relaxed text-sm md:text-base">
                                Aporta al desarrollo y revisión del flujo completo: datos, interfaz, navegación, pruebas y documentación. Su trabajo ayuda a que la aplicación se pueda demostrar sin pasos confusos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-[#1a1a2e] text-white mt-auto border-t-4 border-[#fbbf24]">
        <div class="container mx-auto px-6 md:px-10 py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 text-center sm:text-left">
            <div class="col-span-1 sm:col-span-2 md:col-span-1 flex flex-col items-center sm:items-start">
                 <div class="flex items-center justify-center sm:justify-start gap-2 mb-6 bg-white w-fit px-4 py-1.5 rounded-full shadow-lg">
                    <span class="text-[#c2410c] font-bold text-xl md:text-2xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-xl md:text-2xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/80 text-sm font-medium mb-6 max-w-xs">La mejor comida de tus franquicias directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" aria-label="Facebook de FoodRush" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#1a1a2e]"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" aria-label="Instagram de FoodRush" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#1a1a2e]"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" aria-label="GitHub de FoodRush" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#1a1a2e]"><i class="fa-brands fa-github"></i></a>
                </div>
            </div>

            <div class="col-span-1">
                <h3 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Plataforma</h3>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><a href="#" class="hover:text-white transition">Funcionalidades Multi-tenant</a></li>
                    <li><a href="#" class="hover:text-white transition">Seguridad y Cumplimiento</a></li>
                    <li><a href="#" class="hover:text-white transition">Integraciones API</a></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h3 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Empresa</h3>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><a href="#" class="hover:text-white transition">Nuestra Filosofía</a></li>
                    <li><a href="#" class="hover:text-white transition">El Equipo</a></li>
                    <li><a href="#" class="hover:text-white transition">Carreras</a></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h3 class="font-bold text-lg md:text-xl text-[#fbbf24] mb-4">Soporte</h3>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><router-link to="/support" class="hover:text-white transition">Preguntas Frecuentes</router-link></li>
                    <li><router-link to="/terms" class="hover:text-white transition">Términos y Condiciones</router-link></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-white/10 bg-[#111827] py-4 text-center">
             <div class="text-xs text-white/60 font-medium px-4">
                &copy; {{ currentYear }} FoodRush Inc. Todos los derechos reservados.
            </div>
        </div>
    </footer>

</div>
</template>

<style scoped>

.font-sans { font-family: 'Nunito', sans-serif; }
.font-display { font-family: 'Titan One', cursive; }

@keyframes electric-blink {
    0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.7)); }
    50% { opacity: 0.8; filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.55)); }
}
.electric-blink { animation: electric-blink 3s infinite ease-in-out; }

.subtle-dot-pattern {
    background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.85) 1px, transparent 0);
    background-size: 20px 20px;
}

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
