<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import {
  APP_EVENTS,
  addNotification,
  buildLocalOrder,
  clearCart,
  clearSession,
  getCart,
  getLastClientId,
  getPreferredPaymentMethod,
  getSavedCard,
  getSavedPayPal,
  getSession,
  saveCachedOrder,
  setPreferredPaymentMethod,
  saveSavedCard,
  saveSavedPayPal,
  setLastClientId,
} from '../services/storage';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';

const router = useRouter();
const userName = ref('');
const currentUserEmail = ref(getSession().userEmail || 'usuario_invitado');

const goBack = () => {
    router.go(-1);
};

const mapEl = ref(null);
const mapLoading = ref(true);

const currentMode = ref('delivery'); // 'delivery' | 'pickup'
const deliveryType = ref('basic'); // 'basic' | 'scheduled'
const scheduleDate = ref('');

const addressTitle = ref('Detectando ubicación...');
const addressDetails = ref('Espere un momento');
const instructionsText = ref('Nos vemos en la puerta');

const paymentMethod = ref('cash'); // 'cash' | 'card' | 'paypal'
const paypalEmail = ref('');
const showPaymentModal = ref(false);
const showChangeCardModal = ref(false);
const showCardFormModal = ref(false);
const cardFormTitle = ref('Add Credit or Debit Card');
const cardFormReturnTo = ref('payment'); // 'payment' | 'change'

const isProcessing = ref(false);

const cardForm = ref({
  number: '',
  expiry: '',
  cvv: '',
  name: '',
  save: true,
});

const cardDisplay = ref({
  number: '**** **** **** 1234',
  name: 'JUAN PEREZ',
  expiry: '12/26',
  brand: 'Tarjeta',
});
const savedCard = ref(null);
const savedPayPalAccount = ref(null);

// Load saved methods for user
const loadUserPaymentMethods = () => {
    const email = currentUserEmail.value;
    const storedCard = getSavedCard(email);
    const storedPayPal = getSavedPayPal(email);
    const preferredMethod = getPreferredPaymentMethod(email);
    savedCard.value = storedCard ? { ...storedCard } : null;
    savedPayPalAccount.value = storedPayPal ? { ...storedPayPal } : null;

    if (preferredMethod === 'card' && storedCard) {
        cardDisplay.value = { ...storedCard };
        paymentMethod.value = 'card';
    } else if (preferredMethod === 'paypal' && storedPayPal) {
        paypalEmail.value = storedPayPal.email;
        paymentMethod.value = 'paypal';
    } else if (preferredMethod === 'cash') {
        paymentMethod.value = 'cash';
    } else if (storedCard) {
        cardDisplay.value = { ...storedCard };
        paymentMethod.value = 'card';
        setPreferredPaymentMethod(email, 'card');
    } else if (storedPayPal) {
        paypalEmail.value = storedPayPal.email;
        paymentMethod.value = 'paypal';
        setPreferredPaymentMethod(email, 'paypal');
    } else {
        paymentMethod.value = 'cash';
    }
};

const cartItems = ref([]);
const hasSavedCard = computed(() => Boolean(savedCard.value));
const hasSavedPayPal = computed(() => Boolean(savedPayPalAccount.value?.email));

const cartCount = computed(() =>
  cartItems.value.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
);

const subtotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
);

const deliveryFee = computed(() => (currentMode.value === 'delivery' ? 5 : 0));
const total = computed(() => subtotal.value + deliveryFee.value);

const loadCart = () => {
  cartItems.value = getCart();
};

const setMode = (mode) => {
  currentMode.value = mode;
};

const formatCardNumber = () => {
  const digits = cardForm.value.number.replace(/\D/g, '').slice(0, 16);
  cardForm.value.number = digits.match(/.{1,4}/g)?.join(' ') || digits;
};

