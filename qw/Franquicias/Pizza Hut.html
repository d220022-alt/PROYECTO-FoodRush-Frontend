<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pizza Hut | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        // Colores Oficiales Pizza Hut
                        ph: '#C8102E',        // Rojo Pizza Hut
                        'ph-dark': '#A30D25', // Rojo Oscuro (Hover)
                        'ph-black': '#231F20', // Negro/Gris oscuro
                        'ph-light': '#FEF2F2', // Fondo rojo muy pálido
                        'ph-gray': '#F9FAFB',
                        
                        // Rojo específico para el Rayo del logo
                        'logo-red': '#C8102E',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Sora', 'sans-serif'],
                    },
                    backgroundImage: {
                        'roof': "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200, 16, 46, 0.04) 10px, rgba(200, 16, 46, 0.04) 20px)"
                    }
                }
            }
        }
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F9FAFB; color: #1f2937; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* SLIDER */
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #C8102E; transform: scale(1.2); border: 2px solid white; }
        
        /* FILTROS */
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #4b5563; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; border-radius: 0 4px 4px 0; }
        .side-filter-btn:hover { color: #C8102E; background-color: #FEF2F2; }
        .side-filter-btn.active { color: #C8102E; font-weight: 700; border-left-color: #C8102E; background-color: #FEF2F2; }
        
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
        
        .size-card:hover { border-color: #C8102E; transform: translateY(-2px); }
        .size-card.selected { border-color: #C8102E; background-color: #FEF2F2; box-shadow: 0 4px 12px rgba(200, 16, 46, 0.15); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #C8102E; }
        
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #C8102E; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #C8102E; background-color: #FEF2F2; }

        .ph-opt-container { background-color: #f3f4f6; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
        .ph-opt { padding: 6px 12px; font-size: 0.75rem; font-weight: 600; color: #6b7280; border-radius: 8px; transition: all 0.2s ease; background-color: transparent; cursor: pointer; flex: 1; }
        .ph-opt:hover { background-color: #e5e7eb; color: #374151; }
        .ph-opt.active { background-color: white; color: #C8102E; box-shadow: 0 2px 4px rgba(0,0,0,0.08); font-weight: 700; }
        
        .filter-tab { transition: all 0.3s ease; }
        .filter-tab.active { background-color: #C8102E; color: white; border-color: #C8102E; box-shadow: 0 4px 6px -1px rgba(200, 16, 46, 0.3); }
        .filter-tab:not(.active):hover { border-color: #C8102E; color: #C8102E; background-color: #FEF2F2; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-[#F9FAFB]" onload="updateCartBadge()">

    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav class="bg-white/95 backdrop-blur-sm shadow-sm py-3 md:py-4 sticky top-0 z-50">
            <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
                
                <a href="index.html" class="flex items-center space-x-2 md:space-x-3 group">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-logo-red animate-pulse transform group-hover:scale-110 transition-transform"></i>
                    
                    <span class="self-center text-xl md:text-2xl font-extrabold whitespace-nowrap text-ph-black tracking-tight">FOOD<span class="text-ph">RUSH</span></span>
                </a>
    
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-ph focus-within:ring-1 focus-within:ring-ph transition-all">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                    <input type="text" id="searchInput" placeholder="Buscar Hut Cheese..." class="outline-none w-full text-sm bg-transparent" onkeyup="app.search(this.value)">
                </div>
                
                <div class="flex items-center gap-4 md:gap-6">
                    <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>

                    <button class="hover:text-ph transition relative text-xl text-gray-600 p-1" onclick="window.location.href='cart.html'">
                        <i class="fa-solid fa-cart-shopping"></i>
                        <span id="cart-count" class="absolute -top-1 -right-1 bg-ph text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm border border-white">0</span>
                    </button>
                    
                    <button class="hover:text-ph transition text-xl text-gray-600"><i class="fa-regular fa-user"></i></button>
                    
                    <a href="principal.html" class="hidden md:block ml-2"><span class="bg-ph-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-all shadow-md text-sm font-semibold">Home</span></a>
                </div>
            </div>
        </nav>
    </header>

    <div id="catalog-view" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-white border-b border-gray-100">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-ph-black z-10 order-2 md:order-1 relative overflow-hidden">
                <div class="absolute inset-0 bg-roof opacity-10"></div>
                <img src="https://upload.wikimedia.org/wikipedia/sco/d/d2/Pizza_Hut_logo.svg" 
                     alt="Pizza Hut Logo" class="h-32 md:h-56 w-auto object-contain drop-shadow-xl hover:scale-105 transition duration-500 bg-white rounded-full p-6 z-10 shadow-lg">
            </div>
            <div class="w-full md:w-3/5 relative bg-white h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=2938" alt="Pan Pizza"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?q=80&w=2825" alt="Pizza Share"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2940" alt="Cheesy Pizza"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:hidden"></div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Pizzas', this)" class="filter-tab active px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap">Pizzas</button>
                <button onclick="app.setCategory('Entradas', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Entradas y Pasta</button>
                <button onclick="app.setCategory('Postres', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Postres y Bebidas</button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-gray-100 h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-slate-800 mb-4 font-heading flex items-center justify-between">
                    Filtros <i class="fa-solid fa-filter text-ph text-sm md:hidden"></i>
                </h3>
                <div id="dynamic-sidebar-content" class="space-y-2 md:space-y-4 text-sm md:text-base"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-ph transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-ph group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-ph-light rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border border-red-100 overflow-hidden">
                    <div class="absolute inset-0 bg-roof opacity-20"></div>
                    <img id="detail-img" src="" alt="Product" class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading border-b border-gray-100 pb-2">Elige tu Masa</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Pan')">
                            <div class="size-card" id="size-Pan"><i class="fa-solid fa-pizza-slice text-xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Pan Pizza</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Pan">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Tradicional')">
                            <div class="size-card selected" id="size-Tradicional"><i class="fa-solid fa-pizza-slice text-2xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Tradicional</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Tradicional">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Queso')">
                            <div class="size-card" id="size-Queso"><i class="fa-solid fa-cheese text-3xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Orilla Queso</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Queso">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-ph mb-2 tracking-widest uppercase" id="detail-category-title">Pizza</h2>
                    <h1 id="detail-title" class="text-3xl md:text-4xl font-bold text-slate-900 mb-3 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-yellow-400 gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">Calidad Hut</span>
                    </div>

                    <p id="detail-desc" class="text-gray-600 text-sm md:text-base leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wide">Precio</span>
                        <span id="detail-price-display" class="text-2xl font-bold text-ph-black">$0</span>
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
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-utensils text-ph"></i> Hazla Suprema
                    </h3>
                    
                    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fa-solid fa-cheese"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Queso Extra</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('cheese-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="cheese-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('cheese-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i class="fa-solid fa-circle"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Pepperoni</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('pep-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="pep-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('pep-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><i class="fa-solid fa-bowl-food"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Salsa Dip</span></div>
                            </div>
                            <div class="ph-opt-container">
                                <button class="ph-opt active" onclick="app.selectDipOption(this)">No</button>
                                <button class="ph-opt" onclick="app.selectDipOption(this)">Sí</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] md:shadow-none">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-ph-black">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-ph hover:bg-ph-dark text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-red-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-utensils"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

     <footer class="bg-[#C8102E] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-slate-900 font-bold text-xl italic">Food</span>
                    <span class="text-ph font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-ph transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-ph transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-ph transition"><i class="fa-brands fa-twitter"></i></a>
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
            cart: JSON.parse(localStorage.getItem('foodrush_ph_cart')) || [],
            currentCategory: 'Pizzas',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Pan',
            sizePrices: { Pan: 0, Tradicional: 0, Queso: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            products: [
                { id: 1, name: "Super Supreme", category: "Pizzas", type: "Especialidad", price: 239, spec: "meat", img: "https://www.pizzahut.co.uk/order/images/products/super-supreme.jpg", desc: "La combinación perfecta: Pepperoni, carne de res, jamón, champiñones, pimiento, cebolla y aceitunas." },
                { id: 2, name: "Meat Lover's", category: "Pizzas", type: "Especialidad", price: 249, spec: "meat", img: "https://www.pizzahut.co.uk/order/images/products/meat-feast.jpg", desc: "Para los amantes de la carne: Pepperoni, jamón, carne de res, salchicha italiana y tocino." },
                { id: 3, name: "Pepperoni Lover's", category: "Pizzas", type: "Clasica", price: 219, spec: "meat", img: "https://www.pizzahut.co.uk/order/images/products/pepperoni-feast.jpg", desc: "Doble porción de pepperoni y extra queso mozzarella." },
                { id: 4, name: "Hawaiana", category: "Pizzas", type: "Clasica", price: 199, spec: "fruit", img: "https://www.pizzahut.co.uk/order/images/products/hawaiian.jpg", desc: "Jamón, piña y queso extra. Un clásico tropical." },
                { id: 5, name: "Cheesy Pops", category: "Pizzas", type: "Borde", price: 289, spec: "cheese", img: "https://i.pinimg.com/originals/a9/0b/9a/a90b9a5c8c5c7c5c8c5c7c5c8c5c7c5c.jpg", desc: "Pizza con borde de 28 bocaditos rellenos de queso. ¡Divertida y deliciosa!" },
                { id: 6, name: "Palitos de Pan", category: "Entradas", type: "Pan", price: 69, spec: "snack", img: "https://www.pizzahut.com/assets/w/images/product/sides/breadsticks.2a1a1a1a1a1a1a1a.jpg", desc: "Crujientes por fuera, suaves por dentro, sazonados con ajo y queso parmesano. Incluye salsa marinara." },
                { id: 7, name: "Quepapas", category: "Entradas", type: "Papas", price: 59, spec: "snack", img: "https://www.pizzahut.com.sv/images/products/entradas/quepapas.png", desc: "Bolitas de papa rellenas de queso y jalapeño." },
                { id: 8, name: "Alitas (Tradicionales)", category: "Entradas", type: "Pollo", price: 149, spec: "meat", img: "https://www.pizzahut.com/assets/w/images/product/sides/wings_traditional.jpg", desc: "Alitas de pollo bañadas en tu salsa favorita: BBQ, Buffalo o Lemon Pepper." },
                { id: 9, name: "Pasta Bolognesa", category: "Entradas", type: "Pasta", price: 99, spec: "pasta", img: "https://www.pizzahut.com.sv/images/products/pastas/bolognesa.png", desc: "Pasta rotini con nuestra salsa de carne bolognesa y queso gratinado." },
                { id: 10, name: "Canelazos", category: "Postres", type: "Postre", price: 55, spec: "sweet", img: "https://www.pizzahut.com/assets/w/images/product/desserts/cinnamon_sticks.jpg", desc: "Palitos de pan cubiertos con azúcar y canela, acompañados de glaseado dulce." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Pizzas');
            },

            // --- RENDER SIDEBAR ---
            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let html = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Pizzas') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-ph transition text-sm uppercase tracking-wide">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Clasica')}" onclick="app.toggleTypeFilter('Clasica')">Clásicas</p><p class="side-filter-btn ${isActiveType('Especialidad')}" onclick="app.toggleTypeFilter('Especialidad')">Especialidades</p><p class="side-filter-btn ${isActiveType('Borde')}" onclick="app.toggleTypeFilter('Borde')">Borde Relleno</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-ph transition text-sm uppercase tracking-wide">INGREDIENTE <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('meat')}" onclick="app.toggleSpecFilter('meat')">Carnes</p><p class="side-filter-btn ${isActiveSpec('fruit')}" onclick="app.toggleSpecFilter('fruit')">Hawaiana</p></div></details>`;
                } else if (this.currentCategory === 'Entradas') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-ph transition text-sm uppercase tracking-wide">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Pan')}" onclick="app.toggleTypeFilter('Pan')">Panes</p><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Alitas</p><p class="side-filter-btn ${isActiveType('Papas')}" onclick="app.toggleTypeFilter('Papas')">Papas</p><p class="side-filter-btn ${isActiveType('Pasta')}" onclick="app.toggleTypeFilter('Pasta')">Pastas</p></div></details>`;
                } else {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-ph transition text-sm uppercase tracking-wide">DULCES <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Postre')}" onclick="app.toggleTypeFilter('Postre')">Postres</p></div></details>`;
                }
                html += `<div class="pt-6 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML = html;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-200 text-gray-600 px-5 py-2 rounded-full font-semibold hover:border-ph hover:text-ph transition whitespace-nowrap text-sm md:text-base"; });
                if(btn) btn.className = "filter-tab active bg-ph text-white px-5 py-2 rounded-full font-semibold shadow transition whitespace-nowrap text-sm md:text-base";
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
                if (items.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center"><i class="fa-solid fa-pizza-slice text-4xl mb-4 text-gray-300"></i>No se encontraron productos.</div>`; return; }
                items.forEach(item => {
                    const html = `
                    <div class="fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-ph transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden" onclick="app.openProductDetail(${item.id})">
                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                             <div class="absolute inset-0 bg-ph-light rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-50"></div>
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10">
                        </div>
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-ph transition line-clamp-1 font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-ph-light transition border border-transparent group-hover:border-ph-light">
                                <span class="text-slate-800 font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-ph shadow-sm hover:bg-ph hover:text-white transition flex items-center justify-center border border-gray-100"><i class="fa-solid fa-plus"></i></button>
                            </div>
                        </div>
                    </div>`;
                    grid.innerHTML += html;
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
                this.currentSize = 'Pan';
                const base = product.price;
                this.sizePrices = { Pan: base, Tradicional: base, Queso: Math.round(base * 1.3) };

                document.getElementById('detail-category-title').innerText = product.category;
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc;
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Pan}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (product.category === 'Pizzas') {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Pan').innerText = `$${this.sizePrices.Pan}`;
                    document.getElementById('price-label-Tradicional').innerText = `$${this.sizePrices.Tradicional}`;
                    document.getElementById('price-label-Queso').innerText = `$${this.sizePrices.Queso}`;
                    this.selectSize('Pan');
                    
                    document.getElementById('cheese-qty').innerText = "0";
                    document.getElementById('pep-qty').innerText = "0";
                    this.selectDipOption(document.querySelector('.ph-opt.active'));

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
                ['Pan', 'Tradicional', 'Queso'].forEach(s => {
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

            selectDipOption: function(btn) {
                if(!btn) return;
                btn.parentElement.querySelectorAll('.ph-opt').forEach(b => b.classList.remove('active'));
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
                if (this.currentProduct.category === 'Pizzas') unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            addToCartFromDetail: function() {
                let unitPrice = this.currentProduct.category === 'Pizzas' ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = this.currentProduct.category === 'Pizzas' ? this.currentSize : "Normal";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_ph_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_ph_cart', JSON.stringify(cart));
                this.updateCartBadge();
                Swal.fire({ icon: 'success', title: '¡Añadido!', showConfirmButton: false, timer: 1000, background: '#C8102E', color: '#fff', toast: true, position: 'top-end' });
                this.goBack();
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_ph_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>