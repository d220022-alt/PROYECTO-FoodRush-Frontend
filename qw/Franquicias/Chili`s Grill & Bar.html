<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chili's Grill & Bar | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #FFFFFF; }
        h1, h2, h3, .font-heading { font-family: 'Sora', sans-serif; }
        
        /* CHILI'S COLORS */
        .bg-chili-red { background-color: #D71920; }
        .text-chili-red { color: #D71920; }
        .border-chili-red { border-color: #D71920; }
        
        .bg-chili-green { background-color: #007A33; }
        .text-chili-green { color: #007A33; }
        
        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* SLIDER */
        .slider-container { position: relative; height: 100%; width: 100%; overflow: hidden; }
        .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease-in-out; }
        .slide.active { opacity: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        .slider-dots { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; z-index: 20; }
        .dot { width: 10px; height: 10px; background-color: rgba(255,255,255,0.5); border-radius: 50%; cursor: pointer; transition: all 0.3s; }
        .dot.active { background-color: #D71920; transform: scale(1.2); }
        
        /* FILTROS LATERALES */
        .side-filter-btn { cursor: pointer; padding: 8px 12px; color: #6b7280; border-left: 4px solid transparent; transition: all 0.2s; font-size: 0.95rem; display: flex; align-items: center; }
        .side-filter-btn:hover { color: #D71920; }
        .side-filter-btn.active { color: #D71920; font-weight: 700; border-left-color: #D71920; background-color: #fff1f2; }
        
        details > summary { list-style: none; outline: none; }
        details > summary::-webkit-details-marker { display: none; }
        details summary i { transition: transform 0.3s ease; }
        details[open] summary i { transform: rotate(180deg); }

        /* SELECTOR TAMAÑO/PORCIÓN */
        .size-card {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            border: 2px solid #e5e7eb; border-radius: 12px;
            width: 100px; height: 100px;
            cursor: pointer; transition: all 0.2s;
            position: relative;
            background-color: white;
        }
        .size-card:hover { border-color: #D71920; transform: translateY(-3px); }
        .size-card.selected { border-color: #D71920; background-color: #fff1f2; box-shadow: 0 4px 12px rgba(215, 25, 32, 0.15); }
        .size-card i { color: #d1d5db; transition: color 0.2s; }
        .size-card.selected i { color: #D71920; }
        
        /* CONTADORES */
        .counter-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid #e5e7eb; color: #D71920; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: white; }
        .counter-btn:hover { border-color: #D71920; background-color: #fff1f2; }

        /* TOGGLES (Picante) */
        .chili-toggle {
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
        .chili-toggle:hover { background-color: #f9fafb; color: #374151; }
        .chili-toggle.active {
            background-color: #D71920;
            color: white;
            border-color: #D71920;
            box-shadow: 0 2px 4px rgba(215, 25, 32, 0.2);
        }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 bg-white" onload="updateCartBadge()">

    <header class="bg-white border-b sticky top-0 z-50 py-3 shadow-sm">
        <div class="container mx-auto px-6 flex justify-between items-center">
            
            <a href="#" class="flex items-center gap-2 group" onclick="app.goBack()">
                <div class="flex items-center justify-center w-9 h-9 bg-[#D71920] rounded-full mr-1 shadow-sm text-white border-2 border-[#007A33]">
                    <i class="fa-solid fa-pepper-hot text-sm"></i>
                </div>
                <div class="flex flex-col items-start leading-none">
                    <span class="text-[#D71920] font-bold text-lg italic tracking-tighter font-heading">Chili's</span>
                    <span class="text-[#007A33] font-bold text-xs tracking-wider -mt-0.5 uppercase">Grill & Bar</span>
                </div>
            </a>

            <nav class="hidden md:flex gap-8 font-medium text-slate-600">
                <a href="#" class="text-black font-bold border-b-2 border-[#D71920] pb-1" onclick="app.goBack()">Menú</a>
                <a href="#" class="hover:text-chili-red transition">Rewards</a>
                <a href="#" class="hover:text-chili-red transition">Ubicaciones</a>
            </nav>

            <div class="flex items-center gap-6">
                <div class="hidden md:flex items-center border border-gray-200 rounded-full px-4 py-1.5 w-64 shadow-sm bg-white focus-within:border-[#D71920] transition">
                    <i class="fa-solid fa-magnifying-glass text-gray-400 mr-3 text-lg"></i>
                    <input type="text" id="searchInput" placeholder="Buscar..." class="outline-none w-full text-gray-600 placeholder-gray-400 text-sm" onkeyup="app.search(this.value)">
                </div>

                <div class="flex gap-4 text-xl items-center">
                    <button class="relative group" onclick="window.location.href='cart.html'">
                        <i class="fa-solid fa-cart-shopping text-[#1e293b] group-hover:text-chili-red transition"></i>
                        <span id="cart-count" class="absolute -top-2 -right-2 bg-[#007A33] text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center hidden border border-white">0</span>
                    </button>
                    
                    <button class="group">
                        <i class="fa-regular fa-user text-[#1e293b] group-hover:text-chili-red transition"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div id="catalog-view" class="fade-in">
        <section class="flex flex-col md:flex-row h-[400px] w-full bg-white">
            <div class="w-full md:w-2/5 flex items-center justify-center p-8 bg-white z-10 shadow-lg md:shadow-none">
                 <div class="flex flex-col items-center">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/52/Chilis_Grill_%26_Bar_logo.svg/1200px-Chilis_Grill_%26_Bar_logo.svg.png" 
                         alt="Chili's Logo" class="h-40 md:h-56 object-contain drop-shadow-xl hover:scale-105 transition duration-500">
                 </div>
            </div>
            <div class="w-full md:w-3/5 relative bg-gray-900">
                <div class="slider-container" id="hero-slider">
                    <div class="slide active"><img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2938" alt="Ribs"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2944" alt="Burger"></div>
                    <div class="slide"><img src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2786" alt="Margarita"></div>
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
                <button onclick="app.setCategory('Platos', this)" class="filter-tab active bg-chili-red text-white px-6 py-2 rounded-md font-semibold shadow transition whitespace-nowrap">Ribs & Burgers</button>
                <button onclick="app.setCategory('Fajitas', this)" class="filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-chili-red hover:text-chili-red transition whitespace-nowrap">Fajitas & Bowls</button>
                <button onclick="app.setCategory('Entradas', this)" class="filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-chili-red hover:text-chili-red transition whitespace-nowrap">Apps & Bebidas</button>
            </div>
        </div>

        <div class="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside class="md:col-span-1 select-none bg-white p-5 rounded-xl border border-gray-200 h-fit sticky top-32 shadow-sm">
                <h3 class="font-bold text-xl text-slate-800 mb-6 font-heading">Filtrar Menú</h3>
                <div id="dynamic-sidebar-content" class="space-y-4"></div>
            </aside>
            <main id="product-grid" class="md:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6"></main>
        </div>
    </div>

    <div id="product-detail-view" class="hidden fade-in container mx-auto px-6 py-10 max-w-6xl">
        <button onclick="app.goBack()" class="mb-8 flex items-center text-sm font-bold text-gray-500 hover:text-chili-red transition">
            <i class="fa-solid fa-chevron-left mr-2"></i> Volver al menú
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
            
            <div class="flex flex-col gap-8">
                <div class="relative bg-red-50 rounded-3xl flex items-center justify-center p-12 h-[500px] border border-red-100 overflow-hidden shadow-sm">
                    <div class="absolute inset-0 opacity-5 bg-[radial-gradient(#D71920_3px,transparent_3px)] [background-size:20px_20px]"></div>
                    <img id="detail-img" src="" alt="Product" class="max-h-full max-w-full object-contain drop-shadow-2xl z-10 transition-transform duration-500 hover:scale-105">
                </div>

                <div id="size-section" class="w-full">
                    <h3 class="font-bold text-lg text-slate-800 mb-4 font-heading border-b border-gray-100 pb-2">Elige tu Porción</h3>
                    <div class="flex gap-4 justify-center md:justify-start">
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Media')">
                            <div class="size-card" id="size-Media">
                                <i class="fa-solid fa-drumstick-bite text-2xl"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Media</span>
                                <span class="block text-[10px] text-gray-400">Half Rack</span>
                                <span class="block text-xs font-bold text-chili-red mt-1" id="price-label-Media">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Completa')">
                            <div class="size-card selected" id="size-Completa">
                                <i class="fa-solid fa-bacon text-3xl"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Completa</span>
                                <span class="block text-[10px] text-gray-400">Full Rack</span>
                                <span class="block text-xs font-bold text-chili-red mt-1" id="price-label-Completa">$0</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-center gap-2 cursor-pointer group" onclick="app.selectSize('Doble')">
                            <div class="size-card" id="size-Doble">
                                <i class="fa-solid fa-utensils text-3xl"></i>
                            </div>
                            <div class="text-center leading-tight">
                                <span class="block text-sm font-bold text-slate-700">Combo</span>
                                <span class="block text-[10px] text-gray-400">+ Wings</span>
                                <span class="block text-xs font-bold text-chili-red mt-1" id="price-label-Doble">$0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col h-full">
                <div class="mb-6">
                    <h2 class="text-sm font-bold text-chili-green mb-2 tracking-widest uppercase" id="detail-category-title">Plato</h2>
                    <h1 id="detail-title" class="text-4xl font-bold text-slate-900 mb-4 font-heading leading-tight">Nombre Producto</h1>
                    
                    <div class="flex items-center mb-6 text-sm">
                        <div class="flex text-yellow-500 gap-1 text-sm">
                            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                        </div>
                        <span class="text-gray-400 ml-2 text-xs font-medium">Southwestern Grill</span>
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
                        <i class="fa-solid fa-fire text-chili-red"></i> A tu gusto
                    </h3>
                    
                    <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        
                        <div class="p-4 border-b border-gray-100">
                            <span class="text-sm font-bold text-slate-700 block mb-3">Nivel de Picante</span>
                            <div class="flex flex-wrap gap-2">
                                <button class="chili-toggle active" onclick="app.toggleSpice(this)">Nada</button>
                                <button class="chili-toggle" onclick="app.toggleSpice(this)">Medio</button>
                                <button class="chili-toggle" onclick="app.toggleSpice(this)">Muy Picante</button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center p-4 border-b border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><i class="fa-solid fa-wheat-awn"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Elote</span><span class="text-[10px] text-gray-400 uppercase">Extra side</span></div>
                            </div>
                            <div class="flex items-center gap-3"><button onclick="app.updateIngredient('corn-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="corn-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('corn-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>

                        <div class="flex justify-between items-center p-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><i class="fa-solid fa-bowl-rice"></i></div>
                                <div><span class="text-sm font-bold text-slate-700 block">Arroz</span><span class="text-[10px] text-gray-400 uppercase">Porción</span></div>
                            </div>
                            <div class="flex items-center gap-3"><button onclick="app.updateIngredient('rice-qty', -1)" class="counter-btn"><i class="fa-solid fa-minus text-[10px]"></i></button><span id="rice-qty" class="font-bold text-slate-700 w-4 text-center text-sm">0</span><button onclick="app.updateIngredient('rice-qty', 1)" class="counter-btn"><i class="fa-solid fa-plus text-[10px]"></i></button></div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 bg-white pt-4 border-t border-gray-100 sticky bottom-0 z-20 pb-4">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-gray-400 font-medium">Total estimado</span>
                        <span id="detail-total-price" class="text-3xl font-bold text-slate-900">$0</span>
                    </div>
                    
                    <button onclick="app.addToCartFromDetail()" class="w-full bg-chili-red hover:bg-[#b01018] text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 text-lg transition transform hover:scale-[1.01] flex items-center justify-center gap-3">
                        <span>Añadir al Pedido</span>
                        <i class="fa-solid fa-pepper-hot"></i>
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
            cart: JSON.parse(localStorage.getItem('foodrush_chilis_cart')) || [],
            currentCategory: 'Platos',
            activeTypeFilters: [], activeSpecFilter: null, 
            currentProduct: null, currentQty: 1, currentSize: 'Completa',
            sizePrices: { Media: 0, Completa: 0, Doble: 0 },
            currentSlide: 0, slides: [], dots: [], slideInterval: null,

            // BASE DE DATOS CHILI'S
            products: [
                { id: 1, name: "Baby Back Ribs", category: "Platos", type: "Ribs", price: 650, spec: "pork", img: "https://www.chilis.com/images/Menu/Platter/BabyBackRibs_Platter.jpg", desc: "Nuestras famosas costillas de cerdo, cocinadas lentamente y bañadas en salsa BBQ." },
                { id: 2, name: "Oldtimer® with Cheese", category: "Platos", type: "Burger", price: 490, spec: "beef", img: "https://www.chilis.com/images/Menu/Platter/Oldtimer_Platter.jpg", desc: "La clásica hamburguesa hecha a mano con queso cheddar, pepinillos, lechuga, tomate y cebolla roja." },
                { id: 3, name: "Mix & Match Fajitas", category: "Fajitas", type: "Fajitas", price: 720, spec: "mix", img: "https://www.chilis.com/images/Menu/Platter/MixMatchFajitas_Platter.jpg", desc: "Elige dos: Pollo, Carne o Camarones. Servidas con cebolla, pimientos y tortillas calientes." },
                { id: 4, name: "Southwestern Eggrolls", category: "Entradas", type: "Appetizer", price: 350, spec: "classic", img: "https://www.chilis.com/images/Menu/Platter/SouthwesternEggrolls_Platter.jpg", desc: "Tortillas crujientes rellenas de pollo ahumado, frijoles negros, elote y queso Jack." },
                { id: 5, name: "Boneless Buffalo Wings", category: "Entradas", type: "Wings", price: 380, spec: "spicy", img: "https://www.chilis.com/images/Menu/Platter/BonelessBuffaloWings_Platter.jpg", desc: "Alitas deshuesadas empanizadas y bañadas en nuestra salsa Buffalo picante." },
                { id: 6, name: "Cajun Chicken Pasta", category: "Platos", type: "Pasta", price: 550, spec: "chicken", img: "https://www.chilis.com/images/Menu/Platter/CajunChickenPasta_Platter.jpg", desc: "Pasta penne con salsa Alfredo cremosa, especias cajún y pechuga de pollo a la parrilla." },
                { id: 7, name: "Presidente Margarita", category: "Entradas", type: "Bebida", price: 300, spec: "drink", img: "https://www.chilis.com/images/Menu/Platter/PresidenteMargarita_Platter.jpg", desc: "Nuestra margarita premium, agitada a mano 25 veces." },
                { id: 8, name: "Molten Chocolate Cake", category: "Entradas", type: "Postre", price: 320, spec: "sweet", img: "https://www.chilis.com/images/Menu/Platter/MoltenChocolateCake_Platter.jpg", desc: "Pastel de chocolate caliente con centro líquido, cubierto de helado de vainilla y chocolate crujiente." }
            ],
            
            init: function() { 
                this.updateCartBadge();
                this.initSlider();
                this.setCategory('Platos');
            },

            search: function(text) {
                this.applyFilters(text);
            },

            renderSidebar: function() {
                const container = document.getElementById('dynamic-sidebar-content');
                let html = '';
                const isActiveType = (type) => this.activeTypeFilters.includes(type) ? 'active' : '';
                const isActiveSpec = (val) => this.activeSpecFilter === val ? 'active' : '';

                if (this.currentCategory === 'Platos') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-chili-red transition">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Ribs')}" onclick="app.toggleTypeFilter('Ribs')">Costillas</p><p class="side-filter-btn ${isActiveType('Burger')}" onclick="app.toggleTypeFilter('Burger')">Hamburguesas</p><p class="side-filter-btn ${isActiveType('Pasta')}" onclick="app.toggleTypeFilter('Pasta')">Pastas</p></div></details>
                    <details open class="group mb-4 border-t border-gray-100 pt-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-chili-red transition">PROTEÍNA <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveSpec('pork')}" onclick="app.toggleSpecFilter('pork')">Cerdo</p><p class="side-filter-btn ${isActiveSpec('beef')}" onclick="app.toggleSpecFilter('beef')">Res</p><p class="side-filter-btn ${isActiveSpec('chicken')}" onclick="app.toggleSpecFilter('chicken')">Pollo</p></div></details>`;
                } else if (this.currentCategory === 'Fajitas') {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-chili-red transition">ESTILO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Fajitas')}" onclick="app.toggleTypeFilter('Fajitas')">Clásicas</p></div></details>`;
                } else {
                    html += `<details open class="group mb-4"><summary class="flex justify-between items-center font-bold text-gray-500 cursor-pointer mb-3 hover:text-chili-red transition">TIPO <i class="fa-solid fa-chevron-down text-xs"></i></summary><div class="space-y-1"><p class="side-filter-btn ${isActiveType('Appetizer')}" onclick="app.toggleTypeFilter('Appetizer')">Entradas</p><p class="side-filter-btn ${isActiveType('Wings')}" onclick="app.toggleTypeFilter('Wings')">Alitas</p><p class="side-filter-btn ${isActiveType('Bebida')}" onclick="app.toggleTypeFilter('Bebida')">Bebidas</p><p class="side-filter-btn ${isActiveType('Postre')}" onclick="app.toggleTypeFilter('Postre')">Postres</p></div></details>`;
                }
                html += `<div class="pt-8 mt-4 border-t border-gray-100"><button onclick="app.resetFilters()" class="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"><i class="fa-solid fa-rotate-left"></i> Limpiar Filtros</button></div>`;
                container.innerHTML = html;
            },

            toggleTypeFilter: function(type) { if (this.activeTypeFilters.includes(type)) { this.activeTypeFilters = this.activeTypeFilters.filter(t => t !== type); } else { if (this.activeTypeFilters.length >= 2) this.activeTypeFilters.shift(); this.activeTypeFilters.push(type); } this.applyFilters(); this.renderSidebar(); },
            toggleSpecFilter: function(val) { this.activeSpecFilter = (this.activeSpecFilter === val) ? null : val; this.applyFilters(); this.renderSidebar(); },
            
            setCategory: function(cat, btn) {
                this.currentCategory = cat; this.activeTypeFilters = []; this.activeSpecFilter = null;
                document.querySelectorAll('.filter-tab').forEach(b => { b.className = "filter-tab border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-semibold hover:border-chili-red hover:text-chili-red transition whitespace-nowrap"; });
                if(btn) btn.className = "filter-tab active bg-chili-red text-white px-6 py-2 rounded-md font-semibold shadow transition whitespace-nowrap";
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
                    <div class="fade-in border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-between h-[360px] hover:shadow-xl hover:border-chili-red transition-all duration-300 cursor-pointer bg-white group" onclick="app.openProductDetail(${item.id})">
                        <div class="h-48 w-full flex items-center justify-center mb-4 overflow-hidden relative">
                            <div class="absolute inset-0 bg-red-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 opacity-30"></div>
                            <img src="${item.img}" alt="${item.name}" class="h-full object-cover rounded-lg group-hover:scale-110 transition duration-500 drop-shadow-sm z-10"
                                 onerror="this.src='https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2938'">
                        </div>
                        <div class="text-center w-full">
                            <h3 class="font-bold text-lg text-slate-800 mb-1 group-hover:text-chili-red transition line-clamp-1">${item.name}</h3>
                            <p class="text-xs text-gray-400 mb-4">${item.type}</p>
                            <div class="flex justify-between items-center w-full bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition">
                                <span class="text-slate-800 font-bold px-2 text-lg">$${item.price}</span>
                                <button class="w-8 h-8 rounded-lg bg-white text-chili-red shadow-sm hover:bg-chili-red hover:text-white transition flex items-center justify-center border border-gray-200"><i class="fa-solid fa-plus"></i></button>
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
                this.currentSize = 'Completa';
                const base = product.price;
                
                // Precios ajustados según el tipo de plato
                if (product.type === 'Ribs') {
                    this.sizePrices = { Media: Math.round(base * 0.7), Completa: base, Doble: base + 250 };
                } else if (product.type === 'Burger') {
                    this.sizePrices = { Media: base, Completa: base + 150, Doble: base + 250 };
                } else {
                    this.sizePrices = { Media: base, Completa: base, Doble: base };
                }

                document.getElementById('detail-category-title').innerText = product.category;
                document.getElementById('detail-title').innerText = product.name;
                document.getElementById('detail-desc').innerText = product.desc;
                document.getElementById('detail-img').src = product.img;
                document.getElementById('detail-img').onerror = function() { this.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2938'; };
                
                document.getElementById('detail-qty').innerText = "1";
                document.getElementById('detail-price-display').innerText = `$${this.sizePrices.Completa}`;
                
                const sizeSection = document.getElementById('size-section');
                const custSection = document.getElementById('customization-options');
                
                if (['Platos', 'Fajitas'].includes(product.category)) {
                    sizeSection.classList.remove('hidden');
                    custSection.classList.remove('hidden');
                    document.getElementById('price-label-Media').innerText = `$${this.sizePrices.Media}`;
                    document.getElementById('price-label-Completa').innerText = `$${this.sizePrices.Completa}`;
                    document.getElementById('price-label-Doble').innerText = `$${this.sizePrices.Doble}`;
                    this.selectSize('Completa');
                    
                    document.getElementById('corn-qty').innerText = "0";
                    document.getElementById('rice-qty').innerText = "0";
                    document.querySelectorAll('.chili-toggle').forEach(t => t.classList.remove('active'));

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
                ['Media', 'Completa', 'Doble'].forEach(s => {
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

            toggleSpice: function(btn) {
                const siblings = btn.parentElement.querySelectorAll('.chili-toggle');
                siblings.forEach(s => s.classList.remove('active'));
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
                if (['Platos', 'Fajitas'].includes(this.currentProduct.category)) unitPrice = this.sizePrices[this.currentSize];
                else unitPrice = this.currentProduct.price;
                const total = unitPrice * this.currentQty;
                document.getElementById('detail-total-price').innerText = `$${total}`;
            },
            
            addToCartFromDetail: function() {
                let unitPrice = ['Platos', 'Fajitas'].includes(this.currentProduct.category) ? this.sizePrices[this.currentSize] : this.currentProduct.price;
                let details = ['Platos', 'Fajitas'].includes(this.currentProduct.category) ? this.currentSize : "Estándar";
                const cartItem = { id: this.currentProduct.id, name: this.currentProduct.name, price: unitPrice, img: this.currentProduct.img, qty: this.currentQty, details: details };
                let cart = JSON.parse(localStorage.getItem('foodrush_chilis_cart')) || [];
                const existing = cart.find(i => i.id === cartItem.id && i.details === details);
                if(existing) { existing.qty += this.currentQty; } else { cart.push(cartItem); }
                localStorage.setItem('foodrush_chilis_cart', JSON.stringify(cart));
                this.updateCartBadge();
                
                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido a Chili\'s!',
                    text: '¿Quieres pagar o seguir pidiendo?',
                    showCancelButton: true,
                    confirmButtonText: 'Ir a Pagar',
                    cancelButtonText: 'Seguir Pidiendo',
                    confirmButtonColor: '#D71920',
                    cancelButtonColor: '#333'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'cart.html';
                    } else {
                        this.goBack();
                    }
                });
            },
            updateCartBadge: function() { const cart = JSON.parse(localStorage.getItem('foodrush_chilis_cart')) || []; const count = cart.reduce((sum, i) => sum + i.qty, 0); const badge = document.getElementById('cart-count'); badge.innerText = count; badge.classList.toggle('hidden', count === 0); }
        };
        app.init();
        function updateCartBadge() { app.updateCartBadge(); }
    </script>
</body>
</html>