<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>McDonald's | FoodRush</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        mcdonalds: '#DA291C',
                        'mcdonalds-dark': '#B01E14',
                        'mcdonalds-yellow': '#FFC72C',
                        'mcdonalds-light': '#FFF5F5',
                        'mcdonalds-warm': '#FFFAEB',
                        dark: '#27251F',
                    },
                    fontFamily: {
                        sans: ['Poppins', 'sans-serif'],
                        heading: ['Sora', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <style>
        body { font-family: 'Poppins', sans-serif; background-color: #FAFAFA; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #FFC72C; transform: scale(1.2); border: 2px solid white; }
        
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #4b5563; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; border-radius: 0 4px 4px 0;}
        .side-filter-btn:hover { color: #DA291C; background-color: #FFF5F5; }
        .side-filter-btn.active { color: #DA291C; font-weight: 700; border-left-color: #DA291C; background-color: #FFF5F5; }
        
        details > summary { list-style: none; outline: none; }
        details > summary::-webkit-details-marker { display: none; }
        details summary i { transition: transform 0.3s ease; }
        details[open] summary i { transform: rotate(180deg); }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .size-card {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border: 2px solid #e5e7eb; border-radius: 12px;
            width: 80px; height: 90px;
            cursor: pointer; transition: all 0.2s;
            position: relative; background-color: white;
        }
        @media (min-width: 768px) { .size-card { width: 90px; height: 100px; } }

        .size-card:hover { border-color: #DA291C; transform: translateY(-3px); }
        .size-card.selected { border-color: #DA291C; background-color: #FFF5F5; box-shadow: 0 4px 12px rgba(218, 41, 28, 0.1); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #DA291C; }
        
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #DA291C; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #DA291C; background-color: #FFF5F5; }

        .ice-opt-container { background-color: #f3f4f6; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
        .ice-opt { padding: 6px 12px; font-size: 0.75rem; font-weight: 600; color: #6b7280; border-radius: 8px; transition: all 0.2s ease; background-color: transparent; cursor: pointer; flex: 1; }
        .ice-opt:hover { background-color: #e5e7eb; color: #374151; }
        .ice-opt.active { background-color: white; color: #DA291C; box-shadow: 0 2px 4px rgba(0,0,0,0.08); font-weight: 700; }

        .filter-tab { transition: all 0.3s ease; }
        .filter-tab.active { background-color: #DA291C; color: white; border-color: #DA291C; box-shadow: 0 4px 10px -2px rgba(218, 41, 28, 0.4); }
        .filter-tab:not(.active):hover { border-color: #DA291C; color: #DA291C; background-color: #FFF5F5; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-[#FAFAFA]" onload="updateCartBadge()">

    <nav class="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
            
            <a href="index.html" class="flex items-center space-x-2 md:space-x-3 group">
                <i class="fas fa-bolt text-2xl md:text-3xl text-mcdonalds animate-pulse transform group-hover:scale-110 transition-transform"></i>
                <span class="self-center text-xl md:text-2xl font-extrabold whitespace-nowrap text-dark tracking-tight">FOODRUSH</span>
            </a>
   
            <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-mcdonalds focus-within:ring-1 focus-within:ring-mcdonalds transition-all">
                <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                <input type="text" id="searchInput" placeholder="¿Qué se te antoja hoy?" class="outline-none w-full text-sm bg-transparent" onkeyup="app.search(this.value)">
            </div>
            
            <div class="flex items-center gap-4 md:gap-6">
                <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>

                <button class="hover:text-mcdonalds transition relative text-xl text-gray-600 p-1" onclick="window.location.href='cart.html'">
                    <i class="fa-solid fa-cart-shopping"></i>
                    <span id="cart-count" class="absolute -top-1 -right-1 bg-mcdonalds-yellow text-slate-900 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm border border-white">0</span>
                </button>
                
                <button class="hover:text-mcdonalds transition text-xl text-gray-600"><i class="fa-regular fa-user"></i></button>
                
                <a href="principal.html" class="hidden md:block ml-2"><span class="bg-dark text-white px-5 py-2 rounded-full hover:bg-black transition-all shadow-md text-sm font-semibold">Home</span></a>
            </div>
        </div>
    </nav>

    <div id="catalog-view" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-mcdonalds border-b border-mcdonalds-dark">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-mcdonalds z-10 order-2 md:order-1">
                <div class="bg-white rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition duration-500">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/1200px-McDonald%27s_Golden_Arches.svg.png" 
                        alt="McDonalds Logo" class="h-24 md:h-40 object-contain">
                </div>
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2865" alt="Burger"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1552895638-f7fe08d2f7d5?q=80&w=2894" alt="Fries"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1626202158925-300e8822986d?q=80&w=2940" alt="Ice Cream"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-mcdonalds/60 to-transparent md:hidden"></div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Hamburguesas', this)" class="filter-tab active px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap">Hamburguesas</button>
                <button onclick="app.setCategory('Complementos', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Complementos</button>
                <button onclick="app.setCategory('Postres', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Postres y Café</button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-gray-100 h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-dark mb-4 font-heading flex items-center justify-between">
                    Filtros <i class="fa-solid fa-filter text-mcdonalds text-sm md:hidden"></i>
                </h3>
                <div id="dynamic-sidebar-content" class="space-y-2 md:space-y-4 text-sm md:text-base"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-mcdonalds transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-mcdonalds group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-mcdonalds-light rounded-3xl flex items-center justify-center p-8 h-72 md:h-[500px] border border-red-100 overflow-hidden">
                    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
                    <img id="detail-img" src="" alt="Product" class="max-h-full max-w-full object-contain drop-shadow-2xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-dark mb-4 font-heading border-b border-gray-100 pb-2">Elige el tamaño</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Regular')">
                            <div class="size-card" id="size-Regular"><i class="fa-solid fa-burger text-xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Regular</span>
                                <span class="block text-xs text-gray-400 font-medium" id="price-label-Regular">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Mediano')">
                            <div class="size-card selected" id="size-Mediano"><i class="fa-solid fa-burger text-2xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Mediano</span>
                                <span class="block text-xs text-gray-400 font-medium" id="price-label-Mediano">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Grande')">
                            <div class="size-card" id="size-Grande"><i class="fa-solid fa-burger text-3xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Grande</span>
                                <span class="block text-xs text-gray-400 font-medium" id="price-label-Grande">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-mcdonalds mb-2 tracking-widest uppercase" id="detail-category-title">Hamburguesa</h2>
                    <h1 id="detail-title" class="text-3xl md:text-4xl font-bold text-dark mb-3 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-mcdonalds-yellow gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">(260 Reviews)</span>
                    </div>

                    <p id="detail-desc" class="text-gray-500 text-sm md:text-base leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase">Precio</span>
                        <span id="detail-price-display" class="text-3xl font-bold text-dark">$0</span>
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
                    <h3 class="font-bold text-lg text-dark mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-mcdonalds"></i> Personaliza tu pedido
                    </h3>
                    
                    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><i class="fa-solid fa-carrot"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Pepinillos</span></div>
                            </div>
                            
                            <div class="ice-opt-container">
                                <button class="ice-opt active" onclick="app.selectIceOption(this)">Normal</button>
                                <button class="ice-opt" onclick="app.selectIceOption(this)">Extra</button>
                                <button class="ice-opt" onclick="app.selectIceOption(this)">Sin</button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500"><i class="fa-solid fa-cheese"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Queso Extra</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('cheese-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="cheese-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('cheese-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><i class="fa-solid fa-bottle-droplet"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Ketchup</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('ketchup-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="ketchup-qty" class="font-bold text-slate-700 w-4 text-center text-sm">2</span><button onclick="app.updateIngredient('ketchup-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] md:shadow-none">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-dark">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-mcdonalds hover:bg-mcdonalds-dark text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-red-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-[#DA291C] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-orange-500 font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-mcdonalds transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-mcdonalds transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-mcdonalds transition"><i class="fa-brands fa-twitter"></i></a>
                </div>
            </div>
            <div class="flex flex-col md:flex-row gap-8 md:gap-16 text-sm text-left md:text-right w-full md:w-auto">
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2 md:border-none inline-block w-full md:w-auto">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="soporte.html" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="terminos.html" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg border-b border-white/20 pb-2 md:border-none inline-block w-full md:w-auto">Empresa</h4>
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

    <script>
        const app = {
            cart: JSON.parse(localStorage.getItem('foodrush_mcd_cart')) || [],
            currentCategory: 'Hamburguesas',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Mediano',
            sizePrices: { Regular: 0, Mediano: 0, Grande: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            products: [
                { id: 1, name: "Big Mac", category: "Hamburguesas", type: "Res", price: 120, spec: "iconic", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_BigMac_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Dos hamburguesas de carne 100% de res, salsa especial, queso, pepinillos, cebollas y lechuga en un pan con sésamo." },
                { id: 2, name: "Cuarto de Libra", category: "Hamburguesas", type: "Res", price: 135, spec: "cheese", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_QuarterPounderwithCheese_832x472:product-header-desktop?wid=830&hei=456&dpr=off", desc: "Hamburguesa de un cuarto de libra de carne de res, condimentada con pizca de sal y pimienta, con dos rebanadas de queso." },
                { id: 3, name: "McChicken", category: "Hamburguesas", type: "Pollo", price: 95, spec: "classic", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_McChicken_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Pollo crujiente perfectamente sazonado, lechuga picada y mayonesa cremosa." },
                { id: 4, name: "Filet-O-Fish", category: "Hamburguesas", type: "Pescado", price: 110, spec: "classic", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_Filet-O-Fish_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Pescado blanco capturado en estado salvaje, queso melty americano y salsa tártara cremosa." },
                { id: 5, name: "Papas Fritas", category: "Complementos", type: "Papas", price: 70, spec: "salty", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_MediumFrenchFries_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Papas fritas mundialmente famosas, crujientes por fuera y suaves por dentro." },
                { id: 6, name: "McNuggets (10 pz)", category: "Complementos", type: "Pollo", price: 115, spec: "share", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_10pcMcNuggets_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Chicken McNuggets elaborados con pollo blanco tierno y jugoso." },
                { id: 7, name: "Coca-Cola", category: "Complementos", type: "Bebida", price: 45, spec: "cold", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_CocaCola_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Refrescante Coca-Cola helada para acompañar tu comida." },
                { id: 8, name: "Oreo McFlurry", category: "Postres", type: "Helado", price: 85, spec: "sweet", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_OreoMcFlurry_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Helado suave de vainilla mezclado con trozos de galleta Oreo." },
                { id: 9, name: "Apple Pie", category: "Postres", type: "Pastel", price: 40, spec: "hot", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_ApplePie_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Pastel de manzana horneado caliente con canela y corteza crujiente." },
                { id: 10, name: "McCafé Americano", category: "Postres", type: "Café", price: 55, spec: "hot", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_Americano_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Café Americano simple y satisfactorio hecho con granos de origen sostenible." },
                { id: 11, name: "Double Big Mac", category: "Hamburguesas", type: "Res", price: 160, spec: "iconic", img: "https://s7d1.scene7.com/is/image/mcdonalds/Header_DoubleBigMac_832x472:product-header-desktop?wid=830&hei=458&dpr=off", desc: "Cuatro carnes de res con la salsa clásica Big Mac." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Hamburguesas');
            },

            search: function(text) {
                this.applyFilters(text);
            },

            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let html = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Hamburguesas') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-mcdonalds transition text-sm uppercase tracking-wide">PROTEÍNA <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Res')}" onclick="app.toggleTypeFilter('Res')">Carne de Res</p><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Pollo</p><p class="side-filter-btn ${isActiveType('Pescado')}" onclick="app.toggleTypeFilter('Pescado')">Pescado</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-mcdonalds transition text-sm uppercase tracking-wide">ESTILO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('iconic')}" onclick="app.toggleSpecFilter('iconic')">Clásicos</p><p class="side-filter-btn ${isActiveSpec('cheese')}" onclick="app.toggleSpecFilter('cheese')">Con Queso</p></div></details>`;
                } else if (this.currentCategory === 'Complementos') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-mcdonalds transition text-sm uppercase tracking-wide">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Papas')}" onclick="app.toggleTypeFilter('Papas')">Papas</p><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Nuggets</p><p class="side-filter-btn ${isActiveType('Bebida')}" onclick="app.toggleTypeFilter('Bebida')">Bebidas</p></div></details>`;
                } else {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-mcdonalds transition text-sm uppercase tracking-wide">DULCES <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Helado')}" onclick="app.toggleTypeFilter('Helado')">Helados</p><p class="side-filter-btn ${isActiveType('Pastel')}" onclick="app.toggleTypeFilter('Pastel')">Pastelería</p><p class="side-filter-btn ${isActiveType('Café')}" onclick="app.toggleTypeFilter('Café')">Café</p></div></details>`;
                }
                html += `<div class="pt-6 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML = html;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-200 text-gray-600 px-5 py-2 rounded-full font-semibold hover:border-mcdonalds hover:text-mcdonalds transition whitespace-nowrap text-sm md:text-base"; });
                if(btn) btn.className = "filter-tab active bg-mcdonalds text-white px-5 py-2 rounded-full font-semibold shadow transition whitespace-nowrap text-sm md:text-base";
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
                if (items.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center"><i class="fa-solid fa-burger text-4xl mb-4 text-gray-300"></i>No se encontraron productos.</div>`; return; }
                items.forEach(item => {
                    const html = `
                    <div class="fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-mcdonalds transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden" onclick="app.openProductDetail(${item.id})">
                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                            <div class="absolute inset-0 bg-mcdonalds-light rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-50"></div>
                            <img src="${item.img}" alt="${item.name}" class="h-full object-contain group-hover:scale-110 transition duration-500 drop-shadow-md z-10">
                        </div>
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-dark mb-1 group-hover:text-mcdonalds transition line-clamp-1 font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-mcdonalds-light transition border border-transparent group-hover:border-mcdonalds-light">
                                <span class="text-dark font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-mcdonalds shadow-sm hover:bg-mcdonalds hover:text-white transition flex items-center justify-center border border-gray-100"><i class="fa-solid fa-plus"></i></button>
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
                this.currentSize = 'Mediano';
                const base = product.price;
                this.sizePrices = { Regular: Math.round(base * 0.80), Mediano: base, Grande: Math.round(base * 1.25) };

                document.getElementById('detail-category-title').innerText = product.category;
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc;
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Mediano}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (product.category === 'Hamburguesas') {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Regular').innerText = `$${this.sizePrices.Regular}`;
                    document.getElementById('price-label-Mediano').innerText = `$${this.sizePrices.Mediano}`;
                    document.getElementById('price-label-Grande').innerText = `$${this.sizePrices.Grande}`;
                    this.selectSize('Mediano');
                    
                    document.getElementById('cheese-qty').innerText = "0";
                    document.getElementById('ketchup-qty').innerText = "2";
                    this.selectIceOption(document.querySelector('.ice-opt.active')); 

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

            selectIceOption: function(btn) {
                if(!btn) return;
                btn.parentElement.querySelectorAll('.ice-opt').forEach(b => b.classList.remove('active'));
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
                if (this.currentProduct.category === 'Hamburguesas') unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            addToCartFromDetail: function() {
                let unitPrice = this.currentProduct.category === 'Hamburguesas' ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = this.currentProduct.category === 'Hamburguesas' ? this.currentSize : "Estándar";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_mcd_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_mcd_cart', JSON.stringify(cart));
                this.updateCartBadge();
                Swal.fire({ icon: 'success', title: '¡Añadido!', showConfirmButton: false, timer: 1000, background: '#DA291C', color: '#fff', toast: true, position: 'top-end' });
                this.goBack();
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_mcd_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>