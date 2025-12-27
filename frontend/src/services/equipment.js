import api from './api';

export const equipmentService = {
    async getAll() {
        const response = await api.get('/equipment');
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/equipment/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/equipment', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/equipment/${id}`, data);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/equipment/${id}`);
        return response.data;
    },

    async getRequests(id) {
        const response = await api.get(`/equipment/${id}/requests`);
        return response.data;
    }
};
