import { mockTenants, mockProducts, mockUsers, mockOrders } from './mockData';

const SIMULATE_DELAY = 800; // ms

// Helper to simulate async delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // Generic request simulator
    async request(endpoint, options = {}) {
        await delay(SIMULATE_DELAY);
        console.log(`[MOCK API] Request to ${endpoint}`, options);

        // Health Check
        if (endpoint === '/api/health') {
            return { status: 'ok' };
        }

        return { success: true };
    },

    async getFranchises() {
        await delay(SIMULATE_DELAY);
        return { success: true, data: mockTenants };
    },

    // Products
    async getProducts(params = {}, headers = {}) {
        await delay(SIMULATE_DELAY);

        // Filter logic could be implemented here if needed
        // For now, return all or filter by tenant if header/param exists
        let results = [...mockProducts];

        // Simulating Tenant Filter
        const tenantId = headers['X-Tenant-ID'];
        if (tenantId) {
            results = results.filter(p => p.tenant_id == tenantId);
        }

        return { success: true, data: results };
    },

    async login(email, password) {
        await delay(SIMULATE_DELAY);
        const user = mockUsers.find(u => u.correo === email && u.contrasena === password);

        if (user) {
            return {
                success: true,
                token: 'mock-token-12345',
                user: user
            };
        } else {
            return { success: false, message: 'Credenciales inválidas (Mock)' };
        }
    },

    async register(userData) {
        await delay(SIMULATE_DELAY);
        // Map frontend data to backend structure
        const newUser = {
            id: mockUsers.length + 1,
            nombre: userData.name,
            correo: userData.email,
            contrasena: userData.password,
            telefono: userData.phone,
            direccion: userData.direccion,
            zona: userData.zona
        };

        mockUsers.push(newUser);
        return { success: true, data: newUser };
    },

    async getUser(id) {
        await delay(SIMULATE_DELAY);
        const user = mockUsers.find(u => u.id == id);
        return { success: true, data: user };
    },

    async updateUser(id, data) {
        await delay(SIMULATE_DELAY);
        // Find and update
        const index = mockUsers.findIndex(u => u.id == id);
        if (index !== -1) {
            mockUsers[index] = { ...mockUsers[index], ...data };
            return { success: true, data: mockUsers[index] };
        }
        return { success: false, message: 'Usuario no encontrado' };
    },

    // Client Management
    async getClients(params = {}) {
        await delay(SIMULATE_DELAY);
        // If searching by email
        // params could be query string
        // We will just return the first mock user if it matches generic search or all
        return { success: true, data: mockUsers };
    },

    async createClient(clientData) {
        await delay(SIMULATE_DELAY);
        // Reuse register logic or just return success
        const newUser = { id: mockUsers.length + 1, ...clientData };
        mockUsers.push(newUser);
        return { success: true, data: newUser };
    },

    // Order Management
    async createOrder(orderData) {
        await delay(SIMULATE_DELAY);
        const newOrder = {
            id: Math.floor(Math.random() * 100000),
            timestamp: new Date().toISOString(),
            status: 'Pendiente',
            ...orderData
        };
        mockOrders.push(newOrder);

        console.log("ORDER CREATED:", newOrder);

        return {
            success: true,
            data: newOrder
        };
    },

    async getOrders(params = {}) {
        await delay(SIMULATE_DELAY);
        return { success: true, data: mockOrders };
    },

    async getOrder(id) {
        await delay(SIMULATE_DELAY);
        const order = mockOrders.find(o => o.id == id) || mockOrders[mockOrders.length - 1]; // Return last if not found for demo
        return { success: true, data: order };
    },

    async updateOrder(id, data) {
        await delay(SIMULATE_DELAY);
        return { success: true };
    },

    isNetworkError(error) {
        return false; // Mock never fails network
    }
};
