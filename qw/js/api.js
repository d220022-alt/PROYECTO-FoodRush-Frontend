const api = {
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
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || `Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Re-lanzar para manejarlo en la UI
        }
    },

    // --- Endpoints ---

    // Obtener todas las franquicias
    async getFranchises() {
        // Asumimos GET /franchises
        // Si tu backend usa otro endpoint (ej: /restaurants), cámbialo aquí.
        return this.request('/franchises');
    },

    // Iniciar sesión
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    // Registrar usuario
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
};
