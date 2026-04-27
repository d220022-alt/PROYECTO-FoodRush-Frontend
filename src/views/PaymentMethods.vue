<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import {
  APP_EVENTS,
  getPreferredPaymentMethod,
  getSavedCard,
  getSavedPayPal,
  getSession,
  removeSavedCard,
  removeSavedPayPal,
  saveSavedCard,
  saveSavedPayPal,
  setPreferredPaymentMethod,
} from '../services/storage';

const router = useRouter();
const goBack = () => router.go(-1);

const currentUserEmail = ref(getSession().userEmail || 'usuario_invitado');
const preferredMethod = ref('cash');
const savedCard = ref(null);
const savedPayPal = ref(null);

const showCardFormModal = ref(false);
const showCardPickerModal = ref(false);
const cardFormTitle = ref('Agregar tarjeta');
const cardFormReturnTo = ref('main'); // 'main' | 'picker'
const cardForm = ref({
  number: '',
  expiry: '',
  cvv: '',
  name: '',
  save: true,
});

const hasSavedCard = computed(() => Boolean(savedCard.value));
const hasSavedPayPal = computed(() => Boolean(savedPayPal.value?.email));

const preferredLabel = computed(() => {
  if (preferredMethod.value === 'card') return 'Tarjeta';
  if (preferredMethod.value === 'paypal') return 'PayPal';
  return 'Efectivo';
});

const showToast = (title, icon = 'success') => {
  Swal.fire({
    icon,
    title,
    toast: true,
    position: 'top-end',
    timer: 1400,
    showConfirmButton: false,
  });
};

const loadMethods = () => {
  const session = getSession();
  currentUserEmail.value = session.userEmail || currentUserEmail.value || 'usuario_invitado';

  savedCard.value = getSavedCard(currentUserEmail.value);
  savedPayPal.value = getSavedPayPal(currentUserEmail.value);

  const storedPreferred = getPreferredPaymentMethod(currentUserEmail.value);
  let resolvedPreferred = storedPreferred;

  if (!resolvedPreferred) {
    resolvedPreferred = savedCard.value ? 'card' : savedPayPal.value ? 'paypal' : 'cash';
  } else if (resolvedPreferred === 'card' && !savedCard.value) {
    resolvedPreferred = savedPayPal.value ? 'paypal' : 'cash';
  } else if (resolvedPreferred === 'paypal' && !savedPayPal.value) {
    resolvedPreferred = savedCard.value ? 'card' : 'cash';
  }

  preferredMethod.value = resolvedPreferred;

  if (resolvedPreferred !== storedPreferred) {
    setPreferredPaymentMethod(currentUserEmail.value, resolvedPreferred);
  }
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

const openCardForm = (isChanging = false) => {
  cardFormTitle.value = isChanging ? 'Cambiar tarjeta' : 'Agregar tarjeta';
  cardFormReturnTo.value = isChanging ? 'main' : cardFormReturnTo.value;
  showCardPickerModal.value = false;
  resetCardForm();
  showCardFormModal.value = true;
};

const closeCardForm = () => {
  showCardFormModal.value = false;
  if (cardFormReturnTo.value === 'picker') {
    showCardPickerModal.value = true;
  }
};

const saveCardInfo = (event) => {
  event.preventDefault();

  const number = cardForm.value.number.replace(/\s/g, '');
  const expiry = cardForm.value.expiry;
  const cvv = cardForm.value.cvv;
  const name = cardForm.value.name.trim();

  if (number.length !== 16) return Swal.fire('Error', '16 digitos requeridos', 'error');
  if (cvv.length !== 3) return Swal.fire('Error', 'CVV invalido', 'error');
  if (!name.includes(' ') || name.length < 5) return Swal.fire('Error', 'Nombre y apellido requeridos', 'error');
  if (expiry.length !== 5) return Swal.fire('Error', 'Fecha invalida', 'error');
  if (!cardForm.value.save) {
    return Swal.fire('Error', 'Activa guardar tarjeta para usar este metodo en perfil.', 'error');
  }

  const [month, year] = expiry.split('/').map(Number);
  const now = new Date();
  const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) return Swal.fire('Error', 'Mes invalido', 'error');
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return Swal.fire('Error', 'Tarjeta vencida', 'error');
  }

  saveSavedCard(currentUserEmail.value, {
    number,
    expiry,
    name: name.toUpperCase(),
  });
  setPreferredPaymentMethod(currentUserEmail.value, 'card');
  preferredMethod.value = 'card';

  cardFormReturnTo.value = 'main';
  showCardPickerModal.value = false;
  closeCardForm();
  loadMethods();
  showToast('Tarjeta guardada');
};

