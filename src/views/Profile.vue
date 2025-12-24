<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';

const router = useRouter();

// State
const user = ref({
    name: localStorage.getItem('user_name') || "Invitado",
    email: localStorage.getItem('user_email') || "No registrado",
    address: "Sin dirección registrada",
    avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    phone: localStorage.getItem('user_phone') || ""
});

onMounted(async () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        try {
            const response = await api.getUser(userId);
            if (response.success && response.data) {
                const userData = response.data;
                user.value.name = userData.nombre;
                user.value.email = userData.correo;
                user.value.phone = userData.telefono || "";
                user.value.address = userData.direccion || localStorage.getItem('user_address') || "Sin dirección registrada";
                if (userData.zona) localStorage.setItem('user_zone', userData.zona);
            }
        } catch (e) {
            console.error("Error fetching profile", e);
        }
    }
});

// Navigation Handlers
const goBack = () => router.go(-1);
const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    router.push('/login');
};

// Menu Sections
const menuItems = [
    { title: "Mis Favoritos", icon: "fa-solid fa-heart", route: "/favorites" },
    { title: "Métodos de Pago", icon: "fa-regular fa-credit-card", route: "/payment-methods" },
    { title: "Historial de Pedidos", icon: "fa-solid fa-receipt", route: "/orders" },
    { title: "Cambiar Contraseña", icon: "fa-solid fa-lock", route: "/change-password" },
    { title: "Notificaciones", icon: "fa-regular fa-bell", route: "/notifications" },
    { title: "Ayuda y Soporte", icon: "fa-regular fa-circle-question", route: "/support" }
];

const handleNavigation = (item) => {
    if (item.route) {
        router.push(item.route);
    }
};

// Edit Modal
const isEditModalOpen = ref(false);
const editForm = ref({ name: '', phone: '', address: '', zone: '' });

const openEditModal = () => {
    editForm.value = {
        name: user.value.name,
        email: user.value.email,
        phone: user.value.phone,
        address: user.value.address !== "Sin dirección registrada" ? user.value.address : '',
        zone: localStorage.getItem('user_zone') || ''
    };
    isEditModalOpen.value = true;
};

const closeEditModal = () => isEditModalOpen.value = false;

