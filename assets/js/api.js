const API_BASE = '/api/v1';

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

const api = {
    async request(endpoint, options = {}) {
        const token = getToken();

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

            if (response.status === 401) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                return { ok: false, status: 401, data: { error: 'Sesión expirada' } };
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    async post(endpoint, body, headers = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
            headers,
        });
    },

    async put(endpoint, body, headers = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers,
        });
    },

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

const auth = {
    getUser() {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    getToken() {
        return getToken();
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
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/auth/login.html';
    },
};

const events = {
    async getAll() {
        const result = await api.get('/events');
        return result.data;
    },

    async getById(id) {
        const result = await api.get(`/events/${id}`);
        return result.data;
    },

    async create(eventData) {
        return api.post('/events', eventData);
    },

    async update(id, eventData) {
        return api.put(`/events/${id}`, eventData);
    },

    async delete(id) {
        return api.delete(`/events/${id}`);
    },

    async getByOrganizer(organizerId) {
        const result = await api.get(`/events/organizer/${organizerId}`);
        return result.data;
    },

    async publish(eventId) {
        return api.post(`/events/${eventId}/publish`, {});
    },

    async unpublish(eventId) {
        return api.post(`/events/${eventId}/unpublish`, {});
    },

    async getSummary(eventId) {
        const result = await api.get(`/events/${eventId}/resumen-cupos`);
        return result.data;
    },

    async incrementTicketSales(ticketId, cantidad) {
        return api.post(`/events/tickets/${ticketId}/vender`, { cantidad });
    },

    async getHistory(eventId) {
        const result = await api.get(`/events/${eventId}/history`);
        return result.data;
    }
};

const tickets = {
    async getByEvent(eventId) {
        const result = await api.get(`/tickets/event/${eventId}`);
        return result.data;
    },

    async getById(ticketId) {
        const result = await api.get(`/tickets/${ticketId}`);
        return result.data;
    },

    async create(eventId, ticketData) {
        return api.post(`/tickets/event/${eventId}`, ticketData);
    },

    async update(ticketId, ticketData) {
        return api.put(`/tickets/${ticketId}`, ticketData);
    },

    async delete(ticketId) {
        return api.delete(`/tickets/${ticketId}`);
    },

    async getConditions(ticketId) {
        const result = await api.get(`/tickets/${ticketId}/condiciones`);
        return result.data;
    },

    async addCondition(ticketId, conditionData) {
        return api.post(`/tickets/${ticketId}/condiciones`, conditionData);
    },

    async removeCondition(conditionId) {
        return api.delete(`/tickets/condiciones/${conditionId}`);
    },

    async getQuotaInfo(ticketId) {
        const result = await api.get(`/tickets/${ticketId}/cupos`);
        return result.data;
    }
};

const orders = {
    async create(orderData) {
        return api.post('/orders', orderData);
    },

    async getById(id) {
        return api.get(`/orders/${id}`);
    },

    async getByUser(userId) {
        return api.get(`/orders/user/${userId}`);
    },

    async updateStatus(id, status) {
        return api.request(`/orders/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
    },
};

const issuedTickets = {
    async issue(payload) {
        return api.post('/issued-tickets/issue', payload);
    },

    async getById(ticketId) {
        return api.get(`/issued-tickets/${ticketId}`);
    },

    async getByQrCode(qrCode) {
        return api.get(`/issued-tickets/qr/${encodeURIComponent(qrCode)}`);
    },

    async getByEvent(eventId) {
        return api.get(`/issued-tickets/event/${eventId}`);
    },

    async getByOrder(orderId) {
        return api.get(`/issued-tickets/order/${orderId}`);
    },

    async revoke(ticketId, reason) {
        return api.post(`/issued-tickets/${ticketId}/revoke`, { reason });
    },
};

const checkin = {
    async validate(payload) {
        return api.post('/checkin/validate', payload);
    },

    async sync(validations) {
        return api.post('/checkin/sync', { validations });
    },

    async getValidationsByTicket(ticketId) {
        return api.get(`/checkin/validations/ticket/${ticketId}`);
    },

    async getValidationsByEvent(eventId) {
        return api.get(`/checkin/validations/event/${eventId}`);
    },

    async getEventStats(eventId) {
        return api.get(`/checkin/stats/event/${eventId}`);
    },

    async retryPending() {
        return api.post('/checkin/retry-pending', {});
    },
};

const payments = {
    async createPaymentIntent(paymentData, idempotencyKey) {
        const user = window.Auth ? window.Auth.getUser() : null;
        const dataWithUserId = {
            ...paymentData,
            userId: user?.id || paymentData.userId
        };
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        return api.post('/payments', dataWithUserId, headers);
    },

    async getById(paymentId) {
        return api.get(`/payments/${paymentId}`);
    },

    async getByOrderId(orderId) {
        return api.get(`/payments/order/${orderId}`);
    },

    async confirmPayment(paymentIntentId) {
        return api.post(`/payments/confirm/${paymentIntentId}`, {});
    },

    async processRefund(paymentId, idempotencyKey, refundData) {
        const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
        return api.post(`/payments/${paymentId}/refund`, refundData, headers);
    },
};

const analytics = {
    async getDashboard() {
        return api.get('/analytics/dashboard');
    },

    async getSalesByEvent(eventId) {
        return api.get(`/analytics/sales/${eventId}`);
    },

    async getAttendance(eventId) {
        return api.get(`/analytics/attendance/${eventId}`);
    },
};

window.API = api;
window.Auth = auth;
window.Events = events;
window.Orders = orders;
window.Tickets = tickets;
window.IssuedTickets = issuedTickets;
window.Checkin = checkin;
window.Payments = payments;
window.Analytics = analytics;