import axios from "axios";

// Đổi URL này theo cấu hình backend của bạn
const API_URL = "http://localhost:8000/api/store"; 

const ProductStoreService = {
  // Nhập kho (Import Goods)
  import: async (data) => {
    try {
      // Data gửi lên: { product_id, qty_import, price_root }
      const response = await axios.post(`${API_URL}/import`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách tồn kho (nếu cần hiển thị ở trang khác)
  getAll: async (params) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }, // <--- Đã thêm dấu phẩy ở đây

  // Xóa sản phẩm khỏi kho
  delete: async (productId) => {
    try {
      const response = await axios.delete(`${API_URL}/${productId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ProductStoreService;