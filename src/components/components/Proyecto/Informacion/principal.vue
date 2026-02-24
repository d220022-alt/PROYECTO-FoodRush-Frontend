<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FoodRush | Inicio</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap" rel="stylesheet">
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
        .glass-effect {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .text-shadow { text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        
        /* Corrección para que el slide ocupe toda la pantalla sin espacios blancos */
        #default-carousel {
            height: 100vh;
            width: 100%;
            position: relative;
            z-index: 0;
        }
    </style>
</head>
<body class="font-sans antialiased bg-gray-50 overflow-x-hidden flex flex-col min-h-screen">

    <div class="bg-accent text-center py-2 text-sm font-bold tracking-widest uppercase relative z-50">
        ¡Tu Gusto Nuestra Felicidad!
    </div>

    <nav id="navbar" class="fixed w-full z-50 transition-all duration-300 py-4 bg-transparent text-white top-8">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
            <a href="#" class="flex items-center space-x-3 rtl:space-x-reverse group">
                <i class="fas fa-bolt text-3xl text-primary animate-pulse"></i>
                <span id="brand-text" class="self-center text-2xl font-extrabold whitespace-nowrap transition-colors">FOODRUSH</span>
            </a>
            
            <div class="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                <button data-modal-target="login-modal" data-modal-toggle="login-modal" class="text-white bg-primary hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-full text-sm px-6 py-2 text-center shadow-lg transform hover:scale-105 transition-transform">
                    Iniciar Sesión
                </button>
                <button data-collapse-toggle="navbar-sticky" type="button" class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm rounded-lg md:hidden hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gray-200 text-current" aria-controls="navbar-sticky" aria-expanded="false">
                    <span class="sr-only">Abrir menú</span>
                    <i class="fas fa-bars text-xl"></i>
                </button>
            </div>

            <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
                <ul class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
                    <li><a href="#" class="block py-2 px-3 text-current hover:text-primary md:p-0 font-bold border-b-2 border-transparent hover:border-primary transition-all">Inicio</a></li>
                    <li><a href="#marcas" class="block py-2 px-3 text-current hover:text-primary md:p-0 transition-all">Marcas</a></li>
                    <li><a href="nosotros.html" class="block py-2 px-3 text-current hover:text-primary md:p-0 transition-all">Nosotros</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <div id="default-carousel" class="relative w-full" data-carousel="slide">
        <div class="relative h-full overflow-hidden">
            <div class="hidden duration-1000 ease-in-out" data-carousel-item="active">
                <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop" class="absolute block w-full h-full object-cover brightness-50" alt="Pizza">
                <div class="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
                    <h1 class="text-5xl md:text-7xl font-extrabold mb-4 text-shadow" data-aos="zoom-in">BIENVENIDOS</h1>
                    <p class="text-xl md:text-2xl mb-8 max-w-2xl" data-aos="fade-up" data-aos-delay="200">Gestionamos tus antojos con la tecnología más rápida.</p>
                    <button class="bg-accent text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-yellow-400 transform hover:-translate-y-1 transition-all">Ver Menú</button>
                </div>
            </div>
            <div class="hidden duration-1000 ease-in-out" data-carousel-item>
                <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1469&auto=format&fit=crop" class="absolute block w-full h-full object-cover brightness-50" alt="Burger">
                <div class="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
                    <h1 class="text-5xl md:text-7xl font-extrabold mb-4 text-shadow">CALIDAD PREMIUM</h1>
                    <p class="text-xl md:text-2xl mb-8 max-w-2xl">Las mejores franquicias en un solo lugar.</p>
                    <button class="bg-primary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-red-800 transform hover:-translate-y-1 transition-all">Explorar</button>
                </div>
            </div>
        </div>
        
        <div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer z-30" onclick="document.getElementById('marcas').scrollIntoView({behavior: 'smooth'})">
             <i class="fas fa-chevron-down text-white text-3xl"></i>
        </div>
    </div>

    <section id="marcas" class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16" data-aos="fade-up">
                <span class="text-primary font-bold tracking-widest uppercase">Nuestras Aliados</span>
                <h2 class="text-4xl font-extrabold text-gray-900 mt-2">Top Franquicias</h2>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="100">
                    <div class="h-40 bg-yellow-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="McDonalds">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">McDonald's</h3>
                        <p class="text-gray-500 text-sm">Me encanta todo esto. Felicidad instantánea.</p>
                    </div>
                </div>
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="200">
                    <div class="h-40 bg-gray-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="KFC">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">KFC</h3>
                        <p class="text-gray-500 text-sm">Para chuparse los dedos. El mejor pollo.</p>
                    </div>
                </div>
                <div class="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" data-aos="zoom-in" data-aos-delay="300">
                    <div class="h-40 bg-blue-50 flex items-center justify-center p-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Burger_King_2020.svg" class="h-full object-contain filter group-hover:scale-110 transition-transform duration-500" alt="BK">
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2">Burger King</h3>
                        <p class="text-gray-500 text-sm">A la parrilla sabe mejor. Sabor real.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <div class="relative bg-fixed bg-center bg-cover h-[500px] flex items-center justify-center" style="background-image: url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1920&auto=format&fit=crop');">
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="relative z-10 p-8 glass-effect rounded-3xl max-w-3xl text-center mx-4" data-aos="zoom-in">
            <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Vive la experiencia FoodRush</h2>
            <p class="text-gray-200 text-lg mb-6">Conectamos tecnología de punta con los sabores que amas.</p>
            <button class="bg-transparent border-2 border-white text-white font-bold py-2 px-6 rounded-full hover:bg-white hover:text-black transition-all">Ver Más</button>
        </div>
    </div>

    <section class="py-20 bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-primary" data-aos="fade-up" data-aos-delay="100">
                    <div class="w-16 h-16 bg-red-100 text-primary rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Misión</h3>
                    <p class="text-gray-600">Revolucionar la entrega de comida rápida mediante una plataforma multi-inquilino eficiente.</p>
                </div>
                <div class="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-primary" data-aos="fade-up" data-aos-delay="200">
                    <div class="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                        <i class="fas fa-eye"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Visión</h3>
                    <p class="text-gray-600">Ser el ecosistema digital estándar para franquicias en toda la región.</p>
                </div>
                <div class="bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center group border-b-4 border-transparent hover:border-primary" data-aos="fade-up" data-aos-delay="300">
                    <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl group-hover:bg-dark group-hover:text-white transition-colors">
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
                        <li><a href="#" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2">Empresa</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Sobre Nosotros</a></li>
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
                            <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5" placeholder="nombre@foodrush.com" required>
                        </div>
                        <div>
                            <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Contraseña</label>
                            <input type="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5" required>
                        </div>
                        <button type="submit" class="w-full text-white bg-primary hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Entrar a tu cuenta</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        // Iniciar Animaciones
        AOS.init({ duration: 800, once: true });

        // Corrección del Menú en Scroll
        window.addEventListener('scroll', function() {
            const nav = document.getElementById('navbar');
            
            // Si baja más de 50px
            if (window.scrollY > 50) {
                // Quitar transparencia y poner blanco con sombra
                nav.classList.remove('bg-transparent', 'text-white', 'top-8');
                nav.classList.add('bg-white', 'text-gray-800', 'shadow-md', 'top-0');
            } else {
                // Volver a estado transparente original
                nav.classList.add('bg-transparent', 'text-white', 'top-8');
                nav.classList.remove('bg-white', 'text-gray-800', 'shadow-md', 'top-0');
            }
        });
    </script>
</body>
</html>