import api from './api';

const materialService = {
  getMaterials: (params) => api.get('/materials', { params }).then((res) => res.data),
  createMaterial: (formData) => api.post('/materials', formData).then((res) => res.data),
  deleteMaterial: (id) => api.delete(`/materials/${id}`).then((res) => res.data),
};

export default materialService;
