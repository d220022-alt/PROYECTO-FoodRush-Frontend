<script setup>
import { ref } from 'vue';
import { api } from '../services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

// State for Animation
const isRegisterActive = ref(false);

// Form State
const loginForm = ref({ email: '', password: '' });
const registerForm = ref({ email: '', name: '', phone: '', password: '', confirmPassword: '', address: '', zone: '' });

const loginError = ref('');
const registerError = ref('');
const isSubmitting = ref(false);

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

const togglePanel = (active) => {
    isRegisterActive.value = active; // true = show register (slide left), false = show login
    loginError.value = '';
    registerError.value = '';
};

const handleLogin = async () => {
    loginError.value = '';
    const { email, password } = loginForm.value;

    if (!email || !password) {
        loginError.value = 'Por favor, ingresa correo y contraseña.';
        return;
    }

    if (!validateEmail(email)) {
        loginError.value = 'Ingresa un correo electrónico válido.';
        return;
    }

    isSubmitting.value = true;

    try {
        const response = await api.login(email, password);
        if (response.success) {
            localStorage.setItem('auth_token', response.token);
            localStorage.setItem('user_id', response.user.id);
            localStorage.setItem('user_name', response.user.nombre);
            localStorage.setItem('user_email', response.user.correo);
            if (response.user.telefono) localStorage.setItem('user_phone', response.user.telefono);
            
            // Store address/zone if available
            if (response.user.direccion) localStorage.setItem('user_address', response.user.direccion);
            if (response.user.zona) localStorage.setItem('user_zone', response.user.zona);

            router.push('/');
        } else {
            loginError.value = response.message || 'Error al iniciar sesión';
        }
    } catch (err) {
        console.error(err);
        loginError.value = err.message || 'Error de conexión';
    } finally {
        isSubmitting.value = false;
    }
};
const handleRegister = async () => {
    registerError.value = '';
    const { email, name, phone, password, confirmPassword, address, zone } = registerForm.value;

    if (!email || !name || !phone || !password || !confirmPassword || !address || !zone) {
        registerError.value = 'Completa todos los campos, incluyendo dirección y zona.';
        return;
    }
    if (!validateEmail(email)) {
        registerError.value = 'Ingresa un correo electrónico válido.';
        return;
    }
    if (password.length < 6) {
        registerError.value = 'La contraseña debe tener al menos 6 caracteres.';
        return;
    }
    if (password !== confirmPassword) {
        registerError.value = 'Las contraseñas no coinciden.';
        return;
    }

    isSubmitting.value = true;

    try {
        await api.register({ email, name, phone, password, direccion: address, zona: zone });
        alert('Registro exitoso. Inicia sesión.');
        togglePanel(false); // Switch to login
        loginForm.value.email = email;
    } catch (err) {
        registerError.value = err.message || 'Error al registrar';
    } finally {
        isSubmitting.value = false;
    }
};

</script>