const formatExpiry = () => {
  const digits = cardForm.value.expiry.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    cardForm.value.expiry = `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  } else {
    cardForm.value.expiry = digits;
  }
};

const formatCVV = () => {
  cardForm.value.cvv = cardForm.value.cvv.replace(/\D/g, '').slice(0, 3);
};

const resetCardForm = () => {
  cardForm.value = { number: '', expiry: '', cvv: '', name: '', save: true };
};

const saveCardInfo = (event) => {
  event.preventDefault();
  const num = cardForm.value.number.replace(/\s/g, '');
  const exp = cardForm.value.expiry;
  const cvv = cardForm.value.cvv;
  const name = cardForm.value.name.trim();

  if (num.length !== 16) return Swal.fire('Error', '16 dígitos requeridos', 'error');
  if (cvv.length !== 3) return Swal.fire('Error', 'CVV inválido', 'error');
  if (!name.includes(' ') || name.length < 5) return Swal.fire('Error', 'Nombre y apellido requeridos', 'error');
  if (exp.length !== 5) return Swal.fire('Error', 'Fecha inválida', 'error');

  const [m, y] = exp.split('/').map(Number);
  const now = new Date();
  const cy = parseInt(now.getFullYear().toString().slice(-2), 10);
  const cm = now.getMonth() + 1;

  if (m < 1 || m > 12) return Swal.fire('Error', 'Mes inválido', 'error');
  if (y < cy || (y === cy && m < cm)) return Swal.fire('Error', 'Tarjeta vencida', 'error');

  showCardFormModal.value = false;
  showPaymentModal.value = false;
  showChangeCardModal.value = false;

  paymentMethod.value = 'card';
  setPreferredPaymentMethod(currentUserEmail.value, 'card');
  cardDisplay.value.number = `**** **** **** ${num.slice(-4)}`;
  cardDisplay.value.name = name.toUpperCase();
  cardDisplay.value.expiry = exp;
  cardDisplay.value.brand = cardDisplay.value.brand || 'Tarjeta';

  if (cardForm.value.save) {
      const persistedCard = saveSavedCard(currentUserEmail.value, {
        number: num,
        expiry: exp,
        name: name.toUpperCase(),
      });
      savedCard.value = persistedCard ? { ...persistedCard } : savedCard.value;
  }

  Swal.fire({ icon: 'success', title: 'Tarjeta Guardada', showConfirmButton: false, timer: 1000 });
};

const openPaymentModal = () => {
  showPaymentModal.value = true;
};

const openCardForm = (isChanging) => {
  showPaymentModal.value = false;
  showChangeCardModal.value = false;
  cardFormTitle.value = isChanging ? 'Cambiar Tarjeta' : 'Add Credit or Debit Card';
  cardFormReturnTo.value = isChanging ? 'change' : 'payment';
  resetCardForm();
  showCardFormModal.value = true;
};

const closeCardForm = () => {
  showCardFormModal.value = false;
  if (cardFormReturnTo.value === 'change') {
    showChangeCardModal.value = true;
  } else {
    showPaymentModal.value = true;
  }
};

const closeModal = (modalName) => {
  if (modalName === 'payment') showPaymentModal.value = false;
  if (modalName === 'change') showChangeCardModal.value = false;
  if (modalName === 'card') showCardFormModal.value = false;
};

const selectCash = () => {
  showPaymentModal.value = false;
  showChangeCardModal.value = false;
  paymentMethod.value = 'cash';
  setPreferredPaymentMethod(currentUserEmail.value, 'cash');
};

const selectStoredCard = () => {
  if (!savedCard.value) {
    openCardForm(false);
    return;
  }

  showChangeCardModal.value = false;
  cardDisplay.value = { ...savedCard.value };
  paymentMethod.value = 'card';
  setPreferredPaymentMethod(currentUserEmail.value, 'card');
};

const selectCard = (forceNew = false) => {
  showPaymentModal.value = false;
  
  if (forceNew) {
    showChangeCardModal.value = false;
    openCardForm(true);
    return;
  }

  if (savedCard.value) {
    showChangeCardModal.value = true;
    return;
  }

  showChangeCardModal.value = false;
  openCardForm(false);
};

const connectPayPal = () => {
  showPaymentModal.value = false;
  showChangeCardModal.value = false;

  const email = currentUserEmail.value;
  const prefilledEmail = savedPayPalAccount.value?.email || 'usuario@ejemplo.com';

  Swal.fire({
    title: '<i class="fa-brands fa-paypal text-blue-600 text-4xl mb-2"></i><br>Iniciar Sesión',
    html: `
      <div class="text-left mt-2">
        <label class="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
        <input id="swal-paypal-email" type="email" class="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none mb-4" placeholder="correo@ejemplo.com" value="${prefilledEmail}">
        
        <label class="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
        <input id="swal-paypal-pass" type="password" class="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="••••••••" value="demo1234">
      </div>
      <div class="flex items-center gap-2 mt-4 text-sm text-gray-600">
        <input type="checkbox" id="swal-paypal-save" checked class="rounded border-gray-300">
        <label for="swal-paypal-save">Guardar PayPal para la próxima vez</label>
      </div>
      <p class="text-xs text-gray-500 mt-4 text-center">Simulación segura. No uses datos reales.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Iniciar Sesión',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0070BA',
    cancelButtonColor: '#64748b',
    focusConfirm: false,
    preConfirm: () => {
      const emailInput = document.getElementById('swal-paypal-email').value;
      const passInput = document.getElementById('swal-paypal-pass').value;
      const saveInput = document.getElementById('swal-paypal-save').checked;

      if (!emailInput || !passInput) {
        Swal.showValidationMessage('Por favor completa ambos campos');
        return false;
      }
      if (!emailInput.includes('@')) {
        Swal.showValidationMessage('El correo no es válido');
        return false;
      }
      return { email: emailInput, save: saveInput };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      paypalEmail.value = result.value.email;

      if (result.value.save) {
          saveSavedPayPal(currentUserEmail.value, paypalEmail.value);
          savedPayPalAccount.value = { email: paypalEmail.value };
      }

      Swal.fire({
        title: 'Vinculando Cuenta...',
        text: 'Aprobando conexión con FoodRush',
        timer: 1500,
        timerProgressBar: true,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      }).then(() => {
        paymentMethod.value = 'paypal';
        setPreferredPaymentMethod(currentUserEmail.value, 'paypal');
        Swal.fire({
          icon: 'success',
          title: 'Cuenta vinculada',
          text: `PayPal conectado como ${paypalEmail.value}`,
          timer: 1500,
          showConfirmButton: false
        });
      });
    }
  });
};

const selectPayPal = () => {
  showPaymentModal.value = false;
  showChangeCardModal.value = false;

  if (savedPayPalAccount.value?.email) {
    paypalEmail.value = savedPayPalAccount.value.email;
    paymentMethod.value = 'paypal';
    setPreferredPaymentMethod(currentUserEmail.value, 'paypal');
    return;
  }

  connectPayPal();
};

const editAddress = async () => {
  const { value } = await Swal.fire({
    title: 'Editar Dirección',
    input: 'text',
    inputValue: addressDetails.value,
    showCancelButton: true,
  });
  if (value) addressDetails.value = value;
};

const editInstructions = async () => {
  const { value } = await Swal.fire({
    title: 'Instrucciones',
    input: 'textarea',
    inputValue: instructionsText.value,
    showCancelButton: true,
  });
  if (value) instructionsText.value = value;
};

const resolveTenantId = () => {
  const firstTenant = cartItems.value.find((item) => item.tenantId)?.tenantId;
  return Number.parseInt(firstTenant, 10) || 1;
};

const resolveTenantHeaders = () => ({
  'X-Tenant-ID': String(resolveTenantId()),
});

