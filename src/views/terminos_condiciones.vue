<!--
  Guia rápida para presentar:
  Vista de Términos Condiciones. Agrupa pantalla, estado visual y acciones que ve el usuario en esa seccion.
  Buscar en VS Code: terminos, condiciones, registro, privacidad.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';

// Importación de FontAwesome (Asegúrate de tenerlo instalado)
import '@fortawesome/fontawesome-free/css/all.min.css';

const route = useRoute();
const router = useRouter();

// Estados originales de la página de términos
const currentSection = ref('intro');
const termsAccepted = ref(false);
const isLoggedIn = ref(false);

// ==========================================
// AÑADIDO: LÓGICA UNIFICADA DEL NAVBAR
// ==========================================
const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

// Configuración de los ítems de navegación (puedes ajustarlos)
const navItems = [
    { path: '/terms', label: 'Términos' },
    { path: '/support', label: 'Soporte' },
    { path: '/about', label: 'Nosotros' },
    { path: '/affiliate', label: 'Afíliate' },
];

const termsRoutePaths = ['/terms', '/terminos', '/terminos-condiciones', '/terms-and-conditions'];
const isNavActive = (path) => path === '/terms' ? termsRoutePaths.includes(route.path) : route.path === path;

const handleScroll = () => {
    // 1. Detección de scroll para el estilo del menú fixed
    isScrolled.value = window.scrollY > 110;

    // 2. Lógica original de Scroll Spy para el sidebar lateral
    const sectionElements = document.querySelectorAll('.section-target');
    let current = 'intro';

    sectionElements.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    currentSection.value = current;
    updateSidebarPosition();
};

// Determina si el menú debe tener fondo sólido o transparente
const isSolid = computed(() => isScrolled.value || isMobileMenuOpen.value);

// Clases dinámicas para los enlaces de escritorio
const desktopLinkClasses = (path) => [
    'rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out flex items-center gap-2',
    isNavActive(path)
        ? isSolid.value
            ? 'bg-[#1a1a2e] text-white shadow-lg shadow-slate-200/70'
            : 'bg-white/14 text-white ring-1 ring-white/20 backdrop-blur-md'
        : isSolid.value
            ? 'text-slate-700 hover:bg-slate-100 hover:text-[#1a1a2e]'
            : 'text-white/85 hover:bg-white/10 hover:text-white',
];

// Clases dinámicas para los enlaces móviles
const mobileLinkClasses = (path) => [
    'rounded-2xl px-4 py-3 text-center text-sm font-semibold transition-all duration-300 ease-out',
    isNavActive(path)
        ? 'bg-[#1a1a2e] text-white shadow-lg shadow-slate-200/70'
        : 'text-slate-700 hover:bg-slate-100 hover:text-[#1a1a2e]',
];

// Función de navegación con View Transitions API y cierre de menú móvil
const navigate = (path) => {
    // Si ya estamos en la ruta, solo cerramos el menú móvil
    if (route.path === path) {
        isMobileMenuOpen.value = false;
        return;
    }

    const go = () => router.push(path);

    // Intentar usar View Transitions API si está disponible
    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
        document.startViewTransition(go);
    } else {
        go();
    }

    // Cerrar el menú móvil después de navegar
    isMobileMenuOpen.value = false;
};

const goHome = () => navigate('/');
// ==========================================

const sections = [
    { id: 'intro', title: '1. Introducción' },
    { id: 'uso', title: '2. Uso de la Plataforma' },
    { id: 'cuentas', title: '3. Registro y Seguridad' },
    { id: 'pedidos', title: '4. Pedidos y Pagos' },
    { id: 'cancelaciones', title: '5. Política de Reembolso' },
    { id: 'propiedad', title: '6. Propiedad Intelectual' },
    { id: 'datos', title: '7. Protección de Datos' },
    { id: 'leyes', title: '8. Legislación Aplicable' },
    { id: 'responsabilidad', title: '9. Limitación de Responsabilidad' },
    { id: 'conducta', title: '10. Conducta del Usuario' },
    { id: 'modificaciones', title: '11. Modificaciones' },
    { id: 'contacto', title: '12. Contacto Legal' }
];

const activeSectionIndex = computed(() => {
    const index = sections.findIndex((section) => section.id === currentSection.value);
    return index >= 0 ? index : 0;
});

