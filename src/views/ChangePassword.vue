<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '../services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const goBack = () => router.go(-1);

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const isValid = computed(() => {
    return currentPassword.value && newPassword.value && newPassword.value === confirmPassword.value;
});

const updatePassword = async () => {
    if (!isValid.value) return;
    
    isLoading.value = true;
    const userId = localStorage.getItem('user_id');

    // Manually fetch method since it's a new custom endpoint
    try {
        const response = await fetch(`http://localhost:3000/api/usuarios/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': '123' // Hardcoded for now or get from localStorage if available
            },
            body: JSON.stringify({
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
            })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Contraseña Actualizada',
                text: 'Tu contraseña ha sido cambiada exitosamente.',
                timer: 2000,
                showConfirmButton: false
            });
            setTimeout(() => goBack(), 2000);
        } else {
            throw new Error(data.message || 'Error al actualizar contraseña');
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: e.message
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
<div class="min-h-screen bg-[#F5F5F5] font-sans">
    <header class="p-6 flex items-center bg-[#F5F5F5] sticky top-0 z-10">
        <button @click="goBack" class="text-2xl text-slate-800 hover:text-orange-500 transition">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1 class="flex-1 text-center text-xl font-bold text-slate-800">Cambiar Contraseña</h1>
        <div class="w-8"></div>
    </header>

    <div class="px-6 pb-10 max-w-lg mx-auto">
        <div class="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            
            <!-- Current Password -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                <div class="relative">
                    <input v-model="currentPassword" type="password" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition">
                    <i class="fa-solid fa-lock absolute right-4 top-3.5 text-gray-400"></i>
                </div>
            </div>

            <hr class="border-gray-100">

            <!-- New Password -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <div class="relative">
                    <input v-model="newPassword" type="password" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition">
                    <i class="fa-solid fa-key absolute right-4 top-3.5 text-gray-400"></i>
                </div>
            </div>

            <!-- Confirm Password -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                <div class="relative">
                    <input v-model="confirmPassword" type="password" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition">
                    <i class="fa-solid fa-check-double absolute right-4 top-3.5 text-gray-400"></i>
                </div>
                <p v-if="newPassword && confirmPassword && newPassword !== confirmPassword" class="text-xs text-red-500 mt-1 pl-1">Las contraseñas no coinciden.</p>
            </div>

            <button @click="updatePassword" :disabled="!isValid || isLoading" class="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span v-if="isLoading"><i class="fa-solid fa-spinner fa-spin"></i> Actualizando...</span>
                <span v-else>Actualizar Contraseña</span>
            </button>

        </div>
    </div>
</div>
</template>
