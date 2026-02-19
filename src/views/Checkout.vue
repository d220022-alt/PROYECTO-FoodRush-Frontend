<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';

const router = useRouter();
const goBack = () => router.go(-1);

// State
const step = ref('summary'); // 'summary', 'payment_method_modal', 'card_form'
const paymentMethod = ref(null); // 'cash', 'card', 'paypal'
const billingAddress = ref({ street: '', city: '', zip: '' });
const cardDetails = ref({ number: '', expiry: '', cvv: '', name: '' });
const isProcessing = ref(false);
const formErrors = ref({});

const validateCard = () => {
    const errors = {};
    if (!/^\d{16}$/.test(cardDetails.value.number.replace(/\s/g, ''))) errors.number = 'Número inválido (16 dígitos)';
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.value.expiry)) errors.expiry = 'Formato MM/YY';
    if (!/^\d{3,4}$/.test(cardDetails.value.cvv)) errors.cvv = 'CVV inválido';
    if (cardDetails.value.name.length < 3) errors.name = 'Nombre muy corto';
    
    formErrors.value = errors;
    return Object.keys(errors).length === 0;
};

// Address
const address = ref(localStorage.getItem('user_address') || "Sin dirección registrada");
const zoneLabel = computed(() => {
    const z = localStorage.getItem('user_zone');
    const labels = { 'pekin': 'Pekín', 'gurabo': 'Gurabo', 'villa_olga': 'Villa Olga' };
    return labels[z] || 'Zona por defecto';
});

// Order Data
const order = ref({
    items: [],
    subtotal: 0,
    deliveryFee: 0 // Will be calculated
});

const zone = ref(localStorage.getItem('user_zone') || '');
const zonePrices = {
    'pekin': 25.00,
    'gurabo': 50.00,
    'villa_olga': 75.00
};

const total = computed(() => order.value.subtotal + order.value.deliveryFee);

onMounted(() => {
    loadCart();
    // Calculate initial fee
    if (zone.value && zonePrices[zone.value]) {
        order.value.deliveryFee = zonePrices[zone.value];
    } else {
        // Default or unconfigured
        order.value.deliveryFee = 50.00; // Default to Gurabo price
    }
});

const loadCart = () => {
    const storedCart = localStorage.getItem('foodrush_cart');
    if (storedCart) {
        order.value.items = JSON.parse(storedCart);
    }
    calculateTotals();
};

const calculateTotals = () => {
    let sub = 0;
    order.value.items.forEach(item => {
        sub += item.price * item.qty;
    });
    order.value.subtotal = sub;
};

const deleteItem = (index) => {
    order.value.items.splice(index, 1);
    localStorage.setItem('foodrush_cart', JSON.stringify(order.value.items));
    calculateTotals();
    if (order.value.items.length === 0) {
        Swal.fire('Carrito vacío', 'Has vaciado tu carrito.', 'info').then(() => router.push('/'));
    }
};

// Actions
const openPaymentModal = () => {
    step.value = 'payment_method_modal';
};

const selectPaymentMethod = (method) => {
    paymentMethod.value = method;
    if (method === 'card') {
        step.value = 'card_form';
    } else {
        step.value = 'summary'; 
    }
};

const saveCard = () => {
    if (validateCard()) {
        step.value = 'summary';
    } else {
        Swal.fire('Error en la tarjeta', 'Por favor revisa los datos de tu tarjeta.', 'warning');
    }
};

