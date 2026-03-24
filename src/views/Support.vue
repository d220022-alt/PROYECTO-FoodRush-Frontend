<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();

onMounted(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
});

// ==========================================
// 1. PREGUNTAS FRECUENTES
// ==========================================
const faqs = ref([
    { question: "¿Cómo rastreo mi pedido?", answer: "Ve a 'Historial de Pedidos' en tu perfil y selecciona el pedido activo para ver su estado.", open: false },
    { question: "¿Puedo cancelar mi orden?", answer: "Solo puedes cancelar órdenes si el restaurante aún no ha comenzado a prepararlas.", open: false },
    { question: "¿Qué métodos de pago aceptan?", answer: "Aceptamos tarjetas de crédito/débito (Visa, MC) y PayPal, además de efectivo contra entrega.", open: false },
    { question: "¿Cómo reporto un problema con mi comida?", answer: "Puedes usar el botón 'Crear Ticket' en esta misma página o contactarnos vía WhatsApp.", open: false }
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
        title: 'Mensaje Enviado',
        text: 'Hemos recibido tu consulta. Te responderemos pronto.',
        timer: 2000,
        showConfirmButton: false
    });
    simpleMessage.value = "";
};

// ==========================================
// 3. TICKET MODAL 
// ==========================================
const isTicketModalOpen = ref(false);
const isUserLoggedIn = ref(false);

const ticketForm = ref({ name: '', email: '', subject: 'Reportar un problema', message: '' });

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

const submitTicket = () => {
    isTicketModalOpen.value = false;
    Swal.fire({
        icon: 'success',
        title: '¡Ticket Creado!',
        text: 'Tu número de ticket es #FR-' + Math.floor(Math.random() * 10000) + '. Lo revisaremos enseguida.',
        confirmButtonColor: '#BD0A0A'
    });
    ticketForm.value.message = '';
    ticketForm.value.subject = 'Reportar un problema';
};

// ==========================================
// 4. FOODRUSH AI - PERSONALIDAD ESTRICTA
// ==========================================
const isChatOpen = ref(false);
const chatInput = ref('');
const chatContainer = ref(null);
const isBotTyping = ref(false);

const chatMessages = ref([
    { text: '¡Hola! 👋 Soy FoodRush AI. Mi único propósito en la vida es que comas delicioso. ¿Qué se te antoja hoy?', sender: 'bot' }
]);

const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-200 underline font-bold hover:text-white">$1</a>');
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

    const response = await thinkLikeAI(text);
    
    isBotTyping.value = false;
    chatMessages.value.push({ text: response, sender: 'bot' });
    scrollToBottom();
};

