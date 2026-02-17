<script setup>
import { ref, reactive } from 'vue';

// IMPORTANTE: Asegúrate de que tienes el archivo api.js en la carpeta src/js/
// Si tu estructura es diferente, ajusta esta ruta.
import { api } from '@/js/api.js';



// --- ESTADO ---
const isRegisterActive = ref(false); // False = Muestra Login, True = Muestra Registro
const loginError = ref('');
const regError = ref('');

// Datos del formulario de Login
const loginForm = reactive({
  email: '',
  password: ''
});

// Datos del formulario de Registro
const registerForm = reactive({
  email: '',
  name: '',
  password: '',
  confirmPassword: ''
});

// --- MÉTODOS ---

// Alternar entre Login y Registro (Animación del Slider)
const toggleView = (showRegister) => {
  isRegisterActive.value = showRegister;
  // Limpiar mensajes de error al cambiar de vista
  loginError.value = '';
  regError.value = '';
};

// Lógica de Login
const handleLogin = async () => {
  loginError.value = '';

  if (!loginForm.email || !loginForm.password) {
    loginError.value = 'Por favor completa todos los campos.';
    return;
  }

  try {
    console.log('Intentando login con:', loginForm.email);
    
    // LLAMADA REAL AL BACKEND
    const response = await api.login(loginForm.email, loginForm.password);

    if (response.token) {
      // Guardar sesión en el navegador
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      alert('Login exitoso! Redirigiendo...');
      
      // Redirección. Si usas Vue Router, cámbialo por: router.push('/franquicias')
      window.location.href = './components/Proyecto/index.vue'; 
    }
  } catch (error) {
    console.error(error);
    loginError.value = error.message || 'Error al iniciar sesión';
  }
};

// Lógica de Registro
const handleRegister = async () => {
  regError.value = '';

  // Validaciones básicas
  if (!registerForm.email || !registerForm.name || !registerForm.password || !registerForm.confirmPassword) {
    regError.value = 'Todos los campos son obligatorios.';
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    regError.value = 'Las contraseñas no coinciden.';
    return;
  }

  try {
    // Preparamos el objeto JSON con las claves en español que espera el Backend
    const userData = {
      nombre: registerForm.name,
      correo: registerForm.email,
      contrasena: registerForm.password
    };

    console.log('Enviando Registro:', userData);
    
    // LLAMADA REAL AL BACKEND
    await api.register(userData);

    alert('Registro exitoso! Por favor inicia sesión.');
    
    // Volver a la vista de Login automáticamente para que entre
    toggleView(false); 
    
  } catch (error) {
    console.error(error);
    regError.value = error.message || 'Error en el registro';
  }
};
</script>

<template>
  <div class="login-page-wrapper">
    
    <div class="background-animation"></div>

    <div class="card" :class="{ 'active-register': isRegisterActive }">

      <div class="header">
        <div class="logo-box"><i class="fa-solid fa-utensils"></i></div>
        <div class="brand-name">FoodRush</div>
      </div>

      <div class="forms-wrapper">

        <div class="panel left-panel">
          <h2>Inicio Sesion</h2>
          <form @submit.prevent="handleLogin">
            <label>Usuario/@Gmail</label>
            <input type="text" v-model="loginForm.email" placeholder="Usuario / @Gmail">
            
            <label>Contraseña</label>
            <input type="password" v-model="loginForm.password" placeholder="Contraseña">
            
            <button type="submit" class="btn-action">Ingresar</button>
            
            <div v-if="loginError" class="error-msg">
              {{ loginError }}
            </div>
          </form>

          <div class="separator"><span>o</span></div>

          <a href="#" class="social-btn"><i class="fa-brands fa-google"></i> Continuar con Google</a>
          <a href="./components/Proyecto/index.vue" class="social-btn"><i class="fa-brands fa-apple"></i> Continuar con Apple</a>

          <div class="switch-link">
            ¿No estas registrado? 
            <a @click.prevent="toggleView(true)">Registrarse</a>
          </div>
        </div>

        <div class="panel right-panel">
          <h2>Registro Cliente</h2>
          <form @submit.prevent="handleRegister">
            <label>Correo Electrónico</label>
            <input type="email" v-model="registerForm.email" placeholder="correo@ejemplo.com">

            <label>Nombre completo</label>
            <input type="text" v-model="registerForm.name" placeholder="Tu nombre">

            <label>Contraseña</label>
            <input type="password" v-model="registerForm.password" placeholder="******">

            <label>Confirmar Contraseña</label>
            <input type="password" v-model="registerForm.confirmPassword" placeholder="******">

            <button type="submit" class="btn-action">Registrar</button>
            
            <div v-if="regError" class="error-msg">
              {{ regError }}
            </div>
          </form>

          <div class="switch-link">
            ¿Ya tienes cuenta? 
            <a @click.prevent="toggleView(false)">Iniciar Sesión</a>
          </div>
        </div>

        <div class="overlay-slider"></div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Importación de fuentes y estilos externos */
