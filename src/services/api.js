const API_URL = 'http://localhost:3000';

export const api = {
    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

        const config = {
            ...options,
            signal: controller.signal,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            clearTimeout(id);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || `Error ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('El servidor tardó demasiado en responder (Timeout). Verifica que esté corriendo.');
            }
            console.error('API Error:', error);
            throw error;
        }
    },

    async getFranchises() {
        return this.request('/api/tenants');
    },

    // Products
    async getProducts(params = {}, headers = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/productos?${query}`, { headers });
    },

    async login(email, password) {
        return this.request('/api/usuarios/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async register(userData) {
        // El backend espera: nombre, correo, contrasena
        // El frontend envía: email, name, password
        // Mapeamos los datos
        const payload = {
            nombre: userData.name,
            correo: userData.email,
            contrasena: userData.password,
            telefono: userData.phone,
            direccion: userData.direccion,
            zona: userData.zona
        };

        return this.request('/api/usuarios', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    async getUser(id) {
        return this.request(`/api/usuarios/${id}`);
    },

    async updateUser(id, data) {
        return this.request(`/api/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Client Management (for Orders)
    async getClients(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/clientes?${query}`);
    },

    async createClient(clientData) {
        return this.request('/api/clientes', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    },

    // Order Management
    async createOrder(orderData) {
        return this.request('/api/pedidos', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    },

    async getOrders(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/pedidos?${query}`);
    },

    async getOrder(id) {
        return this.request(`/api/pedidos/${id}`);
    },

    async updateOrder(id, data) {
        return this.request(`/api/pedidos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Validar si es un error de conexión para reintentos o feedback
    isNetworkError(error) {
        return error.message.includes('fetch') || error.message.includes('servidor');
    }
};