const activeSectionNumber = computed(() => String(activeSectionIndex.value + 1).padStart(2, '0'));

const getSectionLabel = (section) => section.title.replace(/^\d+\.\s*/, '');

const sidebarTopOffsetPx = computed(() => (isSolid.value ? 96 : 120));
const termsContentRef = ref(null);
const sidebarColumnRef = ref(null);
const sidebarPanelRef = ref(null);
const sidebarPanelStyles = ref({});
const sidebarColumnStyles = ref({});

const resetSidebarPosition = () => {
    sidebarPanelStyles.value = {};
    sidebarColumnStyles.value = {};
};

const updateSidebarPosition = () => {
    if (
        typeof window === 'undefined' ||
        !termsContentRef.value ||
        !sidebarColumnRef.value ||
        !sidebarPanelRef.value
    ) {
        return;
    }

    if (window.innerWidth < 1024) {
        resetSidebarPosition();
        return;
    }

    const panelHeight = sidebarPanelRef.value.offsetHeight;
    const contentRect = termsContentRef.value.getBoundingClientRect();
    const columnRect = sidebarColumnRef.value.getBoundingClientRect();
    const topOffset = sidebarTopOffsetPx.value;
    const stopPoint = contentRect.bottom - panelHeight;

    sidebarColumnStyles.value = { minHeight: `${panelHeight}px` };

    if (contentRect.top > topOffset) {
        sidebarPanelStyles.value = {};
        return;
    }

    if (stopPoint <= topOffset) {
        const bottomTop = Math.max(0, termsContentRef.value.offsetHeight - panelHeight);
        sidebarPanelStyles.value = {
            position: 'absolute',
            top: `${bottomTop}px`,
            left: '0',
            width: '100%',
        };
        return;
    }

    sidebarPanelStyles.value = {
        position: 'fixed',
        top: `${topOffset}px`,
        left: `${columnRect.left}px`,
        width: `${columnRect.width}px`,
    };
};

const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
        window.scrollTo({
            top: element.offsetTop - 120,
            behavior: 'smooth'
        });
        currentSection.value = id;
    }
};

const handleResize = () => {
    updateSidebarPosition();
};

const goBackWithCancel = () => {
    if (localStorage.getItem('register_draft')) {
        const draft = JSON.parse(localStorage.getItem('register_draft'));
        draft.termsChecked = false; // Always uncheck if they hit cancel
        localStorage.setItem('register_draft', JSON.stringify(draft));
        router.push('/login');
    } else {
        router.push('/');
    }
};

const acceptTerms = () => {
    if (!termsAccepted.value) {
        Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: 'Debes marcar la casilla para aceptar los términos y condiciones antes de continuar.'
        });
        return;
    }

    localStorage.setItem('terms_accepted', 'true');
    Swal.fire({
        icon: 'success',
        title: '¡Términos Aceptados!',
        text: 'Gracias por aceptar nuestros términos y condiciones.',
        timer: 2000,
        showConfirmButton: false
    }).then(() => {
        if (localStorage.getItem('register_draft')) {
            router.push('/login');
        } else {
            router.push('/');
        }
    });
};

onMounted(() => {
    handleScroll(); // Chequeo inicial
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.scrollTo(0, 0);

    // Check if user is logged in
    if (localStorage.getItem('auth_token')) {
        isLoggedIn.value = true;
        termsAccepted.value = true;
    } else {
        // Not logged in. Check for register draft preference OR absolute global preference
        const savedForm = localStorage.getItem('register_draft');
        if (savedForm) {
            try {
                const data = JSON.parse(savedForm);
                if (data.termsChecked) {
                    termsAccepted.value = true;
                }
            } catch (e) {}
        } else if (localStorage.getItem('terms_accepted') === 'true') {
            termsAccepted.value = true;
        }
    }

    requestAnimationFrame(() => {
        updateSidebarPosition();
    });
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
});
</script>

