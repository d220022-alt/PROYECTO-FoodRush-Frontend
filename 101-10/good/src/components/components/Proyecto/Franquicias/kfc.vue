<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KFC | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#E4002B', // Rojo KFC como primario
                        // Colores de Marca
                        kfc: '#E4002B',       // Rojo Vibrante
                        'kfc-dark': '#B90023', // Rojo Oscuro
                        'kfc-black': '#2D2926', // Negro Oficial
                        'kfc-light': '#FDF2F4', // Fondo suave
                        'kfc-gray': '#F8F8F8',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Sora', 'sans-serif'],
                    },
                    backgroundImage: {
                        'stripes': "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(228, 0, 43, 0.03) 10px, rgba(228, 0, 43, 0.03) 20px)"
                    }
                }
            }
        }
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F8F8F8; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* SLIDER */
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #E4002B; transform: scale(1.2); border: 2px solid white; }
        
        /* FILTROS */
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #4b5563; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; border-radius: 0 4px 4px 0; }
        .side-filter-btn:hover { color: #E4002B; background-color: #FDF2F4; }
        .side-filter-btn.active { color: #E4002B; font-weight: 700; border-left-color: #E4002B; background-color: #FDF2F4; }
        
        details > summary { list-style: none; outline: none; }
        details > summary::-webkit-details-marker { display: none; }
        details summary i { transition: transform 0.3s ease; }
        details[open] summary i { transform: rotate(180deg); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* CARDS */
        .size-card {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border: 2px solid #e5e7eb; border-radius: 12px;
            width: 80px; height: 90px;
            cursor: pointer; transition: all 0.2s;
            position: relative; background-color: white;
        }
        @media (min-width: 768px) { .size-card { width: 90px; height: 100px; } }
        
        .size-card:hover { border-color: #E4002B; transform: translateY(-2px); }
        .size-card.selected { border-color: #E4002B; background-color: #FDF2F4; box-shadow: 0 4px 12px rgba(228, 0, 43, 0.1); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #E4002B; }
        
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #E4002B; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #E4002B; background-color: #FDF2F4; }

        .opt-container { background-color: #f3f4f6; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
        .opt-btn { padding: 6px 12px; font-size: 0.75rem; font-weight: 600; color: #6b7280; border-radius: 8px; transition: all 0.2s ease; background-color: transparent; cursor: pointer; flex: 1; }
        .opt-btn:hover { background-color: #e5e7eb; color: #374151; }
        .opt-btn.active { background-color: white; color: #E4002B; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: 700; }
        
        .filter-tab { transition: all 0.3s ease; }
        .filter-tab.active { background-color: #E4002B; color: white; border-color: #E4002B; box-shadow: 0 4px 6px -1px rgba(228, 0, 43, 0.3); }
        .filter-tab:not(.active):hover { border-color: #E4002B; color: #E4002B; background-color: #FDF2F4; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-[#F8F8F8]" onload="updateCartBadge()">

    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav class="bg-white/95 backdrop-blur-sm shadow-sm py-3 md:py-4 sticky top-0 z-50">
            <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
                
                <a href="index.vue" class="flex items-center space-x-2 md:space-x-3 group">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-kfc animate-pulse transform group-hover:scale-110 transition-transform"></i>
                    <span class="self-center text-xl md:text-2xl font-extrabold whitespace-nowrap text-kfc-black tracking-tight">FOOD<span class="text-kfc">RUSH</span></span>
                </a>
    
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-kfc focus-within:ring-1 focus-within:ring-kfc transition-all">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                    <input type="text" id="searchInput" placeholder="Buscar pollo crujiente..." class="outline-none w-full text-sm bg-transparent" onkeyup="app.search(this.value)">
                </div>
                
                <div class="flex items-center gap-4 md:gap-6">
                    <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>

                    <button class="hover:text-kfc transition relative text-xl text-gray-600 p-1" onclick="window.location.href='cart.vue'">
                        <i class="fa-solid fa-cart-shopping"></i>
                        <span id="cart-count" class="absolute -top-1 -right-1 bg-kfc text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm border border-white">0</span>
                    </button>
                    
                    <button class="hover:text-kfc transition text-xl text-gray-600"><i class="fa-regular fa-user"></i></button>
                    
                    <a href="principal.vue" class="hidden md:block ml-2"><span class="bg-kfc-black text-white px-5 py-2 rounded-full hover:bg-black transition-all shadow-md text-sm font-semibold">Home</span></a>
                </div>
            </div>
        </nav>
    </header>

    <div id="catalog-view" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-white border-b border-gray-100">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-kfc z-10 order-2 md:order-1 relative overflow-hidden">
                <div class="absolute inset-0 bg-stripes opacity-20"></div>
                <img src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg" 
                     alt="KFC Logo" class="h-32 md:h-56 w-auto object-contain drop-shadow-xl hover:scale-105 transition duration-500 bg-white rounded-xl p-4 z-10 shadow-lg">
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1513639776629-7b611594e29b?q=80&w=2940" alt="Pollo Frito"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=2940" alt="Sandwich KFC"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=2880" alt="Combo KFC"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-kfc/60 to-transparent md:hidden"></div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Pollo', this)" class="filter-tab active px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap">Pollo y Combos</button>
                <button onclick="app.setCategory('Acompañantes', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Acompañantes</button>
                <button onclick="app.setCategory('Postres', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Postres y Bebidas</button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-gray-100 h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-kfc-black mb-4 font-heading flex items-center justify-between">
                    Filtros <i class="fa-solid fa-filter text-kfc text-sm md:hidden"></i>
                </h3>
                <div id="dynamic-sidebar-content" class="space-y-2 md:space-y-4 text-sm md:text-base"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-kfc transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-kfc group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-kfc-light rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border border-red-100 overflow-hidden">
                    <div class="absolute inset-0 bg-stripes opacity-20"></div>
                    <img id="detail-img" src="" alt="Product" class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-kfc-black mb-4 font-heading border-b border-gray-100 pb-2">Elige el tamaño</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Regular')">
                            <div class="size-card" id="size-Regular"><i class="fa-solid fa-user text-xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Individual</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Regular">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Mediano')">
                            <div class="size-card selected" id="size-Mediano"><i class="fa-solid fa-user-group text-2xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Mediano</span>
                                <span class="block text-xs text-gray-400 font-medium" id="price-label-Mediano">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Grande')">
                            <div class="size-card" id="size-Grande"><i class="fa-solid fa-users text-3xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Familiar</span>
                                <span class="block text-xs text-gray-400 font-medium" id="price-label-Grande">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-kfc mb-2 tracking-widest uppercase" id="detail-category-title">Pollo</h2>
                    <h1 id="detail-title" class="text-3xl md:text-4xl font-bold text-kfc-black mb-3 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-yellow-400 gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">Receta Secreta del Coronel</span>
                    </div>

                    <p id="detail-desc" class="text-gray-600 text-sm md:text-base leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wide">Precio</span>
                        <span id="detail-price-display" class="text-2xl font-bold text-kfc-black">$0</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button onclick="app.changeQty(-1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">-</button>
                            <span id="detail-qty" class="w-8 text-center font-bold text-lg text-slate-800">1</span>
                            <button onclick="app.changeQty(1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">+</button>
                        </div>
                    </div>
                </div>

                <div id="customization-options" class="flex-grow">
                    <h3 class="font-bold text-lg text-kfc-black mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-drumstick-bite text-kfc"></i> Personaliza tu pedido
                    </h3>
                    
                    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-kfc"><i class="fa-solid fa-fire"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Receta</span></div>
                            </div>
                            <div class="opt-container">
                                <button class="opt-btn active" onclick="app.selectRecipeOption(this)">Original</button>
                                <button class="opt-btn" onclick="app.selectRecipeOption(this)">Crispy</button>
                                <button class="opt-btn" onclick="app.selectRecipeOption(this)">BBQ</button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600"><i class="fa-solid fa-bread-slice"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Biscuits Extra</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('biscuit-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="biscuit-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('biscuit-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><i class="fa-solid fa-pepper-hot"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Salsas</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('sauce-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="sauce-qty" class="font-bold text-slate-700 w-4 text-center text-sm">2</span><button onclick="app.updateIngredient('sauce-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] md:shadow-none">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-kfc-black">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-kfc hover:bg-kfc-dark text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-red-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Cubo</span>
                        <i class="fa-solid fa-bucket"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

     <footer class="bg-[#E4002B] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-slate-900 font-bold text-xl italic">Food</span>
                    <span class="text-kfc font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-kfc transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-kfc transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-kfc transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex flex-col md:flex-row gap-8 md:gap-16 text-sm text-left md:text-right w-full md:w-auto">
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/30 pb-2 md:border-none inline-block w-full md:w-auto">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/30 pb-2 md:border-none inline-block w-full md:w-auto">Empresa</h4>
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


    <script>
        const app = {
            cart: JSON.parse(localStorage.getItem('foodrush_kfc_cart')) || [],
            currentCategory: 'Pollo',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Mediano',
            sizePrices: { Regular: 0, Mediano: 0, Grande: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            products: [
                { id: 1, name: "Cubeta 12 Piezas", category: "Pollo", type: "Pollo", price: 550, spec: "original", img: "https://kfc.com.pa/images/products/601004.png", desc: "12 piezas de nuestro legendario pollo con la Receta Secreta de 11 hierbas y especias." },
                { id: 2, name: "Big Crunch Sandwich", category: "Pollo", type: "Sandwich", price: 180, spec: "crispy", img: "https://kfc.com.pa/images/products/606014.png", desc: "Filete de pechuga extra crujiente, lechuga fresca y mayonesa en pan con ajonjolí." },
                { id: 3, name: "Ke-Tiras (Tenders)", category: "Pollo", type: "Tenders", price: 210, spec: "crispy", img: "https://kfc.com.pa/images/products/604005.png", desc: "Tiras de pechuga de pollo 100% real, empanizadas y crujientes." },
                { id: 4, name: "Hot Wings (6 pzas)", category: "Pollo", type: "Pollo", price: 150, spec: "spicy", img: "https://kfc.com.pa/images/products/605006.png", desc: "Alitas picantes empanizadas, perfectas para los amantes del picante." },
                { id: 5, name: "Puré de Papas", category: "Acompañantes", type: "Puré", price: 60, spec: "classic", img: "https://kfc.com.pa/images/products/607001.png", desc: "Cremoso puré de papas bañado en nuestro inconfundible Gravy." },
                { id: 6, name: "Ensalada Coleslaw", category: "Acompañantes", type: "Ensalada", price: 60, spec: "fresh", img: "https://kfc.com.pa/images/products/607002.png", desc: "Ensalada de repollo y zanahoria con nuestro aderezo dulce y cremoso." },
                { id: 7, name: "Biscuits (4 pzas)", category: "Acompañantes", type: "Pan", price: 80, spec: "classic", img: "https://kfc.com.pa/images/products/607004.png", desc: "Nuestros famosos panecillos horneados, dorados y calientitos." },
                { id: 8, name: "Papas Fritas", category: "Acompañantes", type: "Papas", price: 70, spec: "classic", img: "https://kfc.com.pa/images/products/607003.png", desc: "Papas fritas sazonadas al estilo KFC." },
                { id: 9, name: "Krusher Oreo", category: "Postres", type: "Helado", price: 95, spec: "sweet", img: "https://s3-ap-southeast-1.amazonaws.com/files.kfcpku.com/uploads/media/2023/04/10/2400-KRUSHER-COOKIES---CREAM.png", desc: "Bebida helada con trozos reales de galleta Oreo." },
                { id: 10, name: "Refresco", category: "Postres", type: "Bebida", price: 50, spec: "cold", img: "https://kfc.com.pa/images/products/608001.png", desc: "Refresco gaseoso frío (Pepsi, 7Up, Mirinda)." },
                { id: 11, name: "Popcorn Chicken", category: "Pollo", type: "Pollo", price: 130, spec: "snack", img: "https://kfc.com.pa/images/products/603001.png", desc: "Pequeños trozos de pechuga de pollo empanizados y divertidos de comer." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Pollo');
            },

            // --- RENDER SIDEBAR ---
            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let.vue = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Pollo') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-kfc transition text-sm uppercase tracking-wide">TIPO DE COMIDA <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Piezas de Pollo</p><p class="side-filter-btn ${isActiveType('Sandwich')}" onclick="app.toggleTypeFilter('Sandwich')">Sandwiches</p><p class="side-filter-btn ${isActiveType('Tenders')}" onclick="app.toggleTypeFilter('Tenders')">Tenders y Nuggets</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-kfc transition text-sm uppercase tracking-wide">ESTILO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('original')}" onclick="app.toggleSpecFilter('original')">Receta Original</p><p class="side-filter-btn ${isActiveSpec('crispy')}" onclick="app.toggleSpecFilter('crispy')">Crujiente (Crispy)</p><p class="side-filter-btn ${isActiveSpec('spicy')}" onclick="app.toggleSpecFilter('spicy')">Picante</p></div></details>`;
                } else if (this.currentCategory === 'Acompañantes') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-kfc transition text-sm uppercase tracking-wide">CLASICOS <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Puré')}" onclick="app.toggleTypeFilter('Puré')">Puré</p><p class="side-filter-btn ${isActiveType('Papas')}" onclick="app.toggleTypeFilter('Papas')">Papas</p><p class="side-filter-btn ${isActiveType('Ensalada')}" onclick="app.toggleTypeFilter('Ensalada')">Ensalada</p><p class="side-filter-btn ${isActiveType('Pan')}" onclick="app.toggleTypeFilter('Pan')">Biscuits</p></div></details>`;
                } else {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-kfc transition text-sm uppercase tracking-wide">EXTRAS <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Helado')}" onclick="app.toggleTypeFilter('Helado')">Helados</p><p class="side-filter-btn ${isActiveType('Bebida')}" onclick="app.toggleTypeFilter('Bebida')">Bebidas</p></div></details>`;
                }
               .vue += `<div class="pt-6 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML =.vue;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-200 text-gray-600 px-5 py-2 rounded-full font-semibold hover:border-kfc hover:text-kfc transition whitespace-nowrap text-sm md:text-base"; });
                if(btn) btn.className = "filter-tab active bg-kfc text-white px-5 py-2 rounded-full font-semibold shadow transition whitespace-nowrap text-sm md:text-base";
                this.renderSidebar(); this.applyFilters();
            },
            applyFilters: function(searchText = document.getElementById('searchInput').value) {
                let filtered = this.products.filter(p => p.category === this.currentCategory);
                if (searchText) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));
                if (this.activeTypeFilters.length > 0) filtered = filtered.filter(p => this.activeTypeFilters.includes(p.type));
                if (this.activeSpecFilter) filtered = filtered.filter(p => p.spec === this.activeSpecFilter);
                this.render(filtered);
            },
            resetFilters: function() { document.getElementById('searchInput').value = ''; this.activeTypeFilters = []; this.activeSpecFilter = null; this.renderSidebar(); this.applyFilters(); },

            render: function(items) {
                const grid = document.getElementById('product-grid');
                grid.innerHTML = "";
                if (items.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center"><i class="fa-solid fa-drumstick-bite text-4xl mb-4 text-gray-300"></i>No se encontraron productos.</div>`; return; }
                items.forEach(item => {
                    const.vue = `
                    <div class="fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-kfc transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden" onclick="app.openProductDetail(${item.id})">
                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                             <div class="absolute inset-0 bg-kfc-light rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-50"></div>
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10">
                        </div>
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-kfc transition line-clamp-1 font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-kfc-light transition border border-transparent group-hover:border-kfc-light">
                                <span class="text-slate-800 font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-kfc shadow-sm hover:bg-kfc hover:text-white transition flex items-center justify-center border border-gray-100"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </div>
                    </div>`;
                    grid.innerHTML +=.vue;
                });
            },

            initSlider: function() { this.slides = document.querySelectorAll('.slide'); this.dots = document.querySelectorAll('.dot'); this.startSlideShow(); },
            startSlideShow: function() { this.slideInterval = setInterval(() => { this.nextSlide(); }, 4000); },
            nextSlide: function() { let next = (this.currentSlide + 1) % this.slides.length; this.goToSlide(next); },
            goToSlide: function(index) { this.slides[this.currentSlide].classList.remove('active'); this.dots[this.currentSlide].classList.remove('active'); this.currentSlide = index; this.slides[this.currentSlide].classList.add('active'); this.dots[this.currentSlide].classList.add('active'); clearInterval(this.slideInterval); this.startSlideShow(); },

            openProductDetail: function(id) {
                const product = this.products.find(p => p.id === id);
                if (!product) return;
                this.currentProduct = product;
                this.currentQty = 1;
                this.currentSize = 'Mediano';
                const base = product.price;
                this.sizePrices = { Regular: base, Mediano: Math.round(base * 1.35), Grande: Math.round(base * 1.65) };

                document.getElementById('detail-category-title').innerText = product.category;
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc;
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Mediano}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (product.category === 'Pollo') {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Regular').innerText = `$${this.sizePrices.Regular}`;
                    document.getElementById('price-label-Mediano').innerText = `$${this.sizePrices.Mediano}`;
                    document.getElementById('price-label-Grande').innerText = `$${this.sizePrices.Grande}`;
                    this.selectSize('Mediano');
                    
                    document.getElementById('biscuit-qty').innerText = "0";
                    document.getElementById('sauce-qty').innerText = "2";
                    this.selectRecipeOption(document.querySelector('.opt-btn.active'));

                } else {
                    sizeSection.classList.add('hidden');
                    custSection.classList.add('hidden');
                    document.getElementById('detail-price-display').innerText = `$${product.price}`;
                }

                this.updateTotal();
                document.getElementById('catalog-view').classList.add('hidden');
                document.getElementById('product-detail-view').classList.remove('hidden');
                window.scrollTo(0,0);
            },

            selectSize: function(size) {
                this.currentSize = size;
                ['Regular', 'Mediano', 'Grande'].forEach(s => {
                    const el = document.getElementById(`size-${s}`);
                    if (s === size) {
                        el.classList.add('selected');
                        document.getElementById('detail-price-display').innerText = `$${this.sizePrices[s]}`;
                    } else {
                        el.classList.remove('selected');
                    }
                });
                this.updateTotal();
            },

            selectRecipeOption: function(btn) {
                if(!btn) return;
                btn.parentElement.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            },

            updateIngredient: function(id, change) {
                const el = document.getElementById(id);
                let val = parseInt(el.innerText);
                if (val + change >= 0) el.innerText = val + change;
            },

            goBack: function() { document.getElementById('product-detail-view').classList.add('hidden'); document.getElementById('catalog-view').classList.remove('hidden'); },
            changeQty: function(amount) { if (this.currentQty + amount >= 1) { this.currentQty += amount; document.getElementById('detail-qty').innerText = this.currentQty; this.updateTotal(); } },
            updateTotal: function() {
                let unitPrice;
                if (this.currentProduct.category === 'Pollo') unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            
            addToCartFromDetail: function() {
                let unitPrice = this.currentProduct.category === 'Pollo' ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = this.currentProduct.category === 'Pollo' ? this.currentSize : "Estándar";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_kfc_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_kfc_cart', JSON.stringify(cart));
                this.updateCartBadge();
                Swal.fire({ icon: 'success', title: '¡Añadido al cubo!', showConfirmButton: false, timer: 1000, background: '#E4002B', color: '#fff', toast: true, position: 'top-end' });
                this.goBack();
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_kfc_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>