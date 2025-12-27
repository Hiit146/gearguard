import api from './api';

export const teamsService = {
    async getAll() {
        const response = await api.get('/teams');
        return response.data;
    },

    async getById(id) {
        const response = await api.get(`/teams/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/teams', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/teams/${id}`, data);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/teams/${id}`);
        return response.data;
    }
};

export const usersService = {
    async getAll() {
        const response = await api.get('/users');
        return response.data;
    },

    async getTechnicians() {
        const response = await api.get('/users/technicians');
        return response.data;
    }
};