const resolveUserIdentity = () => {
  const session = getSession();

  return {
    email: session.userEmail || currentUserEmail.value || `guest-${Date.now()}@foodrush.local`,
    name: session.userName || userName.value || 'Invitado',
    phone: session.userPhone || localStorage.getItem('user_phone') || '000-000-0000',
  };
};

const resolveClientId = async (identity) => {
  const cachedClientId = getLastClientId(identity.email);
  if (cachedClientId) {
    return cachedClientId;
  }

  try {
    const tenantHeaders = resolveTenantHeaders();
    const clientsResponse = await api.getClients({ correo: identity.email }, tenantHeaders);
    if (clientsResponse.success && clientsResponse.data.length > 0) {
      const foundClientId = clientsResponse.data[0].id;
      setLastClientId(identity.email, foundClientId);
      return foundClientId;
    }

    const newClientResponse = await api.createClient({
      nombre: identity.name,
      correo: identity.email,
      telefono: identity.phone,
      tenant_id: resolveTenantId(),
    }, tenantHeaders);

    const createdClientId = newClientResponse?.data?.id || newClientResponse?.id || null;
    if (createdClientId) {
      setLastClientId(identity.email, createdClientId);
      return createdClientId;
    }
  } catch (error) {
    console.warn('Client resolve error', error);
  }

  return cachedClientId || null;
};

const resolveRemoteOrderItems = async () => {
  const tenantHeaders = resolveTenantHeaders();
  const productsResponse = await api.getProducts({ limit: 300 }, tenantHeaders);

  if (productsResponse?.success === false) {
    throw new Error(productsResponse.message || 'No se pudo validar el catalogo del restaurante.');
  }

  const remoteProducts = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
  const productsById = new Map(remoteProducts.map((product) => [String(product.id), product]));

  const missingItems = cartItems.value.filter((item) => !productsById.has(String(item.id)));
  if (missingItems.length > 0) {
    throw new Error(
      `Hay productos que no existen en el backend: ${missingItems.map((item) => item.name).join(', ')}.`,
    );
  }

  return cartItems.value.map((item) => {
    const remoteProduct = productsById.get(String(item.id));
    const remotePrice = Number.parseFloat(remoteProduct?.precio ?? remoteProduct?.price ?? item.price);

    return {
      ...item,
      id: remoteProduct?.id ?? item.id,
      price: Number.isFinite(remotePrice) ? remotePrice : Number(item.price),
      qty: Number(item.qty),
      nombre: remoteProduct?.nombre || remoteProduct?.name || item.name,
      detalles: item.details,
      tenant_id: item.tenantId || resolveTenantId(),
    };
  });
};

