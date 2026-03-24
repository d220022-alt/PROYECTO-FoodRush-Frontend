<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Forzar que la página inicie arriba al cambiar de ruta
onMounted(() => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });
});

// Datos del equipo fundador
const teamMembers = [
    {
        name: "Rardiel",
        role: "Arquitectura Backend & Multitenant",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1374&auto=format&fit=crop",
        icon: "fa-server",
        social: "#"
    },
    {
        name: "Yirbert",
        role: "Frontend & Diseño Web",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1470&auto=format&fit=crop",
        icon: "fa-code",
        social: "#"
    },
    {
        name: "Aysmar",
        role: "Diseño Multimedia & Documentación",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1374&auto=format&fit=crop",
        icon: "fa-pen-nib",
        social: "#"
    }
];

// Valores de cultura
const cultureValues = [
    { title: "Innovación", desc: "Buscamos constantemente nuevas formas de mejorar la experiencia del usuario final.", icon: "fa-lightbulb", color: "blue" },
    { title: "Pasión", desc: "Amamos la comida y la tecnología. Esa combinación es nuestro motor diario.", icon: "fa-heart", color: "red" },
    { title: "Colaboración", desc: "El trabajo en equipo es fundamental. Nadie llega a la cima solo.", icon: "fa-users", color: "yellow" },
    { title: "Seguridad", desc: "Protegemos los datos de nuestros usuarios y franquicias con los más altos estándares.", icon: "fa-shield-alt", color: "green" }
];
</script>

