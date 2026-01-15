import httpAxios from "./httpAxios";

const ContactService = {
  // 1. Lấy danh sách (Admin) - GET: /api/contacts
  getList: async (params = {}) => {
    try {
      const res = await httpAxios.get("contacts", { params });
      return res.data; 
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  // 2. Lấy chi tiết (Admin) - GET: /api/contacts/{id}
  getById: async (id) => {
    try {
      const res = await httpAxios.get(`contacts/${id}`);
      return res.data;
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  // 3. Gửi liên hệ (Khách hàng) - POST: /api/contacts
  submitContact: async (data) => {
    try {
      // ✅ SỬA LẠI ĐÚNG: 'contacts' (số nhiều)
      const res = await httpAxios.post("contacts", data); 
      return res.data;
    } catch (err) {
      // Trả về data lỗi để page.js hiển thị
      return err.response?.data || { status: false, message: "Lỗi kết nối server" };
    }
  },

  // 4. Trả lời (Admin) - POST: /api/contacts/{id}/reply
  reply: async (id, data) => {
    try {
      // Route này bạn khai báo riêng trong api.php nên OK
      const res = await httpAxios.post(`contacts/${id}/reply`, data);
      return res.data;
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  },

  // 5. Xóa (Admin) - DELETE: /api/contacts/{id}
  delete: async (id) => {
    try {
      const res = await httpAxios.delete(`contacts/${id}`);
      return res.data;
    } catch (err) {
      return err.response?.data || { status: false, message: err.message };
    }
  }
};

export default ContactService;