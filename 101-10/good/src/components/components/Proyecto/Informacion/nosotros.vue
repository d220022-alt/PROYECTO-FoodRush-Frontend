<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nosotros | FoodRush</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" rel="stylesheet" />
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#BD0A0A',
                        secondary: '#f1faee',
                        dark: '#1d3557',
                        accent: '#ffb703',
                    },
                    fontFamily: {
                        sans: ['Poppins', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="font-sans antialiased bg-gray-50 text-gray-800 flex flex-col min-h-screen">

    <nav class="bg-white shadow-md py-4 sticky top-0 z-50">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
            <a href="principal.html" class="flex items-center space-x-3 rtl:space-x-reverse group">
                <i class="fas fa-bolt text-3xl text-primary animate-pulse transform group-hover:scale-110 transition-transform"></i>
                <span class="self-center text-2xl font-extrabold whitespace-nowrap text-dark">FOODRUSH</span>
            </a>
            
            <button data-collapse-toggle="navbar-solid" type="button" class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100" aria-controls="navbar-solid" aria-expanded="false">
                <span class="sr-only">Abrir menú</span>
                <i class="fas fa-bars text-xl"></i>
            </button>

            <div class="hidden w-full md:block md:w-auto" id="navbar-solid">
                <ul class="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white items-center">
                    <li><a href="principal.html" class="block py-2 px-3 text-gray-900 rounded hover:text-primary md:p-0 transition-colors">Inicio</a></li>
                    <li><a href="#" class="block py-2 px-3 text-primary md:p-0 font-bold border-b-2 border-primary">Nosotros</a></li>
                    <li><a href="soporte.html" class="block py-2 px-3 text-gray-900 rounded hover:text-primary md:p-0 transition-colors">Soporte</a></li>
                    <li><a href="principal.html" class="block py-2 px-3 md:p-0 ms-4"><span class="bg-blue-900 text-white px-5 py-2 rounded-full hover:bg-blue-800 transition-all shadow-lg text-sm font-semibold">Volver al Home</span></a></li>
                </ul>
            </div>
        </div>
    </nav>

    <header class="relative h-[60vh] flex items-center justify-center bg-fixed bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1470&auto=format&fit=crop');">
        <div class="absolute inset-0 bg-gradient-to-r from-dark/90 to-dark/40"></div>
        <div class="relative z-10 container mx-auto px-4 text-white">
            <div class="max-w-2xl">
                <span class="text-accent font-bold tracking-widest uppercase text-sm mb-2 block" data-aos="fade-right">Sobre FoodRush</span>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight" data-aos="fade-right" data-aos-delay="100">Innovando la <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-accent to-red-500">Logística Digital</span></h1>
                <p class="text-xl font-light text-gray-200 border-l-4 border-accent pl-6" data-aos="fade-up" data-aos-delay="200">
                    Somos la primera plataforma multi-tenant diseñada para optimizar la gestión de franquicias gastronómicas en tiempo real.
                </p>
            </div>
        </div>
    </header>

    <section class="py-24 bg-white">
        <div class="container mx-auto px-4">
            <div class="flex flex-col lg:flex-row items-center gap-16">
                <div class="w-full lg:w-1/2 relative" data-aos="fade-right">
                    <div class="absolute -top-4 -left-4 w-24 h-24 bg-accent/20 rounded-full z-0"></div>
                    <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/10 rounded-full z-0"></div>
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop" class="relative z-10 rounded-2xl shadow-2xl w-full object-cover h-[500px]" alt="Oficina FoodRush">
                </div>
                
                <div class="w-full lg:w-1/2" data-aos="fade-left">
                    <h2 class="text-4xl font-extrabold text-gray-900 mb-6">Nuestra Trayectoria</h2>
                    <p class="text-gray-600 text-lg mb-6 leading-relaxed">
                        FoodRush comenzó como un proyecto ambicioso en las aulas, buscando resolver un problema crítico: <strong>la fragmentación en los pedidos de comida rápida.</strong>
                    </p>
                    <p class="text-gray-600 text-lg mb-8 leading-relaxed">
                        Observamos que las franquicias perdían hasta un 20% de eficiencia por usar sistemas desconectados. Decidimos unificarlo todo. Lo que empezó como código, hoy es una infraestructura robusta que procesa miles de transacciones.
                    </p>
                    
                    <div class="grid grid-cols-2 gap-6">
                        <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-dark text-xl mb-1">Fundación</h4>
                            <p class="text-sm text-gray-500">Iniciamos operaciones con el objetivo de digitalizar el mercado local.</p>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <h4 class="font-bold text-dark text-xl mb-1">Expansión</h4>
                            <p class="text-sm text-gray-500">Crecimiento del 200% y alianzas con las "Big Three" de la comida rápida.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16 max-w-3xl mx-auto" data-aos="fade-up">
                <span class="text-primary font-bold tracking-widest uppercase text-sm">Nuestra Cultura</span>
                <h2 class="text-4xl font-extrabold text-gray-900 mt-2">Los pilares que nos mueven</h2>
                <p class="text-gray-500 mt-4">No solo escribimos código, construimos relaciones basadas en confianza y resultados.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group" data-aos="zoom-in" data-aos-delay="0">
                    <div class="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <i class="fas fa-lightbulb text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Innovación</h3>
                    <p class="text-gray-500 text-sm">Buscamos constantemente nuevas formas de mejorar la experiencia del usuario final.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group" data-aos="zoom-in" data-aos-delay="100">
                    <div class="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <i class="fas fa-heart text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Pasión</h3>
                    <p class="text-gray-500 text-sm">Amamos la comida y la tecnología. Esa combinación es nuestro motor diario.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group" data-aos="zoom-in" data-aos-delay="200">
                    <div class="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mb-6 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                        <i class="fas fa-users text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Colaboración</h3>
                    <p class="text-gray-500 text-sm">El trabajo en equipo es fundamental. Nadie llega a la cima solo.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group" data-aos="zoom-in" data-aos-delay="300">
                    <div class="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <i class="fas fa-shield-alt text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Seguridad</h3>
                    <p class="text-gray-500 text-sm">Protegemos los datos de nuestros usuarios y franquicias con los más altos estándares.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-dark text-white overflow-hidden">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row items-center justify-between mb-12">
                <div class="mb-6 md:mb-0">
                    <h2 class="text-3xl md:text-4xl font-extrabold">Nuestro Camino</h2>
                    <p class="text-gray-400 mt-2">De una idea universitaria a una realidad empresarial.</p>
                </div>
                <button class="px-6 py-3 border border-gray-600 rounded-full hover:bg-white hover:text-dark transition-all">Ver Roadmap Completo</button>
            </div>

            <div class="relative border-l-4 border-gray-700 ml-4 md:ml-6 space-y-12">
                <div class="relative pl-8 md:pl-12" data-aos="fade-left">
                    <div class="absolute -left-2.5 md:-left-3 top-0 w-6 h-6 bg-accent rounded-full border-4 border-dark"></div>
                    <span class="text-accent font-bold text-sm tracking-wider">OCTUBRE 2025</span>
                    <h3 class="text-2xl font-bold mt-1">Nace la Idea</h3>
                    <p class="text-gray-400 mt-2 max-w-2xl">El equipo identifica la necesidad de un sistema unificado. Se define el nombre "FoodRush".</p>
                </div>
                <div class="relative pl-8 md:pl-12" data-aos="fade-left" data-aos-delay="100">
                    <div class="absolute -left-2.5 md:-left-3 top-0 w-6 h-6 bg-gray-500 rounded-full border-4 border-dark group-hover:bg-white"></div>
                    <span class="text-gray-300 font-bold text-sm tracking-wider">DICIEMBRE 2025</span>
                    <h3 class="text-2xl font-bold mt-1">Desarrollo del Core</h3>
                    <p class="text-gray-400 mt-2 max-w-2xl">Se implementa la arquitectura multi-tenant y se integra la base de datos.</p>
                </div>
                <div class="relative pl-8 md:pl-12" data-aos="fade-left" data-aos-delay="200">
                    <div class="absolute -left-2.5 md:-left-3 top-0 w-6 h-6 bg-primary rounded-full border-4 border-dark animate-pulse"></div>
                    <span class="text-primary font-bold text-sm tracking-wider">HOY</span>
                    <h3 class="text-2xl font-bold mt-1">Lanzamiento Beta</h3>
                    <p class="text-gray-400 mt-2 max-w-2xl">Presentación oficial de la plataforma con funcionalidades completas.</p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <h2 class="text-4xl font-extrabold text-gray-900">Liderazgo</h2>
                <p class="text-gray-500 mt-2">Mentes creativas detrás del código.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div class="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100" data-aos="flip-up">
                    <div class="h-80 overflow-hidden relative group">
                        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1374&auto=format&fit=crop" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" alt="CEO">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                            <div class="text-white space-x-4">
                                <a href="#" class="hover:text-accent"><i class="fab fa-linkedin text-xl"></i></a>
                                <a href="#" class="hover:text-accent"><i class="fab fa-twitter text-xl"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 text-center">
                        <h5 class="text-2xl font-bold text-gray-900">Tu Nombre</h5>
                        <p class="text-primary font-bold uppercase text-xs tracking-wider mb-4">CEO & Fundador</p>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100" data-aos="flip-up" data-aos-delay="100">
                    <div class="h-80 overflow-hidden relative group">
                        <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1374&auto=format&fit=crop" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" alt="Rardiel">
                         <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                            <div class="text-white space-x-4">
                                <a href="#" class="hover:text-accent"><i class="fab fa-github text-xl"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 text-center">
                        <h5 class="text-2xl font-bold text-gray-900">Rardiel</h5>
                        <p class="text-primary font-bold uppercase text-xs tracking-wider mb-4">Director de Tecnología</p>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100" data-aos="flip-up" data-aos-delay="200">
                    <div class="h-80 overflow-hidden relative group">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1470&auto=format&fit=crop" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" alt="Yirbert">
                         <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                            <div class="text-white space-x-4">
                                <a href="#" class="hover:text-accent"><i class="fab fa-instagram text-xl"></i></a>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 text-center">
                        <h5 class="text-2xl font-bold text-gray-900">Yirbert</h5>
                        <p class="text-primary font-bold uppercase text-xs tracking-wider mb-4">Jefe de Operaciones</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="faq" class="py-20 bg-gray-50">
        <div class="container mx-auto px-4 max-w-4xl">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold text-gray-900">Preguntas Frecuentes</h2>
                <p class="text-gray-500 mt-2">Respuestas rápidas a tus dudas.</p>
            </div>
            
            <div id="accordion-collapse" data-accordion="collapse">
                <h2 id="accordion-collapse-heading-1">
                    <button type="button" class="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-red-100 hover:bg-gray-100 gap-3" data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
                        <span>¿Qué es el sistema Multi-Tenant?</span>
                        <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </button>
                </h2>
                <div id="accordion-collapse-body-1" class="hidden" aria-labelledby="accordion-collapse-heading-1">
                    <div class="p-5 border border-b-0 border-gray-200 bg-white">
                        <p class="mb-2 text-gray-500">Es una arquitectura de software donde una sola instancia de la aplicación sirve a múltiples clientes (franquicias) simultáneamente.</p>
                    </div>
                </div>

                <h2 id="accordion-collapse-heading-2">
                    <button type="button" class="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 focus:ring-4 focus:ring-red-100 hover:bg-gray-100 gap-3" data-accordion-target="#accordion-collapse-body-2" aria-expanded="false" aria-controls="accordion-collapse-body-2">
                        <span>¿Cómo puedo registrar mi franquicia?</span>
                        <svg data-accordion-icon class="w-3 h-3 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </button>
                </h2>
                <div id="accordion-collapse-body-2" class="hidden" aria-labelledby="accordion-collapse-heading-2">
                    <div class="p-5 border border-b-0 border-gray-200 bg-white">
                        <p class="text-gray-500">Contáctanos a través del formulario de soporte o envíanos un correo directo a alianzas@foodrush.com.</p>
                    </div>
                </div>
                 <h2 id="accordion-collapse-heading-3">
                    <button type="button" class="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-gray-200 rounded-b-xl focus:ring-4 focus:ring-red-100 hover:bg-gray-100 gap-3" data-accordion-target="#accordion-collapse-body-3" aria-expanded="false" aria-controls="accordion-collapse-body-3">
                        <span>¿Es seguro realizar pagos?</span>
                        <svg data-accordion-icon class="w-3 h-3 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5 5 1 1 5"/>
                        </svg>
                    </button>
                </h2>
                <div id="accordion-collapse-body-3" class="hidden" aria-labelledby="accordion-collapse-heading-3">
                    <div class="p-5 border border-t-0 border-gray-200 bg-white">
                        <p class="text-gray-500">Sí, utilizamos pasarelas de pago con encriptación SSL de 256 bits.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

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
                        <li><a href="#faq" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="soporte.html" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="terminos.html" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="nosotros.html" class="hover:text-white hover:underline">Sobre Nosotros</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Blog</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Afíliate</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="border-t border-white/20 text-center py-4 text-xs text-white/60">
            &copy; 2025 FoodRush Inc. Todos los derechos reservados.
        </div>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({ duration: 800, once: true, offset: 100 });
    </script>
</body>
</html>