<template>
<div class="terms-page font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen overflow-x-hidden">

    <nav
        :class="[
            'fixed inset-x-0 top-0 z-50 border-b transition-all duration-500 ease-out',
            isSolid
                ? 'border-gray-200 bg-white/96 py-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl'
                : 'border-white/10 bg-[#0f172a]/86 py-4 shadow-2xl shadow-black/20 backdrop-blur-xl',
        ]"
    >
        <div class="mx-auto flex max-w-screen-2xl items-center justify-between px-4 md:px-12 lg:px-16">

                <a href="/" @click.prevent="goHome" class="flex items-center space-x-2 group z-50">
                <i :class="['fas fa-bolt text-2xl transition-all duration-300 ease-out group-hover:scale-110 animate-pulse',
                             isSolid ? 'text-[#f97316]' : 'text-[#fbbf24]']"></i>

                <span :class="['text-xl md:text-2xl font-extrabold tracking-wide transition-colors duration-300 font-display drop-shadow-sm',
                                isSolid ? 'text-slate-900' : 'text-white']">
                    FOOD<span :class="isSolid ? 'text-[#f97316]' : 'text-[#fbbf24]'">RUSH</span>
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
                    <i v-if="item.path === '/terms' && isNavActive(item.path)" class="fas fa-file-contract text-xs"></i>
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
                class="z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-2xl transition-all duration-300 md:hidden focus:outline-none"
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
            <div class="mx-auto flex max-w-screen-2xl flex-col gap-3 px-6 py-5">
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
                    class="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1a2e] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#111827] w-full"
                    @click="goHome"
                >
                    <i class="fa-solid fa-house text-xs"></i>
                    Ir al menú principal
                </button>
            </div>
        </div>
    </nav>
    <div class="bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1a1a2e] text-white pt-[164px] md:pt-[188px] pb-24 md:pb-28 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%)]"></div>
        <i class="fas fa-balance-scale absolute top-10 left-10 text-9xl opacity-10 rotate-12"></i>
        <div class="container mx-auto px-4 relative z-10" data-aos="fade-up">
            <h1 class="text-4xl md:text-6xl font-extrabold mb-5 border-none font-display drop-shadow-sm">Términos y Condiciones</h1>
            <p class="text-white/80 text-lg max-w-2xl mx-auto">Marco legal y políticas de uso de la plataforma FoodRush.</p>
            <p class="text-xs mt-4 text-white/60">Actualizado: Febrero 2026</p>
        </div>
    </div>

    <div class="container mx-auto px-4 py-16 lg:py-20">
        <div ref="termsContentRef" class="flex flex-col gap-12 lg:flex-row">

            <div
                ref="sidebarColumnRef"
                class="hidden w-full lg:relative lg:block lg:w-[22rem] lg:flex-none"
                :style="sidebarColumnStyles"
            >
                <div
                    ref="sidebarPanelRef"
                    class="sticky-sidebar bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                    :style="sidebarPanelStyles"
                >
                    <div class="mb-5 rounded-2xl bg-[#0f172a] px-4 py-4 text-white shadow-lg">
                        <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">Seccion actual</p>
                        <div class="mt-3 flex items-end justify-between gap-3">
                            <span class="text-4xl font-black leading-none text-[#fbbf24]">{{ activeSectionNumber }}</span>
                            <span class="text-right text-sm font-medium leading-tight text-white/80">
                                {{ getSectionLabel(sections[activeSectionIndex]) }}
                            </span>
                        </div>
                    </div>
                    <h3 class="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider border-b pb-2">Tabla de Contenido</h3>
                    <ul class="space-y-1 text-sm text-gray-600">
                        <li v-for="(section, index) in sections" :key="section.id">
                            <a :href="`#${section.id}`" @click.prevent="scrollToSection(section.id)"
                               class="term-link"
                               :class="{ 'active': currentSection === section.id }">
                                <span class="term-link__number">{{ String(index + 1).padStart(2, '0') }}</span>
                                <span class="term-link__text">{{ getSectionLabel(section) }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="w-full lg:flex-1 lg:min-w-0">
                <div class="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-16">

                    <div id="intro" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">1</span>
                            Introducción
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Bienvenido a <strong>FoodRush</strong>. Estos términos y condiciones constituyen un acuerdo legalmente vinculante entre usted (el "Usuario") y FoodRush Inc. Al descargar, acceder o utilizar nuestra aplicación móvil o sitio web, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
                        </p>
                    </div>

                    <div id="uso" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">2</span>
                            Uso de la Plataforma Multi-Tenant
                        </h2>
                        <p class="text-gray-600 leading-relaxed mb-4">
                            FoodRush opera bajo un modelo de arquitectura de software <strong>Multi-Tenant (Multi-inquilino)</strong>. Esto implica que:
                        </p>
                        <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4">
                            <li>Actuamos como intermediarios tecnológicos entre usted y las franquicias afiliadas (KFC, McDonald's, Burger King, etc.).</li>
                            <li>Cada franquicia ("Inquilino") es responsable de la gestión de su inventario, precios y preparación de alimentos.</li>
                            <li>FoodRush facilita la plataforma tecnológica y, en algunos casos, la logística de entrega de última milla.</li>
                        </ul>
                    </div>

                    <div id="cuentas" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">3</span>
                            Registro y Seguridad de la Cuenta
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Para utilizar el servicio, debe ser mayor de 13 años. Usted es responsable de salvaguardar la contraseña que utiliza para acceder al servicio y de cualquier actividad o acción bajo su contraseña. FoodRush se reserva el derecho de suspender cuentas que presenten actividad sospechosa, fraudulenta o que violen nuestras normas comunitarias.
                        </p>
                    </div>

                    <div id="pedidos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">4</span>
                            Pedidos y Pagos
                        </h2>
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r">
                            <p class="text-sm text-blue-700"><strong>Nota Fiscal:</strong> Todos los precios mostrados incluyen el ITBIS (Impuesto sobre Transferencia de Bienes Industrializados y Servicios) conforme a las leyes tributarias de la República Dominicana.</p>
                        </div>
                        <p class="text-gray-600 leading-relaxed">
                            Los precios de los productos y los gastos de envío están sujetos a cambios en cualquier momento. El contrato de venta se formaliza cuando la franquicia confirma su pedido. FoodRush procesa los pagos a través de pasarelas seguras (Azul, PayPal, Stripe).
                        </p>
                    </div>

                    <div id="cancelaciones" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">5</span>
                            Política de Reembolso y Cancelación
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El usuario puede cancelar un pedido sin penalización si el estado es "Pendiente". Una vez el estado cambia a "En Preparación", no se aceptan cancelaciones. Los reembolsos por pedidos incorrectos o en mal estado se procesarán tras una investigación, acreditándose a la forma de pago original en un plazo de 3-5 días hábiles.
                        </p>
                    </div>

                    <div id="propiedad" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">6</span>
                            Propiedad Intelectual
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El servicio y su contenido original (excluyendo el contenido proporcionado por las franquicias), características y funcionalidad son y seguirán siendo propiedad exclusiva de FoodRush Inc. y sus licenciantes. El nombre "FoodRush" y el logotipo están protegidos por derechos de autor y marcas registradas.
                        </p>
                    </div>

                    <div id="datos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">7</span>
                            Protección de Datos (Ley 172-13)
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En cumplimiento con la <strong>Ley No. 172-13</strong> sobre Protección de Datos de Carácter Personal de la República Dominicana, FoodRush garantiza que sus datos personales serán tratados con estricta confidencialidad y solo para los fines de la prestación del servicio. No vendemos sus datos a terceros.
                        </p>
                    </div>

                    <div id="leyes" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">8</span>
                            Legislación Aplicable y Jurisdicción
                        </h2>
                        <p class="text-gray-600 leading-relaxed mb-4">
                            Estos Términos se regirán e interpretarán de acuerdo con las leyes de la <strong>República Dominicana</strong>, sin tener en cuenta sus disposiciones sobre conflictos de leyes.
                        </p>
                        <p class="text-gray-600 leading-relaxed">
                            Cualquier disputa relacionada con estos términos será sometida a la jurisdicción exclusiva de los tribunales de <strong>Santiago de los Caballeros</strong>. Asimismo, reconocemos la autoridad del Instituto Nacional de Protección de los Derechos del Consumidor (Pro-Consumidor) bajo la <strong>Ley 358-05</strong>.
                        </p>
                    </div>

                    <div id="responsabilidad" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">9</span>
                            Limitación de Responsabilidad
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En ningún caso FoodRush, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de su acceso o uso del servicio.
                        </p>
                    </div>

                    <div id="conducta" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">10</span>
                            Conducta del Usuario
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El usuario se compromete a no utilizar la plataforma para:
                        </p>
                        <ul class="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
                            <li>Realizar pedidos falsos o fraudulentos.</li>
                            <li>Introducir virus, troyanos u otro material malicioso.</li>
                            <li>Acosar o intimidar a los repartidores o personal de soporte.</li>
                            <li>Intentar acceder sin autorización a los sistemas de FoodRush.</li>
                        </ul>
                    </div>

                    <div id="modificaciones" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">11</span>
                            Modificaciones a los Términos
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.
                        </p>
                    </div>

                    <div id="contacto" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#f97316] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">12</span>
                            Contacto Legal
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Si tiene alguna pregunta sobre estos Términos, o desea ejercer sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), por favor contáctenos:
                        </p>
                        <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-8">
                            <p><strong>Email Legal:</strong> legal@foodrush.com</p>
                            <p><strong>Dirección:</strong> Av. 27 de Febrero, Santiago, República Dominicana.</p>
                        </div>
                    </div>

                    <div class="bg-white border-t border-gray-200 pt-8 mt-8 pb-4" data-aos="fade-up">
                        <div class="flex items-center space-x-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <input id="accept-terms" type="checkbox" v-model="termsAccepted" :disabled="isLoggedIn" class="w-5 h-5 text-[#f97316] bg-white border-gray-300 rounded focus:ring-[#f97316] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <label for="accept-terms" class="text-gray-700 font-medium" :class="{ 'cursor-pointer': !isLoggedIn, 'cursor-not-allowed opacity-70': isLoggedIn }">
                                He leído, entiendo y acepto por completo los términos y condiciones de FoodRush.
                            </label>
                        </div>

                        <div class="flex justify-end gap-4">
                            <button @click="goBackWithCancel" class="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                                {{ isLoggedIn ? 'Volver' : 'Cancelar' }}
                            </button>
                            <button v-if="!isLoggedIn" @click="acceptTerms"
                                    :class="termsAccepted ? 'bg-[#0f172a] hover:bg-black text-white shadow-lg shadow-slate-900/20' : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
                                    class="px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                                <i class="fa-solid fa-check" v-if="termsAccepted"></i>
                                Confirmar y Aceptar
                            </button>
                            <button v-else disabled
                                    class="bg-gray-300 text-gray-500 cursor-not-allowed px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                                <i class="fa-solid fa-check"></i>
                                Términos Aceptados
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <footer class="bg-[#1a1a2e] text-white mt-auto border-t-4 border-[#fbbf24]">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0 flex flex-col items-center md:items-start">
                 <div class="terms-footer-logo flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg mx-auto md:mx-0">
                    <span class="text-orange-500 font-bold text-xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs text-center md:text-left">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <span class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><i class="fa-brands fa-facebook-f"></i></span>
                    <span class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><i class="fa-brands fa-instagram"></i></span>
                    <span class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"><i class="fa-brands fa-twitter"></i></span>
                </div>
            </div>
            <div class="flex gap-16 text-sm text-left md:text-right mx-auto md:mx-0 mt-8 md:mt-0">
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
                        <li><router-link to="/about" class="hover:text-white hover:underline">Equipo FoodRush</router-link></li>
                        <li><router-link to="/affiliate" class="hover:text-white hover:underline">Afíliate</router-link></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="border-t border-white/20 text-center py-4 text-xs text-white/60">
            &copy; 2026 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>

</div>
</template>

<style scoped>
/* Importación de fuentes necesarias para el Navbar y estilos generales */

html { scroll-behavior: smooth; }

/* Ajuste para que los anchors no queden tapados por el menú fixed */
.section-target {
    scroll-margin-top: 140px;
}

/* Estilos originales del sidebar */
.sticky-sidebar {
    position: relative;
}

.term-link.active {
    color: #1a1a2e;
    font-weight: 700;
    background: rgba(249, 115, 22, 0.08);
    border-color: rgba(249, 115, 22, 0.22);
}
.term-link {
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    border-radius: 14px;
    border: 1px solid transparent;
}
.term-link:hover {
    color: #1a1a2e;
    background: rgba(249, 115, 22, 0.08);
    border-color: rgba(249, 115, 22, 0.18);
}

.term-link__number {
    display: inline-flex;
    min-width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    font-size: 0.75rem;
    font-weight: 800;
    line-height: 1;
    transition: all 0.3s ease;
}

.term-link__text {
    flex: 1;
    line-height: 1.35;
}

.term-link.active .term-link__number {
    background: #1a1a2e;
    border-color: #1a1a2e;
    color: #fff;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
}

/* Clase añadida para la tipografía del Logo en el Navbar fixed */
.font-display { font-family: 'Titan One', cursive; }

/* Animación de parpadeo (Pulse) definida explícitamente si Tailwind no la carga */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
