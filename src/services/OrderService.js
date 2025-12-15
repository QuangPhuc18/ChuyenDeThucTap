import httpAxios from './httpAxios';

const OrderService = {
  getList: async (params = {}) => {
    try {
      return await httpAxios.get('order', { params });
    } catch (err) {
      // nếu server trả 404 cho 'orders', thử 'order' (fallback tạm)
      if (err && err.status === 404) {
        try {
          return await httpAxios.get('order', { params });
        } catch (e) {
          throw e;
        }
      }
      throw err;
    }
  },

  getById: async (id) => {
    try {
      return await httpAxios.get(`order/${id}`);
    } catch (err) {
      // fallback
      if (err && err.status === 404) {
        return await httpAxios.get(`order/${id}`);
      }
      throw err;
    }
  },

  updateStatus: async (id, body) => {
    return await httpAxios.post(`order/${id}/status`, body);
  },

  delete: async (id) => {
    return await httpAxios.delete(`order/${id}`);
  }
};

export default OrderService;