@import url('https://fonts.googleapis.com/css2?family=Titan+One&family=Roboto:wght@400;500;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* Estilos Generales */
.login-page-wrapper {
  font-family: 'Roboto', sans-serif;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: #e0e0e0;
  position: relative;
}

/* --- FONDO ANIMADO --- */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  background-image: url('https://img.freepik.com/free-vector/fast-food-seamless-pattern-vector-junk-food-design_53876-160459.jpg');
  background-size: 400px;
  opacity: 0.15;
  z-index: 1; 
  animation: moveBackground 60s linear infinite;
  pointer-events: none;
}

@keyframes moveBackground {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-200px, -200px); }
}

/* --- TARJETA PRINCIPAL --- */
.card {
  background: white;
  width: 900px;
  max-width: 95%;
  height: 600px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 10; 
}

/* --- HEADER AMARILLO --- */
.header {
  background-color: #FDD835;
  padding: 15px 40px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 20;
  height: 80px;
}

.logo-box {
  background: white;
  padding: 5px;
  border-radius: 8px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 1px solid #ddd;
}

.logo-box i {
  font-size: 24px;
  color: #C62828;
}

.brand-name {
  font-family: 'Titan One', cursive;
  font-size: 32px;
  color: #C62828;
  letter-spacing: 1px;
}

/* --- CONTENIDO DE LOS FORMULARIOS --- */
.forms-wrapper {
  display: flex;
  height: calc(100% - 80px);
  position: relative;
}

.panel {
  flex: 1;
  padding: 20px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: opacity 0.5s ease-in-out;
}

/* Estilos de Inputs y Textos */
h2 {
  font-family: 'Titan One', cursive;
  color: #C62828;
  font-size: 28px;
  margin-bottom: 15px;
}

label {
  font-weight: bold;
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #aaa;
  border-radius: 5px;
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: #C62828;
}

.btn-action {
  width: 100%;
  background-color: #C62828;
  color: white;
  border: none;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 5px;
  box-shadow: 0 4px 0 #8E1C1C;
}

.btn-action:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8E1C1C;
}

.error-msg {
  color: red;
  font-size: 0.75rem; 
  margin-top: 0.5rem;
  font-weight: bold;
}

/* Botones Sociales y Links */
.separator {
  display: flex;
  align-items: center;
  margin: 10px 0;
  color: #777;
  font-size: 12px;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px dashed #ccc;
}

.separator span {
  padding: 0 10px;
}

.social-btn {
  width: 100%;
  padding: 8px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  color: #333;
  text-decoration: none;
}

.social-btn i {
  margin-right: 10px;
  font-size: 16px;
}

.fa-google { color: #DB4437; }
.fa-apple { color: black; }

.switch-link {
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
}

.switch-link a {
  color: #2ECC71;
  text-decoration: none;
  font-weight: bold;
  cursor: pointer;
}

.switch-link a:hover {
  text-decoration: underline;
}

/* --- LOGICA DEL SLIDER (EL CUADRO GRIS) --- */
.overlay-slider {
  position: absolute;
  top: 0;
  left: 50%; /* Por defecto empieza tapando la derecha */
  width: 50%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10;
  transition: transform 0.6s ease-in-out;
  pointer-events: auto; 
}

/* CLASE ACTIVA: Mueve el gris a la izquierda cuando Vue activa 'isRegisterActive' */
.card.active-register .overlay-slider {
  transform: translateX(-100%); 
}
</style>