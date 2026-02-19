<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const goBack = () => router.go(-1);

const faqs = ref([
    { question: "¿Cómo rastreo mi pedido?", answer: "Ve a 'Historial de Pedidos' en tu perfil y selecciona el pedido activo para ver su estado.", open: false },
    { question: "¿Puedo cancelar mi orden?", answer: "Solo puedes cancelar órdenes si el restaurante aún no ha comenzado a prepararlas.", open: false },
    { question: "¿Qué métodos de pago aceptan?", answer: "Aceptamos tarjetas de crédito/débito (Visa, MC) y PayPal, además de efectivo contra entrega.", open: false }
]);

const toggleFaq = (idx) => {
    faqs.value[idx].open = !faqs.value[idx].open;
};

const message = ref("");

const sendMessage = () => {
    if(!message.value) return;
    
    Swal.fire({
        icon: 'success',
        title: 'Mensaje Enviado',
        text: 'Hemos recibido tu consulta. Te responderemos pronto.',
        timer: 1500,
        showConfirmButton: false
    });
    message.value = "";
};
</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans">
    <header class="p-6 flex items-center bg-[#F5F5F5] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Ayuda y Soporte</h1>
        <div class="w-8"></div>
    </header>

    <div class="px-6 pb-10 max-w-lg mx-auto space-y-6">
        
        <!-- FAQ Section -->
        <div>
            <h2 class="font-bold text-slate-800 mb-3 ml-1">Preguntas Frecuentes</h2>
            <div class="space-y-3">
                <div v-for="(faq, idx) in faqs" :key="idx" class="bg-white rounded-2xl p-4 shadow-sm overflow-hidden transition-all duration-300">
                    <button @click="toggleFaq(idx)" class="w-full flex justify-between items-center text-left">
                        <span class="font-bold text-slate-700 text-sm">{{ faq.question }}</span>
                        <i class="fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-300" :class="{'rotate-180': faq.open}"></i>
                    </button>
                    <div v-show="faq.open" class="mt-3 text-sm text-gray-500 border-t border-gray-50 pt-3">
                        {{ faq.answer }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Contact Form -->
        <div>
            <h2 class="font-bold text-slate-800 mb-3 ml-1">Contáctanos</h2>
            <div class="bg-white rounded-3xl p-5 shadow-sm">
                <textarea v-model="message" rows="4" placeholder="Describe tu problema aquí..." class="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-orange-500 transition resize-none mb-4"></textarea>
                <button @click="sendMessage" class="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow hover:bg-black transition flex items-center justify-center gap-2">
                    <i class="fa-regular fa-paper-plane text-xs"></i> Enviar Mensaje
                </button>
            </div>
        </div>

    </div>
</div>
</template>
