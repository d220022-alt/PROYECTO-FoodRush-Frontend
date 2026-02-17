<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tu Carrito | FoodRush</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #FAFAFA; }
        h1, h2, h3, .font-heading { font-family: 'Sora', sans-serif; }
        
        .bg-starbucks { background-color: #00704A; }
        .text-starbucks { color: #00704A; }
        .bg-footer-red { background-color: #D50032; }

        .fade-in { animation: fadeIn 0.4s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        .fade-out { animation: fadeOut 0.3s forwards; }
        @keyframes fadeOut { to { opacity: 0; transform: translateX(-20px); height: 0; margin: 0; padding: 0; } }

        /* Estilo input cantidad */
        .qty-btn {
            width: 32px; height: 32px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 8px;
            background-color: #F9FAFB;
            color: #374151;
            transition: all 0.2s;
            border: 1px solid #E5E7EB;
        }
        .qty-btn:hover { background-color: #00704A; color: white; border-color: #00704A; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800" onload="loadCart()">

    <div class="bg-slate-900 text-white text-center py-2 text-xs font-bold tracking-wider uppercase">
        <i class="fa-solid fa-truck-fast mr-2"></i> Envío gratis en pedidos superiores a $100
    </div>

    <header class="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <a href="index.html" class="flex items-center gap-1 group">
                <div class="flex flex-col items-center leading-none">
                    <span class="text-orange-500 font-bold text-lg italic tracking-tighter">Food</span>
                    <span class="text-slate-800 font-bold text-lg italic tracking-tighter -mt-1">Rush</span>
                </div>
            </a>
            <nav class="hidden md:flex gap-8 font-medium text-sm text-slate-500">
                <a href="#" class="hover:text-starbucks transition">Ayuda</a>
                <a href="#" class="hover:text-starbucks transition">Mis Pedidos</a>
            </nav>
        </div>
    </header>

    <main class="container mx-auto px-6 py-10 flex-grow max-w-4xl">
        
        <div class="flex items-center justify-between mb-10">
            <h1 class="text-3xl font-bold text-slate-900 font-heading">Tu Carrito</h1>
            <a href="starbucks.html" class="text-sm font-bold text-starbucks hover:underline flex items-center transition">
                <i class="fa-solid fa-arrow-left mr-2"></i> Seguir comprando
            </a>
        </div>

        <div class="space-y-6" id="cart-items-container">
            </div>

        <div id="cart-footer" class="hidden flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-gray-200">
            <button onclick="clearCart()" class="text-sm text-gray-400 hover:text-red-500 transition mb-4 md:mb-0">
                Vaciar carrito
            </button>
            
            <div class="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full md:w-auto">
                <div class="text-center md:text-right">
                    <span class="block text-sm text-gray-400 font-medium">Total estimado</span>
                    <span class="text-4xl font-bold text-slate-900 font-heading" id="cart-total-price">$0</span>
                </div>
                
                <a href="chekout.html" class="w-full md:w-auto bg-[#00704A] hover:bg-[#005c3d] text-white px-10 py-4 rounded-xl shadow-lg shadow-green-900/20 font-bold text-lg transition transform hover:scale-[1.02] flex items-center justify-center gap-3">
                    Pagar Ahora <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>

        <div id="empty-cart-msg" class="hidden text-center py-24 fade-in">
            <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fa-solid fa-basket-shopping text-4xl text-gray-300"></i>
            </div>
            <h2 class="text-2xl font-bold text-slate-700 mb-2 font-heading">Tu carrito está vacío</h2>
            <p class="text-gray-400 mb-8">Parece que aún no has agregado tu producto favorito.</p>
            <a href="starbucks.html" class="inline-block bg-starbucks text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#005c3d] transition">
                Ir al Menú
            </a>
        </div>

    </main>

    <footer class="bg-white border-t border-gray-200 mt-auto py-8">
        <div class="container mx-auto px-6 text-center text-sm text-gray-400">
            <p>&copy; 2025 FoodRush. Pagos seguros y encriptados.</p>
        </div>
    </footer>

    <script>
        function loadCart() {
            const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
            const container = document.getElementById('cart-items-container');
            const cartFooter = document.getElementById('cart-footer');
            const emptyMsg = document.getElementById('empty-cart-msg');
            const totalPriceEl = document.getElementById('cart-total-price');

            container.innerHTML = '';
            let grandTotal = 0;

            if (cart.length === 0) {
                emptyMsg.classList.remove('hidden');
                cartFooter.classList.add('hidden');
            } else {
                emptyMsg.classList.add('hidden');
                cartFooter.classList.remove('hidden');

                cart.forEach((item, index) => {
                    const itemTotal = item.price * item.qty;
                    grandTotal += itemTotal;

                    const html = `
                    <div id="cart-item-${index}" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 transition hover:shadow-md fade-in">
                        
                        <div class="w-24 h-24 flex-shrink-0 bg-[#f2fcf8] rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                            <img src="${item.img}" alt="${item.name}" class="h-full w-full object-contain">
                        </div>

                        <div class="flex-1 text-center sm:text-left w-full">
                            <h3 class="font-bold text-slate-900 text-lg leading-tight font-heading">${item.name}</h3>
                            <p class="text-xs text-gray-400 mt-1 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full">
                                ${item.details || 'Estándar'}
                            </p>
                        </div>

                        <div class="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto mt-4 sm:mt-0 border-t sm:border-0 pt-4 sm:pt-0 border-gray-50">
                            <div class="flex items-center gap-3">
                                <button onclick="updateQuantity(${index}, -1)" class="qty-btn"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                <span class="w-4 text-center font-bold text-slate-700">${item.qty}</span>
                                <button onclick="updateQuantity(${index}, 1)" class="qty-btn"><i class="fa-solid fa-plus text-[10px]"></i></button>
                            </div>

                            <div class="text-right min-w-[80px]">
                                <span class="block text-xl font-bold text-slate-900">$${itemTotal}</span>
                            </div>
                            
                            <button onclick="removeItem(${index})" class="text-gray-300 hover:text-red-500 transition px-2">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    `;
                    container.innerHTML += html;
                });
                
                totalPriceEl.innerText = `$${grandTotal}`;
            }
        }

        function updateQuantity(index, change) {
            let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
            cart[index].qty += change;

            if (cart[index].qty < 1) {
                removeItem(index);
            } else {
                localStorage.setItem('foodrush_cart', JSON.stringify(cart));
                loadCart();
            }
        }

        function removeItem(index) {
            const itemElement = document.getElementById(`cart-item-${index}`);
            if(itemElement) itemElement.classList.add('fade-out');

            setTimeout(() => {
                let cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
                cart.splice(index, 1);
                localStorage.setItem('foodrush_cart', JSON.stringify(cart));
                loadCart();
                
                const Toast = Swal.mixin({
                    toast: true, position: 'bottom-start', showConfirmButton: false, timer: 1500, background: '#333', color: '#fff'
                });
                Toast.fire({ icon: 'info', title: 'Producto eliminado' });
            }, 300);
        }

        function clearCart() {
            Swal.fire({
                title: '¿Vaciar carrito?',
                text: "Se eliminarán todos los productos.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#111827',
                cancelButtonColor: '#9CA3AF',
                confirmButtonText: 'Sí, vaciar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('foodrush_cart');
                    loadCart();
                }
            })
        }
    </script>
</body>
</html>