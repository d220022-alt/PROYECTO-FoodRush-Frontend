<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Burger King | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        // Mapeo para el Logo (Tu snippet usa 'primary' y 'dark')
                        primary: '#D62300', // Rojo BK
                        dark: '#502314',    // Marrón BK

                        // Colores Oficiales Burger King
                        'bk-red': '#D62300',    
                        'bk-brown': '#502314',  
                        'bk-orange': '#FA8320', 
                        'bk-cream': '#F5EBDC',  
                        'bk-light': '#FFF8F0',  
                        'bk-hover': '#C51F00',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Sora', 'sans-serif'],
                    },
                    backgroundImage: {
                        'grill': "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(80, 35, 20, 0.05) 20px, rgba(80, 35, 20, 0.05) 22px)"
                    }
                }
            }
        }
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F5EBDC; color: #502314; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* SLIDER */
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #FA8320; transform: scale(1.2); border: 2px solid white; }
        
        /* FILTROS */
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #6b5b55; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; border-radius: 0 4px 4px 0; }
        .side-filter-btn:hover { color: #D62300; background-color: #FFF8F0; }
        .side-filter-btn.active { color: #D62300; font-weight: 700; border-left-color: #D62300; background-color: #FFF8F0; }
        
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
        
        .size-card:hover { border-color: #D62300; transform: translateY(-2px); }
        .size-card.selected { border-color: #D62300; background-color: #FFF8F0; box-shadow: 0 4px 12px rgba(214, 35, 0, 0.1); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #D62300; }
        
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #D62300; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #D62300; background-color: #FFF8F0; }

        .bk-opt-container { background-color: #F5EBDC; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
        .bk-opt { padding: 6px 12px; font-size: 0.75rem; font-weight: 600; color: #502314; border-radius: 8px; transition: all 0.2s ease; background-color: transparent; cursor: pointer; flex: 1; }
        .bk-opt:hover { background-color: #e6dac6; color: #374151; }
        .bk-opt.active { background-color: #502314; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-weight: 700; }
        
        .filter-tab { transition: all 0.3s ease; }
        .filter-tab.active { background-color: #502314; color: white; border-color: #502314; box-shadow: 0 4px 6px -1px rgba(80, 35, 20, 0.3); }
        .filter-tab:not(.active):hover { border-color: #D62300; color: #D62300; background-color: #FFF8F0; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-[#502314] bg-[#F5EBDC]" onload="updateCartBadge()">

    <header class="bg-white border-b border-[#E6DAC6] sticky top-0 z-50">
        <nav class="bg-white/95 backdrop-blur-sm shadow-sm py-3 md:py-4 sticky top-0 z-50">
            <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
                
                <a href="index.vue" class="flex items-center space-x-2 group">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-primary animate-pulse transform group-hover:scale-110 transition-transform"></i>
                    <span id="brand-text" class="self-center text-2xl font-extrabold whitespace-nowrap text-dark tracking-tighter">FOOD<span class="text-primary">RUSH</span></span>
                </a>
    
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-bk-red focus-within:ring-1 focus-within:ring-bk-red transition-all">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                    <input type="text" id="searchInput" placeholder="Buscar Whopper..." class="outline-none w-full text-sm bg-transparent" onkeyup="app.search(this.value)">
                </div>
                
                <div class="flex items-center gap-4 md:gap-6">
                    <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>

                    <button class="hover:text-bk-red transition relative text-xl text-gray-600 p-1" onclick="window.location.href='cart.vue'">
                        <i class="fa-solid fa-cart-shopping"></i>
                        <span id="cart-count" class="absolute -top-1 -right-1 bg-bk-red text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm border border-white">0</span>
                    </button>
                    
                    <button class="hover:text-bk-red transition text-xl text-gray-600"><i class="fa-regular fa-user"></i></button>
                    
                    <a href="principal.vue" class="hidden md:block ml-2"><span class="bg-bk-brown text-white px-5 py-2 rounded-full hover:bg-black transition-all shadow-md text-sm font-semibold">Home</span></a>
                </div>
            </div>
        </nav>
    </header>

    <div id="catalog-view" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-bk-brown border-b border-gray-100">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-bk-brown z-10 order-2 md:order-1 relative overflow-hidden">
                <div class="absolute inset-0 bg-grill opacity-10"></div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/1200px-Burger_King_2020.svg.png" 
                     alt="BK Logo" class="h-32 md:h-56 w-auto object-contain drop-shadow-xl hover:scale-105 transition duration-500 bg-bk-cream rounded-full p-6 z-10 shadow-lg">
            </div>
            <div class="w-full md:w-3/5 relative bg-black h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2944" alt="Burger"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=2942" alt="Fries"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2865" alt="Grill"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-[#E6DAC6] sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Hamburguesas', this)" class="filter-tab active px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap">A la Parrilla</button>
                <button onclick="app.setCategory('Pollo', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-[#E6DAC6] text-bk-brown whitespace-nowrap">Pollo y Acompañantes</button>
                <button onclick="app.setCategory('Postres', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-[#E6DAC6] text-bk-brown whitespace-nowrap">Postres</button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-[#E6DAC6] h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-bk-brown mb-4 font-heading flex items-center justify-between">
                    Categorías <i class="fa-solid fa-filter text-bk-red text-sm md:hidden"></i>
                </h3>
                <div id="dynamic-sidebar-content" class="space-y-2 md:space-y-4 text-sm md:text-base"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-bk-red transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-bk-red group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-white rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border border-[#E6DAC6] overflow-hidden shadow-sm">
                    <div class="absolute inset-0 bg-grill opacity-5"></div>
                    <img id="detail-img" src="" alt="Product" class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-bk-brown mb-4 font-heading border-b border-[#E6DAC6] pb-2">Elige el tamaño</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Chico')">
                            <div class="size-card" id="size-Chico"><i class="fa-solid fa-burger text-xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-bk-brown">Chico</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Chico">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Mediano')">
                            <div class="size-card selected" id="size-Mediano"><i class="fa-solid fa-burger text-2xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-bk-brown">Mediano</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Mediano">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('King')">
                            <div class="size-card" id="size-King"><i class="fa-solid fa-crown text-3xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-bk-brown">King</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-King">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-bk-red mb-2 tracking-widest uppercase" id="detail-category-title">Hamburguesa</h2>
                    <h1 id="detail-title" class="text-3xl md:text-4xl font-bold text-bk-brown mb-3 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-bk-orange gap-1 text-sm">
                            <i class="fa-solid fa-fire"></i><i class="fa-solid fa-fire"></i><i class="fa-solid fa-fire"></i><i class="fa-solid fa-fire"></i>
                        </div>
                        <span class="text-gray-500 ml-2 text-xs font-medium">100% Carne de Res</span>
                    </div>

                    <p id="detail-desc" class="text-gray-600 text-sm md:text-base leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-[#E6DAC6] shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wide">Precio</span>
                        <span id="detail-price-display" class="text-2xl font-bold text-bk-brown">$0</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center bg-[#F5EBDC] rounded-lg p-1 border border-[#E6DAC6]">
                            <button onclick="app.changeQty(-1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-bk-brown font-bold transition">-</button>
                            <span id="detail-qty" class="w-8 text-center font-bold text-lg text-bk-brown">1</span>
                            <button onclick="app.changeQty(1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-bk-brown font-bold transition">+</button>
                        </div>
                    </div>
                </div>

                <div id="customization-options" class="flex-grow">
                    <h3 class="font-bold text-lg text-bk-brown mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-bk-red"></i> A tu Manera
                    </h3>
                    
                    <div class="bg-white border border-[#E6DAC6] rounded-xl overflow-hidden shadow-sm">
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-[#E6DAC6]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-bk-red"><i class="fa-solid fa-drumstick-bite"></i></div>
                                <div><span class="text-sm font-bold text-bk-brown block">Carne Extra</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('patty-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="patty-qty" class="font-bold text-bk-brown w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('patty-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-[#E6DAC6]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fa-regular fa-circle"></i></div>
                                <div><span class="text-sm font-bold text-bk-brown block">Aros de Cebolla</span></div>
                            </div>
                            <div class="bk-opt-container">
                                <button class="bk-opt active" onclick="app.selectSideOption(this)">No</button>
                                <button class="bk-opt" onclick="app.selectSideOption(this)">Sí</button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-bk-orange"><i class="fa-solid fa-bacon"></i></div>
                                <div><span class="text-sm font-bold text-bk-brown block">Bacon</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('bacon-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="bacon-qty" class="font-bold text-bk-brown w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('bacon-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-[#E6DAC6] sticky bottom-0 z-20 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] md:shadow-none">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-bk-brown">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-bk-red hover:bg-bk-hover text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-red-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-fire"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

     <footer class="bg-[#D62300] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-bk-orange font-bold text-xl italic">Food</span>
                    <span class="text-bk-brown font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-bk-red transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-bk-red transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-bk-red transition"><i class="fa-brands fa-twitter"></i></a>
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
            cart: JSON.parse(localStorage.getItem('foodrush_bk_cart')) || [],
            currentCategory: 'Hamburguesas',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Mediano',
            sizePrices: { Chico: 0, Mediano: 0, King: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            products: [
                { id: 1, name: "Whopper", category: "Hamburguesas", type: "Res", price: 130, spec: "classic", img: "https://s.cornershopapp.com/product-images/3889115.png?versionId=B.qYl9Yp.fTqE4jE61kI.u2XjF2Xk.T_", desc: "Carne de res a la parrilla, tomates jugosos, lechuga fresca, mayonesa cremosa, kétchup, pepinillos crujientes y cebollas blancas en pan con semillas de sésamo." },
                { id: 2, name: "Bacon King", category: "Hamburguesas", type: "Res", price: 160, spec: "bacon", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Bacon-King-Carne_0.png", desc: "Dos carnes de res a la parrilla, cubiertas con una porción abundante de tocino ahumado grueso, queso americano y mayonesa." },
                { id: 3, name: "King de Pollo", category: "Pollo", type: "Pollo", price: 110, spec: "classic", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/King-de-Pollo_0.png", desc: "Pollo blanco empanizado ligeramente, lechuga fresca y mayonesa cremosa en un pan largo con semillas de sésamo." },
                { id: 4, name: "Chicken Fries (9 pzs)", category: "Pollo", type: "Pollo", price: 90, spec: "snack", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Chicken-Fries-x-9_0.png", desc: "Pollo blanco empanizado con forma de papas fritas, perfectas para dipear en tu salsa favorita." },
                { id: 5, name: "Aros de Cebolla", category: "Pollo", type: "Side", price: 70, spec: "snack", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Aros-de-Cebolla-Medianos_0.png", desc: "Aros de cebolla dorados y crujientes, el acompañamiento perfecto." },
                { id: 6, name: "Hershey's Pie", category: "Postres", type: "Pastel", price: 65, spec: "sweet", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Hersheys-Pie_0.png", desc: "Cremoso pastel de chocolate Hershey's sobre una base crujiente de chocolate." },
                { id: 7, name: "Stacker King Doble", category: "Hamburguesas", type: "Res", price: 155, spec: "bacon", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Stacker-Doble_0.png", desc: "Dos carnes a la parrilla, queso, tocino y la exclusiva salsa Stacker." },
                { id: 8, name: "Nuggets (10 pzs)", category: "Pollo", type: "Pollo", price: 85, spec: "snack", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Nuggets-x-10_0.png", desc: "10 piezas de nuggets de pollo dorados y crujientes por fuera, tiernos por dentro." },
                { id: 9, name: "Cono Relleno", category: "Postres", type: "Helado", price: 25, spec: "sweet", img: "https://bk-latam-prod.s3.amazonaws.com/sites/burgerking.com.pe/files/Cono-Relleno-Manjar_0.png", desc: "Cremoso helado de vainilla en cono crujiente, relleno de dulce de leche o chocolate." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Hamburguesas');
            },

            // --- RENDER SIDEBAR ---
            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let.vue = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Hamburguesas') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-[#502314] cursor-pointer mb-3 hover:text-bk-red transition text-sm uppercase tracking-wide">PROTEÍNA <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Res')}" onclick="app.toggleTypeFilter('Res')">Carne de Res</p><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Pollo</p></div></details>
                    <details open class="group mb-4 border-t border-[#e6dac6] pt-4"><summary class="flex justify-between items-center font-bold text-[#502314] cursor-pointer mb-3 hover:text-bk-red transition text-sm uppercase tracking-wide">ESTILO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('classic')}" onclick="app.toggleSpecFilter('classic')">Clásicas</p><p class="side-filter-btn ${isActiveSpec('bacon')}" onclick="app.toggleSpecFilter('bacon')">Con Bacon</p></div></details>`;
                } else if (this.currentCategory === 'Pollo') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-[#502314] cursor-pointer mb-3 hover:text-bk-red transition text-sm uppercase tracking-wide">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Pollo')}" onclick="app.toggleTypeFilter('Pollo')">Sandwiches y Nuggets</p><p class="side-filter-btn ${isActiveType('Side')}" onclick="app.toggleTypeFilter('Side')">Acompañantes</p></div></details>`;
                } else {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-[#502314] cursor-pointer mb-3 hover:text-bk-red transition text-sm uppercase tracking-wide">DULCES <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Helado')}" onclick="app.toggleTypeFilter('Helado')">Helados</p><p class="side-filter-btn ${isActiveType('Pastel')}" onclick="app.toggleTypeFilter('Pastel')">Pasteles</p></div></details>`;
                }
               .vue += `<div class="pt-6 mt-4 border-t border-[#e6dac6]"><button onclick="app.resetFilters()" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML =.vue;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-[#e6dac6] text-bk-brown px-5 py-2 rounded-full font-semibold hover:border-bk-red hover:text-bk-red transition whitespace-nowrap text-sm md:text-base"; });
                if(btn) btn.className = "filter-tab active bg-bk-brown text-white px-5 py-2 rounded-full font-semibold shadow transition whitespace-nowrap text-sm md:text-base";
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
                    const.vue = `
                    <div class="fade-in border border-[#e6dac6] rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-bk-red transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden" onclick="app.openProductDetail(${item.id})">
                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                             <div class="absolute inset-0 bg-bk-orange rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-20"></div>
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10">
                        </div>
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-[#502314] mb-1 group-hover:text-bk-red transition line-clamp-1 font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-[#F5EBDC] p-2 rounded-xl group-hover:bg-[#fff0e6] transition border border-transparent group-hover:border-bk-orange">
                                <span class="text-[#502314] font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-bk-red shadow-sm hover:bg-bk-red hover:text-white transition flex items-center justify-center border border-[#e6dac6]"><i class="fa-solid fa-plus"></i></button>
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
                this.sizePrices = { Chico: Math.round(base * 0.8), Mediano: base, King: Math.round(base * 1.3) };

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
                    document.getElementById('price-label-Chico').innerText = `$${this.sizePrices.Chico}`;
                    document.getElementById('price-label-Mediano').innerText = `$${this.sizePrices.Mediano}`;
                    document.getElementById('price-label-King').innerText = `$${this.sizePrices.King}`;
                    this.selectSize('Mediano');
                    
                    document.getElementById('patty-qty').innerText = "0";
                    document.getElementById('bacon-qty').innerText = "0";
                    this.selectSideOption(document.querySelector('.bk-opt.active'));

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
                ['Chico', 'Mediano', 'King'].forEach(s => {
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

            selectSideOption: function(btn) {
                if(!btn) return;
                btn.parentElement.querySelectorAll('.bk-opt').forEach(b => b.classList.remove('active'));
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
                let cart = JSON.parse(localStorage.getItem('foodrush_bk_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_bk_cart', JSON.stringify(cart));
                this.updateCartBadge();
                Swal.fire({ icon: 'success', title: '¡Añadido al pedido!', showConfirmButton: false, timer: 1000, background: '#D62300', color: '#fff', toast: true, position: 'top-end' });
                this.goBack();
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_bk_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>