<!--
  Guia rapida para presentar:
  Vista de Support. Agrupa pantalla, estado visual y acciones que ve el usuario en esa seccion.
  Buscar en VS Code: soporte, preguntas frecuentes, ticket, asistente, buildSupportReply.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import Swal from 'sweetalert2';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const currentYear = ref(new Date().getFullYear());
const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

const navItems = [
    { path: '/terms', label: 'Terminos' },
    { path: '/support', label: 'Soporte' },
    { path: '/about', label: 'Nosotros' },
    { path: '/affiliate', label: 'Afiliate' }
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
        threshold: 0.1,
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

// ==========================================
// 1. PREGUNTAS FRECUENTES (Textos expandidos)
// ==========================================
const faqs = ref([
    { 
        question: "¿Cómo puedo rastrear mi pedido en tiempo real?", 
        answer: "Nuestro sistema cuenta con telemetría en tiempo real. Dirígete a la sección 'Historial de Pedidos' en tu perfil, selecciona el pedido en curso y podrás visualizar en el mapa la ubicación exacta del repartidor, así como el tiempo estimado de llegada.", 
        open: false 
    },
    { 
        question: "¿Bajo qué condiciones puedo cancelar una orden?", 
        answer: "Para garantizar la eficiencia logística de nuestros restaurantes asociados, las cancelaciones solo son permitidas dentro de los primeros minutos, estrictamente antes de que el restaurante acepte y comience a preparar los alimentos. Puedes hacerlo desde los detalles del pedido.", 
        open: false 
    },
    { 
        question: "¿Qué pasarelas y métodos de pago procesan?", 
        answer: "Nuestra infraestructura de pagos es 100% segura. Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, AMEX) procesadas mediante pasarelas cifradas, billeteras digitales como PayPal, y ofrecemos la opción tradicional de pago en efectivo contra entrega.", 
        open: false 
    },
    { 
        question: "¿Cómo procedo si mi pedido llega incompleto o incorrecto?", 
        answer: "Tu satisfacción es nuestra prioridad. Por favor, utiliza el botón 'Crear Ticket' en esta misma pantalla. Adjunta una fotografía del pedido recibido y nuestro equipo de resolución prioritaria (Tier 2) procesará un reembolso o reposición inmediata.", 
        open: false 
    }
]);

const toggleFaq = (idx) => {
    faqs.value[idx].open = !faqs.value[idx].open;
};

// ==========================================
// 2. FORMULARIO RÁPIDO
// ==========================================
const simpleMessage = ref("");

const sendSimpleMessage = () => {
    if(!simpleMessage.value) return;
    Swal.fire({
        icon: 'success',
        title: 'Mensaje Recibido',
        text: 'Nuestros agentes han recibido tu consulta. Nos pondremos en contacto contigo a la brevedad.',
        timer: 3000,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: { popup: 'rounded-3xl shadow-2xl' }
    });
    simpleMessage.value = "";
};

// ==========================================
// 3. TICKET MODAL 
// ==========================================
const isTicketModalOpen = ref(false);
const isUserLoggedIn = ref(false);

const ticketForm = ref({ name: '', email: '', subject: 'Reportar incidencia con pedido', message: '' });

const openTicketModal = () => {
    const storedName = localStorage.getItem('user_name');
    const storedEmail = localStorage.getItem('user_email');

    if (storedName || storedEmail) {
        isUserLoggedIn.value = true;
        ticketForm.value.name = storedName || '';
        ticketForm.value.email = storedEmail || '';
    } else {
        isUserLoggedIn.value = false;
        ticketForm.value.name = '';
        ticketForm.value.email = '';
    }
    isTicketModalOpen.value = true;
};

// Para presentar: flujo de ticket; valida datos, simula envio y deja confirmacion al usuario.
const submitTicket = () => {
    isTicketModalOpen.value = false;
    Swal.fire({
        icon: 'success',
        title: '¡Ticket Generado!',
        text: 'Tu código de seguimiento es #FR-' + Math.floor(Math.random() * 10000) + '. Un especialista lo está revisando.',
        confirmButtonColor: '#BD0A0A',
        customClass: { popup: 'rounded-3xl shadow-2xl', confirmButton: 'rounded-xl px-6 py-3 font-bold' }
    });
    ticketForm.value.message = '';
    ticketForm.value.subject = 'Reportar incidencia con pedido';
};

// ==========================================
// 4. ASISTENTE DE SOPORTE
// ==========================================
const isChatOpen = ref(false);
const chatInput = ref('');
const chatContainer = ref(null);
const isBotTyping = ref(false);

const chatMessages = ref([
    { text: 'Hola. Soy el Asistente FoodRush y puedo orientarte con pedidos, restaurantes, pagos y tiempos de entrega. ¿Qué necesitas revisar?', sender: 'bot' }
]);

const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline font-bold hover:text-blue-800">$1</a>');
    return formatted;
};

const sendChatMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    chatMessages.value.push({ text, sender: 'user' });
    chatInput.value = '';
    scrollToBottom();

    isBotTyping.value = true;
    scrollToBottom();

    const response = await buildSupportReply(text);
    
    isBotTyping.value = false;
    chatMessages.value.push({ text: response, sender: 'bot' });
    scrollToBottom();
};

// Respuestas locales del chat de soporte. No depende de servicios externos: solo orienta y manda a rutas internas.
// Para presentar: respuesta del asistente de soporte con reglas locales, sin depender de servicios externos.
const buildSupportReply = async (userMessage) => {
    const lowerInput = userMessage.toLowerCase();

    if (/(mac|mc|mak)\s*(donal|donald|donalz)/i.test(lowerInput)) return "McDonald's está disponible en FoodRush. Puedes revisar su menú aquí: [Menú McDonald's](/franchise/mcdonalds).";
    if (/(buerger|burgel|burger)\s*(kin|king)/i.test(lowerInput)) return "Burger King está en la sección de franquicias. Entra desde aquí: [Pedir Burger King](/franchise/burger-king).";
    if (/(pisa|pizza|piza)\s*(hut|hut|jot)/i.test(lowerInput)) return "Pizza Hut está lista para pedir desde FoodRush: [Pedir Pizza Hut](/franchise/pizza-hut).";
    if (/(pollo|kfc|kefc|kefec)/i.test(lowerInput)) return "Para pollo frito, puedes abrir el menú de KFC aquí: [Pedir KFC](/franchise/kfc).";
    if (/(starbuck|cafe|estarbu|estarvuc)/i.test(lowerInput)) return "Si quieres café o bebidas, revisa Starbucks aquí: [Ir a Starbucks](/franchise/starbucks).";
    if (/(pedido|orden|rastrear|llega|tiempo)/i.test(lowerInput)) return "El tiempo promedio de entrega es de 30 a 45 minutos. Entra a Mis Pedidos para abrir el seguimiento del pedido activo.";

    const fallbacks = [
        `Entiendo tu consulta sobre "${userMessage}". Para resolverla más rápido, revisa las preguntas frecuentes o genera un ticket desde esta misma pantalla.`,
        `Sobre "${userMessage}", lo más recomendable es abrir un ticket si se trata de un pedido, cobro o incidencia técnica.`,
        `Puedo ayudarte con pedidos, restaurantes, pagos y tiempos de entrega. Si tu caso requiere revisión humana, usa el formulario de ticket.`,
        `Para "${userMessage}", puedes escribir más detalles en la consulta general o contactar al soporte por WhatsApp.`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};
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
                    Menu
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
                    Ir al menu principal
                </button>
            </div>
        </div>
    </nav>

    <header class="relative h-[65vh] flex items-center justify-center bg-cover bg-center overflow-hidden" style="background-image: url('https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1469&auto=format&fit=crop');">
        <div class="absolute inset-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/20"></div>
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
        <div class="relative z-10 container mx-auto px-6 text-center text-white scroll-animate">
            <div class="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#fbbf24] text-xs font-bold tracking-widest uppercase mb-6">
                <i class="fas fa-headset mr-2"></i> Centro de Operaciones y Ayuda
            </div>
            <h1 class="text-5xl md:text-7xl font-extrabold mb-8 leading-tight font-display drop-shadow-2xl">
                ¿En qué podemos <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#BD0A0A]">ayudarte hoy?</span>
            </h1>
            
            <div class="relative max-w-2xl mx-auto shadow-2xl rounded-full transform transition-transform hover:scale-[1.02]">
                <div class="absolute inset-y-0 left-0 flex items-center pl-6 text-gray-400">
                    <i class="fas fa-search text-xl"></i>
                </div>
                <input type="text" class="block w-full p-5 pl-14 text-base md:text-lg text-gray-900 border-none rounded-full bg-white outline-none focus:ring-4 focus:ring-[#BD0A0A]/40 transition" placeholder="Buscar 'cancelar orden', 'retraso'...">
                <button class="absolute right-2 top-2 bottom-2 bg-[#BD0A0A] hover:bg-red-800 text-white font-bold rounded-full px-8 transition-all shadow-md">Buscar</button>
            </div>
        </div>
    </header>

    <section class="container mx-auto px-6 -mt-20 relative z-20 mb-24">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            <div @click="isChatOpen = true" class="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl hover:-translate-y-3 transition-all duration-300 border border-white cursor-pointer group">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm">
                    <i class="fas fa-headset"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-slate-800">Asistente FoodRush</h3>
                <p class="text-gray-500 text-base mb-6 leading-relaxed">Respuestas rápidas para dudas sobre pedidos, pagos, tiempos de entrega o restaurantes disponibles.</p>
                <span class="text-blue-600 font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-wider">Interactuar <i class="fas fa-arrow-right"></i></span>
            </div>

            <div @click="openTicketModal" class="bg-white p-10 rounded-3xl shadow-2xl hover:-translate-y-3 transition-all duration-300 border-t-8 border-[#BD0A0A] cursor-pointer group relative overflow-hidden">
                <div class="absolute -right-6 -top-6 text-[#BD0A0A]/5 text-9xl"><i class="fas fa-ticket-alt"></i></div>
                <div class="w-16 h-16 bg-red-50 text-[#BD0A0A] group-hover:bg-[#BD0A0A] group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm relative z-10">
                    <i class="fas fa-envelope-open-text"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-slate-800 relative z-10">Generar Ticket</h3>
                <p class="text-gray-500 text-base mb-6 leading-relaxed relative z-10">Escalamiento oficial para incidencias técnicas, disputas de cobros o reclamos sobre un pedido.</p>
                <span class="text-[#BD0A0A] font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-wider relative z-10">Formulario <i class="fas fa-arrow-right"></i></span>
            </div>

            <a href="https://wa.me/18493504608?text=Hola%20FoodRush,%20tengo%20una%20consulta." target="_blank" class="bg-white/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl hover:-translate-y-3 transition-all duration-300 border border-white group block">
                <div class="w-16 h-16 bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm">
                    <i class="fab fa-whatsapp"></i>
                </div>
                <h3 class="text-2xl font-bold mb-3 text-slate-800">Soporte WhatsApp</h3>
                <p class="text-gray-500 text-base mb-6 leading-relaxed">Conéctate directamente con nuestro equipo de operaciones para soporte humano en tiempo real.</p>
                <span class="text-green-600 font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all uppercase tracking-wider">Chatear <i class="fas fa-external-link-alt"></i></span>
            </a>
        </div>
    </section>

    <section class="py-16 bg-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-1/2 h-full bg-gray-50 -skew-x-12 transform origin-top right-[-10%] z-0"></div>
        <div class="container mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10 scroll-animate">
            
            <div class="lg:col-span-7">
                <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-sm mb-2 block">Base de Conocimientos</span>
                <h2 class="text-4xl md:text-5xl font-extrabold text-[#0f172a] mb-10 font-display">Preguntas Frecuentes</h2>
                <div class="space-y-5">
                    <div v-for="(faq, idx) in faqs" :key="idx" class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-300 group">
                        <button @click="toggleFaq(idx)" class="w-full flex justify-between items-center text-left outline-none">
                            <span class="font-bold text-lg text-slate-800 pr-4">{{ faq.question }}</span>
                            <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#BD0A0A] group-hover:text-white transition-colors">
                                <i class="fa-solid fa-chevron-down text-sm transition-transform duration-300" :class="{'rotate-180': faq.open}"></i>
                            </div>
                        </button>
                        <div v-show="faq.open" class="mt-5 text-base text-gray-600 border-t border-gray-100 pt-5 leading-relaxed">
                            {{ faq.answer }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-5 relative mt-10 lg:mt-0">
                <div class="bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-gray-100 sticky top-32">
                    <div class="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center mb-6 text-white text-2xl shadow-lg">
                        <i class="fa-solid fa-paper-plane"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-800 mb-4">¿Aún con dudas?</h2>
                    <p class="text-base text-gray-500 mb-8 leading-relaxed">Si nuestra base de conocimientos no resolvió tu inquietud, déjanos un mensaje rápido. Nuestro equipo lo enrutará al departamento correspondiente.</p>
                    
                    <textarea v-model="simpleMessage" rows="5" placeholder="Escribe los detalles de tu consulta aquí..." class="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 text-base outline-none focus:border-[#BD0A0A] focus:ring-4 focus:ring-[#BD0A0A]/10 transition resize-none mb-6"></textarea>
                    
                    <button @click="sendSimpleMessage" class="w-full bg-[#0f172a] hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl transition transform hover:-translate-y-1 flex items-center justify-center gap-3">
                        Enviar Consulta General <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </section>

    <div v-if="isTicketModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/80 backdrop-blur-md px-4">
        <div class="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all fade-in-up">
            <div class="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 bg-gray-50/50">
                <div>
                    <h3 class="text-2xl font-extrabold text-gray-900 font-display">Portal de Escalamiento</h3>
                    <p class="text-sm text-gray-500 mt-1">Generación de ticket oficial de soporte</p>
                </div>
                <button @click="isTicketModalOpen = false" class="text-gray-400 hover:text-white bg-gray-200 hover:bg-[#BD0A0A] rounded-full w-10 h-10 flex justify-center items-center transition shadow-sm">
                    <i class="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>
            
            <form @submit.prevent="submitTicket" class="p-6 md:p-8">
                <div v-if="isUserLoggedIn" class="mb-6 text-sm text-blue-700 bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                    <i class="fa-solid fa-circle-check mt-1 text-lg"></i> 
                    <p>Hemos autocompletado tus datos basados en tu sesión activa. Puedes modificarlos si el reporte corresponde a otra cuenta o franquicia.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nombre Completo</label>
                        <input v-model="ticketForm.name" type="text" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#BD0A0A] focus:ring-4 focus:ring-[#BD0A0A]/10 transition" placeholder="Tu nombre" required>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Correo Electrónico</label>
                        <input v-model="ticketForm.email" type="email" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#BD0A0A] focus:ring-4 focus:ring-[#BD0A0A]/10 transition" placeholder="correo@ejemplo.com" required>
                    </div>
                </div>
                <div class="mb-6">
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Categoría del Incidente</label>
                    <select v-model="ticketForm.subject" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#BD0A0A] focus:ring-4 focus:ring-[#BD0A0A]/10 transition font-medium appearance-none">
                        <option>Reportar incidencia con pedido</option>
                        <option>Problemas de facturación / Cobros</option>
                        <option>Afiliación de nueva Franquicia</option>
                        <option>Soporte Técnico de Plataforma</option>
                        <option>Otro requerimiento</option>
                    </select>
                </div>
                <div class="mb-8">
                    <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Descripción Detallada</label>
                    <textarea v-model="ticketForm.message" rows="4" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 outline-none focus:bg-white focus:border-[#BD0A0A] focus:ring-4 focus:ring-[#BD0A0A]/10 resize-none transition" placeholder="Proporciona número de orden, nombres de restaurante y cualquier detalle relevante..." required></textarea>
                </div>
                <div class="flex justify-end gap-4">
                    <button type="button" @click="isTicketModalOpen = false" class="px-8 py-4 font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">Cancelar</button>
                    <button type="submit" class="bg-[#BD0A0A] hover:bg-red-800 text-white font-bold px-10 py-4 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1 flex items-center gap-2">
                        <i class="fas fa-paper-plane"></i> Emitir Ticket Oficial
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div class="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
        <div v-show="isChatOpen" class="w-[340px] md:w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-4 border border-gray-100 transform transition-all origin-bottom-right" :class="isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'">
            <div class="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white p-5 font-bold flex justify-between items-center shadow-md z-10">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <i class="fas fa-headset text-[#fbbf24]"></i>
                    </div>
                    <div>
                        <h4 class="leading-none text-lg">Asistente FoodRush</h4>
                        <span class="text-xs text-green-400 font-normal flex items-center gap-1 mt-1"><span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> En línea</span>
                    </div>
                </div>
                <button @click="isChatOpen = false" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
            </div>
            
            <div ref="chatContainer" class="flex-1 p-5 overflow-y-auto bg-gray-50 text-sm space-y-4">
                <div v-for="(msg, index) in chatMessages" :key="index" 
                     class="max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-sm text-base"
                     :class="msg.sender === 'user' ? 'bg-[#0f172a] text-white self-end ml-auto rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 self-start mr-auto rounded-tl-none'">
                    <span v-html="formatMessage(msg.text)"></span>
                </div>
                
                <div v-if="isBotTyping" class="bg-white border border-gray-100 text-gray-500 max-w-[85%] p-4 rounded-2xl self-start mr-auto rounded-tl-none shadow-sm flex items-center gap-2">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-[#BD0A0A] rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-[#BD0A0A] rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-[#BD0A0A] rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            </div>
            
            <div class="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
                <input v-model="chatInput" @keyup.enter="sendChatMessage" type="text" placeholder="Pregunta lo que sea..." class="flex-1 bg-gray-100 border-none rounded-full px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#BD0A0A]/30">
                <button @click="sendChatMessage" class="w-12 h-12 bg-[#BD0A0A] text-white rounded-full flex items-center justify-center hover:bg-red-800 transition shadow-lg transform hover:scale-105">
                    <i class="fas fa-paper-plane text-sm"></i>
                </button>
            </div>
        </div>

        <button @click="isChatOpen = !isChatOpen" class="w-16 h-16 rounded-full bg-gradient-to-br from-[#BD0A0A] to-[#9B0808] text-white text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform chat-pulse border-4 border-white">
            <i class="fas" :class="isChatOpen ? 'fa-chevron-down' : 'fa-comment-dots'"></i>
        </button>
    </div>

    <footer class="bg-[#BD0A0A] text-white mt-auto border-t-4 border-[#fbbf24]">
        <div class="container mx-auto px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">
            <div class="col-span-1 md:col-span-1 flex flex-col items-center md:items-start">
                 <div class="flex items-center gap-2 mb-6 bg-white w-fit px-4 py-1.5 rounded-full shadow-lg">
                    <span class="text-[#fbbf24] font-bold text-2xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-2xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/80 text-sm font-medium mb-6">La mejor comida de tus franquicias directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-github"></i></a>
                </div>
            </div>
            
            <div class="col-span-1">
                <h5 class="font-bold text-xl text-[#fbbf24] mb-4">Plataforma</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><a href="#" class="hover:text-white transition">Funcionalidades Multi-tenant</a></li>
                    <li><a href="#" class="hover:text-white transition">Seguridad y Cumplimiento</a></li>
                    <li><a href="#" class="hover:text-white transition">Integraciones API</a></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h5 class="font-bold text-xl text-[#fbbf24] mb-4">Empresa</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><router-link to="/about" class="hover:text-white transition">Nuestra Filosofía</router-link></li>
                    <li><router-link to="/about" class="hover:text-white transition">El Equipo</router-link></li>
                    <li><router-link to="/affiliate" class="hover:text-white transition">Afiliados</router-link></li>
                </ul>
            </div>
            <div class="col-span-1">
                <h5 class="font-bold text-xl text-[#fbbf24] mb-4">Soporte</h5>
                <ul class="space-y-3 text-sm text-white/80">
                    <li><span class="text-white font-bold cursor-default">Preguntas Frecuentes</span></li>
                    <li><router-link to="/terms" class="hover:text-white transition">Términos y Condiciones</router-link></li>
                </ul>
            </div>
        </div>
        <div class="border-t border-white/10 bg-[#9B0808] py-4 text-center">
             <div class="text-xs text-white/60 font-medium">
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

@keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(189, 10, 10, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(189, 10, 10, 0); }
    100% { box-shadow: 0 0 0 0 rgba(189, 10, 10, 0); }
}
.chat-pulse { animation: pulse-border 2.5s infinite; }

.scroll-animate {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform, opacity;
}
.scroll-animate.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.fade-in-up { 
    opacity: 0; 
    transform: translateY(30px);
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
}

@keyframes fadeInUp {
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}
</style>
