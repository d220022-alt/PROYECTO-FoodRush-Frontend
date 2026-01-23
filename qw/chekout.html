<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout | FoodRush</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Poppins', sans-serif; background-color: #E5E5E5; }
        
        .bg-footer-red { background-color: #BD0A0A; }
        
        /* Mapa */
        #map { height: 180px; width: 100%; border-radius: 12px; z-index: 1; }
        
        /* Radio Buttons */
        .radio-box:checked + div { border-color: #00704A; background-color: #f0fdf4; }
        .radio-box:checked + div .radio-indicator { border: 5px solid #00704A; }
        .radio-indicator { width: 16px; height: 16px; border-radius: 50%; border: 1px solid #ccc; transition: all 0.2s; }

        /* Tarjeta Visual */
        .credit-card-visual { background: linear-gradient(135deg, #0033cc 0%, #001a66 100%); color: white; border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }

        /* Botones de Modo */
        .mode-btn-active { background-color: #1e293b; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .mode-btn-inactive { color: #475569; background-color: transparent; }
        .mode-btn-inactive:hover { background-color: #d1d5db; }
        
        .input-field { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; width: 100%; outline: none; color: #334155; font-weight: 500; }
        .input-field:focus { border-color: #0f172a; }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800">

    <header class="bg-white border-b py-4 sticky top-0 z-50 shadow-sm">
        <div class="container mx-auto px-6 flex justify-between items-center">
            <a href="index.html" class="flex items-center gap-1 group">
                <div class="flex flex-col items-center leading-none">
                    <span class="text-orange-500 font-bold text-lg italic tracking-tighter">Food</span>
                    <span class="text-slate-800 font-bold text-lg italic tracking-tighter -mt-1">Rush</span>
                </div>
            </a>
            <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white text-xl">
                <i class="fa-solid fa-user"></i>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-4 py-8 flex-grow">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div class="lg:col-span-7 space-y-6">
                
                <div class="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 class="text-xl font-medium text-slate-700 mb-6 text-center">Detalles de la entrega</h2>
                    
                    <div class="flex justify-center mb-6">
                        <div class="bg-gray-200 p-1 rounded-full flex text-sm font-medium transition-all">
                            <button id="btn-delivery" onclick="setMode('delivery')" class="px-6 py-1.5 rounded-full transition mode-btn-active">Entrega a domicilio</button>
                            <button id="btn-pickup" onclick="setMode('pickup')" class="px-6 py-1.5 rounded-full transition mode-btn-inactive">Recolector</button>
                        </div>
                    </div>

                    <div class="border-2 border-slate-200 rounded-xl p-1 mb-6 relative">
                        <div id="map"></div>
                        <div id="map-loading" class="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-xl">
                            <span class="text-sm text-gray-500 animate-pulse"><i class="fa-solid fa-location-dot animate-bounce"></i> Buscando ubicación...</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex items-start justify-between border-b pb-4">
                            <div class="flex gap-3 items-center">
                                <i class="fa-solid fa-briefcase text-slate-500 text-lg"></i>
                                <div>
                                    <p class="font-bold text-slate-800 text-sm" id="address-title">Detectando ubicación...</p>
                                    <p class="text-xs text-slate-500" id="address-details">Espere un momento</p>
                                </div>
                            </div>
                            <button id="btn-edit-address" onclick="editAddress()" class="bg-gray-200 text-xs px-3 py-1 rounded font-bold hover:bg-gray-300 transition">Editar</button>
                        </div>

                        <div id="instructions-container" class="flex items-start justify-between transition-all duration-300">
                            <div class="flex gap-3 items-center">
                                <i class="fa-solid fa-user text-slate-500 text-lg"></i>
                                <div>
                                    <p class="font-bold text-slate-800 text-sm">Instrucciones</p>
                                    <p class="text-xs text-slate-400" id="instructions-text">Nos vemos en la puerta</p>
                                </div>
                            </div>
                            <button onclick="editInstructions()" class="bg-gray-200 text-xs px-3 py-1 rounded font-bold hover:bg-gray-300 transition">Editar</button>
                        </div>
                    </div>

                    <div id="delivery-options-container" class="mt-8 border-t pt-4 transition-all duration-300">
                        <h3 class="text-center text-slate-600 font-medium mb-4">Opciones de entrega</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <label class="cursor-pointer" onclick="toggleSchedule(false)">
                                <input type="radio" name="delivery_type" class="radio-box hidden" checked>
                                <div class="border border-gray-300 rounded-lg p-3 flex items-center gap-3 transition">
                                    <div class="radio-indicator"></div>
                                    <i class="fa-solid fa-truck text-slate-600"></i>
                                    <span class="text-sm font-bold text-slate-700">Básica</span>
                                </div>
                            </label>
                            <label class="cursor-pointer" onclick="toggleSchedule(true)">
                                <input type="radio" name="delivery_type" class="radio-box hidden">
                                <div class="border border-gray-300 rounded-lg p-3 flex items-center gap-3 transition">
                                    <div class="radio-indicator"></div>
                                    <i class="fa-regular fa-calendar text-slate-600"></i>
                                    <span class="text-sm font-bold text-slate-700">Programar</span>
                                </div>
                            </label>
                        </div>
                        <div id="schedule-selector" class="hidden mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                            <label class="block text-xs font-bold text-slate-600 mb-1">Fecha y Hora de Entrega:</label>
                            <input type="datetime-local" class="w-full border border-gray-300 rounded p-2 text-sm">
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800 mb-1">Pago</h2>
                        <div class="flex items-center gap-2 mt-2" id="payment-method-display">
                            <i class="fa-solid fa-money-bill text-green-600 text-xl"></i>
                            <span class="font-medium text-sm">Efectivo</span>
                        </div>
                    </div>
                    <button onclick="openPaymentModal()" class="bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition">Editar</button>
                </div>
            </div>

            <div class="lg:col-span-5 space-y-6">
                <div class="bg-white rounded-2xl p-6 shadow-sm">
                    <a href="cart.html" class="flex justify-between items-center mb-4 border-b pb-2 cursor-pointer hover:opacity-70 transition group">
                        <h2 class="text-lg text-slate-600 group-hover:text-slate-900 group-hover:underline">Resumen de carrito</h2>
                        <div class="relative">
                            <i class="fa-solid fa-cart-shopping text-slate-400 group-hover:text-slate-600 text-xl"></i>
                            <span id="checkout-cart-count" class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
                        </div>
                    </a>
                    
                    <div id="cart-summary-list" class="space-y-4 max-h-[250px] overflow-y-auto pr-2"></div>
                    
                    <div class="border-t mt-4 pt-4 space-y-2 text-sm text-slate-500">
                        <div class="flex justify-between"><span>Subtotal</span><span id="summary-subtotal">$0.00</span></div>
                        <div class="flex justify-between" id="delivery-fee-line"><span>Delivery Fee</span><span>$5.00</span></div>
                        <div class="flex justify-between text-lg font-bold text-slate-800 mt-2"><span>Total</span><span id="summary-total">$0.00</span></div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl p-6 shadow-sm">
                    <div id="right-cash-view" class="text-center">
                        <h3 class="font-bold text-lg mb-2">Cash Payment</h3>
                        <p class="text-xs text-gray-400 mb-6 px-4">Pago en efectivo al recibir.</p>
                        <div class="bg-gray-50 rounded-xl p-6">
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total a Pagar</p>
                            <p class="text-4xl font-extrabold text-slate-800 my-2" id="cash-total-display">$0.00</p>
                        </div>
                    </div>

                    <div id="right-card-view" class="hidden">
                        <h3 class="font-bold text-lg mb-4 text-center">Tarjeta Seleccionada</h3>
                        <div class="credit-card-visual mb-4 shadow-lg">
                            <div class="flex justify-between items-center mb-8">
                                <i class="fa-solid fa-wifi text-2xl opacity-50"></i>
                                <span class="font-mono text-xl font-bold italic">VISA</span>
                            </div>
                            <div class="mb-4">
                                <p class="text-[10px] opacity-70 uppercase tracking-wider">Card Number</p>
                                <p class="font-mono text-lg tracking-widest" id="card-display-number">**** **** **** 1234</p>
                            </div>
                            <div class="flex justify-between">
                                <div><p class="text-[10px] opacity-70 uppercase">Holder</p><p class="font-medium text-sm" id="card-display-name">JUAN PEREZ</p></div>
                                <div><p class="text-[10px] opacity-70 uppercase">Expires</p><p class="font-medium text-sm" id="card-display-expiry">12/25</p></div>
                            </div>
                        </div>
                        <div class="flex justify-between items-center px-2">
                            <span class="font-bold text-slate-800">Total a cobrar</span>
                            <span class="font-bold text-xl" id="card-total-display">$0.00</span>
                        </div>
                        <button onclick="openChangeCardModal()" class="block w-full text-center text-xs text-red-600 font-bold mt-4 hover:underline border border-red-100 py-2 rounded">Cambiar Tarjeta</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="fixed bottom-0 left-0 w-full bg-white border-t p-4 z-40 flex justify-center lg:static lg:bg-transparent lg:border-none lg:p-0 lg:mt-8">
            <button onclick="processOrder()" class="w-full max-w-4xl bg-slate-900 text-white font-bold text-xl py-4 rounded-xl shadow-lg hover:bg-slate-800 transition">
                Pagar
            </button>
        </div>
    </main>

     <footer class="bg-white border-t border-gray-200 mt-auto py-8">
        <div class="container mx-auto px-6 text-center text-sm text-gray-400">
            <p>&copy; 2025 FoodRush. Pagos seguros y encriptados.</p>
        </div>
    </footer>

    <div id="paymentModal" class="fixed inset-0 bg-black/60 z-[60] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onclick="closeModal('paymentModal')" class="absolute top-4 right-4 text-gray-400 hover:text-black"><i class="fa-solid fa-xmark text-xl"></i></button>
            <div class="flex items-center gap-2 mb-6">
                <i class="fa-solid fa-chevron-left text-sm cursor-pointer" onclick="closeModal('paymentModal')"></i>
                <h3 class="text-xl font-bold">Agrega un método de pago</h3>
            </div>
            <div class="space-y-2">
                <div onclick="selectCash()" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-green-100 rounded flex items-center justify-center text-green-700"><i class="fa-solid fa-money-bill"></i></div><span class="font-bold text-slate-700">Efectivo</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
                <div onclick="openCardForm(false)" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-700"><i class="fa-regular fa-credit-card"></i></div><span class="font-bold text-slate-700">Tarjeta de crédito</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
                <div onclick="selectPayPal()" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600"><i class="fa-brands fa-paypal"></i></div><span class="font-bold text-slate-700">PayPal</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
            </div>
        </div>
    </div>

    <div id="changeCardModal" class="fixed inset-0 bg-black/60 z-[60] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onclick="closeModal('changeCardModal')" class="absolute top-4 right-4 text-gray-400 hover:text-black"><i class="fa-solid fa-xmark text-xl"></i></button>
            <div class="mb-6"><h3 class="text-xl font-bold">Cambiar método de pago</h3></div>
            <div class="space-y-2">
                <div onclick="selectCash()" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-green-100 rounded flex items-center justify-center text-green-700"><i class="fa-solid fa-money-bill"></i></div><span class="font-bold text-slate-700">Efectivo</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
                <div onclick="openCardForm(true)" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-700"><i class="fa-regular fa-credit-card"></i></div><span class="font-bold text-slate-700">Nueva Tarjeta</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
                <div onclick="selectPayPal()" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition">
                    <div class="flex items-center gap-4"><div class="w-10 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600"><i class="fa-brands fa-paypal"></i></div><span class="font-bold text-slate-700">PayPal</span></div><i class="fa-solid fa-chevron-right text-gray-300"></i>
                </div>
            </div>
        </div>
    </div>

    <div id="cardFormModal" class="fixed inset-0 bg-black/60 z-[70] hidden flex items-center justify-center p-4 fade-in">
        <div class="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
            <div class="flex items-center gap-2 mb-6">
                <i id="cardFormBackBtn" class="fa-solid fa-chevron-left text-lg cursor-pointer hover:text-slate-600"></i>
                <h3 class="text-xl font-bold text-slate-900" id="cardFormTitle">Add Credit or Debit Card</h3>
            </div>
            <form onsubmit="saveCardInfo(event)" class="space-y-5">
                <div><label class="block text-sm font-bold text-slate-700 mb-2">Card Number</label><div class="relative"><input type="text" id="inputCardNum" placeholder="**** **** **** 1234" maxlength="19" class="input-field pl-4" oninput="formatCardNumber(this)" required><i class="fa-regular fa-credit-card absolute right-4 top-4 text-gray-400 text-lg"></i></div></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label><input type="text" id="inputCardExpiry" placeholder="MM/YY" maxlength="5" class="input-field" oninput="formatExpiry(this)" required></div>
                    <div><label class="block text-sm font-bold text-slate-700 mb-2">CVV</label><input type="text" id="inputCardCVV" placeholder="123" maxlength="3" class="input-field" oninput="formatCVV(this)" required></div>
                </div>
                <div><label class="block text-sm font-bold text-slate-700 mb-2">Cardholder Name</label><input type="text" id="inputCardName" placeholder="John Doe" class="input-field" required></div>
                <div class="flex items-center gap-2 pt-1"><input type="checkbox" id="saveCardCheck" class="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900" checked><label for="saveCardCheck" class="text-sm text-slate-600">Save this card for future purchases</label></div>
                <button type="submit" class="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition mt-4 text-lg">Agregar</button>
            </form>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        let mapInstance, userMarker, storeMarker, cachedPos = null;
        let currentMode = 'delivery', subtotalAmt = 0;

        window.onload = function() {
            initMapDefault();
            loadCart();
        };

        // --- CARGAR CARRITO + BADGE ---
        function loadCart() {
            const cart = JSON.parse(localStorage.getItem('foodrush_cart')) || [];
            const container = document.getElementById('cart-summary-list');
            const badge = document.getElementById('checkout-cart-count');
            
            // Actualizar Badge
            const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            badge.innerText = totalItems;
            
            if(cart.length === 0) {
                container.innerHTML = "<div class='text-center py-8 text-gray-400 text-sm'>Tu carrito está vacío.<br><a href='index.html' class='text-slate-800 font-bold hover:underline'>Ir a comprar</a></div>";
                subtotalAmt = 0;
            } else {
                container.innerHTML = cart.map(item => `
                    <div class="flex gap-4 items-center border border-gray-100 p-2 rounded-lg mb-2">
                        <div class="w-12 h-12 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img src="${item.img}" class="h-full object-contain">
                        </div>
                        <div class="flex-grow">
                            <p class="text-xs font-bold text-slate-700">${item.name}</p>
                            <p class="text-xs text-gray-400">Cant: ${item.qty}</p>
                        </div>
                        <span class="font-bold text-sm text-slate-800">$${item.price * item.qty}</span>
                    </div>
                `).join('');
                subtotalAmt = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
            }
            updateTotals();
        }

        function updateTotals() {
            const deliveryFee = currentMode === 'delivery' ? 5 : 0;
            const total = subtotalAmt + deliveryFee;
            document.getElementById('summary-subtotal').innerText = `$${subtotalAmt.toFixed(2)}`;
            document.getElementById('summary-total').innerText = `$${total.toFixed(2)}`;
            document.getElementById('cash-total-display').innerText = `$${total.toFixed(2)}`;
            document.getElementById('card-total-display').innerText = `$${total.toFixed(2)}`;
        }

        // --- MAPA Y MODOS ---
        function initMapDefault() {
            mapInstance = L.map('map').setView([19.4517, -70.6970], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
            locateUser();
        }
        function locateUser() {
            if(cachedPos) { updateMap(cachedPos.lat, cachedPos.lng, "Tu Ubicación", true); return; }
            document.getElementById('map-loading').style.display = 'flex';
            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const lat = pos.coords.latitude, lng = pos.coords.longitude;
                    cachedPos = { lat, lng };
                    updateMap(lat, lng, "Tu Ubicación", true);
                    document.getElementById('address-title').innerText = "Ubicación Actual";
                    document.getElementById('address-details').innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                }, () => { updateMap(19.4517, -70.6970, "Default", true); });
            } else { updateMap(19.4517, -70.6970, "Default", true); }
        }
        function showStoreLocation() { updateMap(19.4590, -70.6900, "Tienda", false); }
        function updateMap(lat, lng, txt, isUser) {
            document.getElementById('map-loading').style.display = 'none';
            mapInstance.setView([lat, lng], 15);
            if(userMarker) mapInstance.removeLayer(userMarker);
            if(storeMarker) mapInstance.removeLayer(storeMarker);
            if(isUser) userMarker = L.marker([lat, lng]).addTo(mapInstance).bindPopup(txt).openPopup();
            else storeMarker = L.marker([lat, lng]).addTo(mapInstance).bindPopup(txt).openPopup();
        }
        function setMode(m) {
            currentMode = m;
            const del = document.getElementById('btn-delivery'), pick = document.getElementById('btn-pickup');
            if(m === 'delivery') {
                del.classList.add('mode-btn-active'); del.classList.remove('mode-btn-inactive');
                pick.classList.add('mode-btn-inactive'); pick.classList.remove('mode-btn-active');
                ['delivery-options-container','instructions-container','btn-edit-address'].forEach(id=>document.getElementById(id).classList.remove('hidden'));
                document.getElementById('delivery-fee-line').classList.remove('opacity-20','line-through');
                locateUser();
            } else {
                pick.classList.add('mode-btn-active'); pick.classList.remove('mode-btn-inactive');
                del.classList.add('mode-btn-inactive'); del.classList.remove('mode-btn-active');
                ['delivery-options-container','instructions-container','btn-edit-address'].forEach(id=>document.getElementById(id).classList.add('hidden'));
                document.getElementById('delivery-fee-line').classList.add('opacity-20','line-through');
                showStoreLocation();
            }
            updateTotals();
        }

        // --- VALIDACIONES ---
        function formatCardNumber(i){ let v=i.value.replace(/\D/g,'').substring(0,16); i.value = v.match(/.{1,4}/g)?.join(' ') || v; }
        function formatExpiry(i){ let v=i.value.replace(/\D/g,''); if(v.length>=2) i.value=v.substring(0,2)+'/'+v.substring(2,4); else i.value=v; }
        function formatCVV(i){ i.value=i.value.replace(/\D/g,'').substring(0,3); }
        function saveCardInfo(e){
            e.preventDefault();
            const num=document.getElementById('inputCardNum').value.replace(/\s/g,'');
            const exp=document.getElementById('inputCardExpiry').value;
            const cvv=document.getElementById('inputCardCVV').value;
            const name=document.getElementById('inputCardName').value.trim();
            if(num.length!==16) return Swal.fire('Error','16 dígitos requeridos','error');
            if(cvv.length!==3) return Swal.fire('Error','CVV inválido','error');
            if(!name.includes(' ') || name.length<5) return Swal.fire('Error','Nombre y apellido requeridos','error');
            if(exp.length!==5) return Swal.fire('Error','Fecha inválida','error');
            const [m,y] = exp.split('/').map(Number);
            const now=new Date(), cy=parseInt(now.getFullYear().toString().substr(-2)), cm=now.getMonth()+1;
            if(m<1||m>12) return Swal.fire('Error','Mes inválido','error');
            if(y<cy || (y===cy && m<cm)) return Swal.fire('Error','Tarjeta vencida','error');
            
            closeModal('cardFormModal'); closeModal('paymentModal'); closeModal('changeCardModal');
            document.getElementById('payment-method-display').innerHTML=`<i class="fa-regular fa-credit-card text-blue-600 text-xl"></i><span class="font-medium text-sm">Tarjeta</span>`;
            document.getElementById('card-display-number').innerText=`**** **** **** ${num.slice(-4)}`;
            document.getElementById('card-display-name').innerText=name.toUpperCase();
            document.getElementById('card-display-expiry').innerText=exp;
            document.getElementById('right-cash-view').classList.add('hidden');
            document.getElementById('right-card-view').classList.remove('hidden');
            Swal.fire({icon:'success', title:'Tarjeta Guardada', showConfirmButton:false, timer:1000});
        }

        // --- UTILS ---
        function openPaymentModal() { document.getElementById('paymentModal').classList.remove('hidden'); }
        function openChangeCardModal() { document.getElementById('changeCardModal').classList.remove('hidden'); }
        function openCardForm(isChanging) {
            closeModal('paymentModal'); closeModal('changeCardModal');
            const t = document.getElementById('cardFormTitle'), b = document.getElementById('cardFormBackBtn');
            if(isChanging) { t.innerText="Cambiar Tarjeta"; b.onclick=()=>{closeModal('cardFormModal');openChangeCardModal()}; }
            else { t.innerText="Add Credit or Debit Card"; b.onclick=()=>{closeModal('cardFormModal');openPaymentModal()}; }
            document.getElementById('cardFormModal').classList.remove('hidden');
            document.getElementById('inputCardNum').value=''; document.getElementById('inputCardExpiry').value=''; 
            document.getElementById('inputCardCVV').value=''; document.getElementById('inputCardName').value='';
        }
        function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
        function selectCash() { closeModal('paymentModal'); closeModal('changeCardModal'); document.getElementById('payment-method-display').innerHTML=`<i class="fa-solid fa-money-bill text-green-600 text-xl"></i><span class="font-medium text-sm">Efectivo</span>`; document.getElementById('right-cash-view').classList.remove('hidden'); document.getElementById('right-card-view').classList.add('hidden'); }
        function selectPayPal() { Swal.fire('Info','Redirigiendo a PayPal...','info'); closeModal('paymentModal'); closeModal('changeCardModal'); }
        async function editAddress() { const {value:a} = await Swal.fire({title:'Editar Dirección', input:'text', inputValue:document.getElementById('address-details').innerText, showCancelButton:true}); if(a) document.getElementById('address-details').innerText=a; }
        async function editInstructions() { const {value:t} = await Swal.fire({title:'Instrucciones', input:'textarea', inputValue:document.getElementById('instructions-text').innerText, showCancelButton:true}); if(t) document.getElementById('instructions-text').innerText=t; }
        function toggleSchedule(s) { const el=document.getElementById('schedule-selector'); if(s) el.classList.remove('hidden'); else el.classList.add('hidden'); }
        function processOrder() { Swal.fire({title:'Procesando...', timer:2000, didOpen:()=>{Swal.showLoading()}}).then(()=>{ Swal.fire('¡Pedido Exitoso!','Tu comida viene en camino.','success') }); }
    </script>
</body>
</html>