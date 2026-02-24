// Si tienes un archivo config.js, impórtalo así:
// import { CONFIG } from './config.js';

// Si NO tienes config.js migrado a Vue todavía, define la URL aquí temporalmente:
const CONFIG = {
    API_URL: 'https://proyecto-foodrush.onrender.com' // <--- CAMBIA ESTO POR LA URL DE TU BACKEND
};

export const api = {
    // Helper para manejar las respuestas
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_URL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
    

        try {
            const response = await fetch(url, config);
            
            // Intentamos parsear la respuesta aunque sea error para ver el mensaje
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Re-lanzar para manejarlo en la vista (Login.vue)
        }
    },

    // --- Endpoints ---

    // Obtener todas las franquicias
    async getFranchises() {
        return this.request('/franchises');
    },

    // Iniciar sesión
    async login(correo, contrasena) {
        // CORRECCIÓN IMPORTANTE: 
        // Cambié { email, password } por { correo, contrasena } 
        // para que coincida con lo que espera tu base de datos en español.
        return this.request('/api/usuarios/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    // Registrar usuario
    async register(userData) {
        return this.request('/api/usuarios', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
};