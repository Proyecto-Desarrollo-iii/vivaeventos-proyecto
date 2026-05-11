const API_BASE = '/api';

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
            });

            const data = await response.json();

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth/login.html';
            }

            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

const auth = {
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return localStorage.getItem('token');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    hasRole(role) {
        const user = this.getUser();
        return user && user.role === role;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login.html';
    },
};

const events = {
    async getAll() {
        const result = await api.get('/events/v1');
        return result.data;
    },

    async getById(id) {
        const result = await api.get(`/events/v1/${id}`);
        return result.data;
    },

    async create(eventData) {
        return api.post('/events/v1', eventData);
    },

    async update(id, eventData) {
        return api.put(`/events/v1/${id}`, eventData);
    },

    async delete(id) {
        return api.delete(`/events/v1/${id}`);
    },

    async getByOrganizer(organizerId) {
        const result = await api.get(`/events/v1/organizer/${organizerId}`);
        return result.data;
    },

    async publish(eventId) {
        return api.post(`/events/v1/${eventId}/publish`, {});
    },

    async unpublish(eventId) {
        return api.post(`/events/v1/${eventId}/unpublish`, {});
    },

    async getSummary(eventId) {
        const result = await api.get(`/events/v1/${eventId}/resumen-cupos`);
        return result.data;
    }
};

const tickets = {
    async getByEvent(eventId) {
        const result = await api.get(`/tickets/v1/event/${eventId}`);
        return result.data;
    },

    async getById(ticketId) {
        const result = await api.get(`/tickets/v1/${ticketId}`);
        return result.data;
    },

    async create(eventId, ticketData) {
        return api.post(`/tickets/v1/event/${eventId}`, ticketData);
    },

    async update(ticketId, ticketData) {
        return api.put(`/tickets/v1/${ticketId}`, ticketData);
    },

    async delete(ticketId) {
        return api.delete(`/tickets/v1/${ticketId}`);
    },

    async getConditions(ticketId) {
        const result = await api.get(`/tickets/v1/${ticketId}/condiciones`);
        return result.data;
    },

    async addCondition(ticketId, conditionData) {
        return api.post(`/tickets/v1/${ticketId}/condiciones`, conditionData);
    },

    async removeCondition(conditionId) {
        return api.delete(`/tickets/v1/condiciones/${conditionId}`);
    },

    async getQuotaInfo(ticketId) {
        const result = await api.get(`/tickets/v1/${ticketId}/cupos`);
        return result.data;
    }
};

const orders = {
    async create(orderData) {
        return api.post('/orders/v1', orderData);
    },

    async getById(id) {
        return api.get(`/orders/v1/${id}`);
    },

    async getByUser(userId) {
        return api.get(`/orders/v1/user/${userId}`);
    },
};

const analytics = {
    async getDashboard() {
        return api.get('/analytics/v1/dashboard');
    },

    async getSalesByEvent(eventId) {
        return api.get(`/analytics/v1/sales/${eventId}`);
    },

    async getAttendance(eventId) {
        return api.get(`/analytics/v1/attendance/${eventId}`);
    },
};

window.API = api;
window.Auth = auth;
window.Events = events;
window.Orders = orders;
window.Tickets = tickets;
window.Analytics = analytics;