const connectPayPal = async () => {
  const prefilledEmail = savedPayPal.value?.email || 'usuario@ejemplo.com';

  const result = await Swal.fire({
    title: '<i class="fa-brands fa-paypal text-blue-600 text-4xl mb-2"></i><br>Iniciar Sesion',
    html: `
      <div class="text-left mt-2">
        <label class="block text-xs font-bold text-slate-600 mb-1">Correo Electronico</label>
        <input id="swal-paypal-email" type="email" class="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none mb-4" placeholder="correo@ejemplo.com" value="${prefilledEmail}">

        <label class="block text-xs font-bold text-slate-600 mb-1">Contrasena</label>
        <input id="swal-paypal-pass" type="password" class="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="********" value="demo1234">
      </div>
      <div class="flex items-center gap-2 mt-4 text-sm text-gray-600">
        <input type="checkbox" id="swal-paypal-save" checked class="rounded border-gray-300">
        <label for="swal-paypal-save">Guardar PayPal para la proxima vez</label>
      </div>
      <p class="text-xs text-gray-500 mt-4 text-center">Simulacion segura. No uses datos reales.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Iniciar Sesion',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0070BA',
    cancelButtonColor: '#64748b',
    focusConfirm: false,
    preConfirm: () => {
      const emailInput = document.getElementById('swal-paypal-email')?.value || '';
      const passInput = document.getElementById('swal-paypal-pass')?.value || '';
      const saveInput = document.getElementById('swal-paypal-save')?.checked;

      if (!emailInput || !passInput) {
        Swal.showValidationMessage('Por favor completa ambos campos');
        return false;
      }
      if (!emailInput.includes('@')) {
        Swal.showValidationMessage('El correo no es valido');
        return false;
      }
      if (!saveInput) {
        Swal.showValidationMessage('Activa guardar PayPal para usar este metodo en perfil.');
        return false;
      }

      return { email: emailInput };
    },
  });

  if (!result.isConfirmed) return;

  saveSavedPayPal(currentUserEmail.value, result.value.email);
  setPreferredPaymentMethod(currentUserEmail.value, 'paypal');
  loadMethods();

  Swal.fire({
    icon: 'success',
    title: 'PayPal vinculado',
    text: `Cuenta conectada: ${result.value.email}`,
    timer: 1400,
    showConfirmButton: false,
  });
};

const selectMethod = async (method) => {
  if (method === 'cash') {
    showCardPickerModal.value = false;
    setPreferredPaymentMethod(currentUserEmail.value, 'cash');
    preferredMethod.value = 'cash';
    return showToast('Metodo en efectivo seleccionado');
  }

  if (method === 'card') {
    if (hasSavedCard.value) {
      showCardPickerModal.value = true;
      return;
    }

    cardFormReturnTo.value = 'main';
    openCardForm(false);
    return;
  }

  showCardPickerModal.value = false;
  if (!hasSavedPayPal.value) {
    await connectPayPal();
    return;
  }

  setPreferredPaymentMethod(currentUserEmail.value, 'paypal');
  preferredMethod.value = 'paypal';
  showToast('PayPal seleccionado');
};

const selectStoredCard = () => {
  if (!hasSavedCard.value) {
    cardFormReturnTo.value = 'main';
    openCardForm(false);
    return;
  }

  showCardPickerModal.value = false;
  setPreferredPaymentMethod(currentUserEmail.value, 'card');
  preferredMethod.value = 'card';
  showToast('Tarjeta seleccionada');
};

const addCardFromPicker = () => {
  cardFormReturnTo.value = 'picker';
  openCardForm(false);
};

const removeCard = () => {
  removeSavedCard(currentUserEmail.value);
  showCardPickerModal.value = false;

  if (preferredMethod.value === 'card') {
    const fallbackMethod = hasSavedPayPal.value ? 'paypal' : 'cash';
    setPreferredPaymentMethod(currentUserEmail.value, fallbackMethod);
  }

  loadMethods();
  showToast('Tarjeta eliminada');
};

const removePayPal = () => {
  removeSavedPayPal(currentUserEmail.value);

  if (preferredMethod.value === 'paypal') {
    const fallbackMethod = hasSavedCard.value ? 'card' : 'cash';
    setPreferredPaymentMethod(currentUserEmail.value, fallbackMethod);
  }

  loadMethods();
  showToast('PayPal eliminado');
};

onMounted(() => {
  loadMethods();
  window.addEventListener(APP_EVENTS.paymentsChanged, loadMethods);
  window.addEventListener(APP_EVENTS.authChanged, loadMethods);
});

onBeforeUnmount(() => {
  window.removeEventListener(APP_EVENTS.paymentsChanged, loadMethods);
  window.removeEventListener(APP_EVENTS.authChanged, loadMethods);
});
</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans">
  <header class="p-6 flex items-center bg-[#F5F5F5] sticky top-0 z-10">
    <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
      <i class="fa-solid fa-arrow-left"></i>
    </button>
    <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Metodos de Pago</h1>
    <div class="w-8"></div>
  </header>

  <div class="px-6 pb-10 max-w-lg mx-auto space-y-5">
    <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <p class="text-xs uppercase tracking-wider text-gray-400 font-bold">Metodo preferido</p>
      <div class="flex items-center justify-between mt-2">
        <p class="text-xl font-black text-slate-800">{{ preferredLabel }}</p>
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-500 text-xs font-bold">
          <i class="fa-solid fa-check"></i>
          Activo
        </span>
      </div>
    </div>

    <div class="space-y-3">
      <button
        @click="selectMethod('cash')"
        class="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        :class="preferredMethod === 'cash' ? 'border-green-200 bg-green-50/40' : 'border-gray-100'"
      >
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <i class="fa-solid fa-money-bill"></i>
          </div>
          <div class="text-left">
            <p class="font-bold text-slate-800">Efectivo</p>
            <p class="text-xs text-gray-500">Pago al recibir tu pedido</p>
          </div>
        </div>
        <i :class="preferredMethod === 'cash' ? 'fa-solid fa-circle-check text-green-500' : 'fa-solid fa-chevron-right text-gray-300'"></i>
      </button>

      <button
        @click="selectMethod('card')"
        class="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        :class="preferredMethod === 'card' ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'"
      >
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
            <i :class="savedCard?.icon || 'fa-regular fa-credit-card'"></i>
          </div>
          <div class="text-left">
            <p class="font-bold text-slate-800">Tarjeta</p>
            <p class="text-xs text-gray-500">{{ savedCard ? savedCard.number : 'Agrega una tarjeta para continuar' }}</p>
          </div>
        </div>
        <i :class="preferredMethod === 'card' ? 'fa-solid fa-circle-check text-blue-500' : 'fa-solid fa-chevron-right text-gray-300'"></i>
      </button>

      <button
        @click="selectMethod('paypal')"
        class="w-full bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        :class="preferredMethod === 'paypal' ? 'border-sky-200 bg-sky-50/40' : 'border-gray-100'"
      >
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-lg">
            <i class="fa-brands fa-paypal"></i>
          </div>
          <div class="text-left">
            <p class="font-bold text-slate-800">PayPal</p>
            <p class="text-xs text-gray-500">{{ savedPayPal?.email || 'Vincula tu cuenta PayPal' }}</p>
          </div>
        </div>
        <i :class="preferredMethod === 'paypal' ? 'fa-solid fa-circle-check text-sky-500' : 'fa-solid fa-chevron-right text-gray-300'"></i>
      </button>
    </div>

    <div v-if="showCardPickerModal" class="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 fade-in">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 relative">
        <button class="absolute top-4 right-4 text-gray-400 hover:text-black" @click="showCardPickerModal = false">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
        <div class="mb-6">
          <h3 class="text-xl font-bold text-slate-900">Tarjetas</h3>
        </div>
        <div class="space-y-2">
          <div
            class="flex items-center justify-between p-4 hover:bg-red-50 rounded-xl cursor-pointer border border-transparent hover:border-red-100 hover:shadow-sm transition-all duration-300 group"
            @click="addCardFromPicker"
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
                <span class="text-xs text-slate-400">{{ savedCard?.number }}</span>
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

    <TransitionGroup name="list" tag="div" class="space-y-3">
      <div v-if="savedCard" key="card" class="bg-white rounded-3xl p-5 shadow-sm flex items-center justify-between group border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl">
            <i :class="savedCard.icon"></i>
          </div>
          <div>
            <p class="font-bold text-slate-800">{{ savedCard.type }}</p>
            <p class="text-sm text-gray-500">{{ savedCard.number }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="openCardForm(true)" class="w-10 h-10 rounded-full hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition flex items-center justify-center">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button @click="removeCard" class="w-10 h-10 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition flex items-center justify-center">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>

      <div v-if="savedPayPal" key="paypal" class="bg-white rounded-3xl p-5 shadow-sm flex items-center justify-between group border border-gray-100">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-2xl text-sky-600">
            <i class="fa-brands fa-paypal"></i>
          </div>
          <div>
            <p class="font-bold text-slate-800">PayPal</p>
            <p class="text-sm text-gray-500">{{ savedPayPal.email }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="connectPayPal" class="w-10 h-10 rounded-full hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition flex items-center justify-center">
            <i class="fa-solid fa-arrows-rotate"></i>
          </button>
          <button @click="removePayPal" class="w-10 h-10 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition flex items-center justify-center">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <div v-if="!savedCard && !savedPayPal" class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
        <i class="fa-regular fa-credit-card text-2xl"></i>
      </div>
      <p class="text-gray-500 font-medium">Aun no tienes metodos guardados.</p>
    </div>
  </div>

  <div v-if="showCardFormModal" class="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 fade-in">
    <div class="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
      <button class="absolute top-4 right-4 text-gray-400 hover:text-black" @click="closeCardForm">
        <i class="fa-solid fa-xmark text-xl"></i>
      </button>
      <div class="flex items-center gap-2 mb-6">
        <h3 class="text-xl font-bold text-slate-900">{{ cardFormTitle }}</h3>
      </div>
      <form class="space-y-6" @submit="saveCardInfo">
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">Numero de Tarjeta</label>
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
          <input
            v-model="cardForm.name"
            type="text"
            placeholder="EJ. JUAN PEREZ"
            class="input-field border-2 border-gray-200 focus:border-slate-800 focus:ring-4 focus:ring-slate-800/10 font-bold uppercase"
            required
          />
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
