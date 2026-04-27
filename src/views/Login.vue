<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
import { useRouter } from 'vue-router';
import { setSessionFromAuth } from '../services/storage';

const router = useRouter();

// State for Animation
const isRegisterActive = ref(false);

// Form State
const loginForm = ref({ email: '', password: '' });
const registerForm = ref({ email: '', name: '', phone: '', password: '', confirmPassword: '', address: '', zone: '' });
const termsAccepted = ref(false);

const loginError = ref('');
const registerError = ref('');
const isSubmitting = ref(false);

const goToTerms = () => {
    localStorage.setItem('register_draft', JSON.stringify({
        ...registerForm.value,
        termsChecked: termsAccepted.value
    }));
    router.push('/terms');
};

onMounted(() => {
    const savedForm = localStorage.getItem('register_draft');
    if (savedForm) {
        try {
            const data = JSON.parse(savedForm);
            
            registerForm.value.email = data.email || '';
            registerForm.value.name = data.name || '';
            registerForm.value.phone = data.phone || '';
            registerForm.value.password = data.password || '';
            registerForm.value.confirmPassword = data.confirmPassword || '';
            registerForm.value.address = data.address || '';
            registerForm.value.zone = data.zone || '';

            if (data.termsChecked) {
                termsAccepted.value = true;
            }

            isRegisterActive.value = true;
        } catch (e) {}
    }
    
    if (localStorage.getItem('terms_accepted') === 'true') {
        termsAccepted.value = true;
    }
});

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
};

