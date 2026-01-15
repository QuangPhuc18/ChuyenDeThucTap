import httpAxios from './httpAxios';

const OrderService = {
  // [ĐÃ SỬA]: Hàm này xử lý riêng để lấy đúng dữ liệu trả về (chứa payUrl)
  createOrder: async (data) => {
    // RESTful: /orders
    const response = await httpAxios.post('orders', data);

    // FIX LỖI MOMO:
    // Kiểm tra xem kết quả có nằm trong thuộc tính .data (của Axios) hay không.
    // Nếu có .data thì trả về .data (để CheckoutPage lấy được payUrl), 
    // ngược lại trả về nguyên gốc (nếu httpAxios đã xử lý interceptor trước đó).
    if (response && response.data) {
        return response.data;
    }
    return response;
  },

  // --- CÁC HÀM DƯỚI ĐÂY GIỮ NGUYÊN LOGIC CŨ ---
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