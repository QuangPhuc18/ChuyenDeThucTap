import httpAxios, { setAuthToken } from "./httpAxios";

// Helper để lấy dữ liệu thực từ response
const normalize = (res) => res?.data ?? res;

const UserService = {
  // ================================
  // 1. AUTHENTICATION
  // ================================
  
  // Quên mật khẩu (Gửi email)
  forgotPassword: async (data) => {
    // data: { email: "..." }
    const res = await httpAxios.post('forgot-password', data);
    return normalize(res);
  },

  // Đặt lại mật khẩu (Gửi token + pass mới - nếu dùng logic reset link)
  // Nếu dùng logic gửi mật khẩu mới qua mail luôn thì hàm này có thể không cần, 
  // nhưng cứ để đây dự phòng.
  resetPassword: async (data) => {
    const res = await httpAxios.post('reset-password', data);
    return normalize(res);
  },

  login: async (loginInput, password) => {
    const res = await httpAxios.post("login", { login: loginInput, password });
    const data = normalize(res);

    // Backend Laravel thường trả về key là 'access_token'
    // Code cũ dùng 'token', dòng này hỗ trợ cả 2 trường hợp
    const token = data?.access_token || data?.token;

    if (data?.status && token) {
      setAuthToken(token); // Set header Authorization
      if (typeof window !== 'undefined') {
        // Lưu token để persist (giữ đăng nhập khi F5)
        localStorage.setItem('authToken', token);
        // Lưu thông tin user (Backend trả về trong data.data hoặc data.user)
        localStorage.setItem('user', JSON.stringify(data.data || data.user || {}));
      }
    }
    return data;
  },

  logout: async () => {
    try { 
        await httpAxios.post("logout"); 
    } catch (_) {
        // Bỏ qua lỗi nếu token hết hạn
    }
    
    // Xóa thông tin local
    setAuthToken(null);
    if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('rememberMe');
    }
    return { status: true };
  },

  // ================================
  // 2. USER PROFILE
  // ================================
  getProfile: async () => {
    const res = await httpAxios.get("profile");
    return normalize(res);
  },

  updateProfile: async (formData) => {
    const res = await httpAxios.post("profile/update", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return normalize(res);
  },

  changePassword: async (data) => {
    const res = await httpAxios.post("profile/change-password", data);
    return normalize(res);
  },

  // ================================
  // 3. USER CRUD (ADMIN)
  // ================================
  getList: async (params) => {
      const res = await httpAxios.get("user", { params }); // Route backend: Route::resource('user', ...)
      return normalize(res);
  },

  getById: async (id) => {
      const res = await httpAxios.get(`user/${id}`);
      return normalize(res);
  },

  create: async (data) => {
    if (data instanceof FormData) {
      const res = await httpAxios.post("user", data, { 
          headers: { "Content-Type": "multipart/form-data" } 
      });
      return normalize(res);
    }
    const res = await httpAxios.post("user", data);
    return normalize(res);
  },

  update: async (id, data) => {
    if (data instanceof FormData) {
      // Laravel yêu cầu _method: PUT khi gửi FormData
      if (!data.has("_method")) data.append("_method", "PUT");
      
      const res = await httpAxios.post(`user/${id}`, data, { 
          headers: { "Content-Type": "multipart/form-data" } 
      });
      return normalize(res);
    }
    // JSON thường
    const res = await httpAxios.put(`user/${id}`, data);
    return normalize(res);
  },

  delete: async (id) => {
      const res = await httpAxios.delete(`user/${id}`);
      return normalize(res);
  },

  // ================================
  // 4. ORDERS (MEMBER)
  // ================================
  getMyOrders: async () => {
    const res = await httpAxios.get("my-orders");
    return normalize(res);
  },

  cancelOrder: async (orderId) => {
    const res = await httpAxios.post(`my-orders/${orderId}/cancel`);
    return normalize(res);
  },
};

export default UserService;