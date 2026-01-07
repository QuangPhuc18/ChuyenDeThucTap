import httpAxios from './httpAxios';

const OrderService = {
  createOrder: async (data) => {
    // RESTful: /orders
    return await httpAxios.post('orders', data);
  },

  getList: async (params = {}) => {
    try {
      return await httpAxios.get('order', { params }); // ưu tiên /order theo logic cũ
    } catch (err) {
      if (err?.status === 404) {
        return await httpAxios.get('orders', { params }); // fallback /orders
      }
      throw err;
    }
  },

  getById: async (id) => {
    try {
      return await httpAxios.get(`order/${id}`); // ưu tiên /order/{id}
    } catch (err) {
      if (err?.status === 404) {
        return await httpAxios.get(`orders/${id}`); // fallback /orders/{id}
      }
      throw err;
    }
  },

  // Gọi đúng endpoint cập nhật trạng thái mà backend có: POST order/{id}/status
  // Fallback /orders/{id}/status nếu bạn khai báo route số nhiều
  updateStatus: async (id, body) => {
    try {
      return await httpAxios.post(`order/${id}/status`, body);
    } catch (err) {
      if (err?.status === 404) {
        return await httpAxios.post(`orders/${id}/status`, body);
      }
      throw err;
    }
  },

  delete: async (id) => {
    try {
      return await httpAxios.delete(`order/${id}`);
    } catch (err) {
      if (err?.status === 404) {
        return await httpAxios.delete(`orders/${id}`);
      }
      throw err;
    }
  },
};

export default OrderService;