<template>
<div class="font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <nav class="bg-white shadow-md py-4 sticky top-0 z-50 transition-all border-b border-gray-100">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 md:px-12">
            <a href="#" @click.prevent="router.push('/')" class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-3xl text-[#BD0A0A] electric-blink group-hover:scale-110 transition-transform"></i>
                <span class="text-2xl font-extrabold text-[#0f172a] font-display">
                    FOOD<span class="text-[#BD0A0A]">RUSH</span>
                </span>
            </a>
            
            <div class="hidden md:flex gap-6 font-medium items-center text-sm">
                <a @click.prevent="router.push('/terms')" class="cursor-pointer hover:text-[#BD0A0A] transition">Términos y Condiciones</a>
                <a @click.prevent="router.push('/support')" class="cursor-pointer hover:text-[#BD0A0A] transition">Preguntas Frecuentes</a>
                <a class="cursor-pointer text-[#BD0A0A] font-bold border-b-2 border-[#BD0A0A]">Nosotros</a>
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

    <header class="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center overflow-hidden" style="background-image: url('https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1470&auto=format&fit=crop');">
        <div class="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 to-[#0f172a]/50"></div>
        <div class="relative z-10 container mx-auto px-4 md:px-12 text-white">
            <div class="max-w-3xl fade-in-up">
                <span class="text-[#fbbf24] font-bold tracking-widest uppercase text-sm mb-4 block">Conoce nuestra historia</span>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight font-display drop-shadow-lg">
                    Innovando la <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#BD0A0A]">Logística Digital</span>
                </h1>
                <p class="text-xl font-light text-gray-200 border-l-4 border-[#fbbf24] pl-6 leading-relaxed">
                    Somos la plataforma definitiva diseñada para optimizar la gestión de franquicias gastronómicas y conectar tus antojos con la mejor tecnología.
                </p>
            </div>
        </div>
    </header>

    <section class="py-24 bg-white relative overflow-hidden">
        <div class="absolute top-20 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50 -z-0"></div>
        <div class="absolute bottom-20 left-10 w-72 h-72 bg-red-50 rounded-full blur-3xl opacity-50 -z-0"></div>

        <div class="container mx-auto px-4 md:px-12 relative z-10">
            <div class="flex flex-col lg:flex-row items-center gap-16">
                <div class="w-full lg:w-1/2 relative fade-in-up" style="animation-delay: 0.1s;">
                    <div class="absolute -top-4 -left-4 w-32 h-32 bg-[#fbbf24] opacity-20 rounded-full"></div>
                    <div class="absolute -bottom-4 -right-4 w-40 h-40 bg-[#BD0A0A] opacity-10 rounded-full"></div>
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop" class="relative z-10 rounded-3xl shadow-2xl w-full object-cover h-[450px] md:h-[550px] border border-gray-100" alt="Oficina FoodRush">
                </div>
                
                <div class="w-full lg:w-1/2 fade-in-up" style="animation-delay: 0.2s;">
                    <h2 class="text-4xl font-extrabold text-[#0f172a] mb-6">El Origen del Proyecto</h2>
                    <p class="text-gray-600 text-lg mb-6 leading-relaxed">
                        FoodRush nació como un proyecto ambicioso en las aulas, buscando resolver un problema crítico en la industria: <strong>la fragmentación en los pedidos de comida rápida.</strong>
                    </p>
                    <p class="text-gray-600 text-lg mb-8 leading-relaxed">
                        Observamos que las franquicias perdían mucha eficiencia utilizando sistemas desconectados. Decidimos unificarlo todo bajo un mismo techo. Lo que empezó como un desafío de código, hoy es una infraestructura capaz de gestionar datos de múltiples restaurantes.
                    </p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <i class="fa-solid fa-rocket text-[#BD0A0A] text-2xl mb-3"></i>
                            <h4 class="font-bold text-[#0f172a] text-xl mb-2">La Misión</h4>
                            <p class="text-sm text-gray-500 leading-relaxed">Digitalizar y acelerar el mercado local, conectando clientes hambrientos con restaurantes eficientes.</p>
                        </div>
                        <div class="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <i class="fa-solid fa-layer-group text-[#fbbf24] text-2xl mb-3"></i>
                            <h4 class="font-bold text-[#0f172a] text-xl mb-2">Visión Multi-Tenant</h4>
                            <p class="text-sm text-gray-500 leading-relaxed">Crear un núcleo centralizado donde decenas de franquicias puedan operar simultáneamente sin interferencias.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-[#F5F5F5]">
        <div class="container mx-auto px-4 md:px-12">
            <div class="text-center mb-16 max-w-3xl mx-auto fade-in-up">
                <span class="text-[#BD0A0A] font-bold tracking-widest uppercase text-sm">Nuestra Filosofía</span>
                <h2 class="text-4xl font-extrabold text-[#0f172a] mt-2">Los pilares que nos mueven</h2>
                <p class="text-gray-500 mt-4 text-lg">No solo escribimos código, construimos una plataforma basada en confianza y resultados.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div v-for="(value, index) in cultureValues" :key="index" class="bg-white p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group border border-gray-100 fade-in-up" :style="{ animationDelay: `${0.1 * (index + 1)}s` }">
                    <div :class="`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors bg-${value.color}-50 text-${value.color}-600 group-hover:bg-${value.color}-600 group-hover:text-white`">
                        <i :class="`fas ${value.icon} text-2xl`"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-800">{{ value.title }}</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">{{ value.desc }}</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-[#0f172a] text-white overflow-hidden relative">
        <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 30px 30px;"></div>
        
        <div class="container mx-auto px-4 md:px-12 relative z-10">
            <div class="text-center mb-16 fade-in-up">
                <h2 class="text-3xl md:text-4xl font-extrabold font-display">Tecnología de Vanguardia</h2>
                <p class="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">FoodRush está construido sobre un stack tecnológico moderno, garantizando velocidad, escalabilidad y seguridad en cada pedido.</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:bg-white/10 transition backdrop-blur-sm fade-in-up" style="animation-delay: 0.1s">
                    <i class="fa-brands fa-vuejs text-5xl text-[#42b883] mb-4"></i>
                    <h4 class="font-bold text-lg">Vue.js 3</h4>
                    <p class="text-xs text-gray-400 mt-2">Interfaces Reactivas</p>
                </div>
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:bg-white/10 transition backdrop-blur-sm fade-in-up" style="animation-delay: 0.2s">
                    <i class="fa-brands fa-css3-alt text-5xl text-[#38bdf8] mb-4"></i>
                    <h4 class="font-bold text-lg">Tailwind CSS</h4>
                    <p class="text-xs text-gray-400 mt-2">Diseño UI/UX</p>
                </div>
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:bg-white/10 transition backdrop-blur-sm fade-in-up" style="animation-delay: 0.3s">
                    <i class="fa-brands fa-node text-5xl text-[#68a063] mb-4"></i>
                    <h4 class="font-bold text-lg">Node.js</h4>
                    <p class="text-xs text-gray-400 mt-2">Backend Escalable</p>
                </div>
                <div class="bg-white/5 border border-white/10 p-6 rounded-2xl text-center hover:bg-white/10 transition backdrop-blur-sm fade-in-up" style="animation-delay: 0.4s">
                    <i class="fa-solid fa-server text-5xl text-[#fbbf24] mb-4"></i>
                    <h4 class="font-bold text-lg">Multi-Tenant</h4>
                    <p class="text-xs text-gray-400 mt-2">Bases de Datos</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-white">
        <div class="container mx-auto px-4 md:px-12">
            <div class="text-center mb-16 fade-in-up">
                <h2 class="text-4xl font-extrabold text-gray-900 font-display">El Equipo FoodRush</h2>
                <p class="text-gray-500 mt-4 text-lg max-w-2xl mx-auto">Las mentes creativas y técnicas detrás del código, el diseño y la estructura que hace posible esta plataforma.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div v-for="(member, index) in teamMembers" :key="index" class="bg-gray-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 group fade-in-up" :style="{ animationDelay: `${0.2 * index}s` }">
                    <div class="h-80 overflow-hidden relative">
                        <img :src="member.image" :alt="member.name" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                            <div class="text-white space-x-5">
                                <a :href="member.social" class="hover:text-[#fbbf24] transition transform hover:scale-110 inline-block"><i class="fab fa-linkedin text-2xl"></i></a>
                                <a :href="member.social" class="hover:text-[#fbbf24] transition transform hover:scale-110 inline-block"><i class="fab fa-github text-2xl"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="p-8 text-center bg-white relative">
                        <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-[#BD0A0A] rounded-full flex items-center justify-center text-white border-4 border-white shadow-md">
                            <i :class="`fas ${member.icon} text-xl`"></i>
                        </div>
                        <h5 class="text-2xl font-bold text-gray-900 mt-4">{{ member.name }}</h5>
                        <p class="text-[#BD0A0A] font-bold uppercase text-xs tracking-wider mt-2">{{ member.role }}</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-[#BD0A0A] text-white mt-auto border-t-4 border-[#fbbf24]">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
            <div>
                 <div class="flex items-center justify-center md:justify-start gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg mx-auto md:mx-0">
                    <span class="text-[#fbbf24] font-bold text-xl italic font-display">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1 font-display">Rush</span>
                </div>
                <p class="text-white/90 text-sm font-medium">La mejor comida de tus franquicias directo a tu puerta.</p>
            </div>
            
            <div class="flex gap-4">
                <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-instagram"></i></a>
                <a href="#" class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white transition hover:text-[#BD0A0A]"><i class="fa-brands fa-github"></i></a>
            </div>

            <div class="text-xs text-white/70 font-medium">
                &copy; 2026 FoodRush Inc. Todos los derechos reservados.
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

/* Efecto del Rayo en el Logo */
@keyframes electric-blink {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px #BD0A0A); }
    50% { opacity: 0.7; transform: scale(1.05); filter: drop-shadow(0 0 6px #fbbf24); }
}
.electric-blink { animation: electric-blink 3s infinite ease-in-out; }

/* Animaciones CSS personalizadas (Reemplazo de AOS para Vue) */
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

/* Soporte para los colores dinámicos de los iconos de la cultura */
.bg-blue-50 { background-color: #eff6ff; }
.text-blue-600 { color: #2563eb; }
.group-hover\:bg-blue-600:hover { background-color: #2563eb; }

.bg-red-50 { background-color: #fef2f2; }
.text-red-600 { color: #dc2626; }
.group-hover\:bg-red-600:hover { background-color: #dc2626; }

.bg-yellow-50 { background-color: #fefce8; }
.text-yellow-600 { color: #ca8a04; }
.group-hover\:bg-yellow-500:hover { background-color: #eab308; }

.bg-green-50 { background-color: #f0fdf4; }
.text-green-600 { color: #16a34a; }
.group-hover\:bg-green-600:hover { background-color: #16a34a; }
</style>