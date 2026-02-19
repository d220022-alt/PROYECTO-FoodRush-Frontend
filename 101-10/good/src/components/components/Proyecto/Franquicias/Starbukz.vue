<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Starbucks | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#BD0A0A',
                        starbucks: '#00704A',
                        'starbucks-dark': '#1e3932',
                        'starbucks-mint': '#D4E9E2',
                        'starbucks-warm': '#f9f9f9',
                        'starbucks-accent': '#cba258',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        heading: ['Sora', 'sans-serif'],
                    }
                }
            }
        }
    </script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f9f9f9; }
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: white; transform: scale(1.2); }
        
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #4b5563; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; border-radius: 0 4px 4px 0; }
        .side-filter-btn:hover { color: #00704A; background-color: #f2f2f2; }
        .side-filter-btn.active { color: #00704A; font-weight: 700; border-left-color: #00704A; background-color: #D4E9E2; }
        
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
        
        .size-card:hover { border-color: #00704A; transform: translateY(-2px); }
        .size-card.selected { border-color: #00704A; background-color: #D4E9E2; box-shadow: 0 4px 12px rgba(0, 112, 74, 0.1); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #00704A; }
        
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #00704A; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #00704A; background-color: #D4E9E2; }

        .ice-opt-container { background-color: #f3f4f6; padding: 4px; border-radius: 10px; display: flex; gap: 4px; }
        .ice-opt { padding: 6px 12px; font-size: 0.75rem; font-weight: 600; color: #6b7280; border-radius: 8px; transition: all 0.2s ease; background-color: transparent; cursor: pointer; flex: 1; }
        .ice-opt:hover { background-color: #e5e7eb; color: #374151; }
        .ice-opt.active { background-color: white; color: #00704A; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: 700; }
        
        .filter-tab { transition: all 0.3s ease; }
        .filter-tab.active { background-color: #00704A; color: white; border-color: #00704A; box-shadow: 0 4px 6px -1px rgba(0, 112, 74, 0.3); }
        .filter-tab:not(.active):hover { border-color: #00704A; color: #00704A; background-color: #D4E9E2; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-[#f9f9f9]" onload="updateCartBadge()">

    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav class="bg-white/95 backdrop-blur-sm shadow-sm py-3 md:py-4 sticky top-0 z-50">
            <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4">
                
                <a href="index.vue" class="flex items-center space-x-2 md:space-x-3 group">
                    <i class="fas fa-bolt text-2xl md:text-3xl text-primary animate-pulse transform group-hover:scale-110 transition-transform"></i>
                    <span class="self-center text-xl md:text-2xl font-extrabold whitespace-nowrap text-slate-900 tracking-tight">FOODRUSH</span>
                </a>
    
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-2 w-72 bg-gray-50 focus-within:bg-white focus-within:border-starbucks focus-within:ring-1 focus-within:ring-starbucks transition-all">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
                    <input type="text" id="searchInput" placeholder="Buscar tu café favorito..." class="outline-none w-full text-sm bg-transparent" onkeyup="app.search(this.value)">
                </div>
                
                <div class="flex items-center gap-4 md:gap-6">
                    <button class="md:hidden text-gray-600 text-lg"><i class="fa-solid fa-magnifying-glass"></i></button>

                    <button class="hover:text-starbucks transition relative text-xl text-gray-600 p-1" onclick="window.location.href='cart.vue'">
                        <i class="fa-solid fa-cart-shopping"></i>
                        <span id="cart-count" class="absolute -top-1 -right-1 bg-starbucks text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center hidden shadow-sm">0</span>
                    </button>
                    
                    <button class="hover:text-starbucks transition text-xl text-gray-600"><i class="fa-regular fa-user"></i></button>
                    
                    <a href="principal.vue" class="hidden md:block ml-2"><span class="bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition-all shadow-md text-sm font-semibold">Home</span></a>
                </div>
            </div>
        </nav>
    </header>

    <div id="catalog-view" class="fade-in pb-10">
        <section class="flex flex-col md:flex-row h-auto md:h-[450px] w-full bg-white border-b border-gray-100">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 md:p-12 bg-white z-10 order-2 md:order-1">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png" 
                     alt="Starbucks Logo" class="h-32 md:h-64 w-auto object-contain drop-shadow-lg hover:scale-105 transition duration-500">
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900 h-64 md:h-auto order-1 md:order-2">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://i.pinimg.com/736x/31/3b/0d/313b0dc5455e06e91cc76c3cc4e5b036.jpg"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1887"></div>
                    <div class="slide"><img src="https://tb-static.uber.com/prod/image-proc/processed_images/fe123fdb00b05ded4dfc1ec527ba53d1/5283d81c664b43c5f57a3a186d273063.jpeg"></div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-[60px] md:top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-4 md:px-6 py-3 md:py-4 flex gap-3 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Drinks', this)" class="filter-tab active px-5 py-2 rounded-full font-semibold text-sm md:text-base border whitespace-nowrap">Bebidas</button>
                <button onclick="app.setCategory('Food', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Comida</button>
                <button onclick="app.setCategory('At Home Coffee', this)" class="filter-tab px-5 py-2 rounded-full font-semibold text-sm md:text-base border border-gray-200 text-gray-600 whitespace-nowrap">Café en Grano</button>
            </div>
        </div>

        <div class="container mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <aside class="md:col-span-1 select-none bg-white p-4 md:p-5 rounded-xl border border-gray-100 h-fit md:sticky md:top-36 shadow-sm">
                <h3 class="font-bold text-lg md:text-xl text-slate-800 mb-4 font-heading flex items-center justify-between">
                    Filtros <i class="fa-solid fa-filter text-starbucks text-sm md:hidden"></i>
                </h3>
                <div id="dynamic-sidebar-content" class="space-y-2 md:space-y-4 text-sm md:text-base"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-6 flex items-center text-sm font-bold text-gray-500 hover:text-starbucks transition group">
            <div class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-2 group-hover:bg-starbucks group-hover:text-white transition">
                <i class="fa-solid fa-chevron-left"></i>
            </div>
            Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
            <div class="flex flex-col gap-6 md:gap-8">
                <div class="relative bg-starbucks-mint/30 rounded-3xl flex items-center justify-center p-6 h-72 md:h-[500px] border border-starbucks-mint overflow-hidden">
                    <img id="detail-img" src="" alt="Product" class="h-full w-auto object-contain drop-shadow-xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading border-b border-gray-100 pb-2">Elige el tamaño</h3>
                    <div class="flex gap-3 md:gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Alto')">
                            <div class="size-card" id="size-Alto"><i class="fa-solid fa-glass-water text-2xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Alto</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Alto">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Grande')">
                            <div class="size-card selected" id="size-Grande"><i class="fa-solid fa-glass-water text-3xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Grande</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Grande">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Venti')">
                            <div class="size-card" id="size-Venti"><i class="fa-solid fa-glass-water text-4xl"></i></div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Venti</span>
                                <span class="block text-xs text-gray-500 font-medium" id="price-label-Venti">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-xs font-bold text-starbucks mb-2 tracking-widest uppercase" id="detail-category-title">Bebida</h2>
                    <h1 id="detail-title" class="text-3xl md:text-4xl font-bold text-starbucks-dark mb-3 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-4 text-sm">
                        <div class="flex text-starbucks-accent gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">(260 Reviews)</span>
                    </div>

                    <p id="detail-desc" class="text-gray-600 text-sm md:text-base leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-6 md:mb-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-xs md:text-sm uppercase tracking-wide">Precio</span>
                        <span id="detail-price-display" class="text-2xl font-bold text-starbucks-dark">$0</span>
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
                        <i class="fa-solid fa-sliders text-starbucks"></i> Personaliza tu pedido
                    </h3>
                    
                    <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fa-regular fa-snowflake"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Hielo</span></div>
                            </div>
                            <div class="ice-opt-container">
                                <button class="ice-opt active" onclick="app.selectIceOption(this)">Normal</button>
                                <button class="ice-opt" onclick="app.selectIceOption(this)">Extra</button>
                                <button class="ice-opt" onclick="app.selectIceOption(this)">Sin</button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><i class="fa-solid fa-leaf"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Matcha</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('matcha-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="matcha-qty" class="font-bold text-slate-700 w-4 text-center text-sm">4</span><button onclick="app.updateIngredient('matcha-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-3 md:p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><i class="fa-solid fa-bottle-droplet"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Jarabe</span></div>
                            </div>
                            <div class="flex items-center gap-2"><button onclick="app.updateIngredient('syrup-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="syrup-qty" class="font-bold text-slate-700 w-4 text-center text-sm">4</span><button onclick="app.updateIngredient('syrup-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)] md:shadow-none">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-500 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-starbucks-dark">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-starbucks hover:bg-[#005c3d] text-white font-bold py-3 md:py-4 rounded-xl shadow-lg shadow-green-900/20 text-lg transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

     <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded shadow-lg transform -rotate-2">
                    <span class="text-orange-500 font-bold text-xl italic">Food</span>
                    <span class="text-slate-800 font-bold text-xl italic -ml-1">Rush</span>
                </div>
                <p class="text-white/90 text-sm mb-6 font-medium max-w-xs">La mejor comida de tus franquicias favoritas directo a tu puerta.</p>
                <div class="flex gap-4">
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white hover:text-red-600 transition"><i class="fa-brands fa-twitter"></i></a>
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
            cart: JSON.parse(localStorage.getItem('foodrush_cart')) || [],
            currentCategory: 'Drinks',
            activeTypeFilters: [], activeCaffeineFilter: null, gridStates: {},
            currentProduct: null, currentQty: 1, currentSize: 'Grande',
            sizePrices: { Alto: 0, Grande: 0, Venti: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            products: [
                { id: 1, name: "Iced Black Tea", category: "Drinks", type: "Black Tea", price: 500, caffeinated: true, img: "https://globalassets.starbucks.com/assets/f12bc8af498d45ed92c5d6f1dac64062.jpg", desc: "Té negro premium mezclado con hielo. Refrescante y audaz." },
                { id: 2, name: "Hot Chai Tea", category: "Drinks", type: "Black Tea", price:100, caffeinated: true, img: "https://globalassets.starbucks.com/assets/2d52f16a22fb40ff898be1815ecc685e.jpg", desc: "Té negro infusionado con canela, clavo y otras especias calientes." },
                { id: 3, name: "Cold Brew", category: "Drinks", type: "Coffee", price: 12, caffeinated: true, img: "https://globalassets.starbucks.com/assets/f6979e7ea81944cb89d7b42c4c78c3b9.jpg", desc: "Café preparado lentamente en agua fría durante 20 horas." },
                { id: 4, name: "Caffè Americano", category: "Drinks", type: "Coffee", price: 12, caffeinated: true, img: "https://globalassets.starbucks.com/assets/05e26719b3314643b090623ce1b08865.jpg", desc: "Espresso con agua caliente. Rico y con cuerpo." },
                { id: 5, name: "Bottled Matcha", category: "Drinks", type: "Green Tea", price: 10, caffeinated: true, img: "https://globalassets.starbucks.com/assets/957e8416688f4d92a00c61830605e55e.jpg", desc: "Té verde matcha suave y cremoso." },
                { id: 6, name: "Mocha Frappuccino", category: "Drinks", type: "Coffee", price: 10, caffeinated: true, img: "https://globalassets.starbucks.com/assets/5c515339667943ce84dc56effdf5fc1b.jpg", desc: "Café, salsa de chocolate y hielo, mezclados y coronados con crema batida." },
                { id: 7, name: "Hot Chocolate", category: "Drinks", type: "Chocolate", price: 12, caffeine: 'low', img: "https://globalassets.starbucks.com/assets/f4b14d8eb00c406ba266596a2d98c253.jpg", desc: "Leche al vapor con jarabe de chocolate sabor moka y vainilla." },
                { id: 8, name: "Pink Drink", category: "Drinks", type: "Refresher", price: 17, caffeinated: true, img: "https://globalassets.starbucks.com/assets/05a63c09e3a647d6be209b5550c6d67b.jpg", desc: "Refresher de Fresa Acai con leche de coco." },
                { id: 9, name: "Croissant de Jamón", category: "Food", type: "Bakery", price: 5, img: "https://globalassets.starbucks.com/assets/2362e79aa0ab4c37a930956c67ab557a.jpg", desc: "Mantequilloso croissant relleno de jamón y queso suizo." },
                { id: 10, name: "Cake Pop", category: "Food", type: "Bakery", price: 3, img: "https://globalassets.starbucks.com/assets/2c9fa55bd9624513a010461b58536968.jpg", desc: "Pastel de vainilla en un palito, bañado en glaseado rosa." },
                { id: 11, name: "Sandwich de Pollo", category: "Food", type: "Lunch", price: 8, img: "https://globalassets.starbucks.com/assets/02ea801e3aca42bcad2f6ef33c944899.jpg", desc: "Pollo asado, tocino y salsa ranch en pan brioche." },
                { id: 14, name: "Café Veracruz", category: "At Home Coffee", type: "Whole Bean", price: 25, img: "https://globalassets.starbucks.com/assets/652b1450c265431693e506d8601c2576.jpg", desc: "Granos de café de origen único, tostado medio." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Drinks');
            },

            // --- RENDER SIDEBAR ---
            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let.vue = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveCaff = (val) => this.activeCaffeineFilter === val ? 'active' : '';

                if (this.currentCategory === 'Drinks') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-starbucks transition text-sm uppercase tracking-wide">Tipo de Bebida <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Coffee')}" onclick="app.toggleTypeFilter('Coffee')">Café</p><p class="side-filter-btn ${isActiveType('Black Tea')}" onclick="app.toggleTypeFilter('Black Tea')">Té Negro</p><p class="side-filter-btn ${isActiveType('Green Tea')}" onclick="app.toggleTypeFilter('Green Tea')">Té Verde</p><p class="side-filter-btn ${isActiveType('Refresher')}" onclick="app.toggleTypeFilter('Refresher')">Refreshers</p><p class="side-filter-btn ${isActiveType('Chocolate')}" onclick="app.toggleTypeFilter('Chocolate')">Chocolate</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-starbucks transition text-sm uppercase tracking-wide">Cafeína <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveCaff('yes')}" onclick="app.toggleCaffeineFilter('yes')">Con Cafeína</p><p class="side-filter-btn ${isActiveCaff('low')}" onclick="app.toggleCaffeineFilter('low')">Bajo en Cafeína</p><p class="side-filter-btn ${isActiveCaff('no')}" onclick="app.toggleCaffeineFilter('no')">Descafeinado</p></div></details>`;
                } else if (this.currentCategory === 'Food') {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-starbucks transition text-sm uppercase tracking-wide">Tipo de Comida <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Bakery')}" onclick="app.toggleTypeFilter('Bakery')">Panadería</p><p class="side-filter-btn ${isActiveType('Lunch')}" onclick="app.toggleTypeFilter('Lunch')">Almuerzo</p><p class="side-filter-btn ${isActiveType('Breakfast')}" onclick="app.toggleTypeFilter('Breakfast')">Desayuno</p></div></details>`;
                } else {
                   .vue += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-starbucks transition text-sm uppercase tracking-wide">Formato <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Whole Bean')}" onclick="app.toggleTypeFilter('Whole Bean')">Grano Entero</p></div></details>`;
                }
               .vue += `<div class="pt-6 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML =.vue;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleCaffeineFilter: function(val) { this.activeCaffeineFilter = (this.activeCaffeineFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeCaffeineFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-200 text-gray-600 px-5 py-2 rounded-full font-semibold hover:border-starbucks hover:text-starbucks transition whitespace-nowrap text-sm md:text-base"; });
                if(btn) btn.className = "filter-tab active bg-starbucks text-white px-5 py-2 rounded-full font-semibold shadow transition whitespace-nowrap text-sm md:text-base";
                this.renderSidebar(); this.applyFilters();
            },
            applyFilters: function(searchText = document.getElementById('searchInput').value) {
                let filtered = this.products.filter(p => p.category === this.currentCategory);
                if (searchText) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));
                if (this.activeTypeFilters.length > 0) filtered = filtered.filter(p => this.activeTypeFilters.includes(p.type));
                if (this.currentCategory === 'Drinks' && this.activeCaffeineFilter) {
                    if (this.activeCaffeineFilter === 'yes') filtered = filtered.filter(p => p.caffeinated === true);
                    else if (this.activeCaffeineFilter === 'low') filtered = filtered.filter(p => p.caffeine === 'low');
                    else if (this.activeCaffeineFilter === 'no') filtered = filtered.filter(p => p.caffeinated === false || p.caffeine === undefined);
                }
                this.render(filtered);
            },
            resetFilters: function() { document.getElementById('searchInput').value = ''; this.activeTypeFilters = []; this.activeCaffeineFilter = null; this.renderSidebar(); this.applyFilters(); },

            render: function(items) {
                const grid = document.getElementById('product-grid');
                grid.innerHTML = "";
                if (items.length === 0) { grid.innerHTML = `<div class="col-span-full text-center py-20 text-gray-400 flex flex-col items-center"><i class="fa-solid fa-mug-hot text-4xl mb-4 text-gray-300"></i>No se encontraron productos.</div>`; return; }
                items.forEach(item => {
                    const.vue = `
                    <div class="fade-in border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-between h-[340px] md:h-[360px] hover:shadow-xl hover:border-starbucks transition-all duration-300 cursor-pointer bg-white group relative overflow-hidden" onclick="app.openProductDetail(${item.id})">
                        <div class="h-40 md:h-48 w-full flex items-center justify-center mb-4 relative p-2">
                             <div class="absolute inset-0 bg-starbucks-mint/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-50"></div>
                            <img src="${item.img}" alt="${item.name}" class="w-full h-full object-contain group-hover:scale-105 transition duration-500 drop-shadow-md z-10">
                        </div>
                        <div class="text-center w-full relative z-10">
                            <h3 class="font-bold text-base md:text-lg text-slate-800 mb-1 group-hover:text-starbucks transition line-clamp-1 font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-3 md:mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-xl group-hover:bg-starbucks-mint/30 transition border border-transparent group-hover:border-starbucks-mint">
                                <span class="text-slate-800 font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-starbucks shadow-sm hover:bg-starbucks hover:text-white transition flex items-center justify-center border border-gray-100"><i class="fa-solid fa-plus"></i></button>
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
                this.currentSize = 'Grande';
                const base = product.price;
                this.sizePrices = { Alto: Math.round(base * 0.85), Grande: base, Venti: Math.round(base * 1.25) };

                document.getElementById('detail-category-title').innerText = product.category === 'Drinks' ? 'Bebida' : 'Comida';
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc || "Descripción detallada del producto.";
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Grande}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (product.category === 'Drinks') {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Alto').innerText = `$${this.sizePrices.Alto}`;
                    document.getElementById('price-label-Grande').innerText = `$${this.sizePrices.Grande}`;
                    document.getElementById('price-label-Venti').innerText = `$${this.sizePrices.Venti}`;
                    this.selectSize('Grande');
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
                ['Alto', 'Grande', 'Venti'].forEach(s => {
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
                if (this.currentProduct.category === 'Drinks') unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            addToCartFromDetail: function() {
                let unitPrice = this.currentProduct.category === 'Drinks' ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = this.currentProduct.category === 'Drinks' ? this.currentSize : "Normal";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_cart', JSON.stringify(cart));
                this.updateCartBadge();
                Swal.fire({ icon: 'success', title: '¡Añadido!', showConfirmButton: false, timer: 1000, background: '#00704A', color: '#fff', toast: true, position: 'top-end' });
                this.goBack();
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>