const thinkLikeAI = async (userMessage) => {
    const API_KEY = ""; // Pon aquí tu clave de API si tienes una.

    // REGLA PARA LA IA REAL: Estricta con el tema FoodRush
    const systemPrompt = `Eres FoodRush AI, el asistente virtual de FoodRush (app de delivery dominicana).
    REGLAS ESTRICTAS E INQUEBRANTABLES:
    1. Corrige mentalmente cualquier falta ortográfica.
    2. TODO lo que responda DEBE estar relacionado con FoodRush, comida, restaurantes o delivery.
    3. Si el usuario escribe letras al azar, un saludo, un insulto, una pregunta matemática, política o cualquier tema irrelevante, DEBES buscar una forma creativa de desviarlo hacia comida y ofrecer FoodRush.
       Ejemplo: Usuario: "¿Cuánto es 2+2?" -> Tú: "¡Es 4! Como los 4 pedazos de pizza que te podrías estar comiendo ahora mismo en FoodRush. ¿Te busco una?"
    4. Usa links así: [Ir a Restaurante](/restaurant/nombredelrestaurante).`;

    if (API_KEY) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nUsuario dice: ${userMessage}` }]}],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 250 }
                })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("Error conectando a la IA:", error);
            return "Mis circuitos tienen hambre, pero igual te ayudaré a pedir en FoodRush...";
        }
    } else {
        // --- SIMULADOR INTELIGENTE (RESPALDO OBSESIONADO CON COMIDA) ---
        const lowerInput = userMessage.toLowerCase();
        
        // 1. Restaurantes y ortografía mala
        if (/(mac|mc|mak)\s*(donal|donald|donalz)/i.test(lowerInput)) {
            return "¡Me encanta **McDonald's**! Ofrecemos su menú completo con envío rápido. Puedes hacer tu pedido directamente aquí: [Menú McDonald's](/restaurant/mcdonalds). 🍔🍟";
        }
        if (/(buerger|burgel|burger)\s*(kin|king)/i.test(lowerInput)) {
            return "¡Las hamburguesas a la parrilla son un clásico! Tenemos a **Burger King**. [Pedir Burger King](/restaurant/burger-king). 👑🍔";
        }
        if (/(pisa|pizza|piza)\s*(hut|hut|jot)/i.test(lowerInput)) {
            return "¡Claro! **Pizza Hut** lista para llevar calientita a tu casa. [Pedir Pizza Hut](/restaurant/pizza-hut). 🍕";
        }
        if (/(pollo|kfc|kefc|kefec)/i.test(lowerInput)) {
            return "¿Antojo de pollo frito? ¡Tenemos **KFC**! Aquí tienes el menú para chuparse los dedos: [Pedir KFC](/restaurant/kfc). 🍗🤤";
        }
        if (/(starbuck|cafe|estarbu|estarvuc)/i.test(lowerInput)) {
            return "¿Necesitas energía? Pide tu café favorito en **Starbucks**. [Ir a Starbucks](/restaurant/starbucks). ☕✨";
        }
        
        // 2. Soporte Básico
        if (/(pedido|orden|rastrear|llega|tiempo)/i.test(input)) {
            return "El tiempo promedio de FoodRush es de 30-45 minutos. Ve a 'Mis Pedidos' en tu perfil para rastrearlo. 🛵💨";
        }

        // 3. CAJÓN DE SASTRE (Responde a CUALQUIER OTRA COSA girándolo a FoodRush)
        // Usamos la frase del usuario (userMessage) para que sienta que lo leímos.
        const fallbacks = [
            `Mencionaste "${userMessage}", ¡muy interesante! Pero la verdad, mi programación solo me deja pensar en comida. 😅 ¿Qué tal si te pides una pizza en FoodRush?`,
            `No sé mucho de "${userMessage}", pero sí sé que hoy tenemos envío gratis en varias franquicias. ¿Miramos el menú de FoodRush? 🍔🚀`,
            `¡Jaja! Podríamos hablar de "${userMessage}" todo el día, pero me está dando hambre. 🤤 Mejor dime, ¿te provoca pollo frito o unos taquitos?`,
            `Mi cerebro artificial de FoodRush procesó "${userMessage}" y llegó a la conclusión de que necesitas una buena hamburguesa. ¿Qué dices, pedimos algo? 🍟`
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
};
</script>

<template>
<div class="font-sans antialiased bg-[#F5F5F5] text-gray-800 flex flex-col min-h-screen">

    <nav class="bg-white shadow-md py-4 sticky top-0 z-50">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 md:px-12">
            <a href="#" @click.prevent="router.push('/')" class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-3xl text-[#BD0A0A] electric-blink group-hover:scale-110 transition-transform"></i>
                <span class="text-2xl font-extrabold text-[#0f172a] font-display">
                    FOOD<span class="text-[#BD0A0A]">RUSH</span>
                </span>
            </a>
            
            <div class="hidden md:flex gap-6 font-medium items-center text-sm">
                <a @click.prevent="router.push('/terms')" class="cursor-pointer hover:text-[#BD0A0A] transition">Términos y Condiciones</a>
                <a @click.prevent="router.push('/faq')" class="cursor-pointer hover:text-[#BD0A0A] transition">Preguntas Frecuentes</a>
                <a @click.prevent="router.push('/about')" class="cursor-pointer hover:text-[#BD0A0A] transition">Nosotros</a>
                <a @click.prevent="router.push('/affiliate')" class="cursor-pointer hover:text-[#BD0A0A] transition">Afíliate</a>
                
                <div class="w-px h-6 bg-gray-200 mx-2"></div>

                <button @click="router.push('/')" class="bg-[#0f172a] text-white px-5 py-2 rounded-full hover:bg-black transition shadow-lg font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-house text-xs"></i> Menú Principal
                </button>
            </div>
            
            <button class="md:hidden text-gray-600 text-2xl" @click="router.push('/')">
                <i class="fa-solid fa-house"></i>
            </button>
        </div>
    </nav>

    <div class="relative py-20 md:py-28 text-center text-white overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div class="relative z-10 container mx-auto px-4 max-w-3xl fade-in-up">
            <div class="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#fbbf24] text-xs font-bold tracking-widest uppercase mb-4">
                Centro de Ayuda 24/7
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold mb-6 leading-tight font-display">¿En qué podemos <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-orange-500">ayudarte hoy?</span></h1>
            
            <div class="relative max-w-lg mx-auto shadow-2xl rounded-full">
                <div class="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
                    <i class="fas fa-search"></i>
                </div>
                <input type="text" class="block w-full p-4 pl-12 text-sm text-gray-900 border-none rounded-full bg-white outline-none focus:ring-4 focus:ring-[#BD0A0A]/30 transition" placeholder="Buscar 'mi pedido no llega', 'facturación'...">
                <button class="absolute right-2 bottom-2 bg-[#BD0A0A] hover:bg-red-800 text-white font-bold rounded-full text-sm px-6 py-2 transition-all">Buscar</button>
            </div>
        </div>
    </div>

    <section class="container mx-auto px-4 -mt-12 md:-mt-16 relative z-20 mb-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            
            <div @click="isChatOpen = true" class="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 border border-white/20 cursor-pointer fade-in-up" style="animation-delay: 0.1s;">
                <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm">
                    <i class="fas fa-brain"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">FoodRush AI Inteligente</h3>
                <p class="text-gray-500 text-sm mb-4">Pregúntame cualquier cosa. Te aseguro que terminarás con hambre.</p>
                <span class="text-blue-600 font-bold text-sm flex items-center gap-2">Comenzar a pensar <i class="fas fa-arrow-right"></i></span>
            </div>

            <div @click="openTicketModal" class="bg-white p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 border-b-4 border-[#BD0A0A] cursor-pointer fade-in-up" style="animation-delay: 0.2s;">
                <div class="w-14 h-14 bg-red-100 text-[#BD0A0A] rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm">
                    <i class="fas fa-envelope-open-text"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">Crear Ticket</h3>
                <p class="text-gray-500 text-sm mb-4">Para incidencias técnicas o reclamos formales sobre un pedido.</p>
                <span class="text-[#BD0A0A] font-bold text-sm flex items-center gap-2">Llenar Formulario <i class="fas fa-arrow-right"></i></span>
            </div>

            <a href="https://wa.me/18493504608?text=Hola%20FoodRush,%20tengo%20una%20consulta." target="_blank" class="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl hover:-translate-y-2 transition-all duration-300 border border-white/20 fade-in-up block" style="animation-delay: 0.3s;">
                <div class="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm">
                    <i class="fab fa-whatsapp"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">WhatsApp</h3>
                <p class="text-gray-500 text-sm mb-4">Habla con un asesor de servicio al cliente en tiempo real.</p>
                <span class="text-green-600 font-bold text-sm flex items-center gap-2">Chatear ahora <i class="fas fa-external-link-alt"></i></span>
            </a>
        </div>
    </section>

    <section class="container mx-auto px-4 max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 pb-20 fade-in-up" style="animation-delay: 0.4s;">
        
        <div>
            <div class="flex items-center gap-3 mb-6">
                <i class="fa-solid fa-circle-question text-2xl text-[#fbbf24]"></i>
                <h2 class="text-2xl font-bold text-slate-800">Preguntas Frecuentes</h2>
            </div>
            <div class="space-y-4">
                <div v-for="(faq, idx) in faqs" :key="idx" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                    <button @click="toggleFaq(idx)" class="w-full flex justify-between items-center text-left outline-none">
                        <span class="font-bold text-slate-800">{{ faq.question }}</span>
                        <i class="fa-solid fa-chevron-down text-gray-400 text-sm transition-transform duration-300" :class="{'rotate-180': faq.open}"></i>
                    </button>
                    <div v-show="faq.open" class="mt-4 text-sm text-gray-500 border-t border-gray-50 pt-4 leading-relaxed">
                        {{ faq.answer }}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <div class="flex items-center gap-3 mb-6">
                <i class="fa-solid fa-paper-plane text-2xl text-[#BD0A0A]"></i>
                <h2 class="text-2xl font-bold text-slate-800">Envíanos un mensaje rápido</h2>
            </div>
            <div class="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                <p class="text-sm text-gray-500 mb-6">Si no encontraste tu respuesta, escríbenos un mensaje corto y te contactaremos a tu correo registrado.</p>
                <textarea v-model="simpleMessage" rows="5" placeholder="Escribe tu consulta o comentario aquí..." class="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-[#BD0A0A] focus:ring-2 focus:ring-[#BD0A0A]/20 transition resize-none mb-6"></textarea>
                <button @click="sendSimpleMessage" class="w-full bg-[#0f172a] hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                    <i class="fa-regular fa-paper-plane"></i> Enviar Consulta
                </button>
            </div>
        </div>
    </section>

    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
            <div>
                 <div class="flex items-center justify-center md:justify-start gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg mx-auto md:mx-0">
                    <span class="text-orange-500 font-bold text-xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/90 text-sm font-medium">La mejor comida de tus franquicias directo a tu puerta.</p>
            </div>
            <div class="text-xs text-white/60">
                &copy; 2025 FoodRush Inc. Todos los derechos reservados.
            </div>
        </div>
    </footer>

    <div v-if="isTicketModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all">
            <div class="flex items-center justify-between p-5 border-b bg-gray-50">
                <h3 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-ticket-alt text-[#BD0A0A] mr-2"></i> Crear Nuevo Ticket
                </h3>
                <button @click="isTicketModalOpen = false" class="text-gray-400 hover:text-gray-900 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex justify-center items-center transition">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <form @submit.prevent="submitTicket" class="p-6">
                <div v-if="isUserLoggedIn" class="mb-4 text-xs text-green-600 bg-green-50 p-3 rounded-lg flex items-center gap-2 border border-green-100">
                    <i class="fa-solid fa-circle-info text-base"></i> Hemos pre-llenado tus datos, pero puedes modificarlos libremente si deseas usar otro contacto.
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Nombre</label>
                        <input v-model="ticketForm.name" type="text" 
                               class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#BD0A0A] focus:ring-1 focus:ring-[#BD0A0A] transition" 
                               placeholder="Tu nombre" required>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Email</label>
                        <input v-model="ticketForm.email" type="email"
                               class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#BD0A0A] focus:ring-1 focus:ring-[#BD0A0A] transition" 
                               placeholder="correo@ejemplo.com" required>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Asunto</label>
                    <select v-model="ticketForm.subject" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#BD0A0A] focus:ring-1 focus:ring-[#BD0A0A]">
                        <option>Reportar un problema</option>
                        <option>Estado de mi pedido</option>
                        <option>Afiliación de Franquicia</option>
                        <option>Soporte de Cuenta</option>
                        <option>Otro</option>
                    </select>
                </div>
                <div class="mb-6">
                    <label class="block text-xs font-bold text-gray-600 uppercase mb-2">Mensaje Detallado</label>
                    <textarea v-model="ticketForm.message" rows="4" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#BD0A0A] focus:ring-1 focus:ring-[#BD0A0A] resize-none transition" placeholder="Describe tu consulta a detalle..." required></textarea>
                </div>
                <button type="submit" class="w-full bg-[#BD0A0A] hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-1">
                    Enviar Ticket Oficial
                </button>
            </form>
        </div>
    </div>

    <div class="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
        
        <div v-show="isChatOpen" class="w-[320px] md:w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 border border-gray-100 fade-in-up">
            <div class="bg-[#BD0A0A] text-white p-4 font-bold flex justify-between items-center shadow-sm z-10">
                <div class="flex items-center gap-2">
                    <i class="fas fa-brain text-xl"></i> FoodRush AI
                </div>
                <button @click="isChatOpen = false" class="text-white hover:text-gray-200 text-lg"><i class="fas fa-times"></i></button>
            </div>
            
            <div ref="chatContainer" class="flex-1 p-4 overflow-y-auto bg-gray-50 text-sm space-y-3">
                <div v-for="(msg, index) in chatMessages" :key="index" 
                     class="max-w-[85%] p-3 rounded-2xl leading-relaxed"
                     :class="msg.sender === 'user' ? 'bg-[#0f172a] text-white self-end ml-auto rounded-br-sm shadow-sm' : 'bg-white border border-gray-200 text-gray-800 self-start mr-auto rounded-bl-sm shadow-sm'">
                    <span v-html="formatMessage(msg.text)"></span>
                </div>
                
                <div v-if="isBotTyping" class="bg-white border border-gray-200 text-gray-500 max-w-[85%] p-3 rounded-2xl self-start mr-auto rounded-bl-sm shadow-sm flex items-center gap-2">
                    <i class="fas fa-circle-notch fa-spin text-[#BD0A0A]"></i> Pensando...
                </div>
            </div>
            
            <div class="p-3 border-t border-gray-100 flex bg-white items-center gap-2">
                <input v-model="chatInput" @keyup.enter="sendChatMessage" type="text" placeholder="Escribe aquí (hasta un chiste)..." class="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-[#BD0A0A]">
                <button @click="sendChatMessage" class="w-10 h-10 bg-[#BD0A0A] text-white rounded-full flex items-center justify-center hover:scale-105 transition shadow-sm">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <button @click="isChatOpen = !isChatOpen" class="w-16 h-16 rounded-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition chat-pulse">
            <i class="fas text-[#fbbf24]" :class="isChatOpen ? 'fa-xmark' : 'fa-brain'"></i>
        </button>
    </div>

</div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Titan+One&display=swap');

.font-sans { font-family: 'Nunito', sans-serif; }
.font-display { font-family: 'Titan One', cursive; }

@keyframes electric-blink {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px #BD0A0A); }
    50% { opacity: 0.7; transform: scale(1.05); filter: drop-shadow(0 0 6px #fbbf24); }
}
.electric-blink { animation: electric-blink 3s infinite ease-in-out; }

@keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(15, 23, 42, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(15, 23, 42, 0); }
    100% { box-shadow: 0 0 0 0 rgba(15, 23, 42, 0); }
}
.chat-pulse { animation: pulse-border 2.5s infinite; }

.fade-in { animation: fadeIn 0.4s ease-out forwards; }
.fade-in-up { opacity: 0; transform: translateY(20px); animation: fadeInUp 0.6s ease-out forwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>