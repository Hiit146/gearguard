import api from './api';

export const requestsService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.stage) params.append('stage', filters.stage);
        if (filters.request_type) params.append('request_type', filters.request_type);
        
        const response = await api.get(`/requests?${params.toString()}`);
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },

    async getCalendarRequests() {
        const response = await api.get('/requests/calendar');
        return response.data;
    },

    async create(data) {
        const response = await api.post('/requests', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/requests/${id}`, data);
        return response.data;
    },

    async updateStage(id, stage) {
        const response = await api.patch(`/requests/${id}/stage?stage=${stage}`);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/requests/${id}`);
        return response.data;
    }
};

export const analyticsService = {
    async getDashboard() {
        const response = await api.get('/analytics/dashboard');
        return response.data;
    },

    async getRequestsByCategory() {
        const response = await api.get('/analytics/requests-by-category');
        return response.data;
    },

    async getRequestsByTeam() {
        const response = await api.get('/analytics/requests-by-team');
        return response.data;
    }
};
