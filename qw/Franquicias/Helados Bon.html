<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Helados Bon | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #FFFFFF; }
        h1, h2, h3, .font-heading { font-family: 'Sora', sans-serif; }
        
        /* HELADOS BON COLORS */
        .bg-bon-blue { background-color: #0054A6; }
        .text-bon-blue { color: #0054A6; }
        .border-bon-blue { border-color: #0054A6; }
        
        .bg-bon-yellow { background-color: #FFC72C; }
        .text-bon-yellow { color: #FFC72C; }
        
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* SLIDER */
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #0054A6; transform: scale(1.2); }
        
        /* FILTROS LATERALES */
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #6b7280; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; }
        .side-filter-btn:hover { color: #0054A6; }
        .side-filter-btn.active { color: #0054A6; font-weight: 700; border-left-color: #0054A6; background-color: #e6f0ff; }
        
        details > summary { list-style: none; outline: none; }
        details > summary::-webkit-details-marker { display: none; }
        details summary i { transition: transform 0.3s ease; }
        details[open] summary i { transform: rotate(180deg); }

        /* SELECTOR TAMAÑO (Bolas) */
        .size-card {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border: 2px solid #e5e7eb; border-radius: 50%; /* Redondo como bola de helado */
            width: 100px; height: 100px;
            cursor: pointer; transition: all 0.2s;
            position: relative;
            background-color: white;
        }
        .size-card:hover { border-color: #0054A6; transform: translateY(-3px); }
        .size-card.selected { border-color: #0054A6; background-color: #e6f0ff; box-shadow: 0 4px 12px rgba(0, 84, 166, 0.15); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #0054A6; }
        
        /* CONTADORES */
        .counter-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #e5e7eb; color: #0054A6; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #0054A6; background-color: #e6f0ff; }

        /* TOGGLES (Toppings) */
        .bon-toggle {
            padding: 6px 12px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            border-radius: 20px;
            transition: all 0.2s ease;
            background-color: white;
            cursor: pointer;
            display: flex; align-items: center; gap: 4px;
        }
        .bon-toggle:hover { background-color: #f9fafb; color: #374151; }
        .bon-toggle.active {
            background-color: #0054A6;
            color: white;
            border-color: #0054A6;
            box-shadow: 0 2px 4px rgba(0, 84, 166, 0.2);
        }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-white" onload="updateCartBadge()">

    <header class="bg-white border-b sticky top-0 z-50 py-3 shadow-sm">
        <div class="container mx-auto px-6 flex justify-between items-center">
            
            <a href="#" class="flex items-center gap-2 group" onclick="app.goBack()">
                <div class="flex items-center justify-center w-9 h-9 bg-white rounded-full mr-1 shadow-sm text-[#0054A6] border-2 border-[#0054A6] overflow-hidden">
                    <i class="fa-solid fa-ice-cream text-lg"></i>
                </div>
                <div class="flex flex-col items-start leading-none">
                    <span class="text-[#0054A6] font-bold text-lg italic tracking-tighter font-heading">Helados</span>
                    <span class="text-[#FFC72C] font-bold text-lg italic tracking-tighter -mt-1" style="text-shadow: 0.5px 0.5px 0 #0054A6;">Bon</span>
                </div>
            </a>

            <nav class="hidden md:flex gap-8 font-medium text-slate-600">
                <a href="#" class="text-black font-bold border-b-2 border-[#0054A6] pb-1" onclick="app.goBack()">Sabores</a>
                <a href="#" class="hover:text-bon-blue transition">Etiqueta Negra</a>
                <a href="#" class="hover:text-bon-blue transition">Yogen</a>
            </nav>

            <div class="flex items-center gap-6">
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-1.5 w-64 shadow-sm bg-white focus-within:border-[#0054A6] transition">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3 text-lg"></i>
                    <input type="text" id="searchInput" placeholder="Buscar sabor..." class="outline-none w-full text-gray-600 placeholder-gray-400 text-sm" onkeyup="app.search(this.value)">
                </div>

                <div class="flex gap-4 text-xl items-center">
                    <button class="relative group" onclick="window.location.href='cart.html'">
                        <i class="fa-solid fa-cart-shopping text-[#1e293b] group-hover:text-bon-blue transition"></i>
                        <span id="cart-count" class="absolute -top-2 -right-2 bg-[#FFC72C] text-slate-900 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center hidden border border-white">0</span>
                    </button>
                    
                    <button class="group">
                        <i class="fa-regular fa-user text-[#1e293b] group-hover:text-bon-blue transition"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div id="catalog-view" class="fade-in">
        <section class="flex flex-col md:flex-row h-[400px] w-full bg-white">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 bg-white z-10 shadow-lg md:shadow-none">
                 <div class="flex flex-col items-center">
                    <img src="https://heladosbon.com/wp-content/uploads/2021/04/Logo-Bon-Header-300x129-1.png" 
                         onerror="this.src='https://via.placeholder.com/200x100?text=Helados+Bon'"
                         alt="Helados Bon Logo" class="h-40 md:h-56 object-contain drop-shadow-xl hover:scale-105 transition duration-500">
                 </div>
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1579954115563-e72bf1381629?q=80&w=2940" alt="Helado Chocolate"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=2788" alt="Fresa"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1570197788417-0e82375c9371?q=80&w=2808" alt="Batida"></div>
                </div>
                <div class="slider-dots" id="slider-dots">
                    <div class="dot active" onclick="app.goToSlide(0)"></div>
                    <div class="dot" onclick="app.goToSlide(1)"></div>
                    <div class="dot" onclick="app.goToSlide(2)"></div>
                </div>
            </div>
        </section>

        <div class="bg-white border-b sticky top-[73px] z-30 shadow-sm">
            <div class="container mx-auto px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar" id="top-filters">
                <button onclick="app.setCategory('Helados', this)" class="filter-tab active bg-bon-blue text-white px-6 py-2 rounded-md font-semibold shadow transition whitespace-nowrap">Helados</button>
                <button onclick="app.setCategory('Batidas', this)" class="filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-bon-blue hover:text-bon-blue transition whitespace-nowrap">Batidas y Malteadas</button>
                <button onclick="app.setCategory('Especialidades', this)" class="filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-bon-blue hover:text-bon-blue transition whitespace-nowrap">Especialidades</button>
            </div>
        </div>

        <div class="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside class="md:col-span-1 select-none bg-white p-5 rounded-xl border border-gray-200 h-fit sticky top-32 shadow-sm">
                <h3 class="font-bold text-xl text-slate-800 mb-6 font-heading">Felicidad hecha helado</h3>
                <div id="dynamic-sidebar-content" class="space-y-4"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-6 py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-8 flex items-center text-sm font-bold text-gray-500 hover:text-bon-blue transition">
            <i class="fa-solid fa-chevron-left mr-2"></i> Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
            
            <div class="flex flex-col gap-8">
                <div class="relative bg-blue-50 rounded-3xl flex items-center justify-center p-12 h-[500px] border border-blue-100 overflow-hidden shadow-sm">
                    <div class="absolute inset-0 opacity-5 bg-[radial-gradient(#0054A6_3px,transparent_3px)] [background-size:20px_20px]"></div>
                    <img id="detail-img" src="" alt="Product" class="max-h-full max-w-full object-contain drop-shadow-2xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading border-b border-gray-100 pb-2">Elige el Tamaño</h3>
                    <div class="flex gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Sencilla')">
                            <div class="size-card selected" id="size-Sencilla">
                                <i class="fa-solid fa-ice-cream text-3xl"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Sencilla</span>
                                <span class="block text-[10px] text-gray-400">1 Bola</span>
                                <span class="block text-xs font-bold text-bon-blue mt-1" id="price-label-Sencilla">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Doble')">
                            <div class="size-card" id="size-Doble">
                                <i class="fa-solid fa-ice-cream text-3xl" style="transform: scale(1.2);"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Doble</span>
                                <span class="block text-[10px] text-gray-400">2 Bolas</span>
                                <span class="block text-xs font-bold text-bon-blue mt-1" id="price-label-Doble">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Pinta')">
                            <div class="size-card" id="size-Pinta">
                                <i class="fa-solid fa-bucket text-3xl"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Pinta</span>
                                <span class="block text-[10px] text-gray-400">Para llevar</span>
                                <span class="block text-xs font-bold text-bon-blue mt-1" id="price-label-Pinta">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-sm font-bold text-bon-yellow mb-2 tracking-widest uppercase" id="detail-category-title">Helado</h2>
                    <h1 id="detail-title" class="text-4xl font-bold text-slate-900 mb-4 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-6 text-sm">
                        <div class="flex text-yellow-400 gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">Tradición Dominicana</span>
                    </div>

                    <p id="detail-desc" class="text-gray-500 text-sm leading-relaxed">Descripción del producto...</p>
                </div>

                <div class="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div class="flex items-center gap-3">
                        <span class="text-gray-500 font-medium text-sm">Precio</span>
                        <span id="detail-price-display" class="text-2xl font-bold text-slate-800">$0</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center bg-gray-50 rounded-lg p-1">
                            <button onclick="app.changeQty(-1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">-</button>
                            <span id="detail-qty" class="w-10 text-center font-bold text-lg text-slate-800">1</span>
                            <button onclick="app.changeQty(1)" class="w-8 h-8 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-md text-slate-600 font-bold transition">+</button>
                        </div>
                    </div>
                </div>

                <div id="customization-options" class="flex-grow">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-bon-blue"></i> Toppings
                    </h3>
                    
                    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        
                        <div class="p-4 border-b border-gray-100">
                            <span class="text-sm font-bold text-slate-700 block mb-3">Cobertura</span>
                            <div class="flex flex-wrap gap-2">
                                <button class="bon-toggle active" onclick="app.toggleTopping(this)">Mani</button>
                                <button class="bon-toggle" onclick="app.toggleTopping(this)">Lluvia de Colores</button>
                                <button class="bon-toggle" onclick="app.toggleTopping(this)">Lluvia de Chocolate</button>
                            </div>
                        </div>

                        <div class="p-4 border-b border-gray-100">
                            <span class="text-sm font-bold text-slate-700 block mb-3">Sirope</span>
                            <div class="flex flex-wrap gap-2">
                                <button class="bon-toggle active" onclick="app.toggleTopping(this)">No</button>
                                <button class="bon-toggle" onclick="app.toggleTopping(this)">Chocolate</button>
                                <button class="bon-toggle" onclick="app.toggleTopping(this)">Caramelo</button>
                                <button class="bon-toggle" onclick="app.toggleTopping(this)">Fresa</button>
                            </div>
                        </div>

                         <div class="flex justify-between items-center p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fa-solid fa-caret-down"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Barquillas</span><span class="text-[10px] text-gray-400 uppercase">Extra</span></div>
                            </div>
                            <div class="flex items-center gap-3"><button onclick="app.updateIngredient('cone-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="cone-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('cone-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-400 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-slate-900">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-bon-blue hover:bg-[#003d7a] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 text-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-3">
                        <span>Añadir a la Bolsa</span>
                        <i class="fa-solid fa-bag-shopping"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-[#BD0A0A] text-white mt-auto">
        <div class="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div class="mb-8 md:mb-0">
                 <div class="flex items-center gap-2 mb-4 bg-white w-fit px-3 py-1 rounded">
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
                    <h4 class="font-bold mb-4 text-lg">Ayuda</h4>
                    <ul class="space-y-3 text-white/90 font-medium">
                        <li><a href="#" class="hover:text-white hover:underline">Preguntas Frecuentes</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Soporte</a></li>
                        <li><a href="#" class="hover:text-white hover:underline">Términos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4 text-lg">Empresa</h4>
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
            cart: JSON.parse(localStorage.getItem('foodrush_bon_cart')) || [],
            currentCategory: 'Helados',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Sencilla',
            sizePrices: { Sencilla: 0, Doble: 0, Pinta: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            // BASE DE DATOS HELADOS BON
            products: [
                { id: 1, name: "Chocolate Don Alfonso", category: "Helados", type: "Tradicional", price: 150, spec: "choco", img: "https://heladosbon.com/wp-content/uploads/2021/04/Don-Alfonso-300x300.png", desc: "El clásico chocolate de la casa, cremoso y rico. El favorito de siempre." },
                { id: 2, name: "Fresa Natural", category: "Helados", type: "Frutas", price: 150, spec: "fruit", img: "https://heladosbon.com/wp-content/uploads/2021/04/Fresa-300x300.png", desc: "Helado cremoso elaborado con fresas naturales seleccionadas." },
                { id: 3, name: "Vainilla", category: "Helados", type: "Tradicional", price: 140, spec: "classic", img: "https://heladosbon.com/wp-content/uploads/2021/04/Vainilla-300x300.png", desc: "Suave y aromático helado de vainilla, perfecto para combinar." },
                { id: 4, name: "Barquito", category: "Especialidades", type: "Sundae", price: 295, spec: "mix", img: "https://heladosbon.com/wp-content/uploads/2021/04/Barquito-300x300.png", desc: "Tres bolas de helado sobre un plátano maduro, con sirope, crema batida y una cereza." },
                { id: 5, name: "Malteada", category: "Batidas", type: "Batida", price: 220, spec: "milk", img: "https://heladosbon.com/wp-content/uploads/2021/04/Malteada-300x300.png", desc: "Tu sabor de helado favorito batido con leche hasta obtener una textura perfecta." },
                { id: 6, name: "Etiqueta Negra Brownie", category: "Helados", type: "Premium", price: 180, spec: "choco", img: "https://heladosbon.com/wp-content/uploads/2021/04/Brownie-300x300.png", desc: "Helado premium con trozos de brownie y fudge de chocolate." },
                { id: 7, name: "Coco con Piña", category: "Helados", type: "Frutas", price: 150, spec: "fruit", img: "https://heladosbon.com/wp-content/uploads/2021/04/Coco-Pina-300x300.png", desc: "Refrescante combinación tropical de coco y piña." },
                { id: 8, name: "Batida de Frutas", category: "Batidas", type: "Batida", price: 200, spec: "fruit", img: "https://heladosbon.com/wp-content/uploads/2021/04/Batida-Frutas-300x300.png", desc: "Batida refrescante hecha con helado de frutas y agua o leche." },
                { id: 9, name: "Galleta y Crema", category: "Helados", type: "Tradicional", price: 160, spec: "classic", img: "https://heladosbon.com/wp-content/uploads/2021/04/Cookies-Cream-300x300.png", desc: "Cremoso helado con trocitos de galleta de chocolate." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Helados');
            },

            search: function(text) {
                this.applyFilters(text);
            },

            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let html = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Helados') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-bon-blue transition">LÍNEA <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Tradicional')}" onclick="app.toggleTypeFilter('Tradicional')">Tradicionales</p><p class="side-filter-btn ${isActiveType('Premium')}" onclick="app.toggleTypeFilter('Premium')">Etiqueta Negra</p><p class="side-filter-btn ${isActiveType('Frutas')}" onclick="app.toggleTypeFilter('Frutas')">Frutales</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-bon-blue transition">SABOR <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('choco')}" onclick="app.toggleSpecFilter('choco')">Chocolate</p><p class="side-filter-btn ${isActiveSpec('fruit')}" onclick="app.toggleSpecFilter('fruit')">Frutas</p></div></details>`;
                } else if (this.currentCategory === 'Batidas') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-bon-blue transition">BASE <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Batida')}" onclick="app.toggleTypeFilter('Batida')">Con Helado</p></div></details>`;
                } else {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-bon-blue transition">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Sundae')}" onclick="app.toggleTypeFilter('Sundae')">Sundaes</p></div></details>`;
                }
                html += `<div class="pt-8 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML = html;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-bon-blue hover:text-bon-blue transition whitespace-nowrap"; });
                if(btn) btn.className = "filter-tab active bg-bon-blue text-white px-6 py-2 rounded-md font-semibold shadow transition whitespace-nowrap";
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
                if (items.length === 0) { grid.innerHTML = `<div class="col-span-4 text-center py-10 text-gray-400">No se encontraron productos.</div>`; return; }
                items.forEach(item => {
                    const html = `
                    <div class="fade-in border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-between h-[360px] hover:shadow-xl hover:border-bon-blue transition-all duration-300 cursor-pointer bg-white group" onclick="app.openProductDetail(${item.id})">
                        <div class="h-48 w-full flex items-center justify-center mb-4 overflow-hidden relative">
                            <div class="absolute inset-0 bg-blue-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-30"></div>
                            <img src="${item.img}" alt="${item.name}" class="h-full object-contain group-hover:scale-110 transition duration-500 drop-shadow-lg z-10"
                                 onerror="this.src='https://via.placeholder.com/300?text=Helado'">
                        </div>
                        <div class="text-center w-full">
                            <h3 class="font-bold text-lg text-slate-800 mb-1 group-hover:text-bon-blue transition line-clamp-1">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-lg group-hover:bg-yellow-50 transition">
                                <span class="text-slate-800 font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-bon-blue shadow-sm hover:bg-bon-blue hover:text-white transition flex items-center justify-center border border-gray-200"><i class="fa-solid fa-plus"></i></button>
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
                this.currentSize = 'Sencilla';
                const base = product.price;
                this.sizePrices = { Sencilla: base, Doble: Math.round(base * 1.8), Pinta: Math.round(base * 3.5) };

                document.getElementById('detail-category-title').innerText = product.category;
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc;
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-img').onerror = function() { this.src = 'https://via.placeholder.com/300?text=Helado'; };
                
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Sencilla}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (product.category === 'Helados') {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Sencilla').innerText = `$${this.sizePrices.Sencilla}`;
                    document.getElementById('price-label-Doble').innerText = `$${this.sizePrices.Doble}`;
                    document.getElementById('price-label-Pinta').innerText = `$${this.sizePrices.Pinta}`;
                    this.selectSize('Sencilla');
                    
                    document.getElementById('cone-qty').innerText = "0";
                    document.querySelectorAll('.bon-toggle').forEach(t => t.classList.remove('active'));

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
                ['Sencilla', 'Doble', 'Pinta'].forEach(s => {
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

            toggleTopping: function(btn) {
                btn.classList.toggle('active');
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
                if (this.currentProduct.category === 'Helados') unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            
            addToCartFromDetail: function() {
                let unitPrice = this.currentProduct.category === 'Helados' ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = this.currentProduct.category === 'Helados' ? this.currentSize : "Normal";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_bon_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_bon_cart', JSON.stringify(cart));
                this.updateCartBadge();
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Felicidad!',
                    text: '¿Quieres pagar o seguir pidiendo?',
                    showCancelButton: true,
                    confirmButtonText: 'Ir a Pagar',
                    cancelButtonText: 'Seguir Pidiendo',
                    confirmButtonColor: '#0054A6',
                    cancelButtonColor: '#333'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'cart.html';
                    } else {
                        this.goBack();
                    }
                });
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_bon_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>