const saveProfile = async () => {
    try {
        const userId = localStorage.getItem('user_id');
        const updates = {
            nombre: editForm.value.name,
            telefono: editForm.value.phone,
            direccion: editForm.value.address,
            zona: editForm.value.zone
        };

        if (userId) {
            await api.updateUser(userId, updates);
        }

        // Update Local State & Storage
        user.value.name = editForm.value.name;
        user.value.phone = editForm.value.phone;
        user.value.address = editForm.value.address;
        
        localStorage.setItem('user_name', editForm.value.name);
        localStorage.setItem('user_phone', editForm.value.phone);
        localStorage.setItem('user_address', editForm.value.address);
        localStorage.setItem('user_zone', editForm.value.zone);

        closeEditModal();
        // Optional: Swal success
    } catch (e) {
        console.error("Error updating profile", e);
        alert("Error al actualizar perfil");
    }
};
</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans pb-10">
    <!-- Header -->
    <header class="p-6 flex items-center bg-[#F5F5F5]">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Mi Perfil</h1>
        <div class="w-8"></div> <!-- Spacer for center alignment -->
    </header>

    <!-- Profile Info -->
    <div class="flex flex-col items-center mb-8">
        <div class="relative mb-4">
            <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-tr from-orange-400 to-yellow-300 p-0.5">
                <img :src="user.avatar" class="w-full h-full object-cover bg-white rounded-full">
            </div>
            <button class="absolute bottom-0 right-0 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <i class="fa-solid fa-camera text-xs"></i>
            </button>
        </div>
        <h2 class="text-xl font-bold text-slate-900">{{ user.name }}</h2>
        <p class="text-sm text-gray-500">{{ user.email }}</p>
    </div>

    <div class="px-6 max-w-lg mx-auto space-y-6">
        
        <!-- Personal Info Section -->
        <div>
            <div class="flex justify-between items-center mb-3 px-1">
                <h3 class="font-bold text-lg text-slate-800">Información Personal</h3>
                <button @click="openEditModal" class="text-red-500 text-sm font-semibold flex items-center gap-1 hover:underline">
                    <i class="fa-solid fa-pen text-xs"></i> Editar
                </button>
            </div>
            
            <div class="bg-white rounded-3xl p-4 shadow-sm space-y-4">
                <!-- Name -->
                <div class="flex items-center gap-4 p-2">
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                        <i class="fa-regular fa-user"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs text-gray-400">Nombre Completo</p>
                        <p class="font-semibold text-slate-800 text-sm truncate">{{ user.name }}</p>
                    </div>
                </div>
                <hr class="border-gray-50 mx-14">
                <!-- Phone -->
                <div class="flex items-center gap-4 p-2">
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                        <i class="fa-solid fa-phone"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs text-gray-400">Teléfono</p>
                        <p class="font-semibold text-slate-800 text-sm truncate">{{ user.phone || 'Sin registrar' }}</p>
                    </div>
                </div>
                <hr class="border-gray-50 mx-14">
                <!-- Email -->
                <div class="flex items-center gap-4 p-2">
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                        <i class="fa-regular fa-envelope"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs text-gray-400">Email</p>
                        <p class="font-semibold text-slate-800 text-sm truncate">{{ user.email }}</p>
                    </div>
                </div>
                <hr class="border-gray-50 mx-14">
                <!-- Address -->
                <div class="flex items-center gap-4 p-2">
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                        <i class="fa-solid fa-house"></i>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-xs text-gray-400">Dirección</p>
                        <p class="font-semibold text-slate-800 text-sm truncate">{{ user.address }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagos y Pedidos -->
        <div>
             <h3 class="font-bold text-lg text-slate-800 mb-3 px-1">Pagos y Pedidos</h3>
             <div class="bg-white rounded-3xl overflow-hidden shadow-sm">
                 <button v-for="(item, idx) in menuItems.slice(0, 3)" :key="idx" @click="handleNavigation(item)" class="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition border-b last:border-0 border-gray-100">
                     <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                             <i :class="item.icon"></i>
                         </div>
                         <span class="font-semibold text-slate-700 text-sm">{{ item.title }}</span>
                     </div>
                     <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
                 </button>
             </div>
        </div>

        <!-- Configuración -->
        <div>
             <h3 class="font-bold text-lg text-slate-800 mb-3 px-1">Configuración</h3>
             <div class="bg-white rounded-3xl overflow-hidden shadow-sm">
                 <button v-for="(item, idx) in menuItems.slice(3)" :key="idx" @click="handleNavigation(item)" class="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition border-b last:border-0 border-gray-100">
                     <div class="flex items-center gap-4">
                         <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-slate-800 text-lg">
                             <i :class="item.icon"></i>
                         </div>
                         <span class="font-semibold text-slate-700 text-sm">{{ item.title }}</span>
                     </div>
                     <i class="fa-solid fa-chevron-right text-gray-400 text-xs"></i>
                 </button>
             </div>
        </div>

        <!-- Logout Button -->
        <button @click="handleLogout" class="w-full bg-white rounded-full py-4 text-red-500 font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 transition">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar Sesión
        </button>

    </div>

    <!-- Edit Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 fade-in">
        <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button @click="closeEditModal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                <i class="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 class="text-2xl font-bold text-slate-800 mb-6">Editar Perfil</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input v-model="editForm.name" type="text" class="w-full border rounded-lg p-3 outline-none focus:border-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input v-model="editForm.email" type="email" class="w-full border rounded-lg p-3 outline-none focus:border-orange-500 text-gray-500 bg-gray-50 cursor-not-allowed" readonly>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                    <input v-model="editForm.phone" type="text" class="w-full border rounded-lg p-3 outline-none focus:border-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
                    <input v-model="editForm.address" type="text" class="w-full border rounded-lg p-3 outline-none focus:border-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Zona de Entrega</label>
                    <select v-model="editForm.zone" class="w-full border rounded-lg p-3 outline-none focus:border-orange-500">
                        <option value="" disabled>Selecciona tu zona</option>
                        <option value="centro">Zona 1 - Centro ($150)</option>
                        <option value="periferia">Zona 2 - Periferia ($250)</option>
                        <option value="lejos">Zona 3 - Lejos ($350)</option>
                    </select>
                </div>
                <button @click="saveProfile" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-lg mt-2">
                    Guardar Cambios
                </button>
            </div>
        </div>
    </div>

</div>
</template>
