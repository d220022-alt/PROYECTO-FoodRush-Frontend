<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();
const currentSection = ref('intro');
const termsAccepted = ref(false);
const isLoggedIn = ref(false);

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

const handleScroll = () => {
    const sectionElements = document.querySelectorAll('.section-target');
    let current = 'intro';
    
    sectionElements.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    currentSection.value = current;
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
    window.addEventListener('scroll', handleScroll);
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
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
<div class="font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <nav class="bg-white/90 backdrop-blur-md shadow-sm py-4 sticky top-0 z-50 transition-all h-[80px]">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
            <a href="#" @click.prevent="router.push('/')" class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-3xl text-[#BD0A0A] animate-pulse group-hover:scale-110 transition-transform"></i>
                <span class="self-center text-2xl font-extrabold tracking-tight text-gray-900">FOODRUSH</span>
            </a>
            
            <button data-collapse-toggle="navbar-terms" type="button" class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none">
                <i class="fas fa-bars text-xl"></i>
            </button>

            <div class="hidden w-full md:block md:w-auto" id="navbar-terms">
                <ul class="flex flex-col font-medium p-4 md:p-0 mt-4 md:flex-row md:space-x-8 md:mt-0 items-center">
                    <li><a href="#" @click.prevent="router.push('/')" class="block py-2 px-3 text-gray-700 hover:text-[#BD0A0A] transition-colors font-semibold">Inicio</a></li>
                    <li><a href="#" @click.prevent="router.push('/about')" class="block py-2 px-3 text-gray-700 hover:text-[#BD0A0A] transition-colors font-semibold">Nosotros</a></li>
                    <li><a href="#" @click.prevent="router.push('/support')" class="block py-2 px-3 text-gray-700 hover:text-[#BD0A0A] transition-colors font-semibold">Soporte</a></li>
                    <li><a href="#" @click.prevent="router.push('/')" class="block py-2 px-3 md:p-0 ms-4"><span class="bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-[#BD0A0A] transition-all shadow-md text-sm font-semibold">Volver al Home</span></a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="bg-gradient-to-r from-[#BD0A0A] to-red-800 text-white py-20 text-center relative overflow-hidden">
        <i class="fas fa-balance-scale absolute top-10 left-10 text-9xl opacity-10 rotate-12"></i>
        <div class="container mx-auto px-4 relative z-10" data-aos="fade-up">
            <h1 class="text-4xl md:text-5xl font-extrabold mb-4 border-none">Términos y Condiciones</h1>
            <p class="text-white/80 text-lg max-w-2xl mx-auto">Marco legal y políticas de uso de la plataforma FoodRush.</p>
            <p class="text-xs mt-4 text-white/60">Actualizado: Febrero 2026</p>
        </div>
    </div>

    <div class="container mx-auto px-4 py-16">
        <div class="flex flex-col lg:flex-row gap-12">
            
            <!-- Sidebar -->
            <div class="w-full lg:w-1/4 hidden lg:block">
                <div class="sticky-sidebar bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h3 class="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider border-b pb-2">Tabla de Contenido</h3>
                    <ul class="space-y-1 text-sm text-gray-600">
                        <li v-for="section in sections" :key="section.id">
                            <a href="#" @click.prevent="scrollToSection(section.id)" 
                               class="term-link" 
                               :class="{ 'active': currentSection === section.id }">
                                {{ section.title }}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Content -->
            <div class="w-full lg:w-3/4">
                <div class="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 space-y-16">
                    
                    <div id="intro" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">1</span>
                            Introducción
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Bienvenido a <strong>FoodRush</strong>. Estos términos y condiciones constituyen un acuerdo legalmente vinculante entre usted (el "Usuario") y FoodRush Inc. Al descargar, acceder o utilizar nuestra aplicación móvil o sitio web, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
                        </p>
                    </div>

                    <div id="uso" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">2</span>
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
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">3</span>
                            Registro y Seguridad de la Cuenta
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Para utilizar el servicio, debe ser mayor de 13 años. Usted es responsable de salvaguardar la contraseña que utiliza para acceder al servicio y de cualquier actividad o acción bajo su contraseña. FoodRush se reserva el derecho de suspender cuentas que presenten actividad sospechosa, fraudulenta o que violen nuestras normas comunitarias.
                        </p>
                    </div>

                    <div id="pedidos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">4</span>
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
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">5</span>
                            Política de Reembolso y Cancelación
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El usuario puede cancelar un pedido sin penalización si el estado es "Pendiente". Una vez el estado cambia a "En Preparación", no se aceptan cancelaciones. Los reembolsos por pedidos incorrectos o en mal estado se procesarán tras una investigación, acreditándose a la forma de pago original en un plazo de 3-5 días hábiles.
                        </p>
                    </div>

                    <div id="propiedad" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">6</span>
                            Propiedad Intelectual
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            El servicio y su contenido original (excluyendo el contenido proporcionado por las franquicias), características y funcionalidad son y seguirán siendo propiedad exclusiva de FoodRush Inc. y sus licenciantes. El nombre "FoodRush" y el logotipo están protegidos por derechos de autor y marcas registradas.
                        </p>
                    </div>

                    <div id="datos" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">7</span>
                            Protección de Datos (Ley 172-13)
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En cumplimiento con la <strong>Ley No. 172-13</strong> sobre Protección de Datos de Carácter Personal de la República Dominicana, FoodRush garantiza que sus datos personales serán tratados con estricta confidencialidad y solo para los fines de la prestación del servicio. No vendemos sus datos a terceros.
                        </p>
                    </div>

                    <div id="leyes" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">8</span>
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
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">9</span>
                            Limitación de Responsabilidad
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            En ningún caso FoodRush, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de su acceso o uso del servicio.
                        </p>
                    </div>

                    <div id="conducta" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">10</span>
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
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">11</span>
                            Modificaciones a los Términos
                        </h2>
                        <p class="text-gray-600 leading-relaxed">
                            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.
                        </p>
                    </div>

                    <div id="contacto" class="section-target" data-aos="fade-up">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <span class="bg-gray-100 text-[#BD0A0A] w-8 h-8 rounded-full flex items-center justify-center text-sm border border-gray-200">12</span>
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

                    <!-- Botón de aceptación y condiciones -->
                    <div class="bg-white border-t border-gray-200 pt-8 mt-8 pb-4" data-aos="fade-up">
                        <div class="flex items-center space-x-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <input id="accept-terms" type="checkbox" v-model="termsAccepted" :disabled="isLoggedIn" class="w-5 h-5 text-[#BD0A0A] bg-white border-gray-300 rounded focus:ring-[#BD0A0A] focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <label for="accept-terms" class="text-gray-700 font-medium" :class="{ 'cursor-pointer': !isLoggedIn, 'cursor-not-allowed opacity-70': isLoggedIn }">
                                He leído, entiendo y acepto por completo los términos y condiciones de FoodRush.
                            </label>
                        </div>
                        
                        <div class="flex justify-end gap-4">
                            <button @click="goBackWithCancel" class="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                                {{ isLoggedIn ? 'Volver' : 'Cancelar' }}
                            </button>
                            <button v-if="!isLoggedIn" @click="acceptTerms" 
                                    :class="termsAccepted ? 'bg-[#BD0A0A] hover:bg-red-800 text-white shadow-lg shadow-red-500/30' : 'bg-gray-300 text-gray-500 cursor-not-allowed'"
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

    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg">
                    <span class="text-orange-500 font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
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
                        <li><a href="#" @click.prevent="router.push('/support')" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="#" @click.prevent="router.push('/support')" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="#" @click.prevent="router.push('/terms')" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" @click.prevent="router.push('/about')" class="hover:text-white hover:underline">Sobre Nosotros</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Blog</a></li>
                        <li><a href="#" @click.prevent="router.push('/affiliate')" class="hover:text-white hover:underline">Afíliate</a></li>
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
html { scroll-behavior: smooth; }

.section-target {
    scroll-margin-top: 140px; 
}

.sticky-sidebar {
    position: -webkit-sticky;
    position: sticky;
    top: 100px;
    max-height: 80vh;
    overflow-y: auto;
}

.sticky-sidebar::-webkit-scrollbar { width: 4px; }
.sticky-sidebar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

.term-link.active {
    color: #BD0A0A;
    border-left: 3px solid #BD0A0A;
    padding-left: 12px;
    font-weight: 700;
    background: rgba(189, 10, 10, 0.05);
}
.term-link {
    border-left: 3px solid transparent;
    padding-left: 12px;
    transition: all 0.3s ease;
    display: block;
    padding-top: 5px;
    padding-bottom: 5px;
}
.term-link:hover {
    color: #BD0A0A;
    padding-left: 15px;
}
</style>