<template>
  <div class="login-body">
    <div class="background-animation"></div>

    <div class="card" :class="{ 'active-register': isRegisterActive }">
        
        <div class="header">
            <div class="logo-box"><i class="fa-solid fa-utensils"></i></div>
            <div class="brand-name">FoodRush</div>
        </div>

        <div class="forms-wrapper">
            
            <!-- LOGIN PANEL (LEFT) -->
            <div class="panel left-panel">
                <h2>Iniciar Sesión</h2>
                <form @submit.prevent="handleLogin">
                    <label for="login-email">Usuario o Correo</label>
                    <input id="login-email" v-model="loginForm.email" type="text" placeholder="Usuario o Correo Electrónico" aria-required="true">
                    <label for="login-password">Contraseña</label>
                    <input id="login-password" v-model="loginForm.password" type="password" placeholder="Contraseña" aria-required="true">
                    <button type="submit" class="btn-action" :disabled="isSubmitting">
                        {{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}
                    </button>
                    <div v-if="loginError" class="text-red-600 text-xs mt-2 font-bold" role="alert">{{ loginError }}</div>
                </form>

                <div class="separator"><span>o</span></div>
                <a class="social-btn"><i class="fa-brands fa-google"></i> Continuar con Google</a>
                <div class="switch-link">
                    ¿No estás registrado? <a @click="togglePanel(true)">Regístrate</a>
                </div>
            </div>

            <!-- REGISTER PANEL (RIGHT) -->
            <div class="panel right-panel">
                <h2>Registro de Cliente</h2>
                <form @submit.prevent="handleRegister">
                    <label for="reg-email">Correo Electrónico</label>
                    <input id="reg-email" v-model="registerForm.email" type="email" placeholder="correo@ejemplo.com" aria-required="true">
                    
                    <label for="reg-name">Nombre completo</label>
                    <input id="reg-name" v-model="registerForm.name" type="text" placeholder="Tu nombre" aria-required="true">
                    
                    <label for="reg-phone">Teléfono</label>
                    <input id="reg-phone" v-model="registerForm.phone" type="tel" placeholder="809-000-0000" aria-required="true">
                    
                    <label for="reg-password">Contraseña</label>
                    <input id="reg-password" v-model="registerForm.password" type="password" placeholder="Mínimo 6 caracteres" aria-required="true">
                    
                    <label for="reg-confirm">Confirmar Contraseña</label>
                    <input id="reg-confirm" v-model="registerForm.confirmPassword" type="password" placeholder="Repite tu contraseña" aria-required="true">
                    
                    <label for="reg-address">Dirección de Entrega</label>
                    <input id="reg-address" v-model="registerForm.address" type="text" placeholder="Calle, Número, Sector" aria-required="true">
                    
                    <label for="reg-zone">Zona de Entrega</label>
                    <select id="reg-zone" v-model="registerForm.zone" class="w-full padding-8 border rounded margin-bottom-10 outline-none p-2 mb-2 border-gray-300" aria-required="true">
                        <option value="" disabled>Selecciona tu zona</option>
                        <option value="pekin">Pekín ($25)</option>
                        <option value="gurabo">Gurabo ($50)</option>
                        <option value="villa_olga">Villa Olga ($75)</option>
                    </select>

                    <button type="submit" class="btn-action" :disabled="isSubmitting">
                        {{ isSubmitting ? 'Registrando...' : 'Registrar' }}
                    </button>
                    <div v-if="registerError" class="text-red-600 text-xs mt-2 font-bold" role="alert">{{ registerError }}</div>
                </form>

                <div class="switch-link">
                    ¿Ya tienes cuenta? <a @click="togglePanel(false)">Iniciar Sesión</a>
                </div>
            </div>

            <!-- SLIDING OVERLAY -->
            <!-- The overlay is just a visual block. In the Vue version, we toggle the class on the parent -->
            <div class="overlay-slider"></div>

        </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles to simulate the previous isolated login.html body */
.login-body {
    font-family: 'Roboto', sans-serif;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #e0e0e0;
    position: relative;
    width: 100vw;
}

.background-animation {
    position: absolute;
    top: 0; left: 0;
    width: 200%; height: 200%;
    background-image: url('https://img.freepik.com/free-vector/fast-food-seamless-pattern-vector-junk-food-design_53876-160459.jpg');
    background-size: 400px;
    opacity: 0.15;
    z-index: 1;
    animation: moveBackground 60s linear infinite;
}

@keyframes moveBackground {
    0% { transform: translate(0, 0); }
    100% { transform: translate(-200px, -200px); }
}

.card {
    background: white;
    width: 900px; max-width: 95%; height: 750px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    overflow: hidden;
    position: relative;
    z-index: 10;
}

.header {
    background-color: #FDD835;
    padding: 15px 40px;
    display: flex; align-items: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    position: relative;
    z-index: 20; height: 80px;
}

.logo-box {
    background: white; padding: 5px; border-radius: 8px; margin-right: 15px;
    display: flex; align-items: center; justify-content: center;
    width: 50px; height: 50px; border: 1px solid #ddd;
}
.logo-box i { font-size: 24px; color: #C62828; }

.brand-name {
    font-family: 'Titan One', cursive; font-size: 32px; color: #C62828; letter-spacing: 1px;
}

.forms-wrapper {
    display: flex; height: calc(100% - 80px); position: relative;
}

.panel {
    flex: 1; padding: 20px 50px;
    display: flex; flex-direction: column; justify-content: center;
    transition: opacity 0.5s ease-in-out;
}

h2 { font-family: 'Titan One', cursive; color: #C62828; font-size: 28px; margin-bottom: 15px; }
label { font-weight: bold; font-size: 13px; color: #333; margin-bottom: 4px; display: block; }
input { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #aaa; border-radius: 5px; font-size: 14px; outline: none; }
input:focus { border-color: #C62828; }

.btn-action {
    width: 100%; background-color: #C62828; color: white; border: none;
    padding: 10px; font-size: 16px; font-weight: bold; border-radius: 8px;
    cursor: pointer; margin-top: 5px; box-shadow: 0 4px 0 #8E1C1C;
    transition: all 0.2s ease;
}
.btn-action:disabled {
    background-color: #e0e0e0;
    color: #999;
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
}
.btn-action:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 2px 0 #8E1C1C; }

.separator { display: flex; align-items: center; margin: 10px 0; color: #777; font-size: 12px; }
.separator::before, .separator::after { content: ''; flex: 1; border-bottom: 1px dashed #ccc; }
.separator span { padding: 0 10px; }

.social-btn {
    width: 100%; padding: 8px; margin-bottom: 8px;
    background: white; border: 1px solid #ccc; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-weight: bold; font-size: 13px; color: #333;
    text-decoration: none;
}
.social-btn i { margin-right: 10px; font-size: 16px; color: #DB4437; }

.switch-link { text-align: center; margin-top: 10px; font-size: 13px; }
.switch-link a { color: #2ECC71; font-weight: bold; cursor: pointer; }
.switch-link a:hover { text-decoration: underline; }

.overlay-slider {
    position: absolute; top: 0; left: 50%; width: 50%; height: 100%;
    background: rgba(0,0,0,0.6); z-index: 10;
    transition: transform 0.6s ease-in-out; pointer-events: none;
    /* In the original HTML, pointers events were auto, but here we likely want it to be none or handle it carefully */
}

/* Logic for slider */
.card.active-register .overlay-slider { transform: translateX(-100%); }
</style>