const processOrder = async () => {
  if (cartItems.value.length === 0) {
      return Swal.fire('Error', 'El carrito está vacío.', 'error');
  }

  isProcessing.value = true;
  Swal.fire({
    title: 'Procesando...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
  
  try {
      if (paymentMethod.value === 'paypal') {
          // PayPal Simulation
          isProcessing.value = false;
          const { isConfirmed } = await Swal.fire({
              title: '<i class="fa-brands fa-paypal text-blue-600 text-4xl mb-2"></i><br>Conectando con PayPal',
              html: `Vas a pagar <b>$${total.value.toFixed(2)}</b> con tu cuenta de PayPal.<br><br><span class="text-sm text-gray-500">Haz clic en continuar para autorizar el cargo.</span>`,
              showCancelButton: true,
              confirmButtonText: 'Autorizar Pago',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#0070BA',
              cancelButtonColor: '#d33',
              reverseButtons: true,
              allowOutsideClick: false,
          });

          if (!isConfirmed) {
              return Swal.fire('Cancelado', 'El pago con PayPal fue cancelado.', 'info');
          }
          
          isProcessing.value = true;
          Swal.fire({
            title: 'Procesando PayPal...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
      } else if (paymentMethod.value === 'card') {
          // Card Simulation
          Swal.fire({
            title: 'Verificando Tarjeta...',
            html: `Contactando con el banco emisor de la tarjeta terminada en <b>${cardDisplay.value.number.slice(-4)}</b>...`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // Simulate 10% chance of failure for realism, or specific failure if card ends in 0000
          if (cardDisplay.value.number.endsWith('0000')) {
             isProcessing.value = false;
             return Swal.fire({
                 icon: 'error',
                 title: 'Pago Declinado',
                 text: 'El banco ha rechazado la transacción. Por favor, intenta con otra tarjeta.',
                 confirmButtonColor: '#BD0A0A'
             });
          }
      }

      const identity = resolveUserIdentity();
      const clientId = (await resolveClientId(identity)) || 1;
      const syncedItems = await resolveRemoteOrderItems();
      const syncedSubtotal = syncedItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
        0,
      );
      const syncedTotal = syncedSubtotal + (currentMode.value === 'delivery' ? deliveryFee.value : 0);

      const methodMap = {
          'cash': 'Efectivo',
          'card': 'Tarjeta (Pagado)',
          'paypal': 'PayPal (Pagado)'
      };

      const orderPayload = {
          cliente_id: clientId,
          total: syncedTotal,
          tenant_id: resolveTenantId(),
          direccion_entrega: currentMode.value === 'pickup' ? 'Recogida en tienda' : addressDetails.value,
          notas: `Pago vía: ${methodMap[paymentMethod.value] || paymentMethod.value}. Instrucciones: ${instructionsText.value}`,
          estado_id: 1, // Pendiente
          items: syncedItems,
          metodo_pago: paymentMethod.value
      };

      let finalOrder = null;
      let usedLocalFallback = false;

      try {
          const orderParams = await api.createOrder(orderPayload, resolveTenantHeaders());
          if (orderParams.success && orderParams.data) {
              finalOrder = saveCachedOrder(
                {
                  ...orderParams.data,
                  items: orderParams.data.items || orderPayload.items,
                  user_email: identity.email,
                  user_name: identity.name,
                  source: 'remote'
                },
                identity.email
              );
          } else {
              throw new Error(orderParams.message || 'Error al crear la orden en el servidor');
          }
      } catch (serverError) {
          console.warn('Falling back to local order storage', serverError);
          usedLocalFallback = true;
          finalOrder = saveCachedOrder(
            buildLocalOrder({
              orderPayload,
              userEmail: identity.email,
              userName: identity.name,
              clientId,
              paymentMethod: paymentMethod.value,
              deliveryMode: currentMode.value
            }),
            identity.email
          );
      }

      if (finalOrder) {
          addNotification(
            {
              type: 'order',
              title: `Pedido #${finalOrder.id} confirmado`,
              message: usedLocalFallback
                ? 'Quedo guardado localmente y podras seguirlo desde tu historial.'
                : 'Tu pedido fue recibido y ya esta en seguimiento.',
              icon: 'fa-solid fa-receipt',
              route: `/tracking/${finalOrder.id}`,
              order_id: finalOrder.id,
            },
            identity.email,
          );

          Swal.fire({
              icon: 'success',
              title: paymentMethod.value === 'cash' ? '¡Pedido Confirmado!' : '¡Pago Procesado con Éxito!',
              html: `Tu pedido <b>#${finalOrder.id}</b> está siendo preparado.<br><br><span class="text-sm text-gray-500">${usedLocalFallback ? 'Quedó guardado localmente mientras el servidor termina de responder.' : 'Recibirás actualizaciones sobre el estado de tu entrega.'}</span>`,
              confirmButtonColor: '#BD0A0A',
              allowOutsideClick: false
          }).then(() => {
              clearCart();
              router.push(`/tracking/${finalOrder.id}`);
          });
      } else {
          throw new Error('No se pudo registrar el pedido.');
      }

  } catch (e) {
      console.error(e);
      Swal.fire('Error en el Servidor', e.message || 'Hubo un problema de comunicación con FoodRush.', 'error');
  } finally {
      isProcessing.value = false;
  }
};

let leaflet = null;
let mapInstance = null;
let userMarker = null;
let storeMarker = null;
let cachedPos = null;

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const ensureLeaflet = () =>
  new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);

    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

const updateMap = (lat, lng, label, isUser) => {
  if (!mapInstance || !leaflet) return;

  mapLoading.value = false;
  mapInstance.setView([lat, lng], 15);

  if (userMarker) mapInstance.removeLayer(userMarker);
  if (storeMarker) mapInstance.removeLayer(storeMarker);

  if (isUser) {
    userMarker = leaflet.marker([lat, lng]).addTo(mapInstance).bindPopup(label).openPopup();
  } else {
    storeMarker = leaflet.marker([lat, lng]).addTo(mapInstance).bindPopup(label).openPopup();
  }
};

const locateUser = () => {
  if (!mapInstance) return;

  if (cachedPos) {
    updateMap(cachedPos.lat, cachedPos.lng, 'Tu Ubicación', true);
    return;
  }

  mapLoading.value = true;

  if (!navigator.geolocation) {
    updateMap(19.4517, -70.697, 'Default', true);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      cachedPos = { lat, lng };
      updateMap(lat, lng, 'Tu Ubicación', true);
      addressTitle.value = 'Ubicación Actual';
      addressDetails.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    },
    () => {
      updateMap(19.4517, -70.697, 'Default', true);
    }
  );
};

const showStoreLocation = () => {
  updateMap(19.459, -70.69, 'Tienda', false);
};

const initMapDefault = () => {
  if (!mapEl.value || !leaflet) return;

  if (mapInstance) mapInstance.remove();
  mapInstance = leaflet.map(mapEl.value).setView([19.4517, -70.697], 15);
  leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);

  if (currentMode.value === 'pickup') {
    showStoreLocation();
  } else {
    locateUser();
  }
};

watch(currentMode, (mode) => {
  if (!mapInstance) return;
  if (mode === 'delivery') locateUser();
  if (mode === 'pickup') showStoreLocation();
});

const handleLogout = () => {
    clearSession();
    userName.value = '';
    currentUserEmail.value = 'usuario_invitado';
    window.location.reload();
};

const syncCheckoutSession = () => {
  const session = getSession();
  userName.value = session.userName || '';
  currentUserEmail.value = session.userEmail || 'usuario_invitado';
  if (session.userAddress) {
    addressTitle.value = 'Direccion guardada';
    addressDetails.value = session.userAddress;
  } else {
    addressTitle.value = 'Detectando ubicacion...';
    addressDetails.value = 'Espere un momento';
  }
  loadCart();
  loadUserPaymentMethods();
};

onMounted(async () => {
  syncCheckoutSession();
  window.addEventListener(APP_EVENTS.cartChanged, loadCart);
  window.addEventListener(APP_EVENTS.paymentsChanged, loadUserPaymentMethods);
  window.addEventListener(APP_EVENTS.authChanged, syncCheckoutSession);
  
  try {
    leaflet = await ensureLeaflet();
    initMapDefault();
  } catch (error) {
    console.error('Leaflet no pudo cargar', error);
    mapLoading.value = false;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener(APP_EVENTS.cartChanged, loadCart);
  window.removeEventListener(APP_EVENTS.paymentsChanged, loadUserPaymentMethods);
  window.removeEventListener(APP_EVENTS.authChanged, syncCheckoutSession);
  if (mapInstance) mapInstance.remove();
});
</script>

<template>
  <div class="checkout-page flex flex-col min-h-screen text-slate-800 bg-cream">
    <!-- Navbar from Home.vue design -->
    <nav class="bg-white shadow-sm py-3 md:py-4 sticky top-0 z-50 transition-all border-b border-gray-100">
        <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 md:px-12">
            <div class="flex items-center gap-4">
              <button @click="goBack" class="md:hidden text-gray-500 hover:text-primary transition">
                <i class="fa-solid fa-arrow-left text-xl"></i>
              </button>
              <a href="#" @click.prevent="router.push('/')" class="flex items-center space-x-2 group">
                  <i class="fas fa-bolt text-2xl md:text-3xl text-primary transform group-hover:scale-110 transition-transform"></i>
                  <span class="self-center text-2xl font-extrabold whitespace-nowrap text-dark tracking-tighter font-sans">
                      FOOD<span class="text-primary">RUSH</span>
                  </span>
              </a>
            </div>

            <nav class="hidden md:flex gap-8 font-medium">
                <a @click.prevent="goBack" class="text-gray-500 hover:text-primary transition font-medium cursor-pointer"><i class="fa-solid fa-arrow-left mr-1"></i> Volver a Comprar</a>
            </nav>

            <div class="flex items-center gap-5">
                <div v-if="userName" class="flex items-center gap-5">
                    <div class="flex items-center gap-4 mr-2">
                        <button class="relative text-gray-400 hover:text-slate-800 transition" aria-label="Notificaciones">
                            <i class="fa-regular fa-bell text-xl"></i>
                        </button>
                    </div>

                    <div class="h-8 w-px bg-gray-200"></div>

                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-end">
                            <span class="font-bold text-slate-700 text-sm">{{ userName.split(' ')[0] }}</span>
                            <button @click="handleLogout" class="text-[11px] text-red-500 font-bold hover:underline">Cerrar sesión</button>
                        </div>
                        <div @click="router.push('/profile')" class="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-accent cursor-pointer hover:bg-orange-100 transition border border-orange-100 shadow-sm">
                            <i class="fa-regular fa-user"></i>
                        </div>
                    </div>
                </div>

                <button v-else @click="router.push('/login')" class="bg-primary text-white px-5 py-2 rounded-full font-bold hover:bg-red-700 transition flex items-center gap-2 shadow-sm text-sm">
                    <i class="fa-solid fa-user text-xs"></i> Iniciar Sesión
                </button>
            </div>
        </div>
    </nav>

    <main class="container mx-auto px-4 py-8 flex-grow">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <h2 class="text-xl font-medium text-slate-700 mb-6 text-center">Detalles de la entrega</h2>

            <div class="flex justify-center mb-8 relative z-10">
              <div class="bg-gray-100 p-1.5 rounded-full flex text-sm font-bold transition-all shadow-inner border border-gray-200/50">
                <button
                  id="btn-delivery"
                  class="px-8 py-2 rounded-full transition-all duration-300 relative overflow-hidden"
                  :class="currentMode === 'delivery' ? 'mode-btn-active scale-105 shadow-[0_4px_12px_rgba(189,10,10,0.2)]' : 'mode-btn-inactive text-slate-500 hover:text-slate-700'"
                  @click="setMode('delivery')"
                >
                  <i class="fa-solid fa-bicycle mr-2 transition-transform duration-300" :class="currentMode === 'delivery' ? 'scale-110 translate-x-1' : ''"></i>
                  Delivery
                </button>
                <button
                  id="btn-pickup"
                  class="px-8 py-2 rounded-full transition-all duration-300 relative overflow-hidden"
                  :class="currentMode === 'pickup' ? 'mode-btn-active scale-105 shadow-[0_4px_12px_rgba(189,10,10,0.2)]' : 'mode-btn-inactive text-slate-500 hover:text-slate-700'"
                  @click="setMode('pickup')"
                >
                  <i class="fa-solid fa-store mr-2 transition-transform duration-300" :class="currentMode === 'pickup' ? 'scale-110 -translate-x-1' : ''"></i>
                  Pickup
                </button>
              </div>
            </div>

            <div class="border border-slate-200/60 rounded-2xl p-1.5 mb-8 relative shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-500 bg-white/50 backdrop-blur-sm group">
              <div class="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div id="map" ref="mapEl" class="rounded-xl overflow-hidden shadow-inner h-[200px] z-10 relative"></div>
              <div
                v-show="mapLoading"
                id="map-loading"
                class="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 rounded-xl"
              >
                <span class="text-sm text-gray-500 animate-pulse">
                  <i class="fa-solid fa-location-dot animate-bounce"></i>
                  Buscando ubicación...
                </span>
              </div>
            </div>

            <div class="space-y-4 bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between border-b border-gray-100 pb-4">
                <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                    <i class="fa-solid fa-location-dot text-lg"></i>
                  </div>
                  <div>
                    <p class="font-extrabold text-slate-800 text-sm tracking-wide">{{ addressTitle }}</p>
                    <p class="text-xs text-slate-500 mt-0.5 tracking-wide">{{ addressDetails }}</p>
                  </div>
                </div>
                <button
                  v-show="currentMode === 'delivery'"
                  id="btn-edit-address"
                  class="text-xs px-3 py-1.5 rounded-lg font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                  @click="editAddress"
                >
                  Editar
                </button>
              </div>

              <div v-show="currentMode === 'delivery'" id="instructions-container" class="flex items-start justify-between transition-all duration-500 pt-2 animate-fade-in">
                <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                    <i class="fa-solid fa-clipboard-list text-lg"></i>
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 text-sm tracking-wide">Instrucciones de Entrega</p>
                    <p class="text-xs text-slate-400 mt-0.5 italic max-w-[200px] truncate" :title="instructionsText">"{{ instructionsText }}"</p>
                  </div>
                </div>
                <button class="text-xs px-3 py-1.5 rounded-lg font-bold text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-sm" @click="editInstructions">
                  Añadir
                </button>
              </div>
            </div>

            <div v-show="currentMode === 'delivery'" id="delivery-options-container" class="mt-8 border-t border-gray-100 pt-6 transition-all duration-500 animate-fade-in">
              <h3 class="text-left text-slate-800 font-extrabold mb-4 flex items-center gap-2">
                <i class="fa-solid fa-clock text-red-500"></i>
                Opciones de entrega
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <label class="cursor-pointer group">
                  <input v-model="deliveryType" type="radio" name="delivery_type" value="basic" class="radio-box hidden" />
                  <div class="border-2 border-gray-100 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:border-red-200 hover:bg-red-50/30">
                    <div class="radio-indicator flex-shrink-0"></div>
                    <div class="flex-grow">
                      <p class="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">Básica</p>
                      <p class="text-[10px] text-gray-500 mt-0.5">30-45 min</p>
                    </div>
                    <i class="fa-solid fa-bolt text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                </label>
                <label class="cursor-pointer group">
                  <input v-model="deliveryType" type="radio" name="delivery_type" value="scheduled" class="radio-box hidden" />
                  <div class="border-2 border-gray-100 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:border-red-200 hover:bg-red-50/30">
                    <div class="radio-indicator flex-shrink-0"></div>
                    <div class="flex-grow">
                      <p class="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">Programar</p>
                      <p class="text-[10px] text-gray-500 mt-0.5">Elegir hora</p>
                    </div>
                    <i class="fa-regular fa-calendar text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </div>
                </label>
              </div>
              <div v-show="deliveryType === 'scheduled'" id="schedule-selector" class="mt-4 bg-orange-50/50 p-5 rounded-xl border border-orange-100 animate-fade-in shadow-inner">
                <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Fecha y Hora de Entrega</label>
                <input v-model="scheduleDate" type="datetime-local" class="w-full border-2 border-gray-200 rounded-lg p-3 text-sm font-medium text-slate-700 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm" />
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-between text-white overflow-hidden relative group">
            <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div class="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors duration-500"></div>
            <div class="relative z-10">
              <h2 class="text-sm font-bold text-gray-300 mb-1 uppercase tracking-widest">Método de Pago</h2>
              <div class="flex items-center gap-3 mt-2">
                <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <i v-if="paymentMethod === 'cash'" class="fa-solid fa-money-bill text-green-400 text-lg"></i>
                  <i v-else-if="paymentMethod === 'card'" class="fa-regular fa-credit-card text-blue-400 text-lg"></i>
                  <i v-else class="fa-brands fa-paypal text-blue-400 text-lg"></i>
                </div>
                <div>
                  <span class="font-extrabold text-lg tracking-wide block leading-tight">
                    {{ paymentMethod === 'card' ? 'Tarjeta' : paymentMethod === 'paypal' ? 'PayPal' : 'Efectivo' }}
                  </span>
                  <span v-if="paymentMethod === 'card' && hasSavedCard" class="text-xs text-blue-300 font-medium">{{ cardDisplay.number }}</span>
                  <span v-else-if="paymentMethod === 'card'" class="text-xs text-blue-300 font-medium">Sin tarjeta guardada</span>
                  <span v-else-if="paymentMethod === 'paypal'" class="text-xs text-blue-300 font-medium">{{ paypalEmail || savedPayPalAccount?.email }}</span>
                </div>
              </div>
            </div>
            <button class="relative z-10 bg-white/10 hover:bg-white/20 px-5 py-2 rounded-xl text-sm font-bold border border-white/10 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]" @click="openPaymentModal">
              Cambiar
            </button>
          </div>
        </div>

        <div class="lg:col-span-5 space-y-6">
          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <a @click.prevent="router.push('/cart')" class="flex justify-between items-center mb-4 border-b pb-2 cursor-pointer hover:opacity-70 transition group">
              <h2 class="text-lg text-slate-600 font-bold group-hover:text-red-600 transition-colors">Resumen de carrito</h2>
              <div class="relative">
                <i class="fa-solid fa-cart-shopping text-slate-400 group-hover:text-red-500 text-xl transition-colors"></i>
                <span class="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {{ cartCount }}
                </span>
              </div>
            </a>

            <div v-if="cartItems.length === 0" class="text-center py-8 text-gray-400 text-sm">
              Tu carrito está vacío.<br />
              <a @click.prevent="router.push('/')" class="text-slate-800 font-bold hover:underline cursor-pointer">Ir a comprar</a>
            </div>
            <div v-else class="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              <div v-for="(item, index) in cartItems" :key="index" class="flex gap-4 items-center border border-gray-100 p-3 rounded-xl mb-3 hover:shadow-md hover:border-red-100 transition-all duration-300 bg-white group cursor-default">
                <div class="w-14 h-14 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:bg-red-50 transition-colors">
                  <img :src="item.img" :alt="item.name" class="h-full object-contain transform group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div class="flex-grow">
                  <p class="text-sm font-bold text-slate-700 group-hover:text-red-600 transition-colors">{{ item.name }}</p>
                  <p class="text-xs text-gray-500 font-medium mt-0.5">Cant: <span class="bg-gray-100 text-slate-700 font-bold px-1.5 py-0.5 rounded ml-1">{{ item.qty }}</span></p>
                </div>
                <span class="font-bold text-base text-slate-800 bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">${{ (item.price * item.qty).toFixed(2) }}</span>
              </div>
            </div>

            <div class="border-t mt-4 pt-4 space-y-2 text-sm text-slate-500">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between" :class="currentMode === 'pickup' ? 'opacity-20 line-through' : ''">
                <span>Delivery Fee</span>
                <span>$5.00</span>
              </div>
              <div class="flex justify-between text-lg font-bold text-slate-800 mt-2">
                <span>Total</span>
                <span>${{ total.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-6 shadow-sm">
            <div v-if="paymentMethod === 'cash'" class="text-center py-6">
              <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-100">
                <i class="fa-solid fa-hand-holding-dollar text-4xl text-green-500"></i>
              </div>
              <h3 class="font-extrabold text-2xl text-slate-800 mb-2">Pago en Efectivo</h3>
              <p class="text-sm text-gray-500 mb-8 max-w-[250px] mx-auto leading-relaxed">Paga directamente al repartidor cuando recibas tu pedido.</p>
              
              <div class="bg-slate-50 rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-500"></div>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total a Preparar</p>
                <p class="text-5xl font-black text-slate-800 my-2 tracking-tighter">${{ total.toFixed(2) }}</p>
                <p class="text-xs text-green-600 font-bold mt-4 flex items-center justify-center gap-1"><i class="fa-solid fa-shield-check"></i> Seguro y Sin Comisiones</p>
              </div>
            </div>

            <div v-else-if="paymentMethod === 'paypal'" class="text-center py-6">
              <div class="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-sky-100">
                <i class="fa-brands fa-paypal text-4xl text-sky-600"></i>
              </div>
              <h3 class="font-extrabold text-2xl text-slate-800 mb-2">PayPal Seleccionado</h3>
              <p class="text-sm text-gray-500 mb-8 max-w-[300px] mx-auto leading-relaxed">
                {{ savedPayPalAccount?.email || paypalEmail || 'No hay cuenta vinculada. Agrega una para continuar.' }}
              </p>

              <div class="mt-2 bg-slate-50 p-5 rounded-xl border border-gray-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-slate-500 text-sm uppercase tracking-wide">Total a cobrar</span>
                  <span class="font-black text-2xl text-slate-800">${{ total.toFixed(2) }}</span>
                </div>
              </div>
              <button
                class="block w-full text-center text-sm text-red-600 font-bold mt-4 hover:bg-red-50 border border-transparent hover:border-red-100 py-3 rounded-xl transition-all duration-300"
                @click="openPaymentModal"
              >
                Cambiar Metodo de Pago
              </button>
            </div>

            <div v-else>
              <h3 class="font-bold text-lg mb-4 text-center">Tarjeta Seleccionada</h3>
              <div class="credit-card-visual mb-4 shadow-xl border border-white/10 rounded-2xl">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-sm"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 blur-sm"></div>
                <div class="relative z-10">
                  <div class="flex justify-between items-center mb-8">
                    <i class="fa-solid fa-microchip text-2xl opacity-80 text-yellow-400"></i>
                    <i :class="[cardDisplay.icon || 'fa-regular fa-credit-card text-white', 'text-4xl opacity-90']"></i>
                  </div>
                  <div class="mb-5">
                    <p class="text-[10px] opacity-60 uppercase tracking-widest font-semibold mb-1">Card Number</p>
                    <p class="font-mono text-xl tracking-widest text-shadow">{{ cardDisplay.number }}</p>
                  </div>
                  <div class="flex justify-between">
                    <div>
                      <p class="text-[10px] opacity-60 uppercase font-semibold mb-0.5">Holder</p>
                      <p class="font-medium text-sm tracking-wide">{{ cardDisplay.name }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] opacity-60 uppercase font-semibold mb-0.5 text-right">Expires</p>
                      <p class="font-medium text-sm tracking-wide text-right">{{ cardDisplay.expiry }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-8 bg-slate-50 p-5 rounded-xl border border-gray-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-bold text-slate-500 text-sm uppercase tracking-wide">Total a cobrar</span>
                  <span class="font-black text-2xl text-slate-800">${{ total.toFixed(2) }}</span>
                </div>
              </div>
              <button
                class="block w-full text-center text-sm text-red-600 font-bold mt-4 hover:bg-red-50 border border-transparent hover:border-red-100 py-3 rounded-xl transition-all duration-300"
                @click="openPaymentModal"
              >
                Cambiar Método de Pago
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="fixed bottom-0 left-0 w-full bg-white border-t p-4 z-40 flex justify-center lg:static lg:bg-transparent lg:border-none lg:p-0 lg:mt-8">
        <button
          class="w-full max-w-4xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-extrabold text-xl py-4 rounded-xl shadow-[0_8px_15px_rgba(189,10,10,0.2)] hover:shadow-[0_12px_20px_rgba(189,10,10,0.3)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
          @click="processOrder"
          :disabled="isProcessing"
        >
          <template v-if="isProcessing">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i> 
            <span>Procesando...</span>
          </template>
          <template v-else>
            <span>Pagar Ahora</span>
            <i class="fa-solid fa-arrow-right text-lg ml-1"></i>
          </template>
        </button>
      </div>
    </main>

    <footer class="bg-white border-t border-gray-200 mt-auto py-8">
      <div class="container mx-auto px-6 text-center text-sm text-gray-400">
        <p>&copy; 2025 FoodRush. Pagos seguros y encriptados.</p>
      </div>
    </footer>

    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 fade-in">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button class="absolute top-4 right-4 text-gray-400 hover:text-black" @click="closeModal('payment')">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div class="flex items-center gap-2 mb-6">
          <i class="fa-solid fa-chevron-left text-sm cursor-pointer" @click="closeModal('payment')"></i>
          <h3 class="text-xl font-bold">Agrega un método de pago</h3>
        </div>
        <div class="space-y-2">
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectCash"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-green-100 rounded flex items-center justify-center text-green-700">
                <i class="fa-solid fa-money-bill"></i>
              </div>
              <span class="font-bold text-slate-700">Efectivo</span>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectCard(false)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-700">
                <i class="fa-regular fa-credit-card"></i>
              </div>
              <div>
                <span class="font-bold text-slate-700 block">Tarjeta</span>
                <span class="text-xs text-slate-400">{{ hasSavedCard ? (savedCard?.number || cardDisplay.number) : 'No tienes tarjeta guardada' }}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectPayPal"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                <i class="fa-brands fa-paypal"></i>
              </div>
              <div>
                <span class="font-bold text-slate-700 block">PayPal</span>
                <span class="text-xs text-slate-400">{{ hasSavedPayPal ? (savedPayPalAccount?.email || paypalEmail) : 'Vincular cuenta PayPal' }}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>

    <div v-if="false && showChangeCardModal" class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 fade-in">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button class="absolute top-4 right-4 text-gray-400 hover:text-black" @click="closeModal('change')">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div class="mb-6">
          <h3 class="text-xl font-bold">Cambiar método de pago</h3>
        </div>
        <div class="space-y-2">
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectCash"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-green-100 rounded flex items-center justify-center text-green-700">
                <i class="fa-solid fa-money-bill"></i>
              </div>
              <span class="font-bold text-slate-700">Efectivo</span>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectCard(false)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-700">
                <i class="fa-regular fa-credit-card"></i>
              </div>
              <div>
                <span class="font-bold text-slate-700 block">{{ hasSavedCard ? 'Tarjeta guardada' : 'Agregar tarjeta' }}</span>
                <span class="text-xs text-slate-400">{{ hasSavedCard ? cardDisplay.number : 'No tienes tarjeta guardada' }}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectPayPal"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                <i class="fa-brands fa-paypal"></i>
              </div>
              <div>
                <span class="font-bold text-slate-700 block">PayPal</span>
                <span class="text-xs text-slate-400">{{ hasSavedPayPal ? (savedPayPalAccount?.email || paypalEmail) : 'Vincular cuenta PayPal' }}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showChangeCardModal" class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 fade-in">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button class="absolute top-4 right-4 text-gray-400 hover:text-black" @click="closeModal('change')">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div class="mb-6">
          <h3 class="text-xl font-bold">Tarjetas</h3>
        </div>
        <div class="space-y-2">
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectCard(true)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-700">
                <i class="fa-regular fa-credit-card"></i>
              </div>
              <span class="font-bold text-slate-700">{{ hasSavedCard ? 'Agregar otra tarjeta' : 'Agregar tarjeta' }}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div
            v-if="hasSavedCard"
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="selectStoredCard"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-8 bg-emerald-50 rounded flex items-center justify-center text-emerald-600">
                <i :class="savedCard?.icon || 'fa-regular fa-credit-card'"></i>
              </div>
              <div>
                <span class="font-bold text-slate-700 block">{{ savedCard?.type || 'Tarjeta guardada' }}</span>
                <span class="text-xs text-slate-400">{{ savedCard?.number || cardDisplay.number }}</span>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-300"></i>
          </div>
          <div v-else class="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
            Todavia no tienes una tarjeta guardada.
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCardFormModal" class="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 fade-in">
      <div class="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
        <div class="flex items-center gap-2 mb-6">
          <i class="fa-solid fa-chevron-left text-lg cursor-pointer hover:text-slate-600" @click="closeCardForm"></i>
          <h3 class="text-xl font-bold text-slate-900">{{ cardFormTitle }}</h3>
        </div>
        <form class="space-y-6" @submit="saveCardInfo">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Número de Tarjeta</label>
            <div class="relative group">
              <input
                v-model="cardForm.number"
                type="text"
                placeholder="**** **** **** 1234"
                maxlength="19"
                class="input-field pl-5 border-2 border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 font-mono text-lg tracking-wider"
                @input="formatCardNumber"
                required
              />
              <i class="fa-regular fa-credit-card absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl group-focus-within:text-slate-800 transition-colors"></i>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Fecha Exp.</label>
              <input
                v-model="cardForm.expiry"
                type="text"
                placeholder="MM/YY"
                maxlength="5"
                class="input-field border-2 border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 font-mono text-center tracking-widest text-lg"
                @input="formatExpiry"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">CVV</label>
              <input
                v-model="cardForm.cvv"
                type="text"
                placeholder="123"
                maxlength="3"
                class="input-field border-2 border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 font-mono text-center tracking-widest text-lg"
                @input="formatCVV"
                required
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Nombre del Titular</label>
            <input v-model="cardForm.name" type="text" placeholder="EJ. JUAN PEREZ" class="input-field border-2 border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 font-bold uppercase" required />
          </div>
          <div class="flex items-center gap-3 pt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <input
              v-model="cardForm.save"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              checked
            />
            <label class="text-sm font-bold text-slate-700 cursor-pointer">Guardar tarjeta para futuras compras</label>
          </div>
          <button type="submit" class="w-full bg-slate-900 text-white font-extrabold py-4 rounded-xl hover:bg-black transition-all duration-300 mt-6 text-lg shadow-[0_8px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_20px_rgba(0,0,0,0.2)] hover:-translate-y-1">
            Revisar y Guardar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

.checkout-page {
  font-family: 'Poppins', sans-serif;
  background-color: #FAFAF5; /* bg-cream from Home */
}

/* Home Tokens for navbar */
.bg-cream { background-color: #FAFAF5; }
.bg-dark { background-color: #1a1a2e; }
.text-dark { color: #1a1a2e; }
.text-primary { color: #D90429; }
.bg-primary { background-color: #D90429; }
.text-accent { color: #F48C06; }
.font-display { font-family: 'Titan One', cursive; }

#map {
  height: 180px;
  width: 100%;
  border-radius: 12px;
  z-index: 1;
}

.radio-box:checked + div {
  border-color: #BD0A0A;
  background-color: #fff0f0;
}

.radio-box:checked + div .radio-indicator {
  border: 5px solid #BD0A0A;
}

.radio-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ccc;
  transition: all 0.2s;
}

.credit-card-visual {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.mode-btn-active {
  background-color: #BD0A0A;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(189, 10, 10, 0.3);
}

.mode-btn-inactive {
  color: #475569;
  background-color: transparent;
}

.mode-btn-inactive:hover {
  background-color: #d1d5db;
}

.input-field {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  outline: none;
  color: #334155;
  font-weight: 500;
}

.input-field:focus {
  border-color: #0f172a;
}

.fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