const finishPurchase = async () => {
    // Validation
    if (order.value.items.length === 0) {
        return Swal.fire('Error', 'El carrito está vacío.', 'error');
    }

    isProcessing.value = true;
    
    // Unify flow: All payments go to DB
    try {
        // 1. Simulate Processing for Card/PayPal (UX only)
        if (paymentMethod.value !== 'cash') {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 2. Get User Info
        let userEmail = localStorage.getItem('user_email');
        const userName = localStorage.getItem('user_name') || 'Invitado';
        const userPhone = localStorage.getItem('user_phone') || '000-000-0000';
        const tenantId = 1; 

        // Session Fallback
        if (!userEmail) {
             console.warn("User email missing. Using fallback for record keeping.");
             userEmail = "usuario_test@foodrush.com"; 
        }

        // 3. Resolve Client ID (Find or Create)
        let clientId = null;
        try {
            const clientsResponse = await api.getClients({ correo: userEmail });
            if (clientsResponse.success && clientsResponse.data.length > 0) {
                clientId = clientsResponse.data[0].id; 
            } else {
                // Create Client
                const newClientFn = await api.createClient({
                    nombre: userName,
                    correo: userEmail,
                    telefono: userPhone,
                    tenant_id: tenantId
                });
                if (newClientFn && newClientFn.id) clientId = newClientFn.id;
                else if (newClientFn.success && newClientFn.data) clientId = newClientFn.data.id;
            }
        } catch (clientErr) {
            console.warn("Client resolve error", clientErr);
        }

        if (!clientId) clientId = 1; // Fallback ID

        // 4. Create Order (REAL DB SAVE)
        // We add the mock payment method to notes so it's recorded
        const methodMap = {
            'cash': 'Efectivo',
            'card': 'Tarjeta (Simulado)',
            'paypal': 'PayPal (Simulado)'
        };

        const orderPayload = {
            cliente_id: clientId,
            total: total.value,
            direccion_entrega: address.value,
            notas: `Pago vía: ${methodMap[paymentMethod.value] || paymentMethod.value}`,
            estado_id: 1, // Pendiente
            items: order.value.items,
            metodo_pago: paymentMethod.value
        };

        const orderParams = await api.createOrder(orderPayload);
        
        if (orderParams.success) {
            Swal.fire({
                icon: 'success',
                title: paymentMethod.value === 'cash' ? '¡Pedido Realizado!' : '¡Pago Aprobado!',
                text: `Tu pedido #${orderParams.data.id} ha sido registrado exitosamente en la base de datos.`,
                confirmButtonColor: '#00704A'
            }).then(() => {
                localStorage.removeItem('foodrush_cart');
                router.push(`/tracking/${orderParams.data.id}`);
            });
        } else {
            throw new Error(orderParams.message || 'Error al crear la orden');
        }

    } catch (e) {
        console.error(e);
        Swal.fire('Error', e.message || 'Hubo un problema procesando tu orden.', 'error');
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
<div class="min-h-screen bg-white font-sans pb-10">
    <!-- Header -->
    <header class="p-6 border-b flex items-center gap-4 bg-white sticky top-0 z-10" role="banner">
        <button @click="goBack" class="text-xl text-slate-800 hover:text-orange-500 transition" aria-label="Volver">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
        <h1 class="text-2xl font-bold text-slate-800">Checkout</h1>
    </header>

    <div class="max-w-xl mx-auto p-6" role="main">
        
        <!-- SUMMARY VIEW -->
        <div v-if="step === 'summary' || step === 'payment_method_modal'">
             <p class="text-xs text-gray-400 mb-6">Revisa tu orden, ajusta los detalles y selecciona tu método de pago.</p>

             <!-- Order Items List -->
             <div v-if="order.items.length > 0">
                 <div v-for="(item, index) in order.items" :key="index" class="border rounded-xl p-4 flex gap-4 items-center relative mb-6">
                     <button @click="deleteItem(index)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500" :aria-label="'Eliminar ' + item.name">
                        <i class="fa-solid fa-trash-can"></i>
                     </button>
                     <div class="w-20 h-20 bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                         <img :src="item.img" :alt="item.name" class="w-full h-full object-contain">
                     </div>
                     <div>
                         <h3 class="font-bold text-slate-800">{{ item.name }} <span class="ml-2 bg-gray-100 px-2 py-0.5 rounded text-xs">${{ item.price }}</span></h3>
                         <p class="text-xs text-gray-500">{{ item.detail || item.category }}</p>
                         <p class="text-xs text-gray-500">Cantidad: {{ item.qty }}</p>
                     </div>
                     <div class="ml-auto mt-auto">
                         <span class="font-bold text-slate-800 text-lg">${{ (item.price * item.qty).toFixed(2) }}</span>
                     </div>
                 </div>
             </div>
             <div v-else class="text-center py-10 text-gray-500">
                 Tu carrito está vacío.
             </div>

             <!-- Totals -->
             <div class="space-y-2 mb-8 text-sm" role="region" aria-label="Resumen de costos">
                 <div class="flex justify-between text-gray-500">
                     <span>Subtotal</span>
                     <span>${{ order.subtotal.toFixed(2) }}</span>
                 </div>
                 <div class="flex justify-between text-gray-500">
                     <span>Costo de Envío</span>
                     <span>${{ order.deliveryFee.toFixed(2) }}</span>
                 </div>
                 <div class="flex justify-between font-bold text-slate-800 text-lg border-t pt-2 mt-2">
                     <span>Total</span>
                     <span aria-live="polite" aria-atomic="true">${{ total.toFixed(2) }}</span>
                 </div>
             </div>

             <!-- Location -->
             <div class="mb-6">
                  <h3 class="font-bold text-slate-800 mb-2">Ubicación</h3>
                  <div class="border rounded-lg p-4 flex items-center justify-between bg-white text-gray-500 cursor-not-allowed">
                      <div class="flex items-center gap-3">
                          <span class="w-3 h-3 bg-slate-800 rounded-full"></span>
                          <div class="flex flex-col">
                              <span class="text-gray-800 font-bold text-sm">{{ address }}</span>
                              <span class="text-xs text-gray-400">{{ zoneLabel }} - Costo: ${{ order.deliveryFee }}</span>
                          </div>
                      </div>
                      <i class="fa-solid fa-chevron-down text-gray-400"></i>
                  </div>
             </div>

             <!-- Payment Method Trigger -->
             <div class="mb-8">
                 <h3 class="font-bold text-slate-800 mb-2">Método de pago</h3>
                 <button @click="openPaymentModal" class="w-full border rounded-lg p-4 flex items-center justify-between bg-white hover:border-gray-400 transition" aria-haspopup="dialog" :aria-expanded="step === 'payment_method_modal'">
                     <div class="flex items-center gap-3">
                         <span class="w-3 h-3 bg-slate-800 rounded-full" v-if="!paymentMethod"></span>
                         <span class="text-gray-600" v-if="!paymentMethod">Agregar método de pago</span>
                         
                         <div v-else class="flex items-center gap-2">
                            <i v-if="paymentMethod === 'cash'" class="fa-solid fa-money-bill text-green-600"></i>
                            <i v-if="paymentMethod === 'card'" class="fa-regular fa-credit-card text-slate-600"></i>
                            <i v-if="paymentMethod === 'paypal'" class="fa-brands fa-paypal text-blue-600"></i>
                            <span class="font-semibold capitalize">{{ paymentMethod === 'card' ? 'Tarjeta terminada en 1234' : paymentMethod }}</span>
                         </div>
                     </div>
                     <i class="fa-solid fa-chevron-down text-gray-400"></i>
                 </button>
             </div>
             
             <button v-if="paymentMethod" @click="finishPurchase" :disabled="isProcessing" class="w-full bg-[#333] hover:bg-black disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition shadow-lg flex justify-center items-center gap-2">
                 <span v-if="isProcessing"><i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...</span>
                 <span v-else>Realizar Pedido</span>
             </button>
        </div>

        <!-- CARD FORM -->
        <div v-if="step === 'card_form'" class="animate-fade-in" role="form" aria-labelledby="card-heading">
            <h2 id="card-heading" class="text-xl font-bold text-slate-800 mb-6 font-bold">Agregar Tarjeta</h2>
            
            <div class="space-y-4 mb-8">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1" for="card_number">Número de Tarjeta</label>
                    <div class="relative">
                        <input id="card_number" v-model="cardDetails.number" type="text" placeholder="1234 5678 1234 5678" :class="['w-full border rounded-lg p-3 pl-4 pr-10 outline-none focus:border-blue-500', formErrors.number ? 'border-red-500' : 'border-gray-300']">
                        <i class="fa-regular fa-credit-card absolute right-3 top-3.5 text-gray-400"></i>
                    </div>
                    <p v-if="formErrors.number" class="text-red-500 text-xs mt-1 font-bold">{{ formErrors.number }}</p>
                </div>

                <div class="flex gap-4">
                    <div class="flex-1">
                        <label class="block text-sm font-bold text-gray-700 mb-1" for="expiry">Expiración</label>
                        <input id="expiry" v-model="cardDetails.expiry" type="text" placeholder="MM/YY" :class="['w-full border rounded-lg p-3 outline-none focus:border-blue-500', formErrors.expiry ? 'border-red-500' : 'border-gray-300']">
                        <p v-if="formErrors.expiry" class="text-red-500 text-xs mt-1 font-bold">{{ formErrors.expiry }}</p>
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-bold text-gray-700 mb-1" for="cvv">CVV</label>
                        <input id="cvv" v-model="cardDetails.cvv" type="text" placeholder="123" :class="['w-full border rounded-lg p-3 outline-none focus:border-blue-500', formErrors.cvv ? 'border-red-500' : 'border-gray-300']">
                        <p v-if="formErrors.cvv" class="text-red-500 text-xs mt-1 font-bold">{{ formErrors.cvv }}</p>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1" for="card_name">Nombre en Tarjeta</label>
                    <input id="card_name" v-model="cardDetails.name" type="text" placeholder="Como aparece en la tarjeta" :class="['w-full border rounded-lg p-3 outline-none focus:border-blue-500', formErrors.name ? 'border-red-500' : 'border-gray-300']">
                    <p v-if="formErrors.name" class="text-red-500 text-xs mt-1 font-bold">{{ formErrors.name }}</p>
                </div>
            </div>

            <div class="flex gap-3">
                <button @click="step = 'summary'" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition">Cancelar</button>
                <button @click="saveCard" class="flex-2 bg-[#333] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-lg px-8">Guardar Tarjeta</button>
            </div>
        </div>

    </div>

    <!-- MODAL: Payment Method Selection -->
    <div v-if="step === 'payment_method_modal'" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
            <!-- Modal Header -->
            <div class="p-6 pb-2">
                <button @click="step = 'summary'" class="text-gray-500 hover:text-black flex items-center gap-2 text-sm font-semibold mb-4" aria-label="Cerrar modal">
                    <i class="fa-solid fa-chevron-left"></i> Volver
                </button>
                <h2 id="modal-title" class="text-3xl font-extrabold text-slate-900 leading-tight">Agrega un método<br>de pago</h2>
            </div>
            
            <!-- Options -->
            <div class="p-6 space-y-4">
                <button @click="selectPaymentMethod('cash')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group border border-transparent hover:border-gray-100" aria-label="Pago en efectivo">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded bg-[#4CAF50] bg-opacity-20 flex items-center justify-center text-[#2E7D32]">
                            <i class="fa-solid fa-money-bill-1 text-xl"></i>
                        </div>
                        <span class="font-bold text-lg text-slate-800">Efectivo</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-gray-500"></i>
                </button>

                <div class="border-t border-gray-100"></div>

                <button @click="selectPaymentMethod('card')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group border border-transparent hover:border-gray-100" aria-label="Pago con tarjeta de crédito o débito">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded bg-[#424242] bg-opacity-20 flex items-center justify-center text-[#212121]">
                            <i class="fa-solid fa-credit-card text-xl"></i>
                        </div>
                        <span class="font-bold text-lg text-slate-800">Tarjeta de crédito o de débito</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-gray-500"></i>
                </button>

                 <div class="border-t border-gray-100"></div>

                <button @click="selectPaymentMethod('paypal')" class="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition group border border-transparent hover:border-gray-100" aria-label="Pago con PayPal">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded bg-[#E3F2FD] flex items-center justify-center text-[#1565C0]">
                            <i class="fa-brands fa-paypal text-xl"></i>
                        </div>
                        <span class="font-bold text-lg text-slate-800">PayPal</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300 group-hover:text-gray-500"></i>
                </button>
            </div>
            
        </div>
    </div>
</div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
</style>