const togglePanel = (active) => {
    isRegisterActive.value = active; 
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
            setSessionFromAuth({ ...response, email, userEmail: email });
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
    if (!termsAccepted.value) {
        registerError.value = 'Debes aceptar los términos y condiciones para registrarte.';
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
        const registerRes = await api.register({ email, name, phone, password, direccion: address, zona: zone });

        if (registerRes?.success && registerRes?.user && registerRes?.token) {
            localStorage.removeItem('register_draft');
            setSessionFromAuth({ ...registerRes, email, userEmail: email });
            router.push('/');
            return;
        }

        const loginRes = await api.login(email, password);
        if (loginRes.success) {
            localStorage.removeItem('register_draft');
            setSessionFromAuth({ ...loginRes, email, userEmail: email });
            router.push('/');
        } else {
            alert('Registro exitoso. Por favor inicia sesión.');
            togglePanel(false);
            loginForm.value.email = email;
        }
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
        
        <div class="header" @click="router.push('/')" style="cursor: pointer;" title="Volver al inicio">
            <div class="flex items-center space-x-2 group">
                <i class="fas fa-bolt text-3xl electric-blink logo-icon"></i>
                <span class="brand-name">
                    FOOD<span class="text-primary">RUSH</span>
                </span>
            </div>
        </div>

        <div class="forms-wrapper">
            
            <div class="panel left-panel">
                <div class="panel-content">
                    <h2>¡Bienvenido de nuevo!</h2>
                    <p class="subtitle">Ingresa para pedir tu comida favorita</p>
                    
                    <form @submit.prevent="handleLogin">
                        <div class="input-group">
                            <label for="login-email">Usuario o Correo</label>
                            <input id="login-email" v-model="loginForm.email" type="text" placeholder="ejemplo@correo.com" aria-required="true">
                        </div>
                        
                        <div class="input-group">
                            <label for="login-password">Contraseña</label>
                            <input id="login-password" v-model="loginForm.password" type="password" placeholder="••••••••" aria-required="true">
                        </div>

                        <button type="submit" class="btn-action" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}
                        </button>
                        <div v-if="loginError" class="error-msg-global" role="alert">{{ loginError }}</div>
                    </form>

                    <div class="separator"><span>o</span></div>
                    
                    <button class="social-btn">
                        <i class="fa-brands fa-google"></i> Continuar con Google
                    </button>
                    
                    <div class="switch-link">
                        ¿No tienes una cuenta? <a @click="togglePanel(true)">Regístrate aquí</a>
                    </div>
                </div>
            </div>

            <div class="panel right-panel">
                <div class="panel-content scrollable">
                    <h2>Crea tu cuenta</h2>
                    <p class="subtitle">Únete a FoodRush y disfruta sin límites</p>
                    
                    <form @submit.prevent="handleRegister">
                        <div class="input-group">
                            <label for="reg-name">Nombre completo</label>
                            <input id="reg-name" v-model="registerForm.name" type="text" placeholder="Tu nombre" aria-required="true">
                        </div>

                        <div class="input-row">
                            <div class="input-group">
                                <label for="reg-email">Correo Electrónico</label>
                                <input id="reg-email" v-model="registerForm.email" type="email" placeholder="correo@ejemplo.com" aria-required="true">
                            </div>
                            <div class="input-group">
                                <label for="reg-phone">Teléfono</label>
                                <input id="reg-phone" v-model="registerForm.phone" type="tel" placeholder="809-000-0000" aria-required="true">
                            </div>
                        </div>
                        
                        <div class="input-row">
                            <div class="input-group">
                                <label for="reg-password">Contraseña</label>
                                <input id="reg-password" v-model.trim="registerForm.password" type="password" placeholder="Mínimo 6 caracteres" aria-required="true"
                                       :class="{ 'invalid-input': registerForm.password && registerForm.password.length < 6 }">
                                <span v-if="registerForm.password && registerForm.password.length < 6" class="error-msg">Mínimo 6 caracteres.</span>
                            </div>
                            <div class="input-group">
                                <label for="reg-confirm">Confirmar Contraseña</label>
                                <input id="reg-confirm" v-model.trim="registerForm.confirmPassword" type="password" placeholder="Repite tu contraseña" aria-required="true"
                                       :class="{ 'invalid-input': registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword }">
                                <span v-if="registerForm.confirmPassword && registerForm.password !== registerForm.confirmPassword" class="error-msg">No coinciden.</span>
                            </div>
                        </div>
                        
                        <div class="input-row">
                            <div class="input-group flex-2">
                                <label for="reg-address">Dirección de Entrega</label>
                                <input id="reg-address" v-model.trim="registerForm.address" type="text" placeholder="Calle, Número, Sector" aria-required="true">
                            </div>
                            <div class="input-group flex-1">
                                <label for="reg-zone">Zona</label>
                                <select id="reg-zone" v-model="registerForm.zone" aria-required="true">
                                    <option value="" disabled selected>Selecciona</option>
                                    <option value="pekin">Pekín ($25)</option>
                                    <option value="gurabo">Gurabo ($50)</option>
                                    <option value="villa_olga">Villa Olga ($75)</option>
                                </select>
                            </div>
                        </div>

                        <div class="checkbox-group" style="margin-top:10px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                            <input id="reg-terms" type="checkbox" v-model="termsAccepted" style="width:16px; height:16px; cursor:pointer;" aria-required="true">
                            <label for="reg-terms" style="margin:0; cursor:pointer;">Acepto los <a @click.prevent="goToTerms" style="color:#D90429; font-weight:800; text-decoration:underline;">Términos y Condiciones</a></label>
                        </div>

                        <button type="submit" class="btn-action" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Registrando...' : 'Completar Registro' }}
                        </button>
                        <div v-if="registerError" class="error-msg-global" role="alert">{{ registerError }}</div>
                    </form>

                    <div class="switch-link">
                        ¿Ya tienes cuenta? <a @click="togglePanel(false)">Inicia Sesión</a>
                    </div>
                </div>
            </div>

            <div class="overlay-slider">
                <div class="overlay-content overlay-left">
                    <i class="fa-solid fa-burger overlay-icon"></i>
                    <h3>¿Ya eres parte de la familia?</h3>
                    <p>Inicia sesión para seguir disfrutando de tus platillos favoritos.</p>
                </div>
                <div class="overlay-content overlay-right">
                    <i class="fa-solid fa-rocket overlay-icon"></i>
                    <h3>¿Hambre de algo nuevo?</h3>
                    <p>Regístrate y pide en los mejores restaurantes en minutos.</p>
                </div>
            </div>

        </div>
    </div>
  </div>
</template>

<style scoped>
/* --- VARIABLES Y FUENTES --- */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Titan+One&display=swap');

.login-body {
    font-family: 'Nunito', sans-serif;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #f4f7f6;
    position: relative;
    width: 100vw;
    color: #2d3436;
}

.text-primary { color: #D90429; }

/* Animación del rayo igual a la página principal */
@keyframes electric-blink {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px #D90429); }
    50% { opacity: 0.4; transform: scale(1.1); filter: drop-shadow(0 0 8px #F48C06); }
}
.electric-blink { animation: electric-blink 5s infinite ease-in-out; }

/* --- ANIMACIÓN DE FONDO --- */
.background-animation {
    position: absolute;
    top: 0; left: 0;
    width: 200%; height: 200%;
    background-image: url('https://img.freepik.com/free-vector/fast-food-seamless-pattern-vector-junk-food-design_53876-160459.jpg');
    background-size: 350px;
    opacity: 0.08;
    z-index: 1;
    animation: moveBackground 80s linear infinite;
}

@keyframes moveBackground {
    0% { transform: translate(0, 0); }
    100% { transform: translate(-350px, -350px); }
}

/* --- CONTENEDOR PRINCIPAL (TARJETA) --- */
.card {
    background: #ffffff;
    width: 1000px; 
    max-width: 95%; 
    height: 650px;
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
}

/* --- CABECERA (LOGO ANIMADO) --- */
.header {
    background-color: #ffffff;
    padding: 0 40px;
    display: flex; align-items: center; justify-content: center;
    border-bottom: 1px solid #edf2f7;
    position: relative;
    z-index: 20; height: 80px;
    flex-shrink: 0;
}

.logo-icon {
    color: #D90429;
    margin-right: 8px;
}

.brand-name {
    font-family: 'Titan One', cursive; font-size: 28px; color: #1a1a2e; letter-spacing: 0.5px;
}

/* --- FORMULARIOS --- */
.forms-wrapper {
    display: flex; 
    height: calc(100% - 80px); 
    position: relative;
}

.panel {
    flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    padding: 30px 50px;
    background: #ffffff;
}

.panel-content {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

.scrollable {
    overflow-y: auto;
    padding-right: 10px;
}
.scrollable::-webkit-scrollbar { width: 6px; }
.scrollable::-webkit-scrollbar-track { background: transparent; }
.scrollable::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

h2 { font-weight: 800; color: #1e293b; font-size: 26px; margin-bottom: 5px; }
.subtitle { color: #64748b; font-size: 14px; margin-bottom: 25px; }

/* --- INPUTS --- */
.input-group { margin-bottom: 15px; }
.input-row { display: flex; gap: 15px; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

label { font-weight: 700; font-size: 13px; color: #475569; margin-bottom: 6px; display: block; }

input, select { 
    width: 100%; padding: 12px 14px; 
    border: 1px solid #e2e8f0; border-radius: 10px; 
    font-size: 14px; font-family: 'Nunito', sans-serif;
    color: #334155; background-color: #f8fafc;
    transition: all 0.3s ease; outline: none; box-sizing: border-box;
}
input:focus, select:focus { 
    border-color: #D90429; background-color: #ffffff;
    box-shadow: 0 0 0 4px rgba(217, 4, 41, 0.1); 
}

.invalid-input { border-color: #D90429 !important; background-color: #fff1f2; }
.error-msg { color: #D90429; font-size: 12px; margin-top: 4px; display: block; font-weight: 700; }
.error-msg-global { color: #D90429; font-size: 13px; margin-top: 10px; text-align: center; font-weight: 700; background: #fff1f2; padding: 10px; border-radius: 8px; }

/* --- BOTONES --- */
.btn-action {
    width: 100%; background-color: #D90429; color: white; border: none;
    padding: 14px; font-size: 16px; font-weight: 800; border-radius: 10px;
    cursor: pointer; margin-top: 10px; 
    transition: all 0.2s ease;
}
.btn-action:hover { background-color: #b90322; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(217, 4, 41, 0.2); }
.btn-action:active { transform: translateY(1px); box-shadow: none; }
.btn-action:disabled { background-color: #cbd5e1; cursor: not-allowed; transform: none; box-shadow: none; }

.separator { display: flex; align-items: center; margin: 20px 0; color: #94a3b8; font-size: 12px; font-weight: 600;}
.separator::before, .separator::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
.separator span { padding: 0 15px; }

.social-btn {
    width: 100%; padding: 12px; margin-bottom: 15px;
    background: white; border: 1px solid #e2e8f0; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-weight: 700; font-size: 14px; color: #475569;
    transition: background 0.2s; font-family: 'Nunito', sans-serif;
}
.social-btn:hover { background: #f8fafc; }
.social-btn i { margin-right: 10px; font-size: 18px; color: #DB4437; }

/* --- LINKS INFERIORES --- */
.switch-link { text-align: center; margin-top: 15px; font-size: 14px; color: #64748b; font-weight: 600;}
.switch-link a { color: #D90429; font-weight: 800; cursor: pointer; transition: color 0.2s; }
.switch-link a:hover { color: #b90322; text-decoration: underline; }

/* --- OVERLAY MÁGICO --- */
.overlay-slider {
    position: absolute; top: 0; left: 50%; width: 50%; height: 100%;
    background: linear-gradient(135deg, #F48C06, #D90429);
    z-index: 10;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
    pointer-events: none;
    overflow: hidden;
}

.overlay-content {
    position: absolute; width: 100%; height: 100%;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    color: white; text-align: center; padding: 0 40px; box-sizing: border-box;
    transition: opacity 0.4s ease, transform 0.6s ease;
}

.overlay-icon { font-size: 60px; margin-bottom: 20px; opacity: 0.9; }
.overlay-content h3 { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
.overlay-content p { font-size: 15px; font-weight: 600; line-height: 1.5; opacity: 0.9; }

.overlay-left { opacity: 0; transform: translateX(-20%); }
.overlay-right { opacity: 1; transform: translateX(0); }

.card.active-register .overlay-slider { transform: translateX(-100%); }
.card.active-register .overlay-right { opacity: 0; transform: translateX(20%); }
.card.active-register .overlay-left { opacity: 1; transform: translateX(0); }

/* --- RESPONSIVIDAD (MÓVILES) --- */
@media (max-width: 768px) {
    .card { width: 90%; height: 85vh; border-radius: 16px; }
    .header { height: 70px; padding: 0 20px; }
    
    .overlay-slider { display: none; }
    
    .panel { padding: 20px; position: absolute; top: 0; left: 0; width: 100%; height: 100%; box-sizing: border-box; transition: opacity 0.4s ease, visibility 0.4s; }
    
    .left-panel { opacity: 1; visibility: visible; z-index: 5; }
    .right-panel { opacity: 0; visibility: hidden; z-index: 1; }
    
    .card.active-register .left-panel { opacity: 0; visibility: hidden; z-index: 1; }
    .card.active-register .right-panel { opacity: 1; visibility: visible; z-index: 5; }
    
    .input-row { flex-direction: column; gap: 0; }